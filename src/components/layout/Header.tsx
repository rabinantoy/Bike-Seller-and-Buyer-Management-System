import React, { useState } from 'react';
import { 
  Menu, 
  Search, 
  Database, 
  History, 
  PlusCircle, 
  Bike as BikeIcon, 
  Receipt,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { TabType } from './Sidebar';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenAuditLogs: () => void;
  onOpenNewSaleModal: () => void;
  onOpenAddBikeModal: () => void;
  onOpenFirebaseGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onOpenAuditLogs,
  onOpenNewSaleModal,
  onOpenAddBikeModal,
  onOpenFirebaseGuide,
}) => {
  const { user, role } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dealership Overview';
      case 'sellers':
        return 'Seller Directory';
      case 'buyers':
        return 'Buyer Directory';
      case 'inventory':
        return 'Bike Inventory Management';
      case 'sales':
        return 'Sales & Transactions';
      case 'reports':
        return 'Reports & Analytics';
      case 'settings':
        return 'System & Firebase Configuration';
      default:
        return 'Dealership Portal';
    }
  };

  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-md">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            {getPageTitle()}
          </h1>
          <p className="hidden sm:block text-xs text-slate-500 font-medium">
            {currentDate} • Authorized Access ({role.toUpperCase()})
          </p>
        </div>
      </div>

      {/* Middle: Global Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <div className={`relative w-full rounded-xl border transition-all ${
          searchFocused ? 'border-blue-500 ring-2 ring-blue-100 bg-white' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search bikes, reg numbers, sellers, buyers, transactions..."
            className="w-full bg-transparent py-2 pl-9 pr-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Demo Mode & Firebase status badge */}
        <button
          type="button"
          onClick={onOpenFirebaseGuide}
          className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition shadow-xs"
          title="Click to view Firebase setup guide and database schema"
        >
          <Database className="h-3.5 w-3.5 text-amber-600" />
          <span className="hidden sm:inline">Active Mode:</span>
          <span className="underline decoration-amber-400">Persistent Demo</span>
        </button>

        {/* Audit Log / Activity */}
        <button
          type="button"
          onClick={onOpenAuditLogs}
          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
          title="View Dealership Audit Trail"
        >
          <History className="h-4 w-4" />
        </button>

        {/* Quick Action: New Sale */}
        <button
          type="button"
          onClick={onOpenNewSaleModal}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
        >
          <Receipt className="h-3.5 w-3.5" />
          <span>Record Sale</span>
        </button>

        {/* Quick Action: Add Bike */}
        <button
          type="button"
          onClick={onOpenAddBikeModal}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Add Bike</span>
        </button>
      </div>
    </header>
  );
};
