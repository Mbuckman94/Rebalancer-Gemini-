import { quoteCache } from './cache';

const API_KEYS = [
  process.env.Finnhub_API_Key1,
  process.env.Finnhub_API_Key2,
  process.env.Finnhub_API_Key3,
  process.env.Finnhub_API_Key4,
  process.env.Finnhub_API_Key5,
].filter(Boolean) as string[];

class KeyRotator {
  private currentIndex = 0;

  getNextKey(): string {
    if (API_KEYS.length === 0) {
      throw new Error('No Finnhub API keys configured in environment secrets.');
    }
    const key = API_KEYS[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % API_KEYS.length;
    return key;
  }

  rotate() {
    if (API_KEYS.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % API_KEYS.length;
    }
  }
}

const keyRotator = new KeyRotator();

async function fetchWithRetry(endpoint: string, retries = 0): Promise<any> {
  if (API_KEYS.length === 0) {
    throw new Error('No Finnhub API keys configured');
  }

  const apiKey = keyRotator.getNextKey();
  const url = `https://finnhub.io/api/v1${endpoint}${endpoint.includes('?') ? '&' : '?'}token=${apiKey}`;

  try {
    const response = await fetch(url);

    if (response.status === 429) {
      if (retries >= API_KEYS.length * 2) {
        throw new Error('Rate limit exceeded on all keys after retries');
      }
      console.warn(`Rate limit hit, rotating key and retrying...`);
      // The key was already rotated by getNextKey, but we can retry immediately with the next key
      return fetchWithRetry(endpoint, retries + 1);
    }

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  yield: number;
}

const TIINGO_API_KEY = process.env.Tiingo_API_Key;

async function fetchTiingoData(symbol: string): Promise<{ name?: string, description?: string, yield?: number }> {
  if (!TIINGO_API_KEY) return {};
  
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const dateStr = oneYearAgo.toISOString().split('T')[0];

    // Fetch Meta and Prices (for yield calculation) in parallel
    const [metaRes, pricesRes] = await Promise.all([
      fetch(`https://api.tiingo.com/tiingo/daily/${symbol}?token=${TIINGO_API_KEY}`),
      fetch(`https://api.tiingo.com/tiingo/daily/${symbol}/prices?startDate=${dateStr}&columns=divCash,close&token=${TIINGO_API_KEY}`)
    ]);

    const meta = metaRes.ok ? await metaRes.json() : {};
    const prices = pricesRes.ok ? await pricesRes.json() : [];

    let calculatedYield = 0;
    if (Array.isArray(prices) && prices.length > 0) {
      const totalDivs = prices.reduce((sum: number, day: any) => sum + (day.divCash || 0), 0);
      // Use the most recent close price from Tiingo for yield calculation to be consistent
      const lastPrice = prices[prices.length - 1].close;
      if (lastPrice > 0) {
        calculatedYield = (totalDivs / lastPrice) * 100;
      }
    }

    return { 
      name: meta.name, 
      description: meta.description,
      yield: calculatedYield > 0 ? calculatedYield : undefined
    };
  } catch (e) {
    console.warn(`Tiingo fetch failed for ${symbol}`, e);
    return {};
  }
}

export async function fetchMarketData(symbol: string): Promise<MarketData> {
  const cacheKey = `marketData_${symbol}`;
  const cached = quoteCache.get<MarketData>(cacheKey, 60); // 60s TTL

  if (cached) {
    return cached;
  }

  try {
    // Fetch all three endpoints in parallel from Finnhub
    const [profile, quote, metric] = await Promise.all([
      fetchWithRetry(`/stock/profile2?symbol=${symbol}`).catch(() => ({})),
      fetchWithRetry(`/quote?symbol=${symbol}`).catch(() => ({ c: 0 })),
      fetchWithRetry(`/stock/metric?symbol=${symbol}&metric=all`).catch(() => ({}))
    ]);

    let name = profile?.name;
    let dividendYield = metric?.metric?.dividendYieldIndicatedAnnual || metric?.metric?.dividendYield5Y;

    // ETF Fallback Logic:
    // If Finnhub returns no name or no yield, try Tiingo
    // We check for undefined/null yield, or 0 if it's a known dividend payer (but 0 is hard to distinguish from no-yield stock)
    // For now, if name is missing OR yield is missing/0, we check Tiingo. 
    // Note: Some stocks truly have 0 yield. But if Finnhub fails for ETFs, it often returns null/undefined.
    if (!name || name.trim() === '' || dividendYield === undefined || dividendYield === null) {
       const tiingo = await fetchTiingoData(symbol);
       
       if (!name || name.trim() === '') {
         name = tiingo.name;
       }
       
       if (dividendYield === undefined || dividendYield === null) {
         dividendYield = tiingo.yield;
       }
    }

    // Graceful degradation for Name
    if (!name || name.trim() === '') {
      name = symbol; // Fallback to symbol if name is still missing
    }

    const data: MarketData = {
      symbol,
      name: name,
      price: quote?.c || 0,
      yield: dividendYield || 0 // Ensure 0 if undefined/null
    };

    quoteCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`Failed to fetch market data for ${symbol}`, error);
    // Return a safe fallback object instead of throwing, to prevent UI breakage
    return {
      symbol,
      name: symbol,
      price: 0,
      yield: 0
    };
  }
}

export function startPricePolling(
  symbols: string[], 
  onUpdate: (symbol: string, data: MarketData) => void,
  intervalMs = 15000
) {
  // Initial fetch
  symbols.forEach(async (sym) => {
    try {
      const data = await fetchMarketData(sym);
      if (data) {
        onUpdate(sym, data);
      }
    } catch (e) {
      // Ignore errors during polling to prevent log spam
    }
  });

  const intervalId = setInterval(() => {
    symbols.forEach(async (sym) => {
      try {
        const data = await fetchMarketData(sym);
        if (data) {
          onUpdate(sym, data);
        }
      } catch (e) {
        // Ignore
      }
    });
  }, intervalMs);

  return () => clearInterval(intervalId);
}
