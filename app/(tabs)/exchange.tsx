import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowUp, ArrowDown, RefreshCw, Bell, Zap, CheckSquare, Square,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { RateChart } from '../../components/exchange/RateChart';
import { Slider } from '../../components/ui/Slider';
import { UpgradeModal } from '../../components/ui/UpgradeModal';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import { useProducts } from '../../hooks/useProducts';
import { useSubscription } from '../../hooks/useSubscription';
import { calculateSellPrice, updateLastKnownRate } from '../../lib/exchangeRate';
import { logActivity } from '../../lib/activity';
import { formatPrice } from '../../utils/formatCurrency';
import { formatRelativeDate } from '../../utils/formatDate';
import { auth } from '../../lib/firebase';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import { AppCurrency } from '../../types';

export default function ExchangeScreen() {
  const {
    config, baseCurrency, currentRate, pctChangeToday, lastUpdatedAt,
    refreshing, rateError, refresh, history, historyDays, setHistoryDays,
    setBaseCurrency, setAlertThreshold, setAutoAdjustEnabled,
  } = useExchangeRate();
  const { allProducts, applyRateAdjustment } = useProducts();
  const { canUseAutoAlerts, planInfo, plan } = useSubscription();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [applying, setApplying] = useState(false);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);

  const uid = auth.currentUser?.uid;

  // O polling/monitoramento da cotação roda globalmente via usePriceAlerts (app/_layout.tsx);
  // esta tela só lê o estado via useExchangeRate (onSnapshot) e o Firestore.

  const isUp = pctChangeToday > 0;
  const isDown = pctChangeToday < 0;

  const baselineRate = config?.lastKnownRate ?? 0;
  const pctChangeFromBaseline = baselineRate > 0 && currentRate != null
    ? ((currentRate - baselineRate) / baselineRate) * 100
    : 0;
  const alertActive = config != null && baselineRate > 0 && Math.abs(pctChangeFromBaseline) >= config.alertThreshold;

  const affectedProducts = useMemo(() => {
    if (currentRate == null) return [];
    return allProducts
      .filter((p) => p.costUSD != null && p.costUSD > 0 && !p.manualOverride)
      .map((p) => ({ ...p, newPrice: calculateSellPrice(p.costUSD!, currentRate, p.marginPercent ?? 0) }))
      .filter((p) => Math.abs(p.newPrice - p.price) > 0.01);
  }, [allProducts, currentRate]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => affectedProducts.some((p) => p.id === id)));
  }, [affectedProducts]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const selectAll = () => setSelectedIds(affectedProducts.map((p) => p.id));

  const handleApplySelected = async () => {
    if (selectedIds.length === 0 || currentRate == null || !uid) return;
    setApplying(true);
    try {
      await applyRateAdjustment(selectedIds, currentRate);
      await updateLastKnownRate(uid, currentRate);
      await logActivity(uid, 'price_adjusted', `Preços reajustados: ${selectedIds.length} produtos atualizados`);
      setSelectedIds([]);
      Alert.alert('Pronto', 'Preços reajustados com sucesso.');
    } catch (e: any) {
      Alert.alert('Erro ao reajustar', e.message);
    } finally {
      setApplying(false);
    }
  };

  const handleApplyAll = async () => {
    if (affectedProducts.length === 0 || currentRate == null || !uid) return;
    setApplying(true);
    try {
      await applyRateAdjustment(affectedProducts.map((p) => p.id), currentRate);
      await updateLastKnownRate(uid, currentRate);
      await logActivity(uid, 'price_adjusted', `Preços reajustados: ${affectedProducts.length} produtos atualizados`);
      setSelectedIds([]);
      Alert.alert('Pronto', 'Todos os preços foram reajustados.');
    } catch (e: any) {
      Alert.alert('Erro ao reajustar', e.message);
    } finally {
      setApplying(false);
    }
  };

  const handleToggleAutoAdjust = (value: boolean) => {
    if (!canUseAutoAlerts) { setUpgradeModalVisible(true); return; }
    setAutoAdjustEnabled(value);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.pageTitle}>Cotação</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Card cotação atual */}
        <LinearGradient colors={Colors.primaryGradient} style={styles.rateCard}>
          <View style={styles.currencyToggle}>
            {(['BRL', 'PYG'] as AppCurrency[]).map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setBaseCurrency(c)}
                style={[styles.currencyBtn, baseCurrency === c && styles.currencyBtnActive]}
              >
                <Text style={[styles.currencyBtnText, baseCurrency === c && styles.currencyBtnTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.rateLabel}>US$ 1 =</Text>
          <Text style={styles.rateValue}>
            {currentRate != null ? formatPrice(currentRate, baseCurrency) : '—'}
          </Text>

          <View style={styles.rateChangeRow}>
            <View style={[styles.changeBadge, { backgroundColor: isUp ? Colors.danger : isDown ? Colors.success : 'rgba(255,255,255,0.2)' }]}>
              {isUp ? <ArrowUp size={12} color="#fff" /> : isDown ? <ArrowDown size={12} color="#fff" /> : null}
              <Text style={styles.changeBadgeText}>{Math.abs(pctChangeToday).toFixed(2)}% hoje</Text>
            </View>
            <TouchableOpacity onPress={refresh} disabled={refreshing} style={styles.refreshBtn}>
              <RefreshCw size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.updatedText}>
            {rateError
              ? 'Não foi possível atualizar — exibindo último valor salvo'
              : lastUpdatedAt
                ? `Atualizado ${formatRelativeDate(lastUpdatedAt)}`
                : 'Carregando...'}
          </Text>
        </LinearGradient>

        {/* Gráfico */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Histórico</Text>
            <View style={styles.periodToggle}>
              {[7, 30].map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => setHistoryDays(d as 7 | 30)}
                  style={[styles.periodBtn, historyDays === d && styles.periodBtnActive]}
                >
                  <Text style={[styles.periodBtnText, historyDays === d && styles.periodBtnTextActive]}>{d}d</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.chartCard}>
            <RateChart data={history} />
          </View>
        </View>

        {/* Configuração de alertas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alertas</Text>
          <View style={styles.card}>
            <View style={styles.sliderHeader}>
              <View style={styles.sliderLabelRow}>
                <Bell size={14} color={Colors.textMuted} />
                <Text style={styles.cardLabel}>Avisar quando o dólar variar mais que</Text>
              </View>
              <Text style={styles.sliderValue}>{(config?.alertThreshold ?? 2).toFixed(1)}%</Text>
            </View>
            <Slider
              value={config?.alertThreshold ?? 2}
              min={0.5}
              max={10}
              step={0.5}
              onChange={setAlertThreshold}
            />

            <View style={styles.divider} />

            <View style={styles.toggleRow}>
              <View style={styles.sliderLabelRow}>
                <Zap size={14} color={Colors.textMuted} />
                <Text style={styles.cardLabel}>Reajustar preços automaticamente</Text>
              </View>
              <Switch
                value={!!config?.autoAdjustEnabled}
                onValueChange={handleToggleAutoAdjust}
                trackColor={{ false: Colors.border, true: Colors.secondary }}
                thumbColor={config?.autoAdjustEnabled ? Colors.primary : '#fff'}
              />
            </View>
            {!canUseAutoAlerts && (
              <Text style={styles.lockedHint}>Disponível nos planos Pro e Business.</Text>
            )}
          </View>
        </View>

        {/* Produtos afetados */}
        {affectedProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                {alertActive ? `Dólar variou ${pctChangeFromBaseline.toFixed(1)}% — reajuste sugerido` : 'Produtos a reajustar'}
              </Text>
              <TouchableOpacity onPress={selectAll}>
                <Text style={styles.selectAllText}>Selecionar todos</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              {affectedProducts.map((p) => {
                const selected = selectedIds.includes(p.id);
                return (
                  <TouchableOpacity key={p.id} style={styles.productRow} onPress={() => toggleSelected(p.id)} activeOpacity={0.7}>
                    {selected ? <CheckSquare size={20} color={Colors.primary} /> : <Square size={20} color={Colors.border} />}
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                      <Text style={styles.productPrices}>
                        {formatPrice(p.price, p.sellPriceCurrency ?? baseCurrency)} → {formatPrice(p.newPrice, p.sellPriceCurrency ?? baseCurrency)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnOutline]}
                onPress={handleApplyAll}
                disabled={applying}
              >
                <Text style={styles.actionBtnOutlineText}>Aplicar em todos</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnPrimary, selectedIds.length === 0 && { opacity: 0.5 }]}
                onPress={handleApplySelected}
                disabled={applying || selectedIds.length === 0}
              >
                <Text style={styles.actionBtnPrimaryText}>
                  Aplicar selecionado{selectedIds.length > 1 ? 's' : ''} ({selectedIds.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <UpgradeModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
        title="Recurso exclusivo Pro"
        message={`O reajuste automático de preços é exclusivo dos planos Pro e Business. Você está no plano ${planInfo[plan].label}.`}
        ctaLabel="Ver planos"
        onCta={() => { setUpgradeModalVisible(false); router.push('/(tabs)/more'); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  pageTitle: {
    fontFamily: 'Poppins_700Bold', fontSize: 22, color: Colors.text,
    paddingHorizontal: Layout.spacing.lg, paddingVertical: Layout.spacing.md,
  },
  scroll: { paddingHorizontal: Layout.spacing.lg, paddingBottom: 24 },
  rateCard: {
    borderRadius: Layout.borderRadius.lg, padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg, ...Layout.shadow.button,
  },
  currencyToggle: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Layout.borderRadius.full, padding: 3, alignSelf: 'flex-start', marginBottom: Layout.spacing.md,
  },
  currencyBtn: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: Layout.borderRadius.full },
  currencyBtnActive: { backgroundColor: '#fff' },
  currencyBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  currencyBtnTextActive: { color: Colors.primary },
  rateLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  rateValue: { fontFamily: 'Poppins_900Black', fontSize: 42, color: '#fff', marginTop: 2 },
  rateChangeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  changeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: Layout.borderRadius.full,
  },
  changeBadgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#fff' },
  refreshBtn: {
    width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  updatedText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 10 },
  section: { marginBottom: Layout.spacing.lg },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Layout.spacing.sm },
  sectionTitle: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: Colors.text, flex: 1, marginRight: 8 },
  selectAllText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: Colors.primary },
  periodToggle: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Layout.borderRadius.full, padding: 3, borderWidth: 1, borderColor: Colors.border },
  periodBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: Layout.borderRadius.full },
  periodBtnActive: { backgroundColor: Colors.primary },
  periodBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: Colors.textMuted },
  periodBtnTextActive: { color: '#fff' },
  chartCard: { backgroundColor: Colors.card, borderRadius: Layout.borderRadius.lg, padding: Layout.spacing.md, ...Layout.shadow.card },
  card: { backgroundColor: Colors.card, borderRadius: Layout.borderRadius.lg, padding: Layout.spacing.lg, ...Layout.shadow.card },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sliderLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  cardLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.text, flexShrink: 1 },
  sliderValue: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: Colors.primary },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Layout.spacing.md },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lockedHint: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.warning, marginTop: 8 },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  productInfo: { flex: 1 },
  productName: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.text },
  productPrices: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: Layout.spacing.md },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: Layout.borderRadius.md, alignItems: 'center' },
  actionBtnOutline: { borderWidth: 1.5, borderColor: Colors.primary },
  actionBtnOutlineText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.primary },
  actionBtnPrimary: { backgroundColor: Colors.primary },
  actionBtnPrimaryText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#fff' },
});
