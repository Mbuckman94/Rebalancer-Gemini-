export type RoundingMode = 'nearest' | 'down' | 'up';

export interface Position {
  id: string;
  symbol: string;
  description: string;
  quantity: number;
  price: number;
  currentValue: number;
  yield: number;
  targetPct: number;
  roundingMode: RoundingMode;
  // AI Classification fields
  assetClass?: 'US_EQUITY' | 'NON_US_EQUITY' | 'FIXED_INCOME' | 'MUNI_BOND' | 'OTHER' | 'CASH';
  sector?: string;
  stateCode?: string; // For Munis
  logoTicker?: string; // For Corp Bonds
}

export interface Account {
  id: string;
  name: string;
  type: string; // e.g., 'Taxable', 'IRA', 'Roth'
  positions: Position[];
  cash: number;
}

export interface Client {
  id: string;
  name: string;
  lastUpdated: number; // timestamp
  accounts: Account[];
}
