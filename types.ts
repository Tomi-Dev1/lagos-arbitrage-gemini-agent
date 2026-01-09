
export interface MarketDeal {
  id: string | number;
  product_name: string;
  item_name?: string;
  market_a: string;
  market_name?: string;
  price_a: number;
  mile12_price?: number; // Added for specific profit calculation
  market_b: string;
  price_b: number;
  online_price?: number; // Added for specific profit calculation
  potential_profit: number;
  profit_percentage?: number;
  confidence_score?: number;
  specialized_category?: string;
  thought_signature: string;
  created_at: string;
}

export enum MarketStatus {
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type AppTab = 'deals' | 'stats' | 'markets';

export type LogisticsMode = 'delivery' | 'pickup';
