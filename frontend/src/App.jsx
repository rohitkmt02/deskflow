import { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import StatsStrip from './components/StatsStrip';
import FilterBar from './components/FilterBar';
import Board from './components/Board';
import CreateTicketModal from './components/CreateTicketModal';
import './index.css';

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ priority: '', breached: false });
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      const params = {};
      if (filters.priority) params.priority = filters.priority;
      if (filters.breached) params.breached = true;
      const data = await api.getTickets(params);
      setTickets(data);
      setError(null);
    } catch (e) {
      setError('Failed to load tickets');
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (e) { /* silent */ }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTickets(), fetchStats()]).finally(() => setLoading(false));
  }, [fetchTickets, fetchStats]);

  async function handleTransition(id, newStatus) {
    try {
      await api.updateTicket(id, { status: newStatus });
      await Promise.all([fetchTickets(), fetchStats()]);
    } catch (e) {
      showToast(e.data?.error || 'Transition failed');
    }
  }

  async function handleCreate(ticket) {
    const created = await api.createTicket(ticket);
    setTickets((prev) => [created, ...prev]);
    await fetchStats();
    showToast('Ticket created', 'success');
  }

  return (
    <>
      <header className="app-header">
        <div className="app-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" />
          </svg>
          DeskFlow
        </div>
        <button className="btn-create" onClick={() => setShowCreate(true)}>
          + New Ticket
        </button>
      </header>

      <StatsStrip stats={stats} loading={loading} />
      <FilterBar filters={filters} onChange={setFilters} />

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading"><div className="spinner" /> Loading tickets...</div>
      ) : (
        <Board
          tickets={tickets}
          onTransition={handleTransition}
          onDropError={(msg) => showToast(msg)}
        />
      )}

      {showCreate && (
        <CreateTicketModal onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}
