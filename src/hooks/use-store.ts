import { useState, useEffect, useCallback } from 'react';
import { Client, Account, Position } from '@/types';

const DB_KEY = 'rebalance_db_v4';

// Dummy initial data for demonstration if DB is empty
const INITIAL_DATA: Client[] = [
  {
    id: 'demo-1',
    name: 'Tom\'s Retirement',
    lastUpdated: Date.now(),
    accounts: [
      {
        id: 'acc-1',
        name: 'Schwab IRA',
        type: 'IRA',
        cash: 5000,
        positions: [
          {
            id: 'pos-1',
            symbol: 'AAPL',
            description: 'Apple Inc.',
            quantity: 150,
            price: 185.50,
            currentValue: 27825,
            yield: 0.5,
            targetPct: 25,
            roundingMode: 'nearest'
          },
          {
            id: 'pos-2',
            symbol: 'VTI',
            description: 'Vanguard Total Stock Market',
            quantity: 400,
            price: 240.20,
            currentValue: 96080,
            yield: 1.4,
            targetPct: 75,
            roundingMode: 'nearest'
          }
        ]
      }
    ]
  }
];

export function useStore() {
  const [clients, setClients] = useState<Client[]>(() => {
    const stored = localStorage.getItem(DB_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse DB', e);
        return INITIAL_DATA;
      }
    }
    return INITIAL_DATA;
  });

  // Persistence Effect
  useEffect(() => {
    localStorage.setItem(DB_KEY, JSON.stringify(clients));
  }, [clients]);

  const addClient = useCallback((name: string) => {
    const newClient: Client = {
      id: crypto.randomUUID(),
      name,
      lastUpdated: Date.now(),
      accounts: []
    };
    setClients(prev => [newClient, ...prev]);
  }, []);

  const removeClient = useCallback((id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  }, []);

  const updateClient = useCallback((id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => 
      c.id === id ? { ...c, ...updates, lastUpdated: Date.now() } : c
    ));
  }, []);

  // Helper to calculate total value of a client
  const getClientValue = useCallback((client: Client) => {
    return client.accounts.reduce((total, acc) => {
      const positionsValue = acc.positions.reduce((sum, pos) => sum + pos.currentValue, 0);
      return total + positionsValue + acc.cash;
    }, 0);
  }, []);

  return {
    clients,
    addClient,
    removeClient,
    updateClient,
    getClientValue
  };
}
