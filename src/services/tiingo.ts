// Proxy configuration
// In a real production app, this would point to a backend server that handles the request to Tiingo
// to avoid CORS issues. For this client-side demo, we'll assume a proxy is available or 
// use a placeholder that users can configure.
const PROXY_URL = 'https://cors-anywhere.herokuapp.com/'; 
const TIINGO_BASE_URL = 'https://api.tiingo.com/tiingo';

const getApiKey = (): string => {
  try {
    const stored = localStorage.getItem('rebalancer_config');
    if (!stored) return '';
    const config = JSON.parse(stored);
    return config.tiingoKey || '';
  } catch (e) {
    return '';
  }
};

export async function fetchTiingoHistory(
  symbol: string, 
  startDate: string, 
  endDate: string
) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No Tiingo API key configured');
  }

  // Construct URL
  const endpoint = `${TIINGO_BASE_URL}/daily/${symbol}/prices?startDate=${startDate}&endDate=${endDate}&token=${apiKey}`;
  
  // Use proxy if we are in a browser environment that enforces CORS strictly against Tiingo
  // (Tiingo does not support CORS for free tier usually)
  const url = `${PROXY_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Origin': window.location.origin
      }
    });

    if (!response.ok) {
      throw new Error(`Tiingo API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Tiingo fetch failed', error);
    throw error;
  }
}
