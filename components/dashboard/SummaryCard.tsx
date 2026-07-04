import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

interface MetricItemProps {
  label: string;
  value: string;
}

function MetricItem({ label, value }: MetricItemProps) {
  return (
    <View style={styles.metricItem}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

interface SummaryCardProps {
  tabsCount: number;
  campaignsCount: number;
  productsCount: number;
}

const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

export function SummaryCard({ tabsCount, campaignsCount, productsCount }: SummaryCardProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
    translateY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const now = new Date();
  const periodLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <Animated.View style={animStyle}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.cardTitle}>Resumo do Mês</Text>
          <View style={styles.periodBadge}>
            <Text style={styles.periodText}>{periodLabel}</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <MetricItem label="Tabs" value={String(tabsCount)} />
          <View style={styles.divider} />
          <MetricItem label="Campanhas" value={String(campaignsCount)} />
          <View style={styles.divider} />
          <MetricItem label="Produtos" value={String(productsCount)} />
        </View>

        <LinearGradient
          colors={Colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.salesCard}
        >
          <Text style={styles.salesLabel}>Vendas Geradas</Text>
          <Text style={styles.salesValue}>R$ 0,00</Text>
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: Layout.spacing.lg,
    marginHorizontal: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.12)',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  cardTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: Colors.text,
  },
  periodBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.textMuted,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.lg,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: Colors.text,
    lineHeight: 30,
  },
  divider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  salesCard: {
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  salesLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  salesValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: '#fff',
    marginVertical: 2,
  },
});
