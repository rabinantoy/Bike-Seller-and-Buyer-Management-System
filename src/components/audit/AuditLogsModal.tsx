import React, { useState } from 'react';
import { History, Shield, Filter, Search } from 'lucide-react';
import { Modal } from '../common/Modal';
import { AuditLog, AuditAction } from '../../types';
import { formatDateTime } from '../../utils/formatters';

interface AuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLog[];
}

export const AuditLogsModal: React.FC<AuditLogsModalProps> = ({
  isOpen,
  onClose,
  logs,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case 'SALE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CREATE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'UPDATE':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'DELETE':
      case 'CANCEL_TRANSACTION':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'LOGIN':
      case 'LOGOUT':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'SYSTEM_RESET':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dealership Audit Trail & Security Logs"
      subtitle="Complete chronological history of changes, inventory additions, sales, and role activities"
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by action details, user, or record ID..."
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-700 bg-white focus:border-blue-500 focus:outline-hidden"
            >
              <option value="ALL">All Actions ({logs.length})</option>
              <option value="SALE">Sales ({logs.filter(l => l.action === 'SALE').length})</option>
              <option value="CANCEL_TRANSACTION">Cancellations</option>
              <option value="CREATE">Created Records</option>
              <option value="UPDATE">Updated Records</option>
              <option value="DELETE">Deleted Records</option>
              <option value="LOGIN">Auth Logins</option>
            </select>
          </div>
        </div>

        {/* Logs List */}
        <div className="divide-y divide-slate-100 max-h-[50vh] overflow-y-auto pr-1">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No audit logs match your search criteria.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/70 rounded-lg px-2 transition">
                <div className="flex items-start gap-3">
                  <span className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase border tracking-wider ${getActionBadge(log.action)}`}>
                    {log.action}
                  </span>
                  <div>
                    <p className="text-xs font-medium text-slate-800 leading-snug">
                      {log.details}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span className="font-mono text-slate-500">{log.entityId}</span>
                      <span>•</span>
                      <span>User: <strong className="text-slate-600">{log.userEmail}</strong></span>
                    </div>
                  </div>
                </div>
                <div className="sm:text-right shrink-0 text-[11px] text-slate-400 font-mono">
                  {formatDateTime(log.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
