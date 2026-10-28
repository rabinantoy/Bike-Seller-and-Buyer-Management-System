import React from 'react';
import { Printer, Download, CheckCircle, ShieldCheck, X } from 'lucide-react';
import { Transaction, Bike, Buyer, Seller, DealershipSettings } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  bike?: Bike;
  buyer?: Buyer;
  seller?: Seller;
  settings: DealershipSettings;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  bike,
  buyer,
  seller,
  settings,
}) => {
  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Container */}
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Top Control Bar (Hidden during print) */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 bg-slate-100/70 px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tax Invoice & Vehicle Sales Certificate
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              transaction.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              <CheckCircle className="h-3 w-3" />
              {transaction.status === 'Cancelled' ? 'Cancelled Record' : 'Official Dealership Receipt'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTENT */}
        <div className="p-8 text-slate-800 print:p-0">
          {/* Dealership Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-900 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-lg">
                  A
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {settings.dealershipName}
                </h2>
              </div>
              <p className="text-xs font-medium text-slate-500 mt-1">{settings.tagline}</p>
              <p className="text-xs text-slate-600 mt-1">{settings.address}, {settings.city}</p>
              <p className="text-xs text-slate-600">
                Contact: <span className="font-semibold">{settings.contactNumber}</span> | Email: <span className="font-semibold">{settings.contactEmail}</span>
              </p>
            </div>
            <div className="mt-4 sm:mt-0 text-left sm:text-right">
              <span className="inline-block rounded-md bg-slate-900 text-white px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider">
                Sales Tax Invoice
              </span>
              <p className="text-sm font-bold text-slate-900 mt-2">
                Invoice No: <span className="font-mono text-blue-600">{transaction.id}</span>
              </p>
              <p className="text-xs text-slate-500">Date: {formatDate(transaction.transactionDate)}</p>
              <p className="text-xs text-slate-600 font-medium">GSTIN: <span className="font-mono">{settings.gstNumber}</span></p>
            </div>
          </div>

          {/* Parties: Buyer & Seller Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Buyer Details */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                Purchased By (Buyer)
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-1">
                {buyer ? buyer.fullName : `Buyer ID: ${transaction.buyerId}`}
              </h4>
              {buyer && (
                <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                  <p>ID Reference: <span className="font-mono font-medium">{buyer.id}</span></p>
                  <p>Mobile: <span className="font-medium">+91 {buyer.mobileNumber}</span></p>
                  <p>Email: {buyer.email}</p>
                  <p>Address: {buyer.address}, {buyer.city}</p>
                  <p className="font-medium text-slate-700">
                    Govt ID: {buyer.govIdType} ({buyer.govIdNumberMasked})
                  </p>
                </div>
              )}
            </div>

            {/* Seller Details */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Consigned / Sold By (Seller)
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-1">
                {seller ? seller.fullName : `Seller ID: ${transaction.sellerId}`}
              </h4>
              {seller && (
                <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                  <p>ID Reference: <span className="font-mono font-medium">{seller.id}</span></p>
                  <p>Mobile: <span className="font-medium">+91 {seller.mobileNumber}</span></p>
                  <p>Type: <span className="capitalize font-medium">{seller.sellerType}</span></p>
                  <p>Email: {seller.email}</p>
                  <p>City: {seller.city}</p>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Specifications Table */}
          <div className="mb-6">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Vehicle Particulars
            </h5>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="py-2.5 px-3 text-left font-bold text-slate-700">Vehicle Make & Model</th>
                    <th className="py-2.5 px-3 text-left font-bold text-slate-700">Reg Number</th>
                    <th className="py-2.5 px-3 text-left font-bold text-slate-700">Year / CC</th>
                    <th className="py-2.5 px-3 text-left font-bold text-slate-700">Fuel & Color</th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-700">Odometer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  <tr>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{bike ? `${bike.brand} ${bike.modelName}` : `Bike ID: ${transaction.bikeId}`}</p>
                      <p className="text-[11px] text-slate-500">ID: {bike?.id} • Condition: {bike?.condition || 'Used'}</p>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">
                      {bike?.registrationNumber || 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {bike ? `${bike.manufacturingYear} • ${bike.engineCapacityCc ? `${bike.engineCapacityCc}cc` : 'EV'}` : '-'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {bike ? `${bike.fuelType} (${bike.color})` : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-700">
                      {bike ? `${bike.kmDriven.toLocaleString('en-IN')} km` : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 mb-6">
            <div className="flex-1 space-y-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                <p className="font-bold text-slate-700">Payment Particulars:</p>
                <div className="grid grid-cols-2 gap-2 mt-1.5 text-slate-600">
                  <div>
                    <span>Payment Mode: </span>
                    <span className="font-bold text-slate-900">{transaction.paymentMethod}</span>
                  </div>
                  <div>
                    <span>Payment Status: </span>
                    <span className="font-bold text-emerald-700 uppercase">{transaction.paymentStatus}</span>
                  </div>
                </div>
                {transaction.remarks && (
                  <p className="mt-2 text-slate-500 italic border-t border-slate-200/60 pt-1.5">
                    Remarks: {transaction.remarks}
                  </p>
                )}
                {transaction.status === 'Cancelled' && (
                  <div className="mt-2 rounded-lg bg-rose-50 border border-rose-200 p-2 text-rose-800">
                    <p className="font-bold">TRANSACTION CANCELLED</p>
                    <p className="text-[11px]">Reason: {transaction.cancelledReason}</p>
                    <p className="text-[10px] text-rose-600">Cancelled by {transaction.cancelledBy} on {formatDate(transaction.cancelledAt || '')}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full sm:w-72 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Agreed Asking Price:</span>
                  <span className="font-medium">{formatCurrency(transaction.originalAskingPrice)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Dealership Discount:</span>
                  <span>- {formatCurrency(transaction.discount)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-slate-900">
                  <span>Net Payable Amount:</span>
                  <span className="text-base text-blue-600 font-black">{formatCurrency(transaction.finalSellingPrice)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Declarations & Signatures */}
          <div className="border-t border-slate-200 pt-4 mt-6">
            <p className="text-[10px] text-slate-500 leading-normal">
              Declaration: This tax invoice acknowledges receipt of the consideration amount specified above for the two-wheeler vehicle described herein. The buyer agrees that ownership transfer documents and NOC will be filed with the regional transport office (RTO). The vehicle is sold on an "as-is-where-is" verified inspection basis.
            </p>
            <div className="flex justify-between items-end pt-10 text-xs text-slate-600">
              <div className="text-center">
                <div className="w-40 border-b border-slate-400 mb-1" />
                <span>Buyer's Signature</span>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg mb-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  Apex Moto Hub Authorized Stamp
                </div>
                <div className="w-48 border-b border-slate-400 mb-1" />
                <span className="font-semibold text-slate-800">Authorized Dealership Signatory</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
