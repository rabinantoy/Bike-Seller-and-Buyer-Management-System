import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useDealershipData } from './hooks/useDealershipData';
import { Sidebar, TabType } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { SellerList } from './components/sellers/SellerList';
import { BuyerList } from './components/buyers/BuyerList';
import { BikeInventory } from './components/inventory/BikeInventory';
import { SalesTransactions } from './components/sales/SalesTransactions';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { LoginPage } from './components/auth/LoginPage';
import { ReceiptModal } from './components/receipt/ReceiptModal';
import { AuditLogsModal } from './components/audit/AuditLogsModal';
import { Bike, Transaction } from './types';

function MainApp() {
  const { user } = useAuth();
  const { sellers, buyers, bikes, transactions, auditLogs, settings, refresh } = useDealershipData();

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Modals & Action Triggers
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [activeReceiptTxn, setActiveReceiptTxn] = useState<Transaction | null>(null);

  // Quick Action modal triggers
  const [isAddBikeHeaderOpen, setIsAddBikeHeaderOpen] = useState(false);
  const [isNewSaleHeaderOpen, setIsNewSaleHeaderOpen] = useState(false);
  const [preselectedBikeForSale, setPreselectedBikeForSale] = useState<Bike | null>(null);

  // If user is not authenticated, display login screen
  if (!user) {
    return <LoginPage />;
  }

  const handleViewReceipt = (txn: Transaction) => {
    setActiveReceiptTxn(txn);
    setIsReceiptModalOpen(true);
  };

  const handleInitiateSaleForBike = (bike: Bike) => {
    setPreselectedBikeForSale(bike);
    setActiveTab('sales');
  };

  const handleQuickAddBike = () => {
    setActiveTab('inventory');
    setIsAddBikeHeaderOpen(true);
  };

  const handleQuickRecordSale = () => {
    setActiveTab('sales');
    setIsNewSaleHeaderOpen(true);
  };

  const handleOpenAddSeller = () => {
    setActiveTab('sellers');
  };

  const handleOpenAddBuyer = () => {
    setActiveTab('buyers');
  };

  // Find associated entities for active receipt
  const receiptBike = activeReceiptTxn ? bikes.find(b => b.id === activeReceiptTxn.bikeId) : undefined;
  const receiptBuyer = activeReceiptTxn ? buyers.find(b => b.id === activeReceiptTxn.buyerId) : undefined;
  const receiptSeller = activeReceiptTxn ? sellers.find(s => s.id === activeReceiptTxn.sellerId) : undefined;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        counts={{
          sellers: sellers.length,
          buyers: buyers.length,
          bikes: bikes.length,
          sales: transactions.length,
        }}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
      }`}>
        {/* Header */}
        <Header
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={globalSearch}
          setSearchQuery={setGlobalSearch}
          onOpenAuditLogs={() => setIsAuditLogsOpen(true)}
          onOpenNewSaleModal={handleQuickRecordSale}
          onOpenAddBikeModal={handleQuickAddBike}
          onOpenFirebaseGuide={() => setActiveTab('settings')}
        />

        {/* Tab View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              bikes={bikes}
              sellers={sellers}
              buyers={buyers}
              transactions={transactions}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenNewSale={handleQuickRecordSale}
              onOpenAddBike={handleQuickAddBike}
              onOpenAddSeller={handleOpenAddSeller}
              onOpenAddBuyer={handleOpenAddBuyer}
              onViewReceipt={handleViewReceipt}
            />
          )}

          {activeTab === 'sellers' && (
            <SellerList
              sellers={sellers}
              bikes={bikes}
              initialSearchQuery={globalSearch}
            />
          )}

          {activeTab === 'buyers' && (
            <BuyerList
              buyers={buyers}
              transactions={transactions}
              bikes={bikes}
              initialSearchQuery={globalSearch}
              onViewReceipt={handleViewReceipt}
            />
          )}

          {activeTab === 'inventory' && (
            <BikeInventory
              bikes={bikes}
              sellers={sellers}
              initialSearchQuery={globalSearch}
              onInitiateSale={handleInitiateSaleForBike}
              isAddModalOpenFromHeader={isAddBikeHeaderOpen}
              onCloseAddModalHeader={() => setIsAddBikeHeaderOpen(false)}
            />
          )}

          {activeTab === 'sales' && (
            <SalesTransactions
              transactions={transactions}
              bikes={bikes}
              buyers={buyers}
              sellers={sellers}
              initialSearchQuery={globalSearch}
              onViewReceipt={handleViewReceipt}
              isNewSaleModalOpenFromHeader={isNewSaleHeaderOpen}
              onCloseNewSaleHeader={() => setIsNewSaleHeaderOpen(false)}
              preselectedBike={preselectedBikeForSale}
              onClearPreselectedBike={() => setPreselectedBikeForSale(null)}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              sellers={sellers}
              buyers={buyers}
              bikes={bikes}
              transactions={transactions}
              settings={settings}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onRefresh={refresh}
            />
          )}
        </main>
      </div>

      {/* Audit Logs Viewer Modal */}
      <AuditLogsModal
        isOpen={isAuditLogsOpen}
        onClose={() => setIsAuditLogsOpen(false)}
        logs={auditLogs}
      />

      {/* Official Printable Tax Invoice & Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setActiveReceiptTxn(null);
        }}
        transaction={activeReceiptTxn}
        bike={receiptBike}
        buyer={receiptBuyer}
        seller={receiptSeller}
        settings={settings}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
