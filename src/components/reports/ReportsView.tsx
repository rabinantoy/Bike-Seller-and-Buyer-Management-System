import React, { useState } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Download, 
  Printer, 
  TrendingUp, 
  Bike as BikeIcon, 
  Users, 
  UserCheck, 
  IndianRupee, 
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { Seller, Buyer, Bike, Transaction, DealershipSettings } from '../../types';
import { formatCurrency, formatDate, downloadCSV } from '../../utils/formatters';

interface ReportsViewProps {
  sellers: Seller[];
  buyers: Buyer[];
  bikes: Bike[];
  transactions: Transaction[];
  settings: DealershipSettings;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  sellers,
  buyers,
  bikes,
  transactions,
  settings,
}) => {
  // Date filters (defaults to full year 2026)
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [activeReportTab, setActiveReportTab] = useState<'sellers' | 'buyers' | 'inventory' | 'monthly'>('sellers');

  // Filter transactions by date range
  const dateFilteredTransactions = transactions.filter(t => {
    return t.transactionDate >= startDate && t.transactionDate <= endDate;
  });

  const completedTxns = dateFilteredTransactions.filter(t => t.status === 'Completed');
  const totalRevenue = completedTxns.reduce((sum, t) => sum + t.finalSellingPrice, 0);
  const totalDiscounts = completedTxns.reduce((sum, t) => sum + t.discount, 0);

  // 1. Seller-wise Performance Report
  const sellerReport = sellers.map(seller => {
    const sellerBikes = bikes.filter(b => b.sellerId === seller.id);
    const sellerSoldBikes = completedTxns.filter(t => t.sellerId === seller.id);
    const revenue = sellerSoldBikes.reduce((sum, t) => sum + t.finalSellingPrice, 0);
    return {
      sellerId: seller.id,
      fullName: seller.fullName,
      sellerType: seller.sellerType,
      city: seller.city,
      totalConsigned: sellerBikes.length,
      bikesSold: sellerSoldBikes.length,
      totalRevenue: revenue,
    };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);

  // 2. Buyer Purchase Report
  const buyerReport = buyers.map(buyer => {
    const buyerPurchases = completedTxns.filter(t => t.buyerId === buyer.id);
    const totalSpent = buyerPurchases.reduce((sum, t) => sum + t.finalSellingPrice, 0);
    return {
      buyerId: buyer.id,
      fullName: buyer.fullName,
      mobile: buyer.mobileNumber,
      city: buyer.city,
      purchasesCount: buyerPurchases.length,
      totalSpent,
      lastPurchaseDate: buyerPurchases.length > 0 ? buyerPurchases[buyerPurchases.length - 1].transactionDate : '-',
    };
  }).filter(b => b.purchasesCount > 0).sort((a, b) => b.totalSpent - a.totalSpent);

  // 3. Brand Inventory Report (Available vs Sold)
  const brandStatsMap: Record<string, { brand: string; available: number; sold: number; total: number; avgPrice: number }> = {};
  bikes.forEach(b => {
    if (!brandStatsMap[b.brand]) {
      brandStatsMap[b.brand] = { brand: b.brand, available: 0, sold: 0, total: 0, avgPrice: 0 };
    }
    brandStatsMap[b.brand].total += 1;
    if (b.status === 'Available') brandStatsMap[b.brand].available += 1;
    if (b.status === 'Sold') brandStatsMap[b.brand].sold += 1;
  });

  const brandInventoryReport = Object.values(brandStatsMap).sort((a, b) => b.total - a.total);

  // 4. Monthly Breakdown
  const monthlySummaryMap: Record<string, { month: string; units: number; revenue: number; discounts: number }> = {};
  completedTxns.forEach(t => {
    const m = t.transactionDate.slice(0, 7);
    if (!monthlySummaryMap[m]) {
      monthlySummaryMap[m] = { month: m, units: 0, revenue: 0, discounts: 0 };
    }
    monthlySummaryMap[m].units += 1;
    monthlySummaryMap[m].revenue += t.finalSellingPrice;
    monthlySummaryMap[m].discounts += t.discount;
  });
  const monthlyReport = Object.values(monthlySummaryMap).sort((a, b) => a.month.localeCompare(b.month));

  // CSV Exporter for currently viewed report
  const handleExportReportCSV = () => {
    if (activeReportTab === 'sellers') {
      const rows = sellerReport.map(s => ({
        'Seller ID': s.sellerId,
        'Full Name': s.fullName,
        'Type': s.sellerType,
        'City': s.city,
        'Bikes Consigned': s.totalConsigned,
        'Units Sold': s.bikesSold,
        'Revenue Generated (INR)': s.totalRevenue,
      }));
      downloadCSV('Dealership_Seller_Performance_Report', rows);
    } else if (activeReportTab === 'buyers') {
      const rows = buyerReport.map(b => ({
        'Buyer ID': b.buyerId,
        'Full Name': b.fullName,
        'Mobile': b.mobile,
        'City': b.city,
        'Units Purchased': b.purchasesCount,
        'Total Spent (INR)': b.totalSpent,
        'Last Purchase': b.lastPurchaseDate,
      }));
      downloadCSV('Dealership_Buyer_Purchase_Report', rows);
    } else if (activeReportTab === 'inventory') {
      const rows = brandInventoryReport.map(br => ({
        'Brand': br.brand,
        'Total Stock': br.total,
        'Available Units': br.available,
        'Sold Units': br.sold,
      }));
      downloadCSV('Dealership_Inventory_Breakdown_Report', rows);
    } else {
      const rows = monthlyReport.map(m => ({
        'Month': m.month,
        'Units Sold': m.units,
        'Revenue (INR)': m.revenue,
        'Discounts Given (INR)': m.discounts,
      }));
      downloadCSV('Dealership_Monthly_Revenue_Report', rows);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Reports & Analytics Engine</h2>
          <p className="text-xs text-slate-500">
            Real-time financial audits, seller consignments, customer expenditure, and stock ratios.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportReportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-600/30 transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Date Filter & Metrics Summary Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span>Filter by Transaction Date Range:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* 3 Metric Summary Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Total Net Revenue</span>
            <p className="text-xl font-black text-blue-900 mt-1">{formatCurrency(totalRevenue)}</p>
            <p className="text-[11px] text-blue-700 font-medium mt-0.5">{completedTxns.length} units sold in period</p>
          </div>

          <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Average Ticket Size</span>
            <p className="text-xl font-black text-emerald-900 mt-1">
              {formatCurrency(completedTxns.length > 0 ? Math.round(totalRevenue / completedTxns.length) : 0)}
            </p>
            <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Average selling value per bike</p>
          </div>

          <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Dealership Discounts Granted</span>
            <p className="text-xl font-black text-amber-900 mt-1">{formatCurrency(totalDiscounts)}</p>
            <p className="text-[11px] text-amber-700 font-medium mt-0.5">Total concessions provided to buyers</p>
          </div>
        </div>
      </div>

      {/* Report Category Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveReportTab('sellers')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition ${
            activeReportTab === 'sellers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Seller-wise Sales ({sellerReport.length})
        </button>
        <button
          onClick={() => setActiveReportTab('buyers')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition ${
            activeReportTab === 'buyers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Buyer Purchase History ({buyerReport.length})
        </button>
        <button
          onClick={() => setActiveReportTab('inventory')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition ${
            activeReportTab === 'inventory'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Brand Inventory Analysis ({brandInventoryReport.length})
        </button>
        <button
          onClick={() => setActiveReportTab('monthly')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition ${
            activeReportTab === 'monthly'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Monthly Revenue Summary
        </button>
      </div>

      {/* REPORT CONTENT TABLES */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {/* Tab 1: Sellers */}
        {activeReportTab === 'sellers' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="py-3 px-4 font-bold text-slate-600">Seller Name & ID</th>
                  <th className="py-3 px-4 font-bold text-slate-600">Type</th>
                  <th className="py-3 px-4 font-bold text-slate-600">City</th>
                  <th className="py-3 px-4 font-bold text-slate-600 text-center">Total Consigned</th>
                  <th className="py-3 px-4 font-bold text-slate-600 text-center">Bikes Sold</th>
                  <th className="py-3 px-4 font-bold text-slate-600 text-right">Total Revenue (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sellerReport.map(s => (
                  <tr key={s.sellerId} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{s.fullName}</span>
                      <span className="font-mono text-[10px] text-blue-600">{s.sellerId}</span>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-600">{s.sellerType}</td>
                    <td className="py-3 px-4 text-slate-600">{s.city}</td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-800">{s.totalConsigned}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {s.bikesSold} sold
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-blue-600">
                      {formatCurrency(s.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Buyers */}
        {activeReportTab === 'buyers' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="py-3 px-4 font-bold text-slate-600">Buyer Name & ID</th>
                  <th className="py-3 px-4 font-bold text-slate-600">Mobile</th>
                  <th className="py-3 px-4 font-bold text-slate-600">City</th>
                  <th className="py-3 px-4 font-bold text-slate-600 text-center">Units Bought</th>
                  <th className="py-3 px-4 font-bold text-slate-600">Last Purchase Date</th>
                  <th className="py-3 px-4 font-bold text-slate-600 text-right">Total Spent (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {buyerReport.map(b => (
                  <tr key={b.buyerId} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{b.fullName}</span>
                      <span className="font-mono text-[10px] text-blue-600">{b.buyerId}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">+91 {b.mobile}</td>
                    <td className="py-3 px-4 text-slate-600">{b.city}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">{b.purchasesCount}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(b.lastPurchaseDate)}</td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      {formatCurrency(b.totalSpent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Inventory Breakdown */}
        {activeReportTab === 'inventory' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="py-3 px-4 font-bold text-slate-600">Manufacturer Brand</th>
                  <th className="py-3 px-4 font-bold text-slate-600 text-center">Total Stock</th>
                  <th className="py-3 px-4 font-bold text-slate-600 text-center">Available Units</th>
                  <th className="py-3 px-4 font-bold text-slate-600 text-center">Sold Units</th>
                  <th className="py-3 px-4 font-bold text-slate-600 text-right">Sell-Through Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {brandInventoryReport.map(br => {
                  const sellRate = br.total > 0 ? ((br.sold / br.total) * 100).toFixed(0) : 0;
                  return (
                    <tr key={br.brand} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-900">{br.brand}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">{br.total}</td>
                      <td className="py-3 px-4 text-center font-semibold text-emerald-600">{br.available}</td>
                      <td className="py-3 px-4 text-center font-semibold text-blue-600">{br.sold}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{sellRate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Monthly Summary */}
        {activeReportTab === 'monthly' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="py-3 px-4 font-bold text-slate-600">Month</th>
                  <th className="py-3 px-4 font-bold text-slate-600 text-center">Units Sold</th>
                  <th className="py-3 px-4 font-bold text-slate-600 text-right">Discounts Given</th>
                  <th className="py-3 px-4 font-bold text-slate-600 text-right">Net Revenue (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyReport.map(m => (
                  <tr key={m.month} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">{m.month}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">{m.units}</td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-semibold">{formatCurrency(m.discounts)}</td>
                    <td className="py-3 px-4 text-right font-black text-blue-600">{formatCurrency(m.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
