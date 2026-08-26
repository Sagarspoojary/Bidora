const API_BASE_URL = 'http://localhost:5001/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
};

export const bidService = {
  // Place a new bid on an auction
  placeBid: async (auctionId, amount) => {
    const response = await fetch(`${API_BASE_URL}/bids`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ auction_id: auctionId, amount: Number(amount) }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to place bid');
    return result;
  },

  // Get auctions the user has bid on
  getMyBids: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/bids/my-bids`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const result = await response.json();
        return result.data || [];
      }
    } catch (err) {
      console.warn('Backend bids/my-bids failed to load');
    }
    return [];
  },

  // Get statistics counters for the dashboard
  getStats: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/bids/stats`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const result = await response.json();
        return result.data;
      }
    } catch (err) {
      console.warn('Backend bids/stats failed to load');
    }

    return {
      myBids: 0,
      myAuctions: 0,
      activeParticipation: 0,
      auctionsWon: 0
    };
  }
};

export default bidService;
