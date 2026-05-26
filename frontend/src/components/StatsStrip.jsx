export default function StatsStrip({ stats, loading }) {
  if (loading || !stats) {
    return (
      <div className="stats-strip">
        <div className="stat-card"><span className="stat-count">—</span><span className="stat-label">Loading...</span></div>
      </div>
    );
  }

  return (
    <div className="stats-strip">
      {Object.entries(stats.byStatus).map(([status, count]) => (
        <div className="stat-card" key={status}>
          <span className="stat-count">{count}</span>
          <span className="stat-label">{status.replace('_', ' ')}</span>
        </div>
      ))}
      <div className={`stat-card${stats.breachedOpen > 0 ? ' breached' : ''}`}>
        <span className="stat-count">{stats.breachedOpen}</span>
        <span className="stat-label">SLA Breached</span>
      </div>
    </div>
  );
}
