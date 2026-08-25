const API_BASE_URL = 'http://localhost:5001/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
};

export const notificationService = {
  // Get notifications
  getNotifications: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const result = await response.json();
        return result.data || [];
      }
    } catch (err) {
      console.warn('Backend /notifications not ready, using default empty list.');
    }
    // Return empty array to trigger correct dashboard empty state ("No new notifications")
    return [];
  }
};

export default notificationService;
