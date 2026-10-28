import { Seller, Buyer, Bike, Transaction, AuditLog, DealershipSettings, AuditAction } from '../types';
import { 
  INITIAL_SETTINGS, 
  INITIAL_SELLERS, 
  INITIAL_BUYERS, 
  INITIAL_BIKES, 
  INITIAL_TRANSACTIONS, 
  INITIAL_AUDIT_LOGS 
} from '../data/initialData';

const STORAGE_KEYS = {
  SETTINGS: 'apex_dealership_settings',
  SELLERS: 'apex_dealership_sellers',
  BUYERS: 'apex_dealership_buyers',
  BIKES: 'apex_dealership_bikes',
  TRANSACTIONS: 'apex_dealership_transactions',
  AUDIT_LOGS: 'apex_dealership_audit_logs',
  INITIALIZED: 'apex_dealership_initialized_v2',
};

type Listener = () => void;
const listeners: Set<Listener> = new Set();

function notifyListeners() {
  listeners.forEach(fn => {
    try {
      fn();
    } catch (e) {
      console.error('Error notifying listener:', e);
    }
  });
}

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Failed to read key ${key} from localStorage:`, err);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to write key ${key} to localStorage:`, err);
  }
}

// Ensure initial demo data is populated on first load
export function initStorage(): void {
  const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (!isInit) {
    setItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    setItem(STORAGE_KEYS.SELLERS, INITIAL_SELLERS);
    setItem(STORAGE_KEYS.BUYERS, INITIAL_BUYERS);
    setItem(STORAGE_KEYS.BIKES, INITIAL_BIKES);
    setItem(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    setItem(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }
}

// Auto-run init
initStorage();

export const storageService = {
  subscribe(callback: Listener): () => void {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  // --- SETTINGS ---
  getSettings(): DealershipSettings {
    return getItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  },

  updateSettings(settings: DealershipSettings, userEmail = 'admin@apexmotohub.com'): void {
    setItem(STORAGE_KEYS.SETTINGS, settings);
    this.addAuditLog('UPDATE', 'system', 'SETTINGS', 'Updated dealership profile and contact details', userEmail);
    notifyListeners();
  },

  // --- AUDIT LOGS ---
  getAuditLogs(): AuditLog[] {
    const logs = getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    return [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  addAuditLog(action: AuditAction, entity: 'seller' | 'buyer' | 'bike' | 'transaction' | 'auth' | 'system', entityId: string, details: string, userEmail = 'staff@apexmotohub.com'): void {
    const logs = getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    const newLog: AuditLog = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      userEmail,
      action,
      entity,
      entityId,
      details,
    };
    setItem(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...logs].slice(0, 500)); // keep last 500
  },

  // --- SELLERS ---
  getSellers(): Seller[] {
    return getItem<Seller[]>(STORAGE_KEYS.SELLERS, INITIAL_SELLERS);
  },

  getSellerById(id: string): Seller | undefined {
    return this.getSellers().find(s => s.id === id);
  },

  addSeller(sellerData: Omit<Seller, 'id' | 'createdAt'>, userEmail = 'staff@apexmotohub.com'): Seller {
    const sellers = this.getSellers();
    
    // Validate phone number format (must be 10 digits in India)
    const cleanPhone = sellerData.mobileNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }

    // Auto-generate Seller ID
    const maxIdNum = sellers.reduce((max, s) => {
      const match = s.id.match(/\d+/);
      const num = match ? parseInt(match[0], 10) : 1000;
      return num > max ? num : max;
    }, 1000);
    const newId = `SEL-${maxIdNum + 1}`;

    const newSeller: Seller = {
      ...sellerData,
      id: newId,
      mobileNumber: cleanPhone,
      createdAt: new Date().toISOString(),
    };

    setItem(STORAGE_KEYS.SELLERS, [newSeller, ...sellers]);
    this.addAuditLog('CREATE', 'seller', newId, `Registered new seller: ${newSeller.fullName} (${newSeller.sellerType})`, userEmail);
    notifyListeners();
    return newSeller;
  },

  updateSeller(id: string, updates: Partial<Omit<Seller, 'id' | 'createdAt'>>, userEmail = 'staff@apexmotohub.com'): Seller {
    const sellers = this.getSellers();
    const index = sellers.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Seller not found.');

    if (updates.mobileNumber) {
      const cleanPhone = updates.mobileNumber.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        throw new Error('Please enter a valid 10-digit mobile number.');
      }
      updates.mobileNumber = cleanPhone;
    }

    const updatedSeller: Seller = {
      ...sellers[index],
      ...updates,
    };

    sellers[index] = updatedSeller;
    setItem(STORAGE_KEYS.SELLERS, sellers);
    this.addAuditLog('UPDATE', 'seller', id, `Updated seller profile for ${updatedSeller.fullName}`, userEmail);
    notifyListeners();
    return updatedSeller;
  },

  deleteSeller(id: string, userEmail = 'admin@apexmotohub.com'): void {
    const bikes = this.getBikes();
    const associatedBikes = bikes.filter(b => b.sellerId === id);
    if (associatedBikes.length > 0) {
      throw new Error(`Cannot delete this seller. They have ${associatedBikes.length} bike(s) registered in the inventory. Please reassign or delete the bikes first.`);
    }

    const sellers = this.getSellers();
    const target = sellers.find(s => s.id === id);
    if (!target) throw new Error('Seller not found.');

    const filtered = sellers.filter(s => s.id !== id);
    setItem(STORAGE_KEYS.SELLERS, filtered);
    this.addAuditLog('DELETE', 'seller', id, `Deleted seller: ${target.fullName}`, userEmail);
    notifyListeners();
  },

  // --- BUYERS ---
  getBuyers(): Buyer[] {
    return getItem<Buyer[]>(STORAGE_KEYS.BUYERS, INITIAL_BUYERS);
  },

  getBuyerById(id: string): Buyer | undefined {
    return this.getBuyers().find(b => b.id === id);
  },

  addBuyer(buyerData: Omit<Buyer, 'id' | 'createdAt'>, userEmail = 'staff@apexmotohub.com'): Buyer {
    const buyers = this.getBuyers();

    const cleanPhone = buyerData.mobileNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }

    const maxIdNum = buyers.reduce((max, b) => {
      const match = b.id.match(/\d+/);
      const num = match ? parseInt(match[0], 10) : 2000;
      return num > max ? num : max;
    }, 2000);
    const newId = `BUY-${maxIdNum + 1}`;

    const newBuyer: Buyer = {
      ...buyerData,
      id: newId,
      mobileNumber: cleanPhone,
      createdAt: new Date().toISOString(),
    };

    setItem(STORAGE_KEYS.BUYERS, [newBuyer, ...buyers]);
    this.addAuditLog('CREATE', 'buyer', newId, `Registered new buyer: ${newBuyer.fullName}`, userEmail);
    notifyListeners();
    return newBuyer;
  },

  updateBuyer(id: string, updates: Partial<Omit<Buyer, 'id' | 'createdAt'>>, userEmail = 'staff@apexmotohub.com'): Buyer {
    const buyers = this.getBuyers();
    const index = buyers.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Buyer not found.');

    if (updates.mobileNumber) {
      const cleanPhone = updates.mobileNumber.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        throw new Error('Please enter a valid 10-digit mobile number.');
      }
      updates.mobileNumber = cleanPhone;
    }

    const updatedBuyer: Buyer = {
      ...buyers[index],
      ...updates,
    };

    buyers[index] = updatedBuyer;
    setItem(STORAGE_KEYS.BUYERS, buyers);
    this.addAuditLog('UPDATE', 'buyer', id, `Updated buyer profile for ${updatedBuyer.fullName}`, userEmail);
    notifyListeners();
    return updatedBuyer;
  },

  deleteBuyer(id: string, userEmail = 'admin@apexmotohub.com'): void {
    const txns = this.getTransactions();
    const associatedTxns = txns.filter(t => t.buyerId === id && t.status === 'Completed');
    if (associatedTxns.length > 0) {
      throw new Error(`Cannot delete this buyer. They have ${associatedTxns.length} completed purchase transaction(s) on record for legal tax compliance.`);
    }

    const buyers = this.getBuyers();
    const target = buyers.find(b => b.id === id);
    if (!target) throw new Error('Buyer not found.');

    const filtered = buyers.filter(b => b.id !== id);
    setItem(STORAGE_KEYS.BUYERS, filtered);
    this.addAuditLog('DELETE', 'buyer', id, `Deleted buyer: ${target.fullName}`, userEmail);
    notifyListeners();
  },

  // --- BIKES ---
  getBikes(): Bike[] {
    return getItem<Bike[]>(STORAGE_KEYS.BIKES, INITIAL_BIKES);
  },

  getBikeById(id: string): Bike | undefined {
    return this.getBikes().find(b => b.id === id);
  },

  addBike(bikeData: Omit<Bike, 'id' | 'createdAt'>, userEmail = 'staff@apexmotohub.com'): Bike {
    const bikes = this.getBikes();

    // Standardize registration number (e.g. MH 12 AB 1234)
    const regNoClean = bikeData.registrationNumber.trim().toUpperCase().replace(/\s+/g, ' ');

    // Prevent duplicate registration numbers
    const duplicate = bikes.find(
      b => b.registrationNumber.trim().toUpperCase().replace(/\s+/g, ' ') === regNoClean
    );
    if (duplicate) {
      throw new Error(`Duplicate Registration Number: A bike with registration number "${regNoClean}" is already recorded in inventory (${duplicate.id} - ${duplicate.brand} ${duplicate.modelName}).`);
    }

    // Verify Seller exists
    const seller = this.getSellerById(bikeData.sellerId);
    if (!seller) {
      throw new Error(`Invalid Seller: Seller with ID "${bikeData.sellerId}" does not exist.`);
    }

    // Auto-generate Bike ID
    const maxIdNum = bikes.reduce((max, b) => {
      const match = b.id.match(/\d+/);
      const num = match ? parseInt(match[0], 10) : 3000;
      return num > max ? num : max;
    }, 3000);
    const newId = `BIKE-${maxIdNum + 1}`;

    const newBike: Bike = {
      ...bikeData,
      id: newId,
      registrationNumber: regNoClean,
      createdAt: new Date().toISOString(),
    };

    setItem(STORAGE_KEYS.BIKES, [newBike, ...bikes]);
    this.addAuditLog('CREATE', 'bike', newId, `Added bike to inventory: ${newBike.brand} ${newBike.modelName} (${newBike.registrationNumber})`, userEmail);
    notifyListeners();
    return newBike;
  },

  updateBike(id: string, updates: Partial<Omit<Bike, 'id' | 'createdAt'>>, userEmail = 'staff@apexmotohub.com'): Bike {
    const bikes = this.getBikes();
    const index = bikes.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Bike not found in inventory.');

    if (updates.registrationNumber) {
      const regNoClean = updates.registrationNumber.trim().toUpperCase().replace(/\s+/g, ' ');
      const duplicate = bikes.find(
        b => b.id !== id && b.registrationNumber.trim().toUpperCase().replace(/\s+/g, ' ') === regNoClean
      );
      if (duplicate) {
        throw new Error(`Duplicate Registration Number: Another bike (${duplicate.id}) already uses "${regNoClean}".`);
      }
      updates.registrationNumber = regNoClean;
    }

    if (updates.sellerId) {
      const seller = this.getSellerById(updates.sellerId);
      if (!seller) {
        throw new Error(`Invalid Seller ID: "${updates.sellerId}" does not exist.`);
      }
    }

    const updatedBike: Bike = {
      ...bikes[index],
      ...updates,
    };

    bikes[index] = updatedBike;
    setItem(STORAGE_KEYS.BIKES, bikes);
    this.addAuditLog('UPDATE', 'bike', id, `Updated details for ${updatedBike.brand} ${updatedBike.modelName}`, userEmail);
    notifyListeners();
    return updatedBike;
  },

  deleteBike(id: string, userEmail = 'admin@apexmotohub.com'): void {
    const txns = this.getTransactions();
    const activeTxn = txns.find(t => t.bikeId === id && t.status === 'Completed');
    if (activeTxn) {
      throw new Error(`Cannot delete bike ${id}. It is associated with a completed sales transaction (${activeTxn.id}). Cancel or archive the transaction first.`);
    }

    const bikes = this.getBikes();
    const target = bikes.find(b => b.id === id);
    if (!target) throw new Error('Bike not found.');

    const filtered = bikes.filter(b => b.id !== id);
    setItem(STORAGE_KEYS.BIKES, filtered);
    this.addAuditLog('DELETE', 'bike', id, `Removed bike from inventory: ${target.brand} ${target.modelName} (${target.registrationNumber})`, userEmail);
    notifyListeners();
  },

  // --- TRANSACTIONS ---
  getTransactions(): Transaction[] {
    return getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
  },

  getTransactionById(id: string): Transaction | undefined {
    return this.getTransactions().find(t => t.id === id);
  },

  createTransaction(txnData: Omit<Transaction, 'id' | 'createdAt' | 'status'>, userEmail = 'staff@apexmotohub.com'): Transaction {
    const bikes = this.getBikes();
    const bikeIndex = bikes.findIndex(b => b.id === txnData.bikeId);
    if (bikeIndex === -1) {
      throw new Error('Selected bike does not exist in inventory.');
    }

    const targetBike = bikes[bikeIndex];
    if (targetBike.status === 'Sold') {
      throw new Error(`Sale Failed: Bike ${targetBike.id} (${targetBike.brand} ${targetBike.modelName}) is ALREADY SOLD. It cannot be sold twice.`);
    }

    // Verify buyer exists
    const buyer = this.getBuyerById(txnData.buyerId);
    if (!buyer) {
      throw new Error('Selected buyer was not found.');
    }

    // Auto-generate Transaction ID
    const txns = this.getTransactions();
    const maxIdNum = txns.reduce((max, t) => {
      const match = t.id.match(/\d+/);
      const num = match ? parseInt(match[0], 10) : 5000;
      return num > max ? num : max;
    }, 5000);
    const newTxnId = `TXN-${maxIdNum + 1}`;

    const newTxn: Transaction = {
      ...txnData,
      id: newTxnId,
      status: 'Completed',
      createdAt: new Date().toISOString(),
    };

    // Transactionally update: 
    // 1. Mark bike as Sold
    bikes[bikeIndex] = {
      ...targetBike,
      status: 'Sold',
    };
    setItem(STORAGE_KEYS.BIKES, bikes);

    // 2. Add transaction
    setItem(STORAGE_KEYS.TRANSACTIONS, [newTxn, ...txns]);

    // 3. Add audit log
    this.addAuditLog(
      'SALE', 
      'transaction', 
      newTxnId, 
      `Sold ${targetBike.brand} ${targetBike.modelName} (${targetBike.registrationNumber}) to ${buyer.fullName} for ₹${newTxn.finalSellingPrice.toLocaleString('en-IN')}`, 
      userEmail
    );

    notifyListeners();
    return newTxn;
  },

  cancelTransaction(transactionId: string, reason: string, userEmail = 'admin@apexmotohub.com'): Transaction {
    const txns = this.getTransactions();
    const txnIndex = txns.findIndex(t => t.id === transactionId);
    if (txnIndex === -1) {
      throw new Error('Transaction not found.');
    }

    const txn = txns[txnIndex];
    if (txn.status === 'Cancelled') {
      throw new Error('This transaction is already cancelled.');
    }

    if (!reason || reason.trim().length < 5) {
      throw new Error('A detailed cancellation reason (at least 5 characters) is required for audit compliance.');
    }

    // Restore bike status to Available
    const bikes = this.getBikes();
    const bikeIndex = bikes.findIndex(b => b.id === txn.bikeId);
    if (bikeIndex !== -1) {
      bikes[bikeIndex] = {
        ...bikes[bikeIndex],
        status: 'Available',
      };
      setItem(STORAGE_KEYS.BIKES, bikes);
    }

    // Update transaction status
    const updatedTxn: Transaction = {
      ...txn,
      status: 'Cancelled',
      cancelledReason: reason.trim(),
      cancelledAt: new Date().toISOString(),
      cancelledBy: userEmail,
    };

    txns[txnIndex] = updatedTxn;
    setItem(STORAGE_KEYS.TRANSACTIONS, txns);

    this.addAuditLog(
      'CANCEL_TRANSACTION',
      'transaction',
      transactionId,
      `Cancelled sale transaction ${transactionId}. Reason: "${reason.trim()}". Inventory status for bike ${txn.bikeId} restored to Available.`,
      userEmail
    );

    notifyListeners();
    return updatedTxn;
  },

  // --- SYSTEM UTILITIES ---
  resetToDemoData(userEmail = 'admin@apexmotohub.com'): void {
    setItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    setItem(STORAGE_KEYS.SELLERS, INITIAL_SELLERS);
    setItem(STORAGE_KEYS.BUYERS, INITIAL_BUYERS);
    setItem(STORAGE_KEYS.BIKES, INITIAL_BIKES);
    setItem(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    setItem(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    this.addAuditLog('SYSTEM_RESET', 'system', 'DB', 'Reset all records back to realistic demo dataset', userEmail);
    notifyListeners();
  },

  exportDatabaseJson(): string {
    const payload = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      settings: this.getSettings(),
      sellers: this.getSellers(),
      buyers: this.getBuyers(),
      bikes: this.getBikes(),
      transactions: this.getTransactions(),
      auditLogs: this.getAuditLogs(),
    };
    return JSON.stringify(payload, null, 2);
  },

  importDatabaseJson(jsonString: string, userEmail = 'admin@apexmotohub.com'): void {
    try {
      const data = JSON.parse(jsonString);
      if (!data.sellers || !data.buyers || !data.bikes || !data.transactions) {
        throw new Error('Invalid backup file. Required collections missing.');
      }
      if (data.settings) setItem(STORAGE_KEYS.SETTINGS, data.settings);
      setItem(STORAGE_KEYS.SELLERS, data.sellers);
      setItem(STORAGE_KEYS.BUYERS, data.buyers);
      setItem(STORAGE_KEYS.BIKES, data.bikes);
      setItem(STORAGE_KEYS.TRANSACTIONS, data.transactions);
      if (data.auditLogs) setItem(STORAGE_KEYS.AUDIT_LOGS, data.auditLogs);

      this.addAuditLog('SYSTEM_RESET', 'system', 'RESTORE', 'Restored database from external JSON backup', userEmail);
      notifyListeners();
    } catch (err: any) {
      throw new Error(`Import failed: ${err.message || 'Invalid JSON format'}`);
    }
  },
};
