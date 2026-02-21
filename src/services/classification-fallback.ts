import { Position } from '@/types';

export function classifyPositionFallback(position: Position): Partial<Position> {
  const desc = position.description.toUpperCase();
  const sym = position.symbol.toUpperCase();

  let assetClass: Position['assetClass'] = 'OTHER';
  let sector = 'Other';
  let stateCode: string | undefined;
  let logoTicker: string | undefined;

  // Basic Heuristics
  if (sym === 'CASH' || sym === 'USD' || desc.includes('CASH') || desc.includes('SWEEP')) {
    assetClass = 'CASH';
    sector = 'Cash & Equivalents';
  } else if (sym.length === 9 || desc.includes('BOND') || desc.includes('NOTE') || desc.includes('TREASURY')) {
    // Likely Fixed Income
    if (desc.includes('MUNI') || desc.includes('GO ') || desc.includes('REV ')) {
      assetClass = 'MUNI_BOND';
      sector = 'Municipal';
      // Try to extract state code
      const stateMatch = desc.match(/\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/);
      if (stateMatch) {
        stateCode = stateMatch[1];
      }
    } else {
      assetClass = 'FIXED_INCOME';
      sector = 'Corporate/Govt';
      // Try to guess parent ticker for corp bonds (very rough)
      if (!desc.includes('TREASURY')) {
          logoTicker = desc.split(' ')[0].substring(0, 4); 
      }
    }
  } else {
    // Likely Equity
    // Very rough logic: if it has "INTL" or "EMERGING", maybe non-US
    if (desc.includes('INTL') || desc.includes('EMERGING') || desc.includes('EUROPE') || desc.includes('ASIA')) {
      assetClass = 'NON_US_EQUITY';
      sector = 'International Equity';
    } else {
      assetClass = 'US_EQUITY';
      // Keyword sector guessing
      if (desc.includes('TECH') || desc.includes('SOFTWARE') || desc.includes('SEMICONDUCTOR')) sector = 'Technology';
      else if (desc.includes('HEALTH') || desc.includes('PHARMA') || desc.includes('BIO')) sector = 'Healthcare';
      else if (desc.includes('BANK') || desc.includes('FINANCE') || desc.includes('INSURANCE')) sector = 'Financials';
      else if (desc.includes('ENERGY') || desc.includes('OIL') || desc.includes('GAS')) sector = 'Energy';
      else if (desc.includes('REIT') || desc.includes('REAL ESTATE')) sector = 'Real Estate';
      else sector = 'US Equity';
    }
  }

  return {
    assetClass,
    sector,
    stateCode,
    logoTicker
  };
}
