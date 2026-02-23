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
  yield: number | string;
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
    let dividendYield = metric?.metric?.currentDividendYieldTTM || metric?.metric?.dividendYieldIndicatedAnnual;

    // ETF Fallback Logic for Name:
    // If Finnhub returns no name (common for ETFs in profile2), try Finnhub Search
    if (!name || name.trim() === '') {
       try {
         const searchRes = await fetchWithRetry(`/search?q=${symbol}`);
         if (searchRes && searchRes.result && searchRes.result.length > 0) {
            // Find exact match if possible, otherwise take the first
            const match = searchRes.result.find((r: any) => r.symbol === symbol) || searchRes.result[0];
            if (match) {
                name = match.description;
            }
         }
       } catch (e) {
         console.warn(`Finnhub search fallback failed for ${symbol}`, e);
       }
    }

    // Graceful degradation for Name
    if (!name || name.trim() === '') {
      name = symbol; // Fallback to symbol if name is still missing
    }
    
    // Graceful degradation for Yield
    // If yield is undefined or null, set to "N/A"
    let finalYield: number | string = 0;
    if (dividendYield !== undefined && dividendYield !== null) {
        finalYield = dividendYield;
    } else {
        finalYield = "N/A";
    }

    const data: MarketData = {
      symbol,
      name: name,
      price: quote?.c || 0,
      yield: finalYield
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
      yield: "N/A"
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
