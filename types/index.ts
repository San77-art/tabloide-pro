export interface Market {
  id: string;
  name: string;
  logoUrl?: string;
  colors: { primary: string; secondary: string };
}

export interface Product {
  id: string;
  uid?: string;
  name: string;
  price: number;
  oldPrice?: number;
  imageUrl?: string;
  category: 'Alimentos' | 'Bebidas' | 'Limpeza' | 'Higiene' | 'Geral';
  isHighlight?: boolean;
  // Precificação baseada em custo em dólar (lojistas de importados de fronteira)
  costUSD?: number;
  marginPercent?: number;
  sellPrice?: number;
  sellPriceCurrency?: 'BRL' | 'PYG';
  manualOverride?: boolean;
  lastPriceUpdate?: unknown;
  isActive?: boolean;
  createdAt?: unknown;
}

export type AppCurrency = 'BRL' | 'PYG';

export interface ExchangeRateConfig {
  uid: string;
  baseCurrency: AppCurrency;
  alertThreshold: number;
  lastKnownRate: number;
  lastCheckedAt?: unknown;
  autoAdjustEnabled: boolean;
}

export type PlanId = 'free' | 'pro' | 'business' | 'enterprise';

export interface Subscription {
  uid: string;
  plan: PlanId;
  status: 'active' | 'trial' | 'expired' | 'cancelled';
  trialEndsAt?: unknown;
  currentPeriodEnd?: unknown;
  productLimit: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Tab {
  id: string;
  title: string;
  type: 'weekly' | 'monthly' | 'special';
  products: Product[];
  createdAt: Date;
  thumbnailUrl?: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'scheduled' | 'finished';
  tabCount: number;
  views: number;
  sales: number;
  thumbnailUrl?: string;
}

export interface Activity {
  id: string;
  type: 'tab_created' | 'campaign_started' | 'product_added' | 'sale';
  description: string;
  timestamp: Date;
  color: string;
}

