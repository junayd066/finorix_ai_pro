// src/lib/api.ts
import { TradingSignal } from '@/types';

// তোর ngrok লিংক এখানে বসাবে
const API_BASE_URL =
  'https://uninfixed-zulma-supergenerically.ngrok-free.dev/api/live';

export const fetchTradingSignal = async (
  pair: string
): Promise<TradingSignal | null> => {
  try {
    const url = `${API_BASE_URL}?pair=${pair}`;
    console.log('Fetching:', url); // ডিবাগ – দেখবি কোন URL কল হচ্ছে

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.error('HTTP Error:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data?.direction || !data?.timer || !data?.live_price) {
      console.error('Invalid data:', data);
      return null;
    }

    return data as TradingSignal;
  } catch (error) {
    console.error('Fetch failed for pair:', pair, error);
    return null;
  }
};
