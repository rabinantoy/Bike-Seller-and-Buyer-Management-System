import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  XCircle, 
  Eye, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Calculator, 
  IndianRupee, 
  Bike as BikeIcon, 
  User, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Transaction, Bike, Buyer, Seller, PaymentMethod, PaymentStatus } from '../../types';
import { storageService } from '../../services/storage';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatDate, formatCurrency, downloadCSV } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

interface SalesTransactionsProps {
  transactions: Transaction[];
  bikes: Bike[];
  buyers: Buyer[];
  sellers: Seller[];
  initialSearchQuery?: string;
  onViewReceipt: (txn: Transaction) => void;
  isNewSaleModalOpenFromHeader?: boolean;
  onCloseNewSaleHeader?: () => void;
  preselectedBike?: Bike | null;
  onClearPreselectedBike?: () => void;
}

export const SalesTransactions: React.FC<SalesTransactionsProps> = ({
  transactions,
  bikes,
  buyers,
  sellers,
  initialSearchQuery = '',
  onViewReceipt,
  isNewSaleModalOpenFromHeader = false,
  onCloseNewSaleHeader,
  preselectedBike = null,
  onClearPreselectedBike,
}) => {
  const { user, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [targetTxnToCancel, setTargetTxnToCancel] = useState<Transaction | null>(null);

  // New Sale Form State
  const [selectedBikeId, setSelectedBikeId] = useState('');
  const [selectedBuyerId, setSelectedBuyerId] = useState(buyers[0]?.id || '');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks] = useState('');
  const [saleError, setSaleError] = useState('');

  // Handle header or external trigger for New Sale
  React.useEffect(() => {
    if (isNewSaleModalOpenFromHeader || preselectedBike) {
      handleOpenRecordSale(preselectedBike);
      if (onCloseNewSaleHeader) onCloseNewSaleHeader();
    }
  }, [isNewSaleModalOpenFromHeader, preselectedBike]);

  // Available Bikes only for sale
  const availableBikes = bikes.filter(b => b.status === 'Available');

  // Active selected bike in form
  const currentFormBike = bikes.find(b => b.id === selectedBikeId);
  const currentFormSeller = currentFormBike ? sellers.find(s => s.id === currentFormBike.sellerId) : null;
  const currentFormBuyer = buyers.find(b => b.id === selectedBuyerId);

  // Live Math calculation
  const originalAskingPrice = currentFormBike ? currentFormBike.sellingPrice : 0;
  const finalSellingPrice = Math.max(0, originalAskingPrice - (discountAmount || 0));

  const handleOpenRecordSale = (presetBike?: Bike | null) => {
    const targetBike = presetBike || availableBikes[0] || null;
    setSelectedBikeId(targetBike ? targetBike.id : '');
    setSelectedBuyerId(buyers[0]?.id || '');
    setDiscountAmount(0);
    setPaymentMethod('Bank Transfer');
    setPaymentStatus('Paid');
    setTransactionDate(new Date().toISOString().slice(0, 10));
    setRemarks('');
    setSaleError('');
    setIsRecordModalOpen(true);
  };

  const handleCloseRecordSale = () => {
    setIsRecordModalOpen(false);
    if (onClearPreselectedBike) onClearPreselectedBike();
  };

  const handleSubmitSale = (e: React.FormEvent) => {
    e.preventDefault();
    setSaleError('');

    if (!selectedBikeId) {
      setSaleError('Please select an available motorcycle.');
      return;
    }
    if (!selectedBuyerId) {
      setSaleError('Please select a registered buyer.');
      return;
    }
    if (!currentFormBike) {
      setSaleError('Selected bike not found.');
      return;
    }
    if (currentFormBike.status === 'Sold') {
      setSaleError('This motorcycle has already been sold. It cannot be sold twice.');
      return;
    }

    try {
      const newTxn = storageService.createTransaction({
        bikeId: selectedBikeId,
        sellerId: currentFormBike.sellerId,
        buyerId: selectedBuyerId,
        originalAskingPrice,
        discount: discountAmount || 0,
        finalSellingPrice,
        paymentMethod,
        paymentStatus,
        transactionDate,
        remarks: remarks.trim() || 'Direct sale executed through dealership portal.',
      }, user?.email);

      setIsRecordModalOpen(false);
      if (onClearPreselectedBike) onClearPreselectedBike();

      // Automatically open receipt for customer printing!
      onViewReceipt(newTxn);
    } catch (err: any) {
      setSaleError(err.message || 'Transaction failed. Inventory was not modified.');
    }
  };

  const handleOpenCancelTransaction = (txn: Transaction) => {
    setTargetTxnToCancel(txn);
    setCancelReason('');
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = () => {
    if (!targetTxnToCancel) return;
    try {
      storageService.cancelTransaction(targetTxnToCancel.id, cancelReason, user?.email);
      setIsCancelModalOpen(false);
      setTargetTxnToCancel(null);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel transaction.');
    }
  };

  const handleExportCSV = () => {
    const rows = filteredTransactions.map(t => {
      const bike = bikes.find(b => b.id === t.bikeId);
      const buyer = buyers.find(b => b.id === t.buyerId);
      const seller = sellers.find(s => s.id === t.sellerId);
      return {
        'Transaction ID': t.id,
        'Date': t.transactionDate,
        'Status': t.status,
        'Bike ID': t.bikeId,
        'Bike Model': bike ? `${bike.brand} ${bike.modelName}` : 'N/A',
        'Registration No': bike?.registrationNumber || 'N/A',
        'Buyer Name': buyer?.fullName || t.buyerId,
        'Buyer Mobile': buyer?.mobileNumber || 'N/A',
        'Seller Name': seller?.fullName || t.sellerId,
        'Asking Price': t.originalAskingPrice,
        'Discount': t.discount,
        'Final Price (INR)': t.finalSellingPrice,
        'Payment Method': t.paymentMethod,
        'Payment Status': t.paymentStatus,
        'Remarks': t.remarks,
        'Cancelled Reason': t.cancelledReason || '',
      };
    });
    downloadCSV('Apex_Dealership_Sales_Transactions', rows);
  };

  // Filtered transactions
  const filteredTransactions = transactions
    .filter(t => {
      const q = searchTerm.toLowerCase();
      const bike = bikes.find(b => b.id === t.bikeId);
      const buyer = buyers.find(b => b.id === t.buyerId);
      const seller = sellers.find(s => s.id === t.sellerId);

      const matchesSearch = 
        t.id.toLowerCase().includes(q) ||
        (bike && (bike.brand.toLowerCase().includes(q) || bike.modelName.toLowerCase().includes(q) || bike.registrationNumber.toLowerCase().includes(q))) ||
        (buyer && buyer.fullName.toLowerCase().includes(q)) ||
        (seller && seller.fullName.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchesPayment = paymentFilter === 'ALL' || t.paymentMethod === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Sales Transactions & Revenue Ledger</h2>
          <p className="text-xs text-slate-500">
            Record purchases, generate printable sales certificates, and manage legal RTO transactions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleOpenRecordSale()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-600/30 transition"
          >
            <Receipt className="h-4 w-4" />
            <span>Record New Sale</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by transaction ID (e.g. TXN-5001), bike model, buyer name, or reg number..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-700 bg-white focus:border-blue-500 focus:outline-hidden"
          >
            <option value="ALL">All Statuses ({transactions.length})</option>
            <option value="Completed">Completed Sales</option>
            <option value="Cancelled">Cancelled Records</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-700 bg-white focus:border-blue-500 focus:outline-hidden"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Bank Transfer">Bank Transfer (IMPS/RTGS)</option>
            <option value="Finance/EMI">Finance / Loan</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="py-3.5 px-4 font-bold text-slate-600">Txn ID & Date</th>
                <th className="py-3.5 px-4 font-bold text-slate-600">Vehicle Sold</th>
                <th className="py-3.5 px-4 font-bold text-slate-600">Buyer</th>
                <th className="py-3.5 px-4 font-bold text-slate-600">Seller</th>
                <th className="py-3.5 px-4 font-bold text-slate-600">Payment Particulars</th>
                <th className="py-3.5 px-4 font-bold text-slate-600">Amount (₹)</th>
                <th className="py-3.5 px-4 font-bold text-slate-600">Status</th>
                <th className="py-3.5 px-4 font-bold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    No transactions found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(txn => {
                  const bike = bikes.find(b => b.id === txn.bikeId);
                  const buyer = buyers.find(b => b.id === txn.buyerId);
                  const seller = sellers.find(s => s.id === txn.sellerId);
                  const isCancelled = txn.status === 'Cancelled';

                  return (
                    <tr key={txn.id} className={`hover:bg-slate-50/60 transition ${isCancelled ? 'bg-rose-50/30' : ''}`}>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 block">{txn.id}</span>
                        <span className="text-[11px] text-slate-500">{formatDate(txn.transactionDate)}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block truncate max-w-[180px]">
                            {bike ? `${bike.brand} ${bike.modelName}` : txn.bikeId}
                          </span>
                          <span className="font-mono text-[10px] text-slate-600 block">
                            Reg: {bike?.registrationNumber || 'N/A'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block truncate max-w-[140px]">
                          {buyer ? buyer.fullName : txn.buyerId}
                        </span>
                        <span className="text-[10px] text-slate-400">{buyer?.city}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-slate-700 block truncate max-w-[140px]">
                          {seller ? seller.fullName : txn.sellerId}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">{seller?.sellerType}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-[11px]">
                          <span className="font-medium text-slate-800 block">{txn.paymentMethod}</span>
                          <span className={`inline-block text-[10px] font-bold uppercase ${
                            txn.paymentStatus === 'Paid' ? 'text-emerald-700' : 'text-amber-700'
                          }`}>
                            {txn.paymentStatus}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-black text-xs text-slate-900 block">
                            {formatCurrency(txn.finalSellingPrice)}
                          </span>
                          {txn.discount > 0 && (
                            <span className="text-[10px] text-emerald-600 block">
                              Saved {formatCurrency(txn.discount)}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isCancelled ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {txn.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewReceipt(txn)}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition"
                            title="Print Tax Invoice & Receipt"
                          >
                            <Printer className="h-3 w-3" />
                            <span>Invoice</span>
                          </button>

                          {!isCancelled && (
                            <button
                              onClick={() => handleOpenCancelTransaction(txn)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                              title="Cancel Transaction & Restore Bike Inventory"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD NEW SALE MODAL */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={handleCloseRecordSale}
        title="Record Motorcycle Purchase & Sale"
        subtitle="Execute deal, calculate discount, transfer ownership, and update inventory"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmitSale} className="space-y-4">
          {saleError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{saleError}</span>
            </div>
          )}

          {/* Bike Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Motorcycle from Available Stock *
            </label>
            {availableBikes.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                No bikes currently available for sale. Please add bikes to inventory first.
              </div>
            ) : (
              <select
                required
                value={selectedBikeId}
                onChange={(e) => setSelectedBikeId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-xs text-slate-900 bg-white focus:border-blue-500 focus:outline-hidden font-medium"
              >
                <option value="">-- Choose an Available Bike --</option>
                {availableBikes.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.brand} {b.modelName} ({b.registrationNumber}) • Asking: {formatCurrency(b.sellingPrice)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Auto-retrieved Bike & Seller Info Box */}
          {currentFormBike && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bike Details</span>
                <p className="font-bold text-slate-900">{currentFormBike.brand} {currentFormBike.modelName}</p>
                <p className="font-mono text-slate-600 text-[11px]">Reg: {currentFormBike.registrationNumber}</p>
                <p className="text-slate-500 text-[11px]">{currentFormBike.manufacturingYear} • {currentFormBike.kmDriven.toLocaleString('en-IN')} km • {currentFormBike.fuelType}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Consigned Seller</span>
                <p className="font-bold text-slate-900">{currentFormSeller?.fullName || currentFormBike.sellerId}</p>
                <p className="text-slate-600 text-[11px]">Phone: +91 {currentFormSeller?.mobileNumber}</p>
                <p className="text-slate-500 text-[11px]">Type: {currentFormSeller?.sellerType} ({currentFormSeller?.city})</p>
              </div>
            </div>
          )}

          {/* Buyer Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Registered Customer (Buyer) *
            </label>
            <select
              required
              value={selectedBuyerId}
              onChange={(e) => setSelectedBuyerId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-xs text-slate-900 bg-white focus:border-blue-500 focus:outline-hidden font-medium"
            >
              {buyers.map(b => (
                <option key={b.id} value={b.id}>
                  {b.fullName} ({b.id}) • +91 {b.mobileNumber} • {b.city}
                </option>
              ))}
            </select>
            {currentFormBuyer && (
              <p className="mt-1 text-[11px] text-slate-500">
                Verified Gov ID: <span className="font-medium">{currentFormBuyer.govIdType} ({currentFormBuyer.govIdNumberMasked})</span>
              </p>
            )}
          </div>

          {/* Pricing Math Grid */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
            <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Calculator className="h-4 w-4 text-blue-600" />
              Live Price & Discount Calculator
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Asking Price
                </label>
                <div className="rounded-xl bg-white border border-slate-300 py-2 px-3 text-xs font-bold text-slate-800">
                  {formatCurrency(originalAskingPrice)}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Discount (₹ INR)
                </label>
                <input
                  type="number"
                  min={0}
                  max={originalAskingPrice}
                  step={500}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseInt(e.target.value, 10) || 0)}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 font-bold focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Final Deal Value
                </label>
                <div className="rounded-xl bg-blue-600 border border-blue-700 py-2 px-3 text-xs font-black text-white">
                  {formatCurrency(finalSellingPrice)}
                </div>
              </div>
            </div>
          </div>

          {/* Payment & Date Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 bg-white focus:border-blue-500 focus:outline-hidden"
              >
                <option value="Bank Transfer">Bank Transfer (IMPS/RTGS)</option>
                <option value="UPI">UPI (Google Pay / PhonePe)</option>
                <option value="Cash">Cash Counter</option>
                <option value="Finance/EMI">Finance / Bank Loan</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Status *
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 bg-white focus:border-blue-500 focus:outline-hidden"
              >
                <option value="Paid">Fully Paid (Cleared)</option>
                <option value="Partially Paid">Partially Paid (Advance)</option>
                <option value="Pending">Payment Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Transaction Date *
              </label>
              <input
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Remarks & RTO Ownership Transfer Notes
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Full payment cleared. RTO transfer form 29 and 30 signed by seller and buyer."
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCloseRecordSale}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={availableBikes.length === 0}
              className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Record Sale & Generate Receipt</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* CANCEL TRANSACTION MODAL (AUDIT TRAIL & RESTORATION) */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title={`Cancel Transaction: ${targetTxnToCancel?.id}`}
        subtitle="Cancelling will restore the motorcycle inventory status back to 'Available'"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
            <p className="font-bold">Dealership Audit Warning:</p>
            <p className="mt-0.5">
              This action cancels the sales invoice and immediately restores bike <strong>{targetTxnToCancel?.bikeId}</strong> back to available stock. An immutable audit log will be recorded.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mandatory Reason for Cancellation *
            </label>
            <textarea
              rows={3}
              required
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Loan rejected by financier, buyer withdrew deposit, typographical error in agreement..."
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-rose-500 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleConfirmCancel}
              disabled={!cancelReason.trim() || cancelReason.trim().length < 5}
              className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              Cancel Sale & Restore Stock
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
