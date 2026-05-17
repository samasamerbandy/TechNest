import api from '../api/axiosInstance';

// ── Member ────────────────────────────────────────────────────────────────────
export const getMyTickets     = ()              => api.get('/api/tickets/my');
export const submitTicket     = (data)          => api.post('/api/tickets', data);

// ── Worker ────────────────────────────────────────────────────────────────────
export const getAssignedTickets = ()            => api.get('/api/tickets/assigned');
export const addComment         = (id, content) => api.post(`/api/tickets/${id}/comments`, { content });
export const uploadEvidence     = (id, data)    => api.post(`/api/tickets/${id}/evidence`, data);

// ── Manager ───────────────────────────────────────────────────────────────────
export const getAllTickets     = ()                  => api.get('/api/tickets');
export const getWorkers = () => api.get('/api/auth/workers');
export const getTicketById     = (id)                => api.get(`/api/tickets/${id}`);
export const updateTicketStatus = (id, status)       => api.put(`/api/tickets/${id}/status`, { status });
export const assignTicket      = (id, workerId)      => api.put(`/api/tickets/${id}/assign`, { workerId });
export const closeTicket       = (id)                => api.put(`/api/tickets/${id}/close`);
export const deleteTicket      = (id)                => api.delete(`/api/tickets/${id}`);
export const setPriority       = (id, priority)      => api.put(`/api/tickets/${id}/priority`, { priority });
export const mergeTickets      = (id, ticketIds)     => api.post(`/api/tickets/${id}/merge`, { ticketIds });
