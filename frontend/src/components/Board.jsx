import { useState } from 'react';
import TicketCard from './TicketCard';

const COLUMNS = [
  { status: 'open', label: 'Open', color: 'var(--col-open)' },
  { status: 'in_progress', label: 'In Progress', color: 'var(--col-progress)' },
  { status: 'resolved', label: 'Resolved', color: 'var(--col-resolved)' },
  { status: 'closed', label: 'Closed', color: 'var(--col-closed)' },
];

const FORWARD = { open: 'in_progress', in_progress: 'resolved', resolved: 'closed' };
const BACKWARD = { in_progress: 'open', resolved: 'in_progress', closed: 'resolved' };

export default function Board({ tickets, onTransition, onDropError }) {
  const [dragOver, setDragOver] = useState(null);

  function handleDragOver(e, status) {
    e.preventDefault();
    setDragOver(status);
  }

  function handleDragLeave() {
    setDragOver(null);
  }

  function handleDrop(e, targetStatus) {
    e.preventDefault();
    setDragOver(null);
    const ticketId = e.dataTransfer.getData('ticketId');
    const currentStatus = e.dataTransfer.getData('currentStatus');
    if (currentStatus === targetStatus) return;

    const fwd = FORWARD[currentStatus];
    const bwd = BACKWARD[currentStatus];
    if (targetStatus !== fwd && targetStatus !== bwd) {
      onDropError?.(`Cannot move from ${currentStatus.replace('_', ' ')} to ${targetStatus.replace('_', ' ')}`);
      return;
    }
    onTransition(ticketId, targetStatus);
  }

  return (
    <div className="board">
      {COLUMNS.map((col) => {
        const colTickets = tickets.filter((t) => t.status === col.status);
        return (
          <div
            key={col.status}
            className={`board-column${dragOver === col.status ? ' drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, col.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.status)}
          >
            <div className="column-header">
              <span className="column-title">
                <span className="column-dot" style={{ background: col.color }} />
                {col.label}
              </span>
              <span className="column-count">{colTickets.length}</span>
            </div>
            <div className="column-cards">
              {colTickets.length === 0 ? (
                <div className="empty-column">No tickets</div>
              ) : (
                colTickets.map((t) => (
                  <TicketCard key={t._id} ticket={t} onTransition={onTransition} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
