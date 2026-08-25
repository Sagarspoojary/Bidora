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

  // Get all auctions (with optional search filter)
  getAll: async (search = '') => {
    // Basic mock list in case backend endpoint is not fully ready for discovery queries
    // We fetch from backend when implemented, otherwise fallback
    try {
      const response = await fetch(`${API_BASE_URL}/auctions?search=${encodeURIComponent(search)}`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const result = await response.json();
        return result.data || [];
      }
    } catch (err) {
      console.warn('Backend /auctions index not implemented yet, using client mock data:', err.message);
    }

    // Default mock list matching the discovery card specification
    const mockAuctions = [
      {
        id: '8922bdd8-91bb-4e53-8e4c-cf9b7eecbc75',
        title: 'Aetherius Chronograph - Prototype No. 01',
        description: 'Tourbillon movement watch with cosmic dial and sapphire chassis.',
        image_url: '/images/luxury_watch.jpg',
        starting_price: 45000.00,
        current_price: 45000.00,
        start_time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'ACTIVE',
      },
      {
        id: 'mock-laptop',
        title: 'Quantum Ledger Pro - Developer Edition',
        description: 'Supercomputing notebook with titanium chassis and neural processor.',
        image_url: '/images/luxury_watch.jpg', // reusable asset
        starting_price: 2500.00,
        current_price: 2800.00,
        start_time: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        status: 'ACTIVE',
      },
      {
        id: 'mock-cyber',
        title: 'CyberShield Hardened Vault',
        description: 'Biometric cryptographic key hardware storage for digital assets.',
        image_url: '/images/luxury_watch.jpg',
        starting_price: 850.00,
        current_price: 950.00,
        start_time: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        status: 'ACTIVE',
      }
    ];

    if (search.trim()) {
      return mockAuctions.filter(item => 
        item.title.toLowerCase().includes(search.toLowerCase()) || 
        item.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    return mockAuctions;
  },

  // Create new auction
  create: async (data) => {
    // If backend endpoint isn't ready, we simulate validation and mock return
    try {
      const response = await fetch(`${API_BASE_URL}/auctions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const result = await response.json();
        return result.data;
      }
    } catch (err) {
      console.warn('Backend create-auction endpoint not ready yet, simulating successful client return.');
    }

    // Client-side simulation
    return {
      id: `simulated-${Date.now()}`,
      ...data,
      current_price: data.starting_price,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    };
  },

  // Get user-owned auctions
  getMyAuctions: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auctions/my-auctions`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const result = await response.json();
        return result.data || [];
      }
    } catch (err) {
      console.warn('Backend /my-auctions not ready, using mock data.');
    }

    return [
      {
        id: '8922bdd8-91bb-4e53-8e4c-cf9b7eecbc75',
        title: 'Aetherius Chronograph - Prototype No. 01',
        starting_price: 45000.00,
        current_price: 45000.00,
        status: 'LIVE',
        end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        bids_count: 0,
      }
    ];
  }
};

export default auctionService;
