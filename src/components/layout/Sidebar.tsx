import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Bike as BikeIcon, 
  Receipt, 
  BarChart3, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type TabType = 'dashboard' | 'sellers' | 'buyers' | 'inventory' | 'sales' | 'reports' | 'settings';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  counts: {
    sellers: number;
    buyers: number;
    bikes: number;
    sales: number;
  };
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  counts,
  mobileOpen,
  setMobileOpen,
}) => {
  const { user, role, isAdmin, logout, switchRole } = useAuth();

  const navItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sellers' as TabType, label: 'Sellers', icon: Users, badge: counts.sellers },
    { id: 'buyers' as TabType, label: 'Buyers', icon: UserCheck, badge: counts.buyers },
    { id: 'inventory' as TabType, label: 'Bike Inventory', icon: BikeIcon, badge: counts.bikes },
    { id: 'sales' as TabType, label: 'Sales & Transactions', icon: Receipt, badge: counts.sales },
    { id: 'reports' as TabType, label: 'Reports', icon: BarChart3 },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (tab: TabType) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container: Charcoal/Dark Navy #0f172a styling */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-100 transition-all duration-300 ease-in-out border-r border-slate-800
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Dealership Branding Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/20">
              <BikeIcon className="h-6 w-6" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-extrabold tracking-tight text-white uppercase">
                  Apex Moto Hub
                </span>
                <span className="text-[10px] font-medium text-blue-400 tracking-wider uppercase">
                  Dealership Portal
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
          {!isCollapsed && (
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Management Menu
            </p>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 transition-transform ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                  }`}
                />
                {!isCollapsed && (
                  <div className="flex flex-1 items-center justify-between truncate">
                    <span className="truncate">{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Session & Role Bar */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          {!isCollapsed ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-xl bg-slate-800/60 p-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex flex-col truncate flex-1">
                  <span className="text-xs font-bold text-white truncate">
                    {user?.displayName || 'Dealership Staff'}
                  </span>
                  <span className="text-[11px] text-slate-400 truncate">
                    {user?.email || 'staff@dealership.com'}
                  </span>
                </div>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  isAdmin ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {role}
                </span>
              </div>

              {/* Quick Role Switcher for College Project Testing */}
              <div className="flex items-center justify-between text-xs px-1 text-slate-400">
                <span className="text-[11px]">Role Switcher:</span>
                <button
                  type="button"
                  onClick={() => switchRole(isAdmin ? 'staff' : 'admin')}
                  className="text-blue-400 hover:text-blue-300 font-medium underline flex items-center gap-1 text-[11px]"
                >
                  {isAdmin ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                  Switch to {isAdmin ? 'Staff' : 'Admin'}
                </button>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-800/40 px-3 py-2 text-xs font-medium text-rose-300 hover:bg-rose-950/30 hover:border-rose-900/50 hover:text-rose-200 transition"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => switchRole(isAdmin ? 'staff' : 'admin')}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-blue-400 hover:text-white"
                title={`Current: ${role}. Click to switch role`}
              >
                {isAdmin ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={logout}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-rose-400 hover:bg-slate-800"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
