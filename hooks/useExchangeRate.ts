import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import {
  getCurrentQuote, getRateHistory, updateExchangeRateConfig, RatePoint,
} from '../lib/exchangeRate';
import { AppCurrency, ExchangeRateConfig } from '../types';

const DEFAULT_CONFIG: Omit<ExchangeRateConfig, 'uid'> = {
  baseCurrency: 'BRL',
  alertThreshold: 2,
  lastKnownRate: 0,
  autoAdjustEnabled: false,
};

export function useExchangeRate() {
  const uid = auth.currentUser?.uid;
  const [config, setConfig] = useState<ExchangeRateConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [currentRate, setCurrentRate] = useState<number | null>(null);
  const [pctChangeToday, setPctChangeToday] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [rateError, setRateError] = useState(false);
  const [history, setHistory] = useState<RatePoint[]>([]);
  const [historyDays, setHistoryDays] = useState<7 | 30>(7);

  useEffect(() => {
    if (!uid) { setConfigLoading(false); return; }
    const unsub = onSnapshot(doc(db, 'exchange_rates', uid), (snap) => {
      setConfig(snap.exists() ? ({ uid, ...DEFAULT_CONFIG, ...snap.data() } as ExchangeRateConfig) : { uid, ...DEFAULT_CONFIG });
      setConfigLoading(false);
    });
    return unsub;
  }, [uid]);

  const baseCurrency = config?.baseCurrency ?? 'BRL';

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const quote = await getCurrentQuote(baseCurrency);
      setCurrentRate(quote.bid);
      setPctChangeToday(quote.pctChange);
      setLastUpdatedAt(new Date(quote.timestamp * 1000));
      setRateError(false);
    } catch {
      setRateError(true);
    } finally {
      setRefreshing(false);
    }
  }, [baseCurrency]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    getRateHistory(baseCurrency, historyDays).then(setHistory);
  }, [baseCurrency, historyDays]);

  const setBaseCurrency = async (currency: AppCurrency) => {
    if (!uid) return;
    await updateExchangeRateConfig(uid, { baseCurrency: currency });
  };

  const setAlertThreshold = async (threshold: number) => {
    if (!uid) return;
    await updateExchangeRateConfig(uid, { alertThreshold: threshold });
  };

  const setAutoAdjustEnabled = async (enabled: boolean) => {
    if (!uid) return;
    await updateExchangeRateConfig(uid, { autoAdjustEnabled: enabled });
  };

  return {
    config,
    configLoading,
    baseCurrency,
    currentRate,
    pctChangeToday,
    lastUpdatedAt,
    refreshing,
    rateError,
    refresh,
    history,
    historyDays,
    setHistoryDays,
    setBaseCurrency,
    setAlertThreshold,
    setAutoAdjustEnabled,
  };
}
