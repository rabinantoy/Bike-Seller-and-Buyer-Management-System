import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Phone, 
  Mail, 
  MapPin, 
  Bike as BikeIcon, 
  Building2, 
  User as UserIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Seller, Bike, SellerType } from '../../types';
import { storageService } from '../../services/storage';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatDate, formatCurrency, downloadCSV } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

interface SellerListProps {
  sellers: Seller[];
  bikes: Bike[];
  initialSearchQuery?: string;
}

export const SellerList: React.FC<SellerListProps> = ({
  sellers,
  bikes,
  initialSearchQuery = '',
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Active Seller
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);

  // Form State
  const [formState, setFormState] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    address: '',
    city: '',
    sellerType: 'individual' as SellerType,
    registrationDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const [formError, setFormError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Filtered sellers
  const filteredSellers = sellers.filter(seller => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      seller.fullName.toLowerCase().includes(q) ||
      seller.mobileNumber.includes(q) ||
      seller.id.toLowerCase().includes(q) ||
      seller.city.toLowerCase().includes(q);
    
    const matchesType = typeFilter === 'ALL' || seller.sellerType === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleOpenAdd = () => {
    setFormState({
      fullName: '',
      mobileNumber: '',
      email: '',
      address: '',
      city: '',
      sellerType: 'individual',
      registrationDate: new Date().toISOString().slice(0, 10),
      notes: '',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (seller: Seller) => {
    setSelectedSeller(seller);
    setFormState({
      fullName: seller.fullName,
      mobileNumber: seller.mobileNumber,
      email: seller.email,
      address: seller.address,
      city: seller.city,
      sellerType: seller.sellerType,
      registrationDate: seller.registrationDate,
      notes: seller.notes,
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleOpenDetail = (seller: Seller) => {
    setSelectedSeller(seller);
    setIsDetailModalOpen(true);
  };

  const handleOpenDelete = (seller: Seller) => {
    setSelectedSeller(seller);
    setDeleteError('');
    setIsDeleteConfirmOpen(true);
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
      storageService.addSeller({
        ...formState,
        fullName: formState.fullName.trim(),
        mobileNumber: cleanPhone,
      }, user?.email);
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to add seller.');
    }
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeller) return;
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
      storageService.updateSeller(selectedSeller.id, {
        ...formState,
        fullName: formState.fullName.trim(),
        mobileNumber: cleanPhone,
      }, user?.email);
      setIsEditModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update seller.');
    }
  };

  const handleConfirmDelete = () => {
    if (!selectedSeller) return;
    try {
      storageService.deleteSeller(selectedSeller.id, user?.email);
      setIsDeleteConfirmOpen(false);
      setSelectedSeller(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Cannot delete seller.');
    }
  };

  const handleExportCSV = () => {
    const rows = filteredSellers.map(s => {
      const sellerBikes = bikes.filter(b => b.sellerId === s.id);
      return {
        'Seller ID': s.id,
        'Full Name': s.fullName,
        'Mobile Number': s.mobileNumber,
        'Email': s.email,
        'Seller Type': s.sellerType,
        'City': s.city,
        'Address': s.address,
        'Registered Date': s.registrationDate,
        'Total Bikes Consigned': sellerBikes.length,
        'Notes': s.notes,
      };
    });
    downloadCSV('Apex_Dealership_Sellers', rows);
  };

  // Associated bikes for selected seller
  const selectedSellerBikes = selectedSeller 
    ? bikes.filter(b => b.sellerId === selectedSeller.id) 
    : [];

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Registered Sellers & Consignors</h2>
          <p className="text-xs text-slate-500">
            Manage individual motorcycle owners and partner dealerships selling bikes through the hub.
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
            <span>Register New Seller</span>
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
            placeholder="Search by seller name, 10-digit mobile, seller ID (e.g. SEL-1001), or city..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-700 bg-white focus:border-blue-500 focus:outline-hidden"
          >
            <option value="ALL">All Seller Types</option>
            <option value="individual">Individual Owners</option>
            <option value="dealership">Commercial Dealerships</option>
          </select>
        </div>
      </div>

      {/* Sellers Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="py-3.5 px-4 font-bold text-slate-600">Seller ID & Name</th>
                <th className="py-3.5 px-4 font-bold text-slate-600">Type</th>
                <th className="py-3.5 px-4 font-bold text-slate-600">Contact Details</th>
                <th className="py-3.5 px-4 font-bold text-slate-600">City & Address</th>
                <th className="py-3.5 px-4 font-bold text-slate-600 text-center">Bikes Listed</th>
                <th className="py-3.5 px-4 font-bold text-slate-600">Registered</th>
                <th className="py-3.5 px-4 font-bold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSellers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    No sellers found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredSellers.map((seller) => {
                  const sellerBikes = bikes.filter(b => b.sellerId === seller.id);
                  return (
                    <tr key={seller.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            seller.sellerType === 'dealership' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {seller.sellerType === 'dealership' ? <Building2 className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{seller.fullName}</span>
                            <span className="font-mono text-[10px] text-blue-600 font-semibold">{seller.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          seller.sellerType === 'dealership'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {seller.sellerType}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-[11px] text-slate-600">
                          <p className="flex items-center gap-1 font-medium text-slate-800">
                            <Phone className="h-3 w-3 text-slate-400" /> +91 {seller.mobileNumber}
                          </p>
                          {seller.email && (
                            <p className="flex items-center gap-1 text-slate-500">
                              <Mail className="h-3 w-3 text-slate-400" /> {seller.email}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-[11px] text-slate-600 max-w-xs truncate">
                          <p className="font-semibold text-slate-800">{seller.city}</p>
                          <p className="text-slate-400 truncate">{seller.address || 'N/A'}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleOpenDetail(seller)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                            sellerBikes.length > 0 
                              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' 
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <BikeIcon className="h-3 w-3" />
                          <span>{sellerBikes.length} bikes</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {formatDate(seller.registrationDate)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenDetail(seller)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            title="View seller details & bikes"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(seller)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                            title="Edit seller"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(seller)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            title="Delete seller"
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

      {/* ADD SELLER MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Seller / Consignor"
        subtitle="Add motorcycle owner or partner dealership into dealership directory"
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
                Full Name / Business Name *
              </label>
              <input
                type="text"
                required
                value={formState.fullName}
                onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                placeholder="e.g. Rajesh Sharma / Speed Motors"
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Seller Type *
              </label>
              <select
                value={formState.sellerType}
                onChange={(e) => setFormState({ ...formState, sellerType: e.target.value as SellerType })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 bg-white focus:border-blue-500 focus:outline-hidden"
              >
                <option value="individual">Individual Motorcycle Owner</option>
                <option value="dealership">Commercial Dealership / Partner</option>
              </select>
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
                  placeholder="9820112345"
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
                placeholder="seller@example.com"
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
                placeholder="e.g. Pune, Mumbai, Bengaluru"
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Registration Date
              </label>
              <input
                type="date"
                value={formState.registrationDate}
                onChange={(e) => setFormState({ ...formState, registrationDate: e.target.value })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Residential / Office Address
            </label>
            <textarea
              rows={2}
              value={formState.address}
              onChange={(e) => setFormState({ ...formState, address: e.target.value })}
              placeholder="House/Plot No, Street, Landmark..."
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Dealership Notes / Background
            </label>
            <textarea
              rows={2}
              value={formState.notes}
              onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
              placeholder="Reason for sale, preferred payment mode, verification notes..."
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
              Save Seller Record
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT SELLER MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Seller: ${selectedSeller?.id}`}
        subtitle={`Update contact or location details for ${selectedSeller?.fullName}`}
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
                Full Name / Business Name *
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
                Seller Type *
              </label>
              <select
                value={formState.sellerType}
                onChange={(e) => setFormState({ ...formState, sellerType: e.target.value as SellerType })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 bg-white focus:border-blue-500 focus:outline-hidden"
              >
                <option value="individual">Individual Motorcycle Owner</option>
                <option value="dealership">Commercial Dealership / Partner</option>
              </select>
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

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Registration Date
              </label>
              <input
                type="date"
                value={formState.registrationDate}
                onChange={(e) => setFormState({ ...formState, registrationDate: e.target.value })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Address
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
              Update Seller
            </button>
          </div>
        </form>
      </Modal>

      {/* SELLER DETAILS DRAWER / MODAL */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Seller Profile: ${selectedSeller?.fullName}`}
        subtitle={`ID: ${selectedSeller?.id} • Type: ${selectedSeller?.sellerType.toUpperCase()}`}
        maxWidth="2xl"
      >
        {selectedSeller && (
          <div className="space-y-6">
            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contact Details</span>
                <p className="font-semibold text-slate-800">Phone: +91 {selectedSeller.mobileNumber}</p>
                <p className="text-slate-600">Email: {selectedSeller.email || 'None'}</p>
                <p className="text-slate-600">Registered: {formatDate(selectedSeller.registrationDate)}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Address & Notes</span>
                <p className="font-semibold text-slate-800">City: {selectedSeller.city}</p>
                <p className="text-slate-600">Address: {selectedSeller.address || 'N/A'}</p>
                <p className="text-slate-500 italic">Notes: {selectedSeller.notes || 'No remarks logged.'}</p>
              </div>
            </div>

            {/* Associated Bikes Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <BikeIcon className="h-4 w-4 text-blue-600" />
                  Bikes Consigned by this Seller ({selectedSellerBikes.length})
                </h4>
              </div>

              {selectedSellerBikes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                  This seller does not currently have any bikes registered in the inventory.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {selectedSellerBikes.map(bike => (
                    <div key={bike.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-slate-50 transition">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{bike.brand} {bike.modelName}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            bike.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {bike.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                          {bike.registrationNumber} • {bike.manufacturingYear} • {bike.engineCapacityCc ? `${bike.engineCapacityCc}cc` : 'EV'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-xs text-blue-600 block">{formatCurrency(bike.sellingPrice)}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{bike.id}</span>
                      </div>
                    </div>
                  ))}
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
        title="Delete Seller Confirmation"
        message={
          deleteError 
            ? deleteError 
            : `Are you sure you want to delete seller "${selectedSeller?.fullName}" (${selectedSeller?.id})? This will permanently remove their record from the dealership database.`
        }
        confirmText="Confirm Delete"
        variant="danger"
      />
    </div>
  );
};
