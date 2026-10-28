# Bike Seller & Buyer Management System
**Apex Moto Hub Dealership Portal**

A full-stack, responsive, and production-grade motorcycle dealership management system designed for dealership staff and managers to control bike inventory, register sellers, manage buyers, execute sales transactions, generate printable tax invoices, and analyze sales reports.

---

## 🚀 Key Features

1. **Dashboard & Analytics:**
   - 6 Key Performance Indicator (KPI) stat cards (Total Bikes, Available, Sellers, Buyers, Completed Sales, Total Revenue in ₹).
   - Interactive Monthly Sales Revenue Bar Chart (Recharts).
   - Real-time Bike Inventory Status Donut Chart (Available vs Sold vs Reserved).
   - Quick activity feeds for recent transactions and newly onboarded motorcycles.

2. **Seller Management:**
   - Auto-generated Seller IDs (e.g. `SEL-1001`).
   - Validates Indian 10-digit mobile numbers and email addresses.
   - Categorizes individual motorcycle owners vs commercial dealership consignors.
   - Drawer/modal displaying all bikes associated with/consigned by any specific seller.
   - Safe deletion confirmation with protection against deleting sellers with assigned bikes.

3. **Buyer Management:**
   - Auto-generated Buyer IDs (e.g. `BUY-2001`).
   - Verified identity documents (Aadhaar, Driving License, PAN Card, Voter ID, Passport).
   - Identity privacy: Masked ID references (e.g., `XXXX-XXXX-8821`), preventing storage of unmasked sensitive numbers.
   - Purchase history drawer showing all completed transactions for each customer.

4. **Bike Inventory Management:**
   - Fields: Brand, Model, Reg Number, Mfg Year, Engine CC, Fuel Type, Color, Odometer (km), Condition (New/Used), Selling Price in ₹, Consigning Seller, Status (Available, Reserved, Sold).
   - **Duplicate Registration Number Guard:** Case-insensitive check prevents duplicate bikes with identical registration numbers from being recorded.
   - Grid View & Table View toggles with responsive motorcycle cards.
   - Multi-filtering by brand, availability status, condition, and price sorting.
   - One-click "Sell This Bike" action for available bikes.

5. **Sales & Transaction Management:**
   - Selects available bikes only (prevents selling already-sold bikes).
   - Auto-retrieves bike specifications and consigning seller details.
   - **Live interactive price & discount calculator** with net payable preview.
   - Payment method recording (Cash, UPI, Bank Transfer, Cheque, Finance/Loan).
   - **Atomic inventory locking:** Automatically transitions bike status to `Sold` on completion.
   - **Transaction Cancellation & Inventory Restoration:** Authorized users can cancel a sale with mandatory audit reason; the bike is automatically returned to `Available` stock.
   - **Official Printable Tax Invoice / Sales Receipt:** Formatted dealership invoice complete with buyer details, vehicle particulars, financial breakdown, RTO declaration, and signature stamp box.

6. **Reports & Global Export:**
   - Date-range filtering across all transactions.
   - Seller-wise performance reports.
   - Buyer purchase volume and expenditure reports.
   - Brand inventory breakdown (available vs sold sell-through rate).
   - Monthly revenue summary.
   - One-click CSV export for Sellers, Buyers, Inventory, and Sales.
   - Print report support.

7. **Security, RBAC & Audit Trail:**
   - Role-Based Access Control: Administrator and Sales Staff roles.
   - Chronological immutable Audit Log tracking entity creations, edits, deletions, sales, and role changes.
   - Evaluator-friendly 1-click role switcher and demo presets.

---

## 🛠 Technology Stack

- **Frontend:** React 19 with TypeScript
- **Styling:** Tailwind CSS 4 with custom print stylesheets (`@media print`)
- **Icons:** Lucide React
- **Data Visualization:** Recharts
- **Storage Layer:** Reactive LocalStorage with synchronous change-listeners, transaction validation, and JSON backup/restore.
- **Backend Blueprint:** Cloud Firestore schema and security rules ready in `firebase-blueprint.json`.

---

## 📁 Project Structure

```
├── firebase-blueprint.json      # Firestore Intermediate Representation (IR)
├── index.html                   # HTML entry point with Plus Jakarta Sans
├── metadata.json                # Project branding metadata
├── package.json                 # Dependencies and build scripts
├── README.md                    # System documentation and setup guide
├── src/
│   ├── App.tsx                  # Main application orchestrator
│   ├── main.tsx                 # React DOM root
│   ├── index.css                # Global Tailwind CSS and print rules
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces for all data entities
│   ├── data/
│   │   └── initialData.ts       # Realistic Indian motorcycle market seed data
│   ├── services/
│   │   └── storage.ts           # Persistent repository layer with CRUD & audit logs
│   ├── hooks/
│   │   └── useDealershipData.ts # Reactive data hook for live UI synchronization
│   ├── context/
│   │   └── AuthContext.tsx      # Authentication state and RBAC provider
│   ├── utils/
│   │   └── formatters.ts        # Currency (₹ INR), date, and CSV export utilities
│   └── components/
│       ├── layout/
│       │   ├── Sidebar.tsx      # Dark navy collapsible navigation menu
│       │   └── Header.tsx       # Search bar, demo indicator, and quick actions
│       ├── dashboard/
│       │   └── Dashboard.tsx    # Dealership KPI metrics and Recharts graphs
│       ├── sellers/
│       │   └── SellerList.tsx   # Seller CRUD, consigned bikes view, CSV export
│       ├── buyers/
│       │   └── BuyerList.tsx    # Buyer CRUD, ID masking, purchase history
│       ├── inventory/
│       │   └── BikeInventory.tsx# Inventory cards/table, reg no guard, filters
│       ├── sales/
│       │   └── SalesTransactions.tsx # Deal execution, live calculator, cancellation
│       ├── reports/
│       │   └── ReportsView.tsx  # Date-filtered analytics, seller/buyer reports
│       ├── receipt/
│       │   └── ReceiptModal.tsx # Printable tax invoice and vehicle certificate
│       ├── audit/
│       │   └── AuditLogsModal.tsx# Dealership chronological audit trail
│       ├── auth/
│       │   └── LoginPage.tsx    # Branded login with 1-click evaluator access
│       ├── settings/
│       │   └── SettingsView.tsx # Profile, database backup/restore, Firebase guide
│       └── common/
│           ├── Modal.tsx        # Reusable accessible dialog
│           └── ConfirmDialog.tsx# Safety confirmation for destructive actions
```

---

## ⚡ How to Run Locally

1. Clone or download the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the local development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ How to Connect Firebase Firestore & Authentication

If you wish to switch from local persistent demo storage to Google Cloud Firestore:

1. Create a project at [Firebase Console](https://console.firebase.google.com).
2. Create a **Cloud Firestore** database.
3. Enable **Email/Password** or **Google Sign-In** under Authentication.
4. Copy your web app credentials and save them as `firebase-applet-config.json`:
   ```json
   {
     "apiKey": "YOUR_API_KEY",
     "authDomain": "YOUR_PROJECT_ID.firebaseapp.com",
     "projectId": "YOUR_PROJECT_ID",
     "storageBucket": "YOUR_PROJECT_ID.firebasestorage.app",
     "messagingSenderId": "YOUR_SENDER_ID",
     "appId": "YOUR_APP_ID"
   }
   ```
5. Deploy security rules defined in `firebase-blueprint.json` to lock collection writes to authenticated dealership staff.
