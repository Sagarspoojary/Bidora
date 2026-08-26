const API_BASE_URL = 'http://localhost:5001/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
};

export const notificationService = {
  // Get notifications from database
  getNotifications: async () => {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      headers: getHeaders(),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch notifications');
    return result.data || [];
  },

  // Mark all notifications as read in database
  markAllAsRead: async () => {
    const response = await fetch(`${API_BASE_URL}/notifications/read`, {
      method: 'POST',
      headers: getHeaders(),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to mark notifications as read');
    return result;
  }
};

export default notificationService;
