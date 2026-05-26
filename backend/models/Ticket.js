const mongoose = require('mongoose');

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

const SLA_TARGETS_MINUTES = {
  urgent: 60,
  high: 240,
  medium: 1440,
  low: 4320,
};

const ticketSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    priority: { type: String, required: true, enum: PRIORITIES },
    status: { type: String, enum: STATUSES, default: 'open' },
    resolvedAt: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);

ticketSchema.virtual('ageMinutes').get(function () {
  const end = this.resolvedAt || new Date();
  return Math.floor((end - this.createdAt) / 60000);
});

ticketSchema.virtual('slaBreached').get(function () {
  const target = SLA_TARGETS_MINUTES[this.priority];
  if (this.status === 'resolved' || this.status === 'closed') {
    const resolveTime = this.resolvedAt || new Date();
    return Math.floor((resolveTime - this.createdAt) / 60000) > target;
  }
  return Math.floor((new Date() - this.createdAt) / 60000) > target;
});

ticketSchema.index({ status: 1 });
ticketSchema.index({ priority: 1 });

const RealTicket = mongoose.model('Ticket', ticketSchema);

// --- In-Memory Mock Fallback Store ---
const mockDb = [];

function generateMockMongoId() {
  const chars = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < 24; i++) {
    id += chars[Math.floor(Math.random() * 16)];
  }
  return id;
}

class MockTicket {
  constructor(data) {
    this._id = data._id || generateMockMongoId();
    this.subject = data.subject;
    this.description = data.description;
    this.customerEmail = data.customerEmail;
    this.priority = data.priority;
    this.status = data.status || 'open';
    this.resolvedAt = data.resolvedAt ? new Date(data.resolvedAt) : null;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
  }

  get ageMinutes() {
    const end = this.resolvedAt || new Date();
    return Math.max(0, Math.floor((end - this.createdAt) / 60000));
  }

  get slaBreached() {
    const target = SLA_TARGETS_MINUTES[this.priority];
    const resolveTime = this.resolvedAt || new Date();
    return Math.floor((resolveTime - this.createdAt) / 60000) > target;
  }

  save() {
    const idx = mockDb.findIndex(t => t._id === this._id);
    if (idx !== -1) {
      mockDb[idx] = this.toJSON();
    } else {
      mockDb.push(this.toJSON());
    }
    return Promise.resolve(this);
  }

  toJSON() {
    return {
      _id: this._id,
      id: this._id,
      subject: this.subject,
      description: this.description,
      customerEmail: this.customerEmail,
      priority: this.priority,
      status: this.status,
      resolvedAt: this.resolvedAt,
      createdAt: this.createdAt,
      ageMinutes: this.ageMinutes,
      slaBreached: this.slaBreached
    };
  }
}

const mockModel = {
  create: async (data) => {
    const ticket = new MockTicket(data);
    await ticket.save();
    return ticket;
  },
  find: (filter = {}) => {
    let results = mockDb.filter(t => {
      for (let key in filter) {
        if (t[key] !== filter[key]) return false;
      }
      return true;
    }).map(t => new MockTicket(t));
    
    results.sort = function(sortObj) {
      if (sortObj && sortObj.createdAt === -1) {
        this.sort((a, b) => b.createdAt - a.createdAt);
      }
      return this;
    };
    return results;
  },
  findById: async (id) => {
    const found = mockDb.find(t => t._id === id);
    return found ? new MockTicket(found) : null;
  },
  findByIdAndDelete: async (id) => {
    const idx = mockDb.findIndex(t => t._id === id);
    if (idx !== -1) {
      const deleted = mockDb.splice(idx, 1)[0];
      return new MockTicket(deleted);
    }
    return null;
  }
};

const TicketProxy = new Proxy(RealTicket, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.get(target, prop);
    } else {
      return Reflect.get(mockModel, prop);
    }
  }
});

module.exports = { Ticket: TicketProxy, PRIORITIES, STATUSES, SLA_TARGETS_MINUTES };

