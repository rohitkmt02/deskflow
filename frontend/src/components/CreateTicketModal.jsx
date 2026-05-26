import { useState } from 'react';

const INITIAL = { subject: '', description: '', customerEmail: '', priority: 'medium' };

export default function CreateTicketModal({ onClose, onSubmit }) {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const e = {};
    if (!form.subject.trim()) e.subject = 'Subject is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.customerEmail.trim()) e.customerEmail = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) e.customerEmail = 'Invalid email format';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setSubmitting(true);
    setErrors({});
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      if (err.data?.errors) {
        const fieldErrors = {};
        err.data.errors.forEach((er) => { fieldErrors[er.field] = er.message; });
        setErrors(fieldErrors);
      } else {
        setErrors({ form: err.data?.error || 'Failed to create ticket' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Create New Ticket</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Subject</label>
            <input value={form.subject} onChange={(e) => set('subject', e.target.value)} placeholder="Brief summary of the issue" />
            {errors.subject && <div className="field-error">{errors.subject}</div>}
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Detailed description..." />
            {errors.description && <div className="field-error">{errors.description}</div>}
          </div>
          <div className="form-group">
            <label>Customer Email</label>
            <input type="email" value={form.customerEmail} onChange={(e) => set('customerEmail', e.target.value)} placeholder="customer@example.com" />
            {errors.customerEmail && <div className="field-error">{errors.customerEmail}</div>}
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          {errors.form && <div className="field-error">{errors.form}</div>}
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
