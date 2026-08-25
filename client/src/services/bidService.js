const API_BASE_URL = 'http://localhost:5001/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
};

export const bidService = {
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
      console.warn('Backend bids/my-bids not ready, using mock data.');
    }

    return [
      {
        id: 'mock-bids-1',
        title: 'Aetherius Chronograph - Prototype No. 01',
        user_highest_bid: 45000.00,
        current_highest_bid: 45000.00,
        status: 'Winning', // 'Winning' or 'Losing'
        end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'mock-bids-2',
        title: 'Quantum Ledger Pro - Developer Edition',
        user_highest_bid: 2600.00,
        current_highest_bid: 2800.00,
        status: 'Losing',
        end_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      }
    ];
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
      console.warn('Backend bids/stats not ready, using mock counts.');
    }

    return {
      myBids: 2,
      myAuctions: 1,
      activeParticipation: 2,
      auctionsWon: 0
    };
  }
};

export default bidService;
