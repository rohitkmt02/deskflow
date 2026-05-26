const FORWARD = { open: 'in_progress', in_progress: 'resolved', resolved: 'closed' };
const BACKWARD = { in_progress: 'open', resolved: 'in_progress', closed: 'resolved' };

const STATUS_LABELS = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' };

function formatAge(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h < 24) return `${h}h ${m}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

export default function TicketCard({ ticket, onTransition }) {
  const forward = FORWARD[ticket.status];
  const backward = BACKWARD[ticket.status];

  function handleDragStart(e) {
    e.dataTransfer.setData('ticketId', ticket._id);
    e.dataTransfer.setData('currentStatus', ticket.status);
    e.target.classList.add('dragging');
  }

  function handleDragEnd(e) {
    e.target.classList.remove('dragging');
  }

  return (
    <div
      className={`ticket-card${ticket.slaBreached ? ' sla-breached' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="ticket-subject">{ticket.subject}</div>
      <div className="ticket-meta">
        <span className={`priority-badge ${ticket.priority}`}>{ticket.priority}</span>
        <span className="ticket-age">⏱ {formatAge(ticket.ageMinutes)}</span>
        {ticket.slaBreached && <span className="sla-indicator">⚠ SLA</span>}
      </div>
      <div className="ticket-actions">
        {backward && (
          <button className="btn-transition back" onClick={() => onTransition(ticket._id, backward)}>
            ← {STATUS_LABELS[backward]}
          </button>
        )}
        {forward && (
          <button className="btn-transition" onClick={() => onTransition(ticket._id, forward)}>
            {STATUS_LABELS[forward]} →
          </button>
        )}
      </div>
    </div>
  );
}
