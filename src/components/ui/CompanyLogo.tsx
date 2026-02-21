import React, { useState } from 'react';
import { useConfig } from '@/hooks/use-config';
import { Landmark } from 'lucide-react';

interface CompanyLogoProps {
  symbol: string;
  className?: string;
}

export function CompanyLogo({ symbol, className }: CompanyLogoProps) {
  const { config } = useConfig();
  const [error, setError] = useState(false);

  // Simple logic to detect if it's likely a ticker or CUSIP
  // CUSIPs are 9 chars, tickers usually 1-5.
  const isCusip = symbol.length === 9;
  
  if (isCusip || error || !config.logodevKey) {
    return (
      <div className={`flex items-center justify-center bg-zinc-800 text-zinc-400 rounded ${className}`}>
        <Landmark className="h-4 w-4" />
      </div>
    );
  }

  const logoUrl = `https://img.logo.dev/ticker/${symbol}?token=${config.logodevKey}`;

  return (
    <img
      src={logoUrl}
      alt={`${symbol} logo`}
      className={`rounded object-contain bg-white ${className}`}
      onError={() => setError(true)}
    />
  );
}
