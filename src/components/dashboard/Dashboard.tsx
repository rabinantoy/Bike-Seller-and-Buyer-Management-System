import React from 'react';
import { 
  Bike as BikeIcon, 
  Users, 
  UserCheck, 
  Receipt, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Plus, 
  IndianRupee, 
  ArrowUpRight,
  Eye,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { Bike, Buyer, Seller, Transaction } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface DashboardProps {
  bikes: Bike[];
  sellers: Seller[];
  buyers: Buyer[];
  transactions: Transaction[];
  onNavigate: (tab: any) => void;
  onOpenNewSale: () => void;
  onOpenAddBike: () => void;
  onOpenAddSeller: () => void;
  onOpenAddBuyer: () => void;
  onViewReceipt: (txn: Transaction) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  bikes,
  sellers,
  buyers,
  transactions,
  onNavigate,
  onOpenNewSale,
  onOpenAddBike,
  onOpenAddSeller,
  onOpenAddBuyer,
  onViewReceipt,
}) => {
  // Stats Calculations
  const totalBikes = bikes.length;
  const availableBikes = bikes.filter(b => b.status === 'Available').length;
  const soldBikes = bikes.filter(b => b.status === 'Sold').length;
  const reservedBikes = bikes.filter(b => b.status === 'Reserved').length;

  const totalSellers = sellers.length;
  const totalBuyers = buyers.length;
  
  const completedTransactions = transactions.filter(t => t.status === 'Completed');
  const totalCompletedSales = completedTransactions.length;
  const totalSalesRevenue = completedTransactions.reduce((acc, t) => acc + t.finalSellingPrice, 0);

  // Monthly Sales Chart Data (Aggregation by month)
  const monthlyDataMap: Record<string, { month: string; salesCount: number; revenue: number }> = {
    '2026-01': { month: 'Jan 2026', salesCount: 0, revenue: 0 },
    '2026-02': { month: 'Feb 2026', salesCount: 0, revenue: 0 },
    '2026-03': { month: 'Mar 2026', salesCount: 0, revenue: 0 },
    '2026-04': { month: 'Apr 2026', salesCount: 0, revenue: 0 },
    '2026-05': { month: 'May 2026', salesCount: 0, revenue: 0 },
  };

  completedTransactions.forEach(t => {
    const key = t.transactionDate.slice(0, 7);
    if (monthlyDataMap[key]) {
      monthlyDataMap[key].salesCount += 1;
      monthlyDataMap[key].revenue += t.finalSellingPrice;
    } else {
      monthlyDataMap[key] = {
        month: key,
        salesCount: 1,
        revenue: t.finalSellingPrice,
      };
    }
  });

  const monthlySalesChartData = Object.values(monthlyDataMap).map(item => ({
    month: item.month,
    revenueInLakhs: Number((item.revenue / 100000).toFixed(2)),
    revenue: item.revenue,
    salesCount: item.salesCount,
  }));

  // Pie Chart Data: Availability
  const availabilityPieData = [
    { name: 'Available', value: availableBikes, color: '#10b981' }, // emerald
    { name: 'Sold', value: soldBikes, color: '#3b82f6' }, // blue
    { name: 'Reserved', value: reservedBikes, color: '#f59e0b' }, // amber
  ].filter(d => d.value > 0);

  // Recent Transactions (last 5)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Recently Added Bikes (last 4)
  const recentlyAddedBikes = [...bikes]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6 pb-8">
      {/* Quick Action Shortcuts Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 text-white shadow-xl">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-blue-300 border border-blue-500/30 mb-2">
            Dealership Operations Hub
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Apex Moto Hub Dealership
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
            Real-time control center for inventory onboarding, customer registrations, and sale execution.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenNewSale}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition"
          >
            <Receipt className="h-4 w-4" />
            <span>Record Sale</span>
          </button>
          <button
            onClick={onOpenAddBike}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
          >
            <BikeIcon className="h-4 w-4" />
            <span>+ Add Bike</span>
          </button>
          <button
            onClick={onOpenAddBuyer}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
          >
            <UserCheck className="h-4 w-4" />
            <span>+ Add Buyer</span>
          </button>
        </div>
      </div>

      {/* 6 Core Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Bikes */}
        <div 
          onClick={() => onNavigate('inventory')}
          className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-blue-400 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Bikes</span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
              <BikeIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalBikes}</span>
            <span className="text-xs text-slate-500">units</span>
          </div>
          <p className="mt-1 text-[11px] text-blue-600 font-semibold flex items-center gap-0.5">
            View Inventory <ArrowUpRight className="h-3 w-3" />
          </p>
        </div>

        {/* Available Bikes */}
        <div 
          onClick={() => onNavigate('inventory')}
          className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-emerald-400 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Available</span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{availableBikes}</span>
            <span className="text-xs text-slate-500">ready to sell</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 font-semibold">
            {((availableBikes / (totalBikes || 1)) * 100).toFixed(0)}% of stock
          </p>
        </div>

        {/* Total Sellers */}
        <div 
          onClick={() => onNavigate('sellers')}
          className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-indigo-400 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sellers</span>
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalSellers}</span>
            <span className="text-xs text-slate-500">partners</span>
          </div>
          <p className="mt-1 text-[11px] text-indigo-600 font-semibold flex items-center gap-0.5">
            View Sellers <ArrowUpRight className="h-3 w-3" />
          </p>
        </div>

        {/* Total Buyers */}
        <div 
          onClick={() => onNavigate('buyers')}
          className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-sky-400 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Buyers</span>
            <div className="rounded-xl bg-sky-50 p-2 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalBuyers}</span>
            <span className="text-xs text-slate-500">customers</span>
          </div>
          <p className="mt-1 text-[11px] text-sky-600 font-semibold flex items-center gap-0.5">
            View Buyers <ArrowUpRight className="h-3 w-3" />
          </p>
        </div>

        {/* Completed Sales */}
        <div 
          onClick={() => onNavigate('sales')}
          className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-violet-400 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Sales</span>
            <div className="rounded-xl bg-violet-50 p-2 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-violet-700">{totalCompletedSales}</span>
            <span className="text-xs text-slate-500">deals</span>
          </div>
          <p className="mt-1 text-[11px] text-violet-600 font-semibold flex items-center gap-0.5">
            View Ledger <ArrowUpRight className="h-3 w-3" />
          </p>
        </div>

        {/* Total Sales Revenue */}
        <div 
          onClick={() => onNavigate('reports')}
          className="group cursor-pointer rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/50 to-white p-4 shadow-xs hover:border-blue-500 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900">Total Revenue</span>
            <div className="rounded-xl bg-blue-600 p-2 text-white shadow-xs">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-black text-blue-700">
              {formatCurrency(totalSalesRevenue)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-blue-700 font-semibold">
            Across {totalCompletedSales} transactions
          </p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Sales Revenue Trend</h3>
              <p className="text-xs text-slate-500">Revenue in Lakhs (₹) across 2026 sales</p>
            </div>
            <span className="rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700">
              2026 Fiscal Year
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySalesChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} unit="L" />
                <Tooltip 
                  formatter={(val: any) => [`₹${(Number(val) * 100000).toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="revenueInLakhs" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bike Availability Donut Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Bike Inventory Status</h3>
            <p className="text-xs text-slate-500">Available vs Sold vs Reserved distribution</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={availabilityPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {availabilityPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any, name: any) => [`${val} bikes`, name]}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Available</p>
              <p className="text-sm font-bold text-emerald-600">{availableBikes}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Sold</p>
              <p className="text-sm font-bold text-blue-600">{soldBikes}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Total</p>
              <p className="text-sm font-bold text-slate-800">{totalBikes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Transactions & Recently Added Bikes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Transactions</h3>
              <p className="text-xs text-slate-500">Latest bike sales and invoice generation</p>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View All ({transactions.length})
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentTransactions.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No transactions recorded yet.</p>
            ) : (
              recentTransactions.map((t) => {
                const targetBike = bikes.find(b => b.id === t.bikeId);
                const targetBuyer = buyers.find(b => b.id === t.buyerId);
                return (
                  <div key={t.id} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 rounded-xl px-2 transition">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Receipt className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {targetBike ? `${targetBike.brand} ${targetBike.modelName}` : `Bike: ${t.bikeId}`}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Buyer: {targetBuyer?.fullName || t.buyerId} • {formatDate(t.transactionDate)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-900">{formatCurrency(t.finalSellingPrice)}</p>
                      <button
                        onClick={() => onViewReceipt(t)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                      >
                        <FileText className="h-3 w-3" />
                        <span>Receipt</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recently Added Bikes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recently Added Bikes</h3>
              <p className="text-xs text-slate-500">New arrivals added to dealership floor</p>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View Full Stock ({bikes.length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentlyAddedBikes.map((bike) => (
              <div 
                key={bike.id}
                className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-3 hover:bg-white hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    bike.status === 'Available'
                      ? 'bg-emerald-100 text-emerald-800'
                      : bike.status === 'Sold'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {bike.status}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 font-semibold">
                    {bike.registrationNumber}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mt-2 truncate">
                  {bike.brand} {bike.modelName}
                </h4>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[11px]">
                  <span className="text-slate-500">{bike.manufacturingYear} • {bike.kmDriven.toLocaleString('en-IN')} km</span>
                  <span className="font-extrabold text-blue-600">{formatCurrency(bike.sellingPrice)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
