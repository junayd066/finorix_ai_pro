export interface TradingSignal {
  direction: "GREEN" | "RED";
  confidence: number;
  live_price: number;
  predicted_price: number;
  timer: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  validity: "lifetime" | number; // number of days or "lifetime"
  createdAt: string;
  deviceHash?: string;
  expiresAt?: string;
}

export interface AuthSession {
  userId: string;
  username: string;
  expiresAt: string;
  deviceHash: string;
}
