import { useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storage';
import { Seller, Buyer, Bike, Transaction, AuditLog, DealershipSettings } from '../types';

export function useDealershipData() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<DealershipSettings>(storageService.getSettings());
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setSellers(storageService.getSellers());
    setBuyers(storageService.getBuyers());
    setBikes(storageService.getBikes());
    setTransactions(storageService.getTransactions());
    setAuditLogs(storageService.getAuditLogs());
    setSettings(storageService.getSettings());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = storageService.subscribe(refresh);
    return () => {
      unsubscribe();
    };
  }, [refresh]);

  return {
    sellers,
    buyers,
    bikes,
    transactions,
    auditLogs,
    settings,
    isLoading,
    refresh,
  };
}
