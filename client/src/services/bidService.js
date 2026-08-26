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
      console.warn('Backend bids/my-bids not ready');
    }

    // Default empty array so no fake bids display in client before Phase 4 (Bidding)
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
      console.warn('Backend bids/stats not ready');
    }

    // Dynamic mock lookup to count local auctions count from localStorage
    let localAuctionsCount = 0;
    try {
      const stored = localStorage.getItem('bidora_created_auctions');
      if (stored) {
        localAuctionsCount = JSON.parse(stored).length;
      }
    } catch (e) {}

    // Add centerpiece watch count (1) if it hasn't been deleted
    let centerpieceActive = 1;
    try {
      const deleted = localStorage.getItem('bidora_deleted_auction_ids');
      if (deleted && JSON.parse(deleted).includes('8922bdd8-91bb-4e53-8e4c-cf9b7eecbc75')) {
        centerpieceActive = 0;
      }
    } catch (e) {}

    return {
      myBids: 0,
      myAuctions: centerpieceActive + localAuctionsCount,
      activeParticipation: 0,
      auctionsWon: 0
    };
  }
};

export default bidService;
