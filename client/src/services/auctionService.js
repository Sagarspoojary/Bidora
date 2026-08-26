const API_BASE_URL = 'http://localhost:5001/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
};

export const auctionService = {
  // Get active centerpiece auction
  getActive: async () => {
    const response = await fetch(`${API_BASE_URL}/auctions/active`, {
      headers: getHeaders(),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch active auction');
    return result.data;
  },

  // Get single auction details by ID
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/auctions/${id}`, {
      headers: getHeaders(),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch auction details');
    return result.data;
  },

  // Get all auctions (supports search keywords)
  getAll: async (search = '') => {
    const response = await fetch(`${API_BASE_URL}/auctions?search=${encodeURIComponent(search)}`, {
      headers: getHeaders(),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch auctions');
    return result.data || [];
  },

  // Create a new database auction item
  create: async (data) => {
    const response = await fetch(`${API_BASE_URL}/auctions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to create auction');
    return result.data;
  },

  // Get user registered auctions list from postgres
  getMyAuctions: async () => {
    const response = await fetch(`${API_BASE_URL}/auctions/my-auctions`, {
      headers: getHeaders(),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch your auctions');
    return result.data || [];
  },

  // Delete an auction item
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/auctions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to delete auction');
    return result;
  }
};

export default auctionService;
