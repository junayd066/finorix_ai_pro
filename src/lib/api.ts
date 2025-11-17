// src/lib/api.ts
import { TradingSignal } from '@/types';

const API_BASE_URL = 'https://finorixaipro-production.up.railway.app/api/live';

export const fetchTradingSignal = async (
  pair: string = 'frxEURUSD'
): Promise<TradingSignal | null> => {
  try {
    const url = `${API_BASE_URL}?pair=${pair}`;
    console.log('Calling API:', url); // ডিবাগ

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data?.direction || !data?.timer || !data?.live_price) {
      throw new Error('Invalid data format');
    }

    return data as TradingSignal;
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
};
