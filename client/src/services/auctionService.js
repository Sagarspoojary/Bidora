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

  // Helper to load locally created auctions from localStorage
  getLocalAuctions: () => {
    try {
      const stored = localStorage.getItem('bidora_created_auctions');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to parse local auctions:', e);
      return [];
    }
  },

  // Helper to save locally created auctions
  saveLocalAuctions: (list) => {
    localStorage.setItem('bidora_created_auctions', JSON.stringify(list));
  },

  // Get all auctions (with optional search filter)
  getAll: async (search = '') => {
    // Default mock list
    const baseMockAuctions = [
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
        image_url: '/images/luxury_watch.jpg',
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

    // Combine database and local creations
    let allAuctions = [...baseMockAuctions];
    try {
      const response = await fetch(`${API_BASE_URL}/auctions`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const result = await response.json();
        if (result.data && result.data.length > 0) {
          allAuctions = result.data;
        }
      }
    } catch (err) {
      console.warn('Backend /auctions index fallback to mock data');
    }

    // Append locally created items from localStorage
    const localList = auctionService.getLocalAuctions();
    allAuctions = [...localList, ...allAuctions];

    if (search.trim()) {
      return allAuctions.filter(item => 
        item.title.toLowerCase().includes(search.toLowerCase()) || 
        item.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    return allAuctions;
  },

  // Create new auction
  create: async (data) => {
    const newAuction = {
      id: `local-${Date.now()}`,
      ...data,
      current_price: data.starting_price,
      status: 'LIVE',
      bids_count: 0,
      created_at: new Date().toISOString(),
    };

    // Save locally
    const currentLocal = auctionService.getLocalAuctions();
    auctionService.saveLocalAuctions([newAuction, ...currentLocal]);

    // Forward to backend if endpoint is ready
    try {
      await fetch(`${API_BASE_URL}/auctions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.warn('Backend create-auction endpoint not ready yet, saved to local session.');
    }

    return newAuction;
  },

  // Get user-owned auctions
  getMyAuctions: async () => {
    // Default centerpiece owner mock
    const defaultCenterpiece = {
      id: '8922bdd8-91bb-4e53-8e4c-cf9b7eecbc75',
      title: 'Aetherius Chronograph - Prototype No. 01',
      starting_price: 45000.00,
      current_price: 45000.00,
      status: 'LIVE',
      end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      bids_count: 0,
    };

    let baseList = [defaultCenterpiece];
    try {
      const response = await fetch(`${API_BASE_URL}/auctions/my-auctions`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const result = await response.json();
        if (result.data) baseList = result.data;
      }
    } catch (err) {
      console.warn('Backend /my-auctions fallback to local list');
    }

    // Append locally created items from localStorage
    const localList = auctionService.getLocalAuctions();
    return [...localList, ...baseList];
  },

  // Delete an auction
  delete: async (id) => {
    // Remove from local list
    const currentLocal = auctionService.getLocalAuctions();
    const updatedLocal = currentLocal.filter(item => item.id !== id);
    auctionService.saveLocalAuctions(updatedLocal);

    // Call backend delete if it exists
    try {
      await fetch(`${API_BASE_URL}/auctions/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
    } catch (err) {
      console.warn('Backend delete-auction not ready, deleted from local session.');
    }

    return { success: true };
  }
};

export default auctionService;
