const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, data };
  return data;
}

export const api = {
  getTickets: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.priority) qs.set('priority', params.priority);
    if (params.breached) qs.set('breached', 'true');
    const query = qs.toString();
    return request(`/tickets${query ? `?${query}` : ''}`);
  },
  getStats: () => request('/tickets/stats'),
  createTicket: (ticket) => request('/tickets', { method: 'POST', body: JSON.stringify(ticket) }),
  updateTicket: (id, data) => request(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTicket: (id) => request(`/tickets/${id}`, { method: 'DELETE' }),
};
