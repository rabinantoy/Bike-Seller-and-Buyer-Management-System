import React, { useState } from 'react';
import { 
  Settings, 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  Shield, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  FileCode, 
  Building,
  Save,
  AlertCircle
} from 'lucide-react';
import { DealershipSettings, UserRole } from '../../types';
import { storageService } from '../../services/storage';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';

interface SettingsViewProps {
  settings: DealershipSettings;
  onRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onRefresh,
}) => {
  const { user, isAdmin } = useAuth();
  const [formData, setFormData] = useState<DealershipSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importError, setImportError] = useState('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.updateSettings(formData, user?.email);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    onRefresh();
  };

  const handleResetData = () => {
    storageService.resetToDemoData(user?.email);
    setIsResetConfirmOpen(false);
    onRefresh();
  };

  const handleExportBackup = () => {
    const json = storageService.exportDatabaseJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Apex_Dealership_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = () => {
    setImportError('');
    if (!importJsonText.trim()) {
      setImportError('Please paste valid JSON backup data.');
      return;
    }
    try {
      storageService.importDatabaseJson(importJsonText, user?.email);
      setIsImportModalOpen(false);
      setImportJsonText('');
      onRefresh();
      alert('Database restored successfully!');
    } catch (err: any) {
      setImportError(err.message || 'Invalid JSON format.');
    }
  };

  const firebaseConfigSample = `{
  "apiKey": "AIzaSy...",
  "authDomain": "apex-moto-hub.firebaseapp.com",
  "projectId": "apex-moto-hub",
  "storageBucket": "apex-moto-hub.firebasestorage.app",
  "messagingSenderId": "1234567890",
  "appId": "1:1234567890:web:abcdef..."
}`;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">System Settings & Firebase Cloud Setup</h2>
        <p className="text-xs text-slate-500">
          Configure dealership identity, inspect Firebase schemas, manage database backups, and view RBAC permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dealership Profile Form */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building className="h-4 w-4 text-blue-600" />
                Dealership Profile & Tax Particulars
              </h3>
              <p className="text-xs text-slate-500">Information displayed on official sales invoices and customer receipts</p>
            </div>
            {saveSuccess && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Saved
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dealership Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.dealershipName}
                  onChange={(e) => setFormData({ ...formData, dealershipName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Brand Tagline
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  GSTIN / Tax Identification *
                </label>
                <input
                  type="text"
                  required
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 font-mono focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Contact Phone *
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={formData.currencySymbol}
                  onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Showroom Street Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                City, State & Postal Code
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-xs transition"
              >
                <Save className="h-4 w-4" />
                <span>Save Dealership Profile</span>
              </button>
            </div>
          </form>
        </div>

        {/* Database & College Project Controls */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-600" />
              Database Management
            </h3>
            <p className="text-xs text-slate-500">
              Manage database states, export complete JSON archives, or reset data to default realistic records.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleExportBackup}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition"
              >
                <span className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-blue-600" />
                  Export Full Backup (.JSON)
                </span>
                <span className="text-[10px] text-slate-400">Download</span>
              </button>

              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition"
              >
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-emerald-600" />
                  Restore from JSON Backup
                </span>
                <span className="text-[10px] text-slate-400">Import</span>
              </button>

              <button
                onClick={() => setIsResetConfirmOpen(true)}
                className="flex w-full items-center justify-between rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-xs font-semibold text-rose-800 hover:bg-rose-100/70 transition"
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-rose-600" />
                  Reset to Initial Demo Data
                </span>
                <span className="text-[10px] text-rose-600">Reset</span>
              </button>
            </div>
          </div>

          {/* Role-Based Permissions Reference */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-600" />
              Role-Based Access (RBAC)
            </h3>
            <div className="space-y-2 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                <div className="flex items-center justify-between">
                  <strong className="text-slate-900">Administrator</strong>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">All Permissions</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Full CRUD, delete entities, cancel sales, restore database, view audit trail.</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                <div className="flex items-center justify-between">
                  <strong className="text-slate-900">Sales Staff</strong>
                  <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">Operational</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Add bikes, register sellers/buyers, record sales, print invoices.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FIREBASE INTEGRATION & ARCHITECTURE GUIDE */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="h-4 w-4 text-amber-500" />
              Cloud Firestore & Firebase Integration Guide
            </h3>
            <p className="text-xs text-slate-500">
              How to configure Firebase Firestore and Authentication for real cloud persistence
            </p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
            Persistent Demo Mode Active
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs text-slate-700">
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Step-by-Step Setup Instructions:
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-slate-600 leading-relaxed">
              <li>
                Visit the <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-blue-600 font-semibold underline inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="h-3 w-3" /></a> and create a new project.
              </li>
              <li>
                Under <strong>Build &gt; Firestore Database</strong>, click <em>Create Database</em> (Start in Test or Production Mode).
              </li>
              <li>
                Under <strong>Build &gt; Authentication</strong>, enable <em>Email/Password</em> or <em>Google Sign-In</em>.
              </li>
              <li>
                Under <strong>Project Settings &gt; General &gt; Your Apps</strong>, add a Web App and copy your Firebase config object.
              </li>
              <li>
                Save the config in <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">firebase-applet-config.json</code> in the workspace root.
              </li>
            </ol>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Firestore Collections Blueprint:
              </h4>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(firebaseConfigSample);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Copy className="h-3 w-3" />
                {copiedCode ? 'Copied!' : 'Copy Schema'}
              </button>
            </div>
            <div className="rounded-xl bg-slate-900 text-slate-200 p-3.5 font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
              <pre>
{`Collections:
- /sellers/{sellerId}
  { id, fullName, mobileNumber, email, city, sellerType, registrationDate, notes }
- /buyers/{buyerId}
  { id, fullName, mobileNumber, email, city, govIdType, govIdNumberMasked }
- /bikes/{bikeId}
  { id, brand, modelName, registrationNumber, sellingPrice, status, sellerId }
- /transactions/{txnId}
  { id, bikeId, buyerId, sellerId, finalSellingPrice, paymentMethod, status }
- /auditLogs/{logId}
  { id, timestamp, userEmail, action, entity, details }`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* RESET CONFIRMATION */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetData}
        title="Reset All Dealership Data?"
        message="This will restore all collections (Sellers, Buyers, Bikes, Transactions, and Audit Logs) to the initial realistic Indian motorcycle demo records. Any newly created entries will be replaced."
        confirmText="Reset to Defaults"
        variant="warning"
      />

      {/* IMPORT BACKUP MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Restore Database from JSON</h3>
            <p className="text-xs text-slate-500 mb-4">Paste the JSON database backup content below to restore all records:</p>

            {importError && (
              <div className="mb-3 rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800">
                {importError}
              </div>
            )}

            <textarea
              rows={8}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Paste backup JSON content here..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs font-mono text-slate-900 focus:border-blue-500 focus:outline-hidden"
            />

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportBackup}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
              >
                Restore Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
