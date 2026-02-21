import api from "./api";

export const notificationService = {
  getUnreadCount: () => api.get("/notifications/unread-count"),
  getAll: () => api.get("/notifications"),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/read-all"),

  // ✅ NEW deletes
  deleteOne: (id) => api.delete(`/notifications/${id}`),
  deleteAll: () => api.delete("/notifications"),
  deleteRange: (range) => api.delete(`/notifications/by-range?range=${encodeURIComponent(range)}`),
  deleteMonth: (month) => api.delete(`/notifications/by-month?month=${encodeURIComponent(month)}`),
};