import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  SafeAreaView,
  Linking,
  AppState,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Check, X } from 'lucide-react-native';
import { PLAN_INFO, PlanInfo } from '../hooks/useSubscription';
import { useSubscription } from '../hooks/useSubscription';
import { useMarket } from '../hooks/useMarket';
import { auth } from '../lib/firebase';
import { BillingCycle, MP_PLANS, createSubscription, formatBRL, getMpPlanKey } from '../lib/mercadopago';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';
import { PlanId } from '../types';

const CONTACT_WHATSAPP = '+55 (XX) XXXXX-XXXX'; // Substitua pelo número real
const CONTACT_EMAIL = 'santiagoribeirodelima@gmail.com';

const PLAN_ORDER: PlanId[] = ['free', 'pro', 'business', 'enterprise'];

function priceInfoFor(planId: PlanId, cycle: BillingCycle): { price: string; badge?: string } {
  if (planId === 'pro' || planId === 'business') {
    const opt = MP_PLANS[getMpPlanKey(planId, cycle)];
    if (cycle === 'yearly' && opt.monthlyEquivalent) {
      return {
        price: `${formatBRL(opt.amount)}/ano (equiv. ${formatBRL(opt.monthlyEquivalent)}/mês)`,
        badge: opt.discountLabel,
      };
    }
    return { price: `${formatBRL(opt.amount)}/mês` };
  }
  return { price: PLAN_INFO[planId].price };
}

async function openWhatsApp(message: string) {
  const encoded = encodeURIComponent(message);
  try {
    const canOpen = await Linking.canOpenURL(`whatsapp://send?text=${encoded}`);
    if (canOpen) {
      await Linking.openURL(`whatsapp://send?text=${encoded}`);
      return;
    }
  } catch {
    // segue para o fallback web
  }
  await Linking.openURL(`https://wa.me/?text=${encoded}`);
}

function PlanCard({
  planId,
  info,
  priceLabel,
  discountBadge,
  isCurrent,
  subscribing,
  onSubscribe,
}: {
  planId: PlanId;
  info: PlanInfo;
  priceLabel: string;
  discountBadge?: string;
  isCurrent: boolean;
  subscribing?: boolean;
  onSubscribe: (planId: PlanId, info: PlanInfo) => void;
}) {
  const isPro = planId === 'pro';
  const isEnterprise = planId === 'enterprise';

  return (
    <View
      style={[
        styles.card,
        isCurrent && styles.cardCurrent,
        isPro && styles.cardPro,
        isEnterprise && styles.cardEnterprise,
      ]}
    >
      {isPro && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>⭐ Mais popular</Text>
        </View>
      )}
      {isEnterprise && (
        <View style={styles.enterpriseBadge}>
          <Text style={styles.enterpriseBadgeText}>🏢 Para grandes redes</Text>
        </View>
      )}

      <View style={[styles.cardHeader, { backgroundColor: isEnterprise ? 'rgba(255,255,255,0.08)' : info.color + '20' }]}>
        <Text style={[styles.planLabel, { color: isEnterprise ? '#fff' : info.color }]}>{info.label}</Text>
        <Text style={[styles.planPrice, isEnterprise && styles.planPriceEnterprise]}>{priceLabel}</Text>
        {discountBadge && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>{discountBadge}</Text>
          </View>
        )}
      </View>

      <View style={styles.featuresList}>
        {info.features.map((feat, i) => (
          <View key={i} style={styles.featureRow}>
            <Check size={14} color={isEnterprise ? '#fff' : Colors.success} />
            <Text style={[styles.featureText, isEnterprise && styles.featureTextEnterprise]}>{feat}</Text>
          </View>
        ))}
      </View>

      {isCurrent ? (
        <View style={styles.currentBadge}>
          <Text style={styles.currentBadgeText}>✅ Plano atual</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.subscribeBtn, { backgroundColor: isEnterprise ? '#fff' : info.color }]}
          onPress={() => onSubscribe(planId, info)}
          activeOpacity={0.85}
          disabled={subscribing}
        >
          {subscribing ? (
            <ActivityIndicator color={isEnterprise ? Colors.text : '#fff'} />
          ) : (
            <Text style={[styles.subscribeBtnText, isEnterprise && styles.subscribeBtnTextEnterprise]}>
              {isEnterprise ? 'Fale com nossa equipe' : 'Assinar agora'}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function UpgradeScreen() {
  const { plan: currentPlan } = useSubscription();
  const { market } = useMarket();
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ id: PlanId; info: PlanInfo } | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [subscribingKey, setSubscribingKey] = useState<string | null>(null);
  const [awaitingPayment, setAwaitingPayment] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && awaitingPayment) {
        setAwaitingPayment(false);
        Alert.alert(
          'Pagamento em processamento',
          'Seu plano será ativado em até 5 minutos, assim que confirmarmos o pagamento com o Mercado Pago.',
        );
      }
    });
    return () => subscription.remove();
  }, [awaitingPayment]);

  const handleRealSubscribe = async (planId: 'pro' | 'business') => {
    const user = auth.currentUser;
    if (!user?.email) {
      Alert.alert('Erro', 'Você precisa estar logado com um e-mail válido para assinar.');
      return;
    }
    const planKey = getMpPlanKey(planId, cycle);
    setSubscribingKey(planKey);
    try {
      const { initPoint } = await createSubscription(user.uid, planKey, user.email);
      setAwaitingPayment(true);
      await Linking.openURL(initPoint);
    } catch (e: any) {
      Alert.alert('Erro ao iniciar assinatura', e.message ?? 'Tente novamente em instantes.');
    } finally {
      setSubscribingKey(null);
    }
  };

  const handleEnterpriseContact = () => {
    const marketName = market?.name ?? 'minha rede';
    Alert.alert(
      'Plano Enterprise',
      'Como você prefere falar com a gente?',
      [
        {
          text: 'WhatsApp',
          onPress: () => openWhatsApp(`Olá! Sou do ${marketName} e tenho interesse no plano Enterprise do Tab.`),
        },
        {
          text: 'Email',
          onPress: () => Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Interesse no plano Enterprise - Tab')}`),
        },
        { text: 'Cancelar', style: 'cancel' },
      ],
    );
  };

  const handleSubscribe = (planId: PlanId, info: PlanInfo) => {
    if (planId === 'enterprise') {
      handleEnterpriseContact();
      return;
    }
    if (planId === 'pro' || planId === 'business') {
      handleRealSubscribe(planId);
      return;
    }
    setSelectedPlan({ id: planId, info });
    setContactModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={Colors.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Escolha seu plano</Text>
          <Text style={styles.headerSubtitle}>Cresça mais com o Tab</Text>
        </View>
        <View style={{ width: 38 }} />
      </LinearGradient>

      {/* Toggle Mensal / Anual */}
      <View style={styles.cycleToggle}>
        <TouchableOpacity
          style={[styles.cycleBtn, cycle === 'monthly' && styles.cycleBtnActive]}
          onPress={() => setCycle('monthly')}
          activeOpacity={0.8}
        >
          <Text style={[styles.cycleBtnText, cycle === 'monthly' && styles.cycleBtnTextActive]}>Mensal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cycleBtn, cycle === 'yearly' && styles.cycleBtnActive]}
          onPress={() => setCycle('yearly')}
          activeOpacity={0.8}
        >
          <Text style={[styles.cycleBtnText, cycle === 'yearly' && styles.cycleBtnTextActive]}>Anual</Text>
        </TouchableOpacity>
      </View>

      {/* Plans */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.plansScroll}
        style={styles.scroll}
      >
        {PLAN_ORDER.map((planId) => {
          const { price, badge } = priceInfoFor(planId, cycle);
          const planKey = planId === 'pro' || planId === 'business' ? getMpPlanKey(planId, cycle) : null;
          return (
            <PlanCard
              key={planId}
              planId={planId}
              info={PLAN_INFO[planId]}
              priceLabel={price}
              discountBadge={badge}
              isCurrent={planId === currentPlan}
              subscribing={planKey !== null && subscribingKey === planKey}
              onSubscribe={handleSubscribe}
            />
          );
        })}
      </ScrollView>

      {/* Comparison note */}
      <Text style={styles.note}>
        Os planos pagos garantem mais tabloides, banco de imagens ampliado e sem marca d'água.
      </Text>

      {/* Contact modal */}
      <Modal
        visible={contactModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setContactModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setContactModalVisible(false)}
            >
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>
              Assinar plano {selectedPlan?.info.label}
            </Text>
            <Text style={styles.modalPrice}>{selectedPlan?.info.price}</Text>

            <Text style={styles.modalBody}>
              Para assinar, entre em contato informando seu e-mail de cadastro:
            </Text>

            <View style={styles.modalContact}>
              <Text style={styles.modalContactLabel}>📱 WhatsApp</Text>
              <Text style={styles.modalContactValue}>{CONTACT_WHATSAPP}</Text>
            </View>

            <View style={styles.modalContact}>
              <Text style={styles.modalContactLabel}>📧 E-mail</Text>
              <Text style={styles.modalContactValue}>{CONTACT_EMAIL}</Text>
            </View>

            <Text style={styles.modalNote}>
              Ativação manual em até 24 horas após confirmação do pagamento.
            </Text>

            <TouchableOpacity
              style={styles.modalOkBtn}
              onPress={() => setContactModalVisible(false)}
            >
              <LinearGradient
                colors={Colors.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalOkBtnInner}
              >
                <Text style={styles.modalOkBtnText}>Entendido</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: 18,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 20,
    color: '#fff',
  },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  cycleToggle: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    padding: 4,
    marginTop: Layout.spacing.md,
    gap: 4,
  },
  cycleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: Layout.borderRadius.md - 2,
  },
  cycleBtnActive: {
    backgroundColor: Colors.primary,
  },
  cycleBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.textMuted,
  },
  cycleBtnTextActive: {
    color: '#fff',
  },
  scroll: { flex: 1 },
  plansScroll: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.lg,
    gap: 12,
    alignItems: 'flex-start',
  },
  card: {
    width: 260,
    backgroundColor: Colors.card,
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.border,
    ...Layout.shadow.button,
  },
  cardCurrent: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  cardPro: {
    borderColor: '#2563EB',
  },
  cardEnterprise: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  popularBadge: {
    backgroundColor: Colors.warning,
    paddingVertical: 6,
    alignItems: 'center',
  },
  popularText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    color: Colors.text,
  },
  enterpriseBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 6,
    alignItems: 'center',
  },
  enterpriseBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    color: '#fff',
  },
  cardHeader: {
    padding: 16,
    alignItems: 'center',
  },
  planLabel: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 22,
    marginBottom: 4,
  },
  planPrice: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.text,
  },
  planPriceEnterprise: {
    color: 'rgba(255,255,255,0.85)',
  },
  discountBadge: {
    marginTop: 6,
    backgroundColor: Colors.success,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  discountBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    color: '#fff',
  },
  featuresList: {
    padding: 16,
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  featureText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.text,
    flex: 1,
    lineHeight: 18,
  },
  featureTextEnterprise: {
    color: 'rgba(255,255,255,0.85)',
  },
  subscribeBtn: {
    margin: 16,
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
  },
  subscribeBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#fff',
  },
  subscribeBtnTextEnterprise: {
    color: '#0F172A',
  },
  currentBadge: {
    margin: 16,
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  currentBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.textMuted,
  },
  note: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.lg,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalClose: {
    alignSelf: 'flex-end',
    padding: 4,
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 20,
    color: Colors.text,
    marginBottom: 4,
  },
  modalPrice: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.primary,
    marginBottom: 16,
  },
  modalBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.text,
    marginBottom: 16,
    lineHeight: 20,
  },
  modalContact: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    padding: 14,
    marginBottom: 10,
  },
  modalContactLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  modalContactValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: Colors.text,
  },
  modalNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 17,
  },
  modalOkBtn: {
    borderRadius: Layout.borderRadius.md,
    overflow: 'hidden',
  },
  modalOkBtnInner: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalOkBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: '#fff',
  },
});
