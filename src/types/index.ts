export type SellerType = 'individual' | 'dealership';

export interface Seller {
  id: string; // e.g. SEL-1001
  fullName: string;
  mobileNumber: string;
  email: string;
  address: string;
  city: string;
  sellerType: SellerType;
  registrationDate: string; // YYYY-MM-DD
  notes: string;
  createdAt: string; // ISO
}

export type GovIdType = 'Aadhaar' | 'PAN Card' | 'Driving License' | 'Voter ID' | 'Passport';

export interface Buyer {
  id: string; // e.g. BUY-2001
  fullName: string;
  mobileNumber: string;
  email: string;
  address: string;
  city: string;
  govIdType: GovIdType;
  govIdNumberMasked: string; // e.g. "XXXX-XXXX-8921"
  registrationDate: string; // YYYY-MM-DD
  notes: string;
  createdAt: string; // ISO
}

export type BikeCondition = 'New' | 'Used';
export type FuelType = 'Petrol' | 'Electric' | 'Hybrid';
export type BikeStatus = 'Available' | 'Reserved' | 'Sold';

export interface Bike {
  id: string; // e.g. BIKE-3001
  brand: string;
  modelName: string;
  registrationNumber: string; // e.g. MH 12 AB 1234
  manufacturingYear: number;
  engineCapacityCc: number;
  fuelType: FuelType;
  color: string;
  kmDriven: number;
  condition: BikeCondition;
  sellingPrice: number; // in INR (₹)
  sellerId: string; // Foreign key to Seller.id
  dateAdded: string; // YYYY-MM-DD
  status: BikeStatus;
  notes?: string;
  imageUrl?: string;
  createdAt: string;
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Finance/EMI';
export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Pending';
export type TransactionStatus = 'Completed' | 'Cancelled';

export interface Transaction {
  id: string; // e.g. TXN-5001
  bikeId: string; // Foreign key to Bike.id
  sellerId: string; // Foreign key to Seller.id
  buyerId: string; // Foreign key to Buyer.id
  originalAskingPrice: number;
  discount: number;
  finalSellingPrice: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionDate: string; // YYYY-MM-DD
  remarks: string;
  status: TransactionStatus;
  cancelledReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  createdAt: string; // ISO
}

export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'SALE' 
  | 'CANCEL_TRANSACTION' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'SYSTEM_RESET';

export interface AuditLog {
  id: string;
  timestamp: string; // ISO
  userEmail: string;
  action: AuditAction;
  entity: 'seller' | 'buyer' | 'bike' | 'transaction' | 'auth' | 'system';
  entityId: string;
  details: string;
}

export type UserRole = 'admin' | 'staff';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
}

export interface DealershipSettings {
  dealershipName: string;
  tagline: string;
  gstNumber: string;
  contactNumber: string;
  contactEmail: string;
  address: string;
  city: string;
  currencySymbol: string;
}
