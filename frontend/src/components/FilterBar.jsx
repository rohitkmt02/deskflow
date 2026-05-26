export default function FilterBar({ filters, onChange }) {
  return (
    <div className="filter-bar">
      <label>Priority:</label>
      <select
        className="filter-select"
        value={filters.priority}
        onChange={(e) => onChange({ ...filters, priority: e.target.value })}
      >
        <option value="">All Priorities</option>
        <option value="urgent">Urgent</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      <label className="filter-toggle">
        <input
          type="checkbox"
          checked={filters.breached}
          onChange={(e) => onChange({ ...filters, breached: e.target.checked })}
        />
        SLA Breached Only
      </label>
    </div>
  );
}
