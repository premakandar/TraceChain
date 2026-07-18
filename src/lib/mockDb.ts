// src/lib/mockDb.ts

export type MockProduct = {
  id: string;
  name: string;
  sku: string;
  description: string;
  status: string;
  price: string;
  createdAt: string;
  manufacturer: { name: string; walletAddress: string };
  currentOwner: { name: string; walletAddress: string };
};

export type MockShipment = {
  id: string;
  productId: string;
  carrierAddress: string;
  senderAddress: string;
  receiverAddress: string;
  source: string;
  destination: string;
  status: string;
  createdAt: string;
  txHash: string;
};

export type MockPartner = {
  walletAddress: string;
  name: string;
  role: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  email: string | null;
  createdAt: string;
};

export type MockOwnershipLog = {
  id: string;
  productId: string;
  fromAddress: string;
  toAddress: string;
  timestamp: string;
  txHash: string;
};

export type MockShipmentUpdate = {
  id: string;
  shipmentId: string;
  status: string;
  location: string;
  description: string | null;
  timestamp: string;
  txHash: string;
};

export type MockNotification = {
  id: string;
  walletAddress: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

class MockDatabase {
  public products: MockProduct[] = [];
  public shipments: MockShipment[] = [];
  public partners: MockPartner[] = [];
  public ownershipLogs: MockOwnershipLog[] = [];
  public shipmentUpdates: MockShipmentUpdate[] = [];
  public notifications: MockNotification[] = [];

  constructor() {
    this.seed();
  }

  // Initial seed data to make the dashboard look pretty
  private seed() {
    this.partners = [
      {
        walletAddress: 'GA123...456',
        name: 'OceanFreight Ltd.',
        role: 'DISTRIBUTOR',
        status: 'PENDING',
        email: 'ops@oceanfreight.com',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        walletAddress: 'GB789...012',
        name: 'Nexus Electronics',
        role: 'MANUFACTURER',
        status: 'PENDING',
        email: 'onboarding@nexuselec.io',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        walletAddress: 'GC345...678',
        name: 'Global Tech Corp',
        role: 'MANUFACTURER',
        status: 'APPROVED',
        email: 'admin@globaltech.com',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        walletAddress: 'GD901...234',
        name: 'LogiChain Shipping',
        role: 'DISTRIBUTOR',
        status: 'APPROVED',
        email: 'logistics@logichain.net',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        walletAddress: 'GE567...890',
        name: 'Apex Manufacturing',
        role: 'MANUFACTURER',
        status: 'APPROVED',
        email: 'hello@apex.io',
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      }
    ];

    this.products = [
      {
        id: 'prod_1001',
        name: 'High-Grade Silicon Wafers',
        sku: 'HW-SIL-01',
        description: 'Batch of 10,000 industrial-grade silicon wafers.',
        status: 'IN_TRANSIT',
        price: '4500.00',
        createdAt: new Date().toISOString(),
        manufacturer: { name: 'Global Tech Corp', walletAddress: 'GABC123...' },
        currentOwner: { name: 'LogiChain Shipping', walletAddress: 'GDEF456...' },
      },
      {
        id: 'prod_1002',
        name: 'Aerospace Aluminum Sheets',
        sku: 'AA-SHT-99',
        description: 'Premium aluminum sheets for aerospace manufacturing.',
        status: 'REGISTERED',
        price: '12000.00',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        manufacturer: { name: 'Apex Electronics', walletAddress: 'GXYZ789...' },
        currentOwner: { name: 'Apex Electronics', walletAddress: 'GXYZ789...' },
      },
      {
        id: 'prod_1003',
        name: 'Consumer Electronics Batteries',
        sku: 'CE-BAT-22',
        description: 'Lithium-ion battery packs for smart devices.',
        status: 'DELIVERED',
        price: '3200.50',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        manufacturer: { name: 'Nexus Innovations', walletAddress: 'G123ABC...' },
        currentOwner: { name: 'Retailer Alpha', walletAddress: 'G456DEF...' },
      }
    ];

    this.ownershipLogs = [
      {
        id: 'log_seed_1',
        productId: 'prod_1001',
        fromAddress: 'GABC123...',
        toAddress: 'GDEF456...',
        timestamp: new Date().toISOString(),
        txHash: 'stellar_tx_dummy_own1'
      },
      {
        id: 'log_seed_2',
        productId: 'prod_1003',
        fromAddress: 'G123ABC...',
        toAddress: 'G456DEF...',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        txHash: 'stellar_tx_dummy_own2'
      }
    ];

    this.shipments = [
      {
        id: 'ship_9001',
        productId: 'prod_1001',
        carrierAddress: 'GCARRIER1...',
        senderAddress: 'GABC123...',
        receiverAddress: 'GRETAIL9...',
        source: 'San Francisco, CA',
        destination: 'Austin, TX',
        status: 'IN_TRANSIT',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        txHash: 'stellar_tx_dummy1'
      },
      {
        id: 'ship_9002',
        productId: 'prod_1003',
        carrierAddress: 'GCARRIER2...',
        senderAddress: 'G123ABC...',
        receiverAddress: 'G456DEF...',
        source: 'Shenzhen, CN',
        destination: 'Los Angeles, CA',
        status: 'DELIVERED',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        txHash: 'stellar_tx_dummy2'
      }
    ];

    this.shipmentUpdates = [
      {
        id: 'update_seed_1',
        shipmentId: 'ship_9001',
        status: 'IN_TRANSIT',
        location: 'San Jose, CA',
        description: 'Shipment departed sorting facility.',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        txHash: 'stellar_tx_dummy_update1'
      },
      {
        id: 'update_seed_2',
        shipmentId: 'ship_9002',
        status: 'DELIVERED',
        location: 'Los Angeles, CA',
        description: 'Delivered to loading dock.',
        timestamp: new Date(Date.now() - 172800000 + 3600000).toISOString(),
        txHash: 'stellar_tx_dummy_update2'
      }
    ];

    this.notifications = [
      {
        id: 'notif_seed_1',
        walletAddress: 'GDLTIQINDDQ7I3XZCSZUMZTK5Q6GUMPAZPX2MSCMUGYMXKPI2OI6OV5U',
        title: 'Welcome to TraceChain',
        message: 'Your node is fully operational and synced with Stellar Testnet.',
        read: false,
        createdAt: new Date().toISOString()
      }
    ];
  }

  // --- Products ---
  getProducts() {
    return this.products;
  }

  addProduct(product: MockProduct) {
    this.products.unshift(product); // Add to beginning
  }

  // --- Shipments ---
  getShipments() {
    return this.shipments;
  }

  addShipment(shipment: MockShipment) {
    this.shipments.unshift(shipment);
    
    // Automatically add initial update checkpoint
    this.addShipmentUpdate({
      id: 'update_' + Math.random().toString(36).substring(2, 9),
      shipmentId: shipment.id,
      status: shipment.status,
      location: shipment.source,
      description: 'Shipment created and scheduled.',
      timestamp: shipment.createdAt,
      txHash: shipment.txHash
    });

    // Update product status
    const prod = this.products.find(p => p.id === shipment.productId);
    if (prod) {
      prod.status = 'IN_TRANSIT';
    }
  }

  updateShipmentStatus(shipmentId: string, newStatus: string) {
    const shipment = this.shipments.find(s => s.id === shipmentId);
    if (shipment) {
      shipment.status = newStatus;
      // Also update the product status
      const prod = this.products.find(p => p.id === shipment.productId);
      if (prod) {
        prod.status = newStatus;
      }
    }
  }

  // --- Shipment Updates ---
  getShipmentUpdates(shipmentId: string) {
    return this.shipmentUpdates.filter(u => u.shipmentId === shipmentId);
  }

  addShipmentUpdate(update: MockShipmentUpdate) {
    this.shipmentUpdates.unshift(update);
  }

  // --- Ownership Logs ---
  getOwnershipLogs(productId: string) {
    return this.ownershipLogs.filter(l => l.productId === productId);
  }

  addOwnershipLog(log: MockOwnershipLog) {
    this.ownershipLogs.unshift(log);
  }

  // --- Notifications ---
  getNotifications(walletAddress: string) {
    return this.notifications.filter(n => n.walletAddress === walletAddress);
  }

  addNotification(notification: MockNotification) {
    this.notifications.unshift(notification);
  }

  // --- Analytics ---
  getAnalytics() {
    return {
      metrics: {
        totalProducts: this.products.length,
        activeShipments: this.shipments.filter(s => s.status === 'IN_TRANSIT').length,
        completedShipments: this.shipments.filter(s => s.status === 'DELIVERED').length,
        totalTransfers: this.shipments.length * 2, // arbitrary
      },
      productsByStatus: [
        { status: 'REGISTERED', count: this.products.filter(p => p.status === 'REGISTERED').length },
        { status: 'IN_TRANSIT', count: this.products.filter(p => p.status === 'IN_TRANSIT').length },
        { status: 'DELIVERED', count: this.products.filter(p => p.status === 'DELIVERED').length },
      ],
      recentShipments: this.shipments.slice(0, 5),
    };
  }

  // --- Partners (Admin) ---
  getPartners() {
    return this.partners;
  }

  updatePartnerStatus(walletAddress: string, newStatus: 'APPROVED' | 'REJECTED') {
    const partner = this.partners.find(p => p.walletAddress === walletAddress);
    if (partner) {
      partner.status = newStatus;
    }
  }
}

// Ensure global singleton across Next.js HMR reloads
const globalForDb = globalThis as unknown as {
  mockDb: MockDatabase | undefined;
};

export const mockDb = globalForDb.mockDb ?? new MockDatabase();

if (process.env.NODE_ENV !== 'production') globalForDb.mockDb = mockDb;
