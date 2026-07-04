import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { AppCurrency, ExchangeRateConfig } from '../types';

// API gratuita AwesomeAPI (https://docs.awesomeapi.com.br/api-de-moedas), sem necessidade de chave.
const AWESOME_API_BASE = 'https://economia.awesomeapi.com.br/json';
const CACHE_KEY_PREFIX = '@tab/exchangeRate/';

const PAIR: Record<AppCurrency, string> = { BRL: 'USD-BRL', PYG: 'USD-PYG' };
const FIELD: Record<AppCurrency, string> = { BRL: 'USDBRL', PYG: 'USDPYG' };

export interface RatePoint {
  date: string;
  value: number;
}

export interface RateChangeEvent {
  currency: AppCurrency;
  previousRate: number;
  currentRate: number;
  changePercent: number;
}

export interface RateQuote {
  bid: number;
  pctChange: number;
  timestamp: number;
}

async function cacheQuote(currency: AppCurrency, quote: RateQuote): Promise<void> {
  try {
    await AsyncStorage.setItem(`${CACHE_KEY_PREFIX}${currency}`, JSON.stringify(quote));
  } catch {
    // armazenamento local indisponível, segue sem cache
  }
}

async function getCachedQuote(currency: AppCurrency): Promise<RateQuote | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_KEY_PREFIX}${currency}`);
    if (!raw) return null;
    return JSON.parse(raw) as RateQuote;
  } catch {
    return null;
  }
}

// Nunca lança o app a perder: se a API falhar, cai para a última cotação salva localmente.
export async function getCurrentQuote(currency: AppCurrency): Promise<RateQuote> {
  try {
    const res = await fetch(`${AWESOME_API_BASE}/last/USD-BRL,USD-PYG`);
    if (!res.ok) throw new Error(`AwesomeAPI respondeu ${res.status}`);
    const data = await res.json();
    const raw = data[FIELD[currency]];
    const bid = parseFloat(raw?.bid);
    if (!Number.isFinite(bid)) throw new Error('Cotação inválida recebida da API');
    const quote: RateQuote = {
      bid,
      pctChange: parseFloat(raw?.pctChange) || 0,
      timestamp: Number(raw?.timestamp) || Date.now() / 1000,
    };
    await cacheQuote(currency, quote);
    return quote;
  } catch (err) {
    const cached = await getCachedQuote(currency);
    if (cached != null) return cached;
    throw err;
  }
}

export async function getCurrentRate(currency: AppCurrency): Promise<number> {
  const quote = await getCurrentQuote(currency);
  return quote.bid;
}

export async function getRateHistory(currency: AppCurrency, days: number): Promise<RatePoint[]> {
  try {
    const res = await fetch(`${AWESOME_API_BASE}/daily/${PAIR[currency]}/${days}`);
    if (!res.ok) throw new Error(`AwesomeAPI respondeu ${res.status}`);
    const data: Array<{ bid: string; timestamp: string }> = await res.json();
    return data
      .map((item) => ({ date: new Date(Number(item.timestamp) * 1000).toISOString(), value: parseFloat(item.bid) }))
      .reverse();
  } catch {
    return [];
  }
}

const DEFAULT_CONFIG: Omit<ExchangeRateConfig, 'uid'> = {
  baseCurrency: 'BRL',
  alertThreshold: 2,
  lastKnownRate: 0,
  autoAdjustEnabled: false,
};

export async function getExchangeRateConfig(uid: string): Promise<ExchangeRateConfig> {
  const snap = await getDoc(doc(db, 'exchange_rates', uid));
  if (snap.exists()) return { uid, ...DEFAULT_CONFIG, ...snap.data() } as ExchangeRateConfig;
  await setDoc(doc(db, 'exchange_rates', uid), { ...DEFAULT_CONFIG, lastCheckedAt: serverTimestamp() });
  return { uid, ...DEFAULT_CONFIG };
}

export async function updateExchangeRateConfig(
  uid: string,
  data: Partial<Omit<ExchangeRateConfig, 'uid'>>,
): Promise<void> {
  await setDoc(doc(db, 'exchange_rates', uid), data, { merge: true });
}

export async function updateLastKnownRate(uid: string, rate: number): Promise<void> {
  await setDoc(
    doc(db, 'exchange_rates', uid),
    { lastKnownRate: rate, lastCheckedAt: serverTimestamp() },
    { merge: true },
  );
}

// Polling local a cada 15 minutos (padrão), comparando com o lastKnownRate salvo no Firestore.
// Dispara o callback quando a variação ultrapassa o alertThreshold configurado pelo usuário.
// Útil como fallback no app aberto; o monitoramento "de verdade" (mesmo com app fechado) é
// feito pela Cloud Function `checkExchangeRate` (ver functions/index.js).
export function subscribeToRateChanges(
  uid: string,
  callback: (event: RateChangeEvent) => void,
  intervalMs = 15 * 60 * 1000,
): () => void {
  let cancelled = false;

  const tick = async () => {
    try {
      const config = await getExchangeRateConfig(uid);
      const currency = config.baseCurrency;
      const currentRate = await getCurrentRate(currency);
      const previousRate = config.lastKnownRate || currentRate;
      const changePercent = previousRate > 0 ? ((currentRate - previousRate) / previousRate) * 100 : 0;

      await updateLastKnownRate(uid, currentRate);

      if (previousRate > 0 && Math.abs(changePercent) >= config.alertThreshold) {
        callback({ currency, previousRate, currentRate, changePercent });
      }
    } catch {
      // Falha silenciosa: a próxima checagem tenta novamente.
    }
  };

  tick();
  const interval = setInterval(() => { if (!cancelled) tick(); }, intervalMs);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}

export function calculateSellPrice(costUSD: number, exchangeRate: number, marginPercent: number): number {
  return costUSD * exchangeRate * (1 + marginPercent / 100);
}
