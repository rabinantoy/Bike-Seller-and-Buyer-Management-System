import React, { useState } from 'react';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Phone, 
  Mail, 
  MapPin, 
  FileCheck, 
  Receipt,
  AlertCircle
} from 'lucide-react';
import { Buyer, Transaction, Bike, GovIdType } from '../../types';
import { storageService } from '../../services/storage';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatDate, formatCurrency, downloadCSV } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

interface BuyerListProps {
  buyers: Buyer[];
  transactions: Transaction[];
  bikes: Bike[];
  initialSearchQuery?: string;
  onViewReceipt: (txn: Transaction) => void;
}

export const BuyerList: React.FC<BuyerListProps> = ({
  buyers,
  transactions,
  bikes,
  initialSearchQuery = '',
  onViewReceipt,
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [govIdFilter, setGovIdFilter] = useState<string>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Active Buyer
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);

  // Form
  const [formState, setFormState] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    address: '',
    city: '',
    govIdType: 'Aadhaar' as GovIdType,
    govIdNumberMasked: '',
    registrationDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const [formError, setFormError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Filtered
  const filteredBuyers = buyers.filter(buyer => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      buyer.fullName.toLowerCase().includes(q) ||
      buyer.mobileNumber.includes(q) ||
      buyer.id.toLowerCase().includes(q) ||
      buyer.city.toLowerCase().includes(q) ||
      buyer.govIdNumberMasked.toLowerCase().includes(q);
    
    const matchesGovId = govIdFilter === 'ALL' || buyer.govIdType === govIdFilter;
    return matchesSearch && matchesGovId;
  });

  const handleOpenAdd = () => {
    setFormState({
      fullName: '',
      mobileNumber: '',
      email: '',
      address: '',
      city: '',
      govIdType: 'Aadhaar',
      govIdNumberMasked: '',
      registrationDate: new Date().toISOString().slice(0, 10),
      notes: '',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (buyer: Buyer) => {
    setSelectedBuyer(buyer);
    setFormState({
      fullName: buyer.fullName,
      mobileNumber: buyer.mobileNumber,
      email: buyer.email,
      address: buyer.address,
      city: buyer.city,
      govIdType: buyer.govIdType,
      govIdNumberMasked: buyer.govIdNumberMasked,
      registrationDate: buyer.registrationDate,
      notes: buyer.notes,
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleOpenDetail = (buyer: Buyer) => {
    setSelectedBuyer(buyer);
    setIsDetailModalOpen(true);
  };

  const handleOpenDelete = (buyer: Buyer) => {
    setSelectedBuyer(buyer);
    setDeleteError('');
    setIsDeleteConfirmOpen(true);
  };

  const maskGovId = (val: string, type: GovIdType) => {
    if (!val) return 'XXXX-VERIFIED';
    const clean = val.trim().toUpperCase();
    if (clean.length <= 4) return `XXXX-${clean}`;
    const last4 = clean.slice(-4);
    if (type === 'Aadhaar') return `XXXX-XXXX-${last4}`;
    if (type === 'PAN Card') return `XXXXX${last4}`;
    return `ID-XXXX-${last4}`;
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formState.fullName.trim()) {
      setFormError('Full name is required.');
      return;
    }
    const cleanPhone = formState.mobileNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setFormError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!formState.city.trim()) {
      setFormError('City is required.');
      return;
    }

    try {
      storageService.addBuyer({
        ...formState,
        fullName: formState.fullName.trim(),
        mobileNumber: cleanPhone,
        govIdNumberMasked: formState.govIdNumberMasked ? maskGovId(formState.govIdNumberMasked, formState.govIdType) : 'NOT PROVIDED',
      }, user?.email);
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to register buyer.');
    }
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuyer) return;
    setFormError('');

    if (!formState.fullName.trim()) {
      setFormError('Full name is required.');
      return;
    }
    const cleanPhone = formState.mobileNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setFormError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    try {
      storageService.updateBuyer(selectedBuyer.id, {
        ...formState,
        fullName: formState.fullName.trim(),
        mobileNumber: cleanPhone,
      }, user?.email);
      setIsEditModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update buyer.');
    }
  };

  const handleConfirmDelete = () => {
    if (!selectedBuyer) return;
    try {
      storageService.deleteBuyer(selectedBuyer.id, user?.email);
      setIsDeleteConfirmOpen(false);
      setSelectedBuyer(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Cannot delete buyer.');
    }
  };

  const handleExportCSV = () => {
    const rows = filteredBuyers.map(b => {
      const buyerTxns = transactions.filter(t => t.buyerId === b.id && t.status === 'Completed');
      return {
        'Buyer ID': b.id,
        'Full Name': b.fullName,
        'Mobile Number': b.mobileNumber,
        'Email': b.email,
        'City': b.city,
        'Address': b.address,
        'Gov ID Type': b.govIdType,
        'Masked ID Reference': b.govIdNumberMasked,
        'Registration Date': b.registrationDate,
        'Completed Purchases': buyerTxns.length,
        'Notes': b.notes,
      };
    });
    downloadCSV('Apex_Dealership_Buyers', rows);
  };

  // Buyer purchases
  const selectedBuyerPurchases = selectedBuyer
    ? transactions.filter(t => t.buyerId === selectedBuyer.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Buyer Directory & Customer Accounts</h2>
          <p className="text-xs text-slate-500">
            Registered motorcycle customers, verified identity references, and complete transaction history.
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
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-600/30 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Register New Buyer</span>
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
            placeholder="Search by buyer name, phone, buyer ID (e.g. BUY-2001), city, or masked ID..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={govIdFilter}
            onChange={(e) => setGovIdFilter(e.target.value)}
            className="rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-700 bg-white focus:border-blue-500 focus:outline-hidden"
          >
            <option value="ALL">All Identity Types</option>
            <option value="Aadhaar">Aadhaar Card</option>
            <option value="Driving License">Driving License</option>
            <option value="PAN Card">PAN Card</option>
            <option value="Voter ID">Voter ID</option>
            <option value="Passport">Passport</option>
          </select>
        </div>
      </div>

      {/* Buyers Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="py-3.5 px-4 font-bold text-slate-600">Buyer ID & Name</th>
                <th className="py-3.5 px-4 font-bold text-slate-600">Contact Details</th>
                <th className="py-3.5 px-4 font-bold text-slate-600">City & Location</th>
                <th className="py-3.5 px-4 font-bold text-slate-600">Government ID</th>
                <th className="py-3.5 px-4 font-bold text-slate-600 text-center">Purchases</th>
                <th className="py-3.5 px-4 font-bold text-slate-600">Registered</th>
                <th className="py-3.5 px-4 font-bold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBuyers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    No buyers found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredBuyers.map((buyer) => {
                  const buyerPurchases = transactions.filter(t => t.buyerId === buyer.id && t.status === 'Completed');
                  return (
                    <tr key={buyer.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                            <UserCheck className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{buyer.fullName}</span>
                            <span className="font-mono text-[10px] text-blue-600 font-semibold">{buyer.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-[11px] text-slate-600">
                          <p className="flex items-center gap-1 font-medium text-slate-800">
                            <Phone className="h-3 w-3 text-slate-400" /> +91 {buyer.mobileNumber}
                          </p>
                          {buyer.email && (
                            <p className="flex items-center gap-1 text-slate-500">
                              <Mail className="h-3 w-3 text-slate-400" /> {buyer.email}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-[11px] text-slate-600 max-w-xs truncate">
                          <p className="font-semibold text-slate-800">{buyer.city}</p>
                          <p className="text-slate-400 truncate">{buyer.address || 'N/A'}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-[11px]">
                          <span className="font-semibold text-slate-700 block">{buyer.govIdType}</span>
                          <span className="font-mono text-slate-500 text-[10px]">{buyer.govIdNumberMasked}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleOpenDetail(buyer)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                            buyerPurchases.length > 0 
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Receipt className="h-3 w-3" />
                          <span>{buyerPurchases.length} bought</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {formatDate(buyer.registrationDate)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenDetail(buyer)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            title="View buyer details & purchase history"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(buyer)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                            title="Edit buyer"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(buyer)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            title="Delete buyer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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

      {/* REGISTER BUYER MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Buyer / Customer"
        subtitle="Onboard customer profile for motorcycle purchase verification"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitAdd} className="space-y-4">
          {formError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Legal Name *
              </label>
              <input
                type="text"
                required
                value={formState.fullName}
                onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                placeholder="e.g. Vikram Aditya Malhotra"
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Number (10 digits) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-medium text-slate-400">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={formState.mobileNumber}
                  onChange={(e) => setFormState({ ...formState, mobileNumber: e.target.value.replace(/\D/g, '') })}
                  placeholder="9811223344"
                  className="w-full rounded-xl border border-slate-300 py-2 pl-12 pr-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formState.email}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                placeholder="buyer@example.com"
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                City *
              </label>
              <input
                type="text"
                required
                value={formState.city}
                onChange={(e) => setFormState({ ...formState, city: e.target.value })}
                placeholder="e.g. Gurugram, Mumbai, Delhi"
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Government ID Type *
              </label>
              <select
                value={formState.govIdType}
                onChange={(e) => setFormState({ ...formState, govIdType: e.target.value as GovIdType })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 bg-white focus:border-blue-500 focus:outline-hidden"
              >
                <option value="Aadhaar">Aadhaar Card</option>
                <option value="Driving License">Driving License</option>
                <option value="PAN Card">PAN Card</option>
                <option value="Voter ID">Voter ID</option>
                <option value="Passport">Passport</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ID Reference (Auto-Masked for Privacy)
              </label>
              <input
                type="text"
                value={formState.govIdNumberMasked}
                onChange={(e) => setFormState({ ...formState, govIdNumberMasked: e.target.value })}
                placeholder="Enter last 4 digits (e.g. 8821)"
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Stored with privacy masking</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Residential Address (For RTO Registration)
            </label>
            <textarea
              rows={2}
              value={formState.address}
              onChange={(e) => setFormState({ ...formState, address: e.target.value })}
              placeholder="Flat/House, Apartment, Road, Landmark..."
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Customer Preferences / Notes
            </label>
            <textarea
              rows={2}
              value={formState.notes}
              onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
              placeholder="Budget range, desired motorcycle category, loan eligibility..."
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-xs"
            >
              Save Buyer Record
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT BUYER MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Buyer: ${selectedBuyer?.id}`}
        subtitle={`Update details for ${selectedBuyer?.fullName}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitEdit} className="space-y-4">
          {formError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Legal Name *
              </label>
              <input
                type="text"
                required
                value={formState.fullName}
                onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Number (10 digits) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-medium text-slate-400">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={formState.mobileNumber}
                  onChange={(e) => setFormState({ ...formState, mobileNumber: e.target.value.replace(/\D/g, '') })}
                  className="w-full rounded-xl border border-slate-300 py-2 pl-12 pr-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formState.email}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                City *
              </label>
              <input
                type="text"
                required
                value={formState.city}
                onChange={(e) => setFormState({ ...formState, city: e.target.value })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Residential Address
            </label>
            <textarea
              rows={2}
              value={formState.address}
              onChange={(e) => setFormState({ ...formState, address: e.target.value })}
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={formState.notes}
              onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-xs"
            >
              Update Buyer
            </button>
          </div>
        </form>
      </Modal>

      {/* BUYER DETAILS & PURCHASE HISTORY MODAL */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Buyer Profile: ${selectedBuyer?.fullName}`}
        subtitle={`ID: ${selectedBuyer?.id} • Gov ID: ${selectedBuyer?.govIdType}`}
        maxWidth="2xl"
      >
        {selectedBuyer && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contact & ID Verification</span>
                <p className="font-semibold text-slate-800">Phone: +91 {selectedBuyer.mobileNumber}</p>
                <p className="text-slate-600">Email: {selectedBuyer.email || 'None'}</p>
                <p className="text-slate-700 font-medium">
                  {selectedBuyer.govIdType}: <span className="font-mono">{selectedBuyer.govIdNumberMasked}</span>
                </p>
                <p className="text-slate-500">Registered: {formatDate(selectedBuyer.registrationDate)}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Address & Background</span>
                <p className="font-semibold text-slate-800">City: {selectedBuyer.city}</p>
                <p className="text-slate-600">Address: {selectedBuyer.address || 'N/A'}</p>
                <p className="text-slate-500 italic">Notes: {selectedBuyer.notes || 'None recorded.'}</p>
              </div>
            </div>

            {/* Purchase History */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-emerald-600" />
                Completed Purchase Transactions ({selectedBuyerPurchases.length})
              </h4>

              {selectedBuyerPurchases.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                  This buyer has not completed any motorcycle purchases yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {selectedBuyerPurchases.map(txn => {
                    const purchasedBike = bikes.find(b => b.id === txn.bikeId);
                    return (
                      <div key={txn.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-slate-50 transition">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">
                              {purchasedBike ? `${purchasedBike.brand} ${purchasedBike.modelName}` : `Bike: ${txn.bikeId}`}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {txn.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Transaction: <span className="font-mono font-medium">{txn.id}</span> • Date: {formatDate(txn.transactionDate)} • {txn.paymentMethod}
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <span className="font-black text-xs text-slate-900 block">{formatCurrency(txn.finalSellingPrice)}</span>
                            <span className="text-[10px] text-emerald-600 uppercase font-semibold">{txn.paymentStatus}</span>
                          </div>
                          <button
                            onClick={() => {
                              setIsDetailModalOpen(false);
                              onViewReceipt(txn);
                            }}
                            className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-100"
                          >
                            Receipt
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Buyer Confirmation"
        message={
          deleteError 
            ? deleteError 
            : `Are you sure you want to delete buyer "${selectedBuyer?.fullName}" (${selectedBuyer?.id})? This cannot be undone.`
        }
        confirmText="Confirm Delete"
        variant="danger"
      />
    </div>
  );
};
