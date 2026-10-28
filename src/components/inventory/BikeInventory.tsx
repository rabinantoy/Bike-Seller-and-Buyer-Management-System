import React, { useState } from 'react';
import { 
  Bike as BikeIcon, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  LayoutGrid, 
  Table as TableIcon,
  Fuel, 
  Gauge, 
  Calendar, 
  User, 
  Tag, 
  ShoppingCart,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Bike, Seller, BikeCondition, FuelType, BikeStatus } from '../../types';
import { storageService } from '../../services/storage';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatDate, formatCurrency, downloadCSV } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

interface BikeInventoryProps {
  bikes: Bike[];
  sellers: Seller[];
  initialSearchQuery?: string;
  onInitiateSale: (bike: Bike) => void;
  isAddModalOpenFromHeader?: boolean;
  onCloseAddModalHeader?: () => void;
}

export const BikeInventory: React.FC<BikeInventoryProps> = ({
  bikes,
  sellers,
  initialSearchQuery = '',
  onInitiateSale,
  isAddModalOpenFromHeader = false,
  onCloseAddModalHeader,
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filters
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [conditionFilter, setConditionFilter] = useState('ALL');
  const [fuelFilter, setFuelFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'price-desc' | 'price-asc' | 'km-asc'>('date-desc');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Active Bike
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);

  // Form State
  const [formState, setFormState] = useState({
    brand: 'Royal Enfield',
    modelName: '',
    registrationNumber: '',
    manufacturingYear: 2024,
    engineCapacityCc: 350,
    fuelType: 'Petrol' as FuelType,
    color: '',
    kmDriven: 5000,
    condition: 'Used' as BikeCondition,
    sellingPrice: 150000,
    sellerId: sellers[0]?.id || '',
    dateAdded: new Date().toISOString().slice(0, 10),
    status: 'Available' as BikeStatus,
    notes: '',
    imageUrl: '',
  });

  const [formError, setFormError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Handle header modal trigger
  React.useEffect(() => {
    if (isAddModalOpenFromHeader) {
      handleOpenAdd();
      if (onCloseAddModalHeader) onCloseAddModalHeader();
    }
  }, [isAddModalOpenFromHeader]);

  // Unique brands
  const brandsList = Array.from(new Set(bikes.map(b => b.brand))).sort();

  // Filtered & Sorted bikes
  const filteredBikes = bikes
    .filter(bike => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = 
        bike.brand.toLowerCase().includes(q) ||
        bike.modelName.toLowerCase().includes(q) ||
        bike.registrationNumber.toLowerCase().includes(q) ||
        bike.id.toLowerCase().includes(q) ||
        bike.color.toLowerCase().includes(q);

      const matchesBrand = brandFilter === 'ALL' || bike.brand === brandFilter;
      const matchesStatus = statusFilter === 'ALL' || bike.status === statusFilter;
      const matchesCondition = conditionFilter === 'ALL' || bike.condition === conditionFilter;
      const matchesFuel = fuelFilter === 'ALL' || bike.fuelType === fuelFilter;

      return matchesSearch && matchesBrand && matchesStatus && matchesCondition && matchesFuel;
    })
    .sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      if (sortBy === 'date-asc') return new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
      if (sortBy === 'price-desc') return b.sellingPrice - a.sellingPrice;
      if (sortBy === 'price-asc') return a.sellingPrice - b.sellingPrice;
      if (sortBy === 'km-asc') return a.kmDriven - b.kmDriven;
      return 0;
    });

  const handleOpenAdd = () => {
    setFormState({
      brand: 'Royal Enfield',
      modelName: '',
      registrationNumber: '',
      manufacturingYear: 2024,
      engineCapacityCc: 350,
      fuelType: 'Petrol',
      color: '',
      kmDriven: 5000,
      condition: 'Used',
      sellingPrice: 150000,
      sellerId: sellers[0]?.id || '',
      dateAdded: new Date().toISOString().slice(0, 10),
      status: 'Available',
      notes: '',
      imageUrl: '',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (bike: Bike) => {
    setSelectedBike(bike);
    setFormState({
      brand: bike.brand,
      modelName: bike.modelName,
      registrationNumber: bike.registrationNumber,
      manufacturingYear: bike.manufacturingYear,
      engineCapacityCc: bike.engineCapacityCc,
      fuelType: bike.fuelType,
      color: bike.color,
      kmDriven: bike.kmDriven,
      condition: bike.condition,
      sellingPrice: bike.sellingPrice,
      sellerId: bike.sellerId,
      dateAdded: bike.dateAdded,
      status: bike.status,
      notes: bike.notes || '',
      imageUrl: bike.imageUrl || '',
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleOpenDetail = (bike: Bike) => {
    setSelectedBike(bike);
    setIsDetailModalOpen(true);
  };

  const handleOpenDelete = (bike: Bike) => {
    setSelectedBike(bike);
    setDeleteError('');
    setIsDeleteConfirmOpen(true);
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formState.brand.trim() || !formState.modelName.trim()) {
      setFormError('Brand and Model name are required.');
      return;
    }
    if (!formState.registrationNumber.trim()) {
      setFormError('Registration number is required.');
      return;
    }
    if (!formState.sellerId) {
      setFormError('Please select a seller.');
      return;
    }
    if (formState.sellingPrice <= 0) {
      setFormError('Selling price must be greater than zero.');
      return;
    }

    try {
      storageService.addBike({
        ...formState,
        brand: formState.brand.trim(),
        modelName: formState.modelName.trim(),
        color: formState.color.trim() || 'Standard',
        notes: formState.notes.trim(),
      }, user?.email);
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to add bike.');
    }
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBike) return;
    setFormError('');

    if (!formState.brand.trim() || !formState.modelName.trim()) {
      setFormError('Brand and Model name are required.');
      return;
    }
    if (!formState.registrationNumber.trim()) {
      setFormError('Registration number is required.');
      return;
    }

    try {
      storageService.updateBike(selectedBike.id, {
        ...formState,
        brand: formState.brand.trim(),
        modelName: formState.modelName.trim(),
        color: formState.color.trim() || 'Standard',
        notes: formState.notes.trim(),
      }, user?.email);
      setIsEditModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update bike.');
    }
  };

  const handleConfirmDelete = () => {
    if (!selectedBike) return;
    try {
      storageService.deleteBike(selectedBike.id, user?.email);
      setIsDeleteConfirmOpen(false);
      setSelectedBike(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Cannot delete bike.');
    }
  };

  const handleExportCSV = () => {
    const rows = filteredBikes.map(b => {
      const seller = sellers.find(s => s.id === b.sellerId);
      return {
        'Bike ID': b.id,
        'Brand': b.brand,
        'Model Name': b.modelName,
        'Registration Number': b.registrationNumber,
        'Status': b.status,
        'Condition': b.condition,
        'Selling Price (INR)': b.sellingPrice,
        'Mfg Year': b.manufacturingYear,
        'Engine CC': b.engineCapacityCc,
        'Fuel Type': b.fuelType,
        'Color': b.color,
        'Kilometres Driven': b.kmDriven,
        'Seller ID': b.sellerId,
        'Seller Name': seller ? seller.fullName : 'Unknown',
        'Date Added': b.dateAdded,
      };
    });
    downloadCSV('Apex_Dealership_Bike_Inventory', rows);
  };

  const getStatusBadge = (status: BikeStatus) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Sold':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Reserved':
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  const selectedBikeSeller = selectedBike 
    ? sellers.find(s => s.id === selectedBike.sellerId) 
    : null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Motorcycle Inventory & Stock</h2>
          <p className="text-xs text-slate-500">
            Certified pre-owned and new showroom bikes available for sale across India.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-lg p-1.5 transition ${viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700'}`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`rounded-lg p-1.5 transition ${viewMode === 'table' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700'}`}
              title="Table View"
            >
              <TableIcon className="h-4 w-4" />
            </button>
          </div>

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
            <span>Add Bike to Stock</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by brand, model, registration (e.g. MH 12 AB 1234), or bike ID..."
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Brand Filter */}
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-700 bg-white focus:border-blue-500 focus:outline-hidden"
            >
              <option value="ALL">All Brands ({bikes.length})</option>
              {brandsList.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-700 bg-white focus:border-blue-500 focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="Available">Available Only</option>
              <option value="Sold">Sold Records</option>
              <option value="Reserved">Reserved</option>
            </select>

            {/* Condition Filter */}
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-700 bg-white focus:border-blue-500 focus:outline-hidden"
            >
              <option value="ALL">Condition: All</option>
              <option value="Used">Used / Pre-Owned</option>
              <option value="New">Brand New</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-700 bg-white focus:border-blue-500 focus:outline-hidden"
            >
              <option value="date-desc">Newest Added</option>
              <option value="date-asc">Oldest Added</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="km-asc">Lowest Kilometres</option>
            </select>
          </div>
        </div>
      </div>

      {/* INVENTORY CONTENT: GRID VIEW OR TABLE VIEW */}
      {filteredBikes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <BikeIcon className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-2 text-sm font-bold text-slate-900">No bikes found</h3>
          <p className="mt-1 text-xs text-slate-500">
            No inventory matches your search and filter settings.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setBrandFilter('ALL');
              setStatusFilter('ALL');
              setConditionFilter('ALL');
            }}
            className="mt-4 rounded-xl bg-blue-50 px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-100"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredBikes.map(bike => {
            const seller = sellers.find(s => s.id === bike.sellerId);
            return (
              <div
                key={bike.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs hover:border-slate-300 hover:shadow-lg transition-all"
              >
                <div>
                  {/* Photo or Visual Placeholder */}
                  <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                    <img
                      src={bike.imageUrl || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80'}
                      alt={bike.modelName}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-xs ${getStatusBadge(bike.status)}`}>
                        {bike.status}
                      </span>
                    </div>

                    {/* Condition badge */}
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 text-slate-800 backdrop-blur-xs">
                        {bike.condition}
                      </span>
                    </div>

                    {/* Bottom overlay: Reg Number & ID */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
                      <span className="font-mono text-xs font-bold tracking-wide bg-slate-950/70 px-2 py-0.5 rounded">
                        {bike.registrationNumber}
                      </span>
                      <span className="font-mono text-[10px] text-slate-300">{bike.id}</span>
                    </div>
                  </div>

                  {/* Body Specs */}
                  <div className="p-4 space-y-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                        {bike.brand}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {bike.modelName}
                      </h3>
                    </div>

                    {/* Quick Specs Pill Grid */}
                    <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-semibold text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[9px]">ENGINE</span>
                        <span>{bike.engineCapacityCc ? `${bike.engineCapacityCc}cc` : 'Electric'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">YEAR</span>
                        <span>{bike.manufacturingYear}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">ODOMETER</span>
                        <span>{bike.kmDriven.toLocaleString('en-IN')} km</span>
                      </div>
                    </div>

                    {/* Seller Link */}
                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-400" />
                        <span className="truncate max-w-[140px]">{seller ? seller.fullName : bike.sellerId}</span>
                      </span>
                      <span className="text-slate-400 capitalize">{bike.fuelType}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Price & Actions */}
                <div className="p-4 pt-0 border-t border-slate-100 mt-2">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Selling Price</span>
                      <span className="text-base font-black text-blue-600">{formatCurrency(bike.sellingPrice)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenDetail(bike)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        title="View Full Specifications"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(bike)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                        title="Edit Bike"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(bike)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        title="Delete Bike"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Sell Button if Available */}
                  {bike.status === 'Available' ? (
                    <button
                      onClick={() => onInitiateSale(bike)}
                      className="w-full mt-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs transition"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span>Sell This Bike</span>
                    </button>
                  ) : (
                    <div className="w-full mt-1 py-1.5 text-center text-[11px] font-semibold text-slate-400 bg-slate-100 rounded-xl">
                      {bike.status === 'Sold' ? 'Sold to Customer' : 'Reserved for Buyer'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="py-3.5 px-4 font-bold text-slate-600">Bike ID & Make</th>
                  <th className="py-3.5 px-4 font-bold text-slate-600">Reg Number</th>
                  <th className="py-3.5 px-4 font-bold text-slate-600">Year / Specs</th>
                  <th className="py-3.5 px-4 font-bold text-slate-600">Mileage</th>
                  <th className="py-3.5 px-4 font-bold text-slate-600">Seller Details</th>
                  <th className="py-3.5 px-4 font-bold text-slate-600">Price (₹)</th>
                  <th className="py-3.5 px-4 font-bold text-slate-600">Status</th>
                  <th className="py-3.5 px-4 font-bold text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBikes.map(bike => {
                  const seller = sellers.find(s => s.id === bike.sellerId);
                  return (
                    <tr key={bike.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <BikeIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{bike.brand} {bike.modelName}</span>
                            <span className="font-mono text-[10px] text-blue-600 font-semibold">{bike.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {bike.registrationNumber}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {bike.manufacturingYear} • {bike.engineCapacityCc ? `${bike.engineCapacityCc}cc` : 'EV'} • {bike.fuelType}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {bike.kmDriven.toLocaleString('en-IN')} km
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="font-medium text-slate-800 block truncate max-w-[150px]">
                          {seller ? seller.fullName : bike.sellerId}
                        </span>
                        <span className="text-[10px] text-slate-400">{seller?.city}</span>
                      </td>

                      <td className="py-3.5 px-4 font-black text-blue-600">
                        {formatCurrency(bike.sellingPrice)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(bike.status)}`}>
                          {bike.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {bike.status === 'Available' && (
                            <button
                              onClick={() => onInitiateSale(bike)}
                              className="mr-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
                            >
                              Sell
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenDetail(bike)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            title="View bike details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(bike)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                            title="Edit bike"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(bike)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            title="Delete bike"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD BIKE MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Motorcycle to Inventory"
        subtitle="Onboard a new or certified pre-owned bike with duplicate registration guard"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmitAdd} className="space-y-4">
          {formError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Motorcycle Brand *
              </label>
              <input
                type="text"
                required
                value={formState.brand}
                onChange={(e) => setFormState({ ...formState, brand: e.target.value })}
                placeholder="Royal Enfield, Yamaha, KTM..."
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Model Name & Variant *
              </label>
              <input
                type="text"
                required
                value={formState.modelName}
                onChange={(e) => setFormState({ ...formState, modelName: e.target.value })}
                placeholder="e.g. Classic 350 Reborn (Dark Stealth)"
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Registration Number *
              </label>
              <input
                type="text"
                required
                value={formState.registrationNumber}
                onChange={(e) => setFormState({ ...formState, registrationNumber: e.target.value.toUpperCase() })}
                placeholder="MH 12 AB 1234"
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Manufacturing Year
              </label>
              <input
                type="number"
                min={2000}
                max={2030}
                value={formState.manufacturingYear}
                onChange={(e) => setFormState({ ...formState, manufacturingYear: parseInt(e.target.value, 10) || 2024 })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Engine Capacity (cc)
              </label>
              <input
                type="number"
                min={0}
                max={2500}
                value={formState.engineCapacityCc}
                onChange={(e) => setFormState({ ...formState, engineCapacityCc: parseInt(e.target.value, 10) || 0 })}
                placeholder="0 for Electric"
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fuel Type
              </label>
              <select
                value={formState.fuelType}
                onChange={(e) => setFormState({ ...formState, fuelType: e.target.value as FuelType })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 bg-white focus:border-blue-500 focus:outline-hidden"
              >
                <option value="Petrol">Petrol</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Color
              </label>
              <input
                type="text"
                value={formState.color}
                onChange={(e) => setFormState({ ...formState, color: e.target.value })}
                placeholder="e.g. Stealth Black"
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kilometres Driven
              </label>
              <input
                type="number"
                min={0}
                value={formState.kmDriven}
                onChange={(e) => setFormState({ ...formState, kmDriven: parseInt(e.target.value, 10) || 0 })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Condition
              </label>
              <select
                value={formState.condition}
                onChange={(e) => setFormState({ ...formState, condition: e.target.value as BikeCondition })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 bg-white focus:border-blue-500 focus:outline-hidden"
              >
                <option value="Used">Used / Certified Pre-Owned</option>
                <option value="New">Brand New Showroom Stock</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Selling Price (₹ INR) *
              </label>
              <input
                type="number"
                min={1000}
                step={500}
                required
                value={formState.sellingPrice}
                onChange={(e) => setFormState({ ...formState, sellingPrice: parseInt(e.target.value, 10) || 0 })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 font-bold focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Consigning Seller *
              </label>
              <select
                required
                value={formState.sellerId}
                onChange={(e) => setFormState({ ...formState, sellerId: e.target.value })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 bg-white focus:border-blue-500 focus:outline-hidden"
              >
                {sellers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.id}) - {s.city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Image URL (Optional)
            </label>
            <input
              type="url"
              value={formState.imageUrl}
              onChange={(e) => setFormState({ ...formState, imageUrl: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Vehicle Notes & Service Highlights
            </label>
            <textarea
              rows={2}
              value={formState.notes}
              onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
              placeholder="ABS features, accessories installed, tyre condition, insurance validity..."
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
              Save Bike Record
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT BIKE MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Bike: ${selectedBike?.id}`}
        subtitle={`Update specifications for ${selectedBike?.brand} ${selectedBike?.modelName}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmitEdit} className="space-y-4">
          {formError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Motorcycle Brand *
              </label>
              <input
                type="text"
                required
                value={formState.brand}
                onChange={(e) => setFormState({ ...formState, brand: e.target.value })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Model Name *
              </label>
              <input
                type="text"
                required
                value={formState.modelName}
                onChange={(e) => setFormState({ ...formState, modelName: e.target.value })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Registration Number *
              </label>
              <input
                type="text"
                required
                value={formState.registrationNumber}
                onChange={(e) => setFormState({ ...formState, registrationNumber: e.target.value.toUpperCase() })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Selling Price (₹ INR) *
              </label>
              <input
                type="number"
                min={1000}
                required
                value={formState.sellingPrice}
                onChange={(e) => setFormState({ ...formState, sellingPrice: parseInt(e.target.value, 10) || 0 })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 font-bold focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Availability Status
              </label>
              <select
                value={formState.status}
                onChange={(e) => setFormState({ ...formState, status: e.target.value as BikeStatus })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 bg-white focus:border-blue-500 focus:outline-hidden"
              >
                <option value="Available">Available</option>
                <option value="Reserved">Reserved</option>
                <option value="Sold">Sold</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kilometres Driven
              </label>
              <input
                type="number"
                min={0}
                value={formState.kmDriven}
                onChange={(e) => setFormState({ ...formState, kmDriven: parseInt(e.target.value, 10) || 0 })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Condition
              </label>
              <select
                value={formState.condition}
                onChange={(e) => setFormState({ ...formState, condition: e.target.value as BikeCondition })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 bg-white focus:border-blue-500 focus:outline-hidden"
              >
                <option value="Used">Used</option>
                <option value="New">New</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Consigning Seller
              </label>
              <select
                value={formState.sellerId}
                onChange={(e) => setFormState({ ...formState, sellerId: e.target.value })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 bg-white focus:border-blue-500 focus:outline-hidden"
              >
                {sellers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Image URL
            </label>
            <input
              type="url"
              value={formState.imageUrl}
              onChange={(e) => setFormState({ ...formState, imageUrl: e.target.value })}
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
              Update Bike
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW BIKE DETAILS MODAL */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`${selectedBike?.brand} ${selectedBike?.modelName}`}
        subtitle={`Stock ID: ${selectedBike?.id} • Registration: ${selectedBike?.registrationNumber}`}
        maxWidth="2xl"
      >
        {selectedBike && (
          <div className="space-y-6">
            <div className="relative h-56 w-full rounded-xl overflow-hidden bg-slate-900">
              <img
                src={selectedBike.imageUrl || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80'}
                alt={selectedBike.modelName}
                className="h-full w-full object-cover"
              />
              <div className="absolute top-3 left-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase border shadow-xs ${getStatusBadge(selectedBike.status)}`}>
                  {selectedBike.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5">
                <span className="text-[10px] text-slate-400 block font-semibold">PRICE</span>
                <span className="font-black text-blue-600 text-sm">{formatCurrency(selectedBike.sellingPrice)}</span>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5">
                <span className="text-[10px] text-slate-400 block font-semibold">REG NUMBER</span>
                <span className="font-mono font-bold text-slate-800">{selectedBike.registrationNumber}</span>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5">
                <span className="text-[10px] text-slate-400 block font-semibold">ENGINE / FUEL</span>
                <span className="font-semibold text-slate-800">{selectedBike.engineCapacityCc ? `${selectedBike.engineCapacityCc}cc` : 'EV'} ({selectedBike.fuelType})</span>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5">
                <span className="text-[10px] text-slate-400 block font-semibold">ODOMETER</span>
                <span className="font-semibold text-slate-800">{selectedBike.kmDriven.toLocaleString('en-IN')} km</span>
              </div>
            </div>

            {/* Consigning Seller Info */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Consigned By Seller</span>
              <div className="flex items-center justify-between mt-1">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedBikeSeller?.fullName || selectedBike.sellerId}</h4>
                  <p className="text-slate-500">Phone: +91 {selectedBikeSeller?.mobileNumber} • City: {selectedBikeSeller?.city}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-700">
                  {selectedBikeSeller?.sellerType || 'Individual'}
                </span>
              </div>
            </div>

            {selectedBike.notes && (
              <div className="text-xs text-slate-600 rounded-xl border border-slate-200 p-3 bg-white">
                <span className="font-bold text-slate-700 block mb-1">Inspection & Vehicle Notes:</span>
                <p>{selectedBike.notes}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              {selectedBike.status === 'Available' ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    onInitiateSale(selectedBike);
                  }}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs flex items-center gap-1.5"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Initiate Sale for this Bike</span>
                </button>
              ) : (
                <span className="text-xs font-semibold text-slate-400">Bike is not available for sale.</span>
              )}

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
        title="Remove Bike from Inventory"
        message={
          deleteError 
            ? deleteError 
            : `Are you sure you want to remove "${selectedBike?.brand} ${selectedBike?.modelName}" (${selectedBike?.registrationNumber}) from inventory?`
        }
        confirmText="Confirm Removal"
        variant="danger"
      />
    </div>
  );
};
