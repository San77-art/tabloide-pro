import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import {
  Settings, HelpCircle, LogOut, ChevronRight,
  Camera, Edit3, Trash2, Crown, CheckCircle, FileText, Shield,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useMarket } from '../../hooks/useMarket';
import { useSubscription } from '../../hooks/useSubscription';
import { UpgradeModal } from '../../components/ui/UpgradeModal';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import { PlanId } from '../../types';

const PLAN_ORDER: PlanId[] = ['free', 'pro', 'business'];

function PlanBadge({ plan, label }: { plan: PlanId; label: string }) {
  return (
    <View style={[styles.planBadge, plan !== 'free' && styles.planBadgePro]}>
      {plan !== 'free' && <Crown size={12} color="#fff" />}
      <Text style={[styles.planText, plan !== 'free' && styles.planTextPro]}>{label}</Text>
    </View>
  );
}

function EditNameModal({
  visible, current, onSave, onClose,
}: { visible: boolean; current: string; onSave: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState(current);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.editModal}>
          <Text style={styles.editModalTitle}>Editar nome do mercado</Text>
          <TextInput
            style={styles.editInput}
            value={name}
            onChangeText={setName}
            maxLength={50}
            autoFocus
            placeholder="Nome do mercado"
            placeholderTextColor={Colors.textMuted}
          />
          <View style={styles.editModalRow}>
            <TouchableOpacity onPress={onClose} style={styles.editCancel}>
              <Text style={styles.editCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onSave(name)} style={styles.editSave}>
              <Text style={styles.editSaveText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function MoreScreen() {
  const { user, logout, deleteAccount } = useAuth();
  const { market, updateMarket, uploadLogo, loading } = useMarket();
  const { plan, productCount, productLimit, planInfo } = useSubscription();
  const [editingName, setEditingName] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);

  const handlePickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permissão necessária', 'Permita acesso à galeria.'); return; }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    setUploadingLogo(true);
    try {
      await uploadLogo(result.assets[0].uri);
      Alert.alert('Sucesso', 'Logo atualizado!');
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveName = async (name: string) => {
    try {
      await updateMarket({ name });
      setEditingName(false);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir conta',
      'Essa ação é irreversível. Todos os seus dados serão apagados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            try { await deleteAccount(); } catch (e: any) { Alert.alert('Erro', e.message); }
          },
        },
      ],
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.pageTitle}>Perfil</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar + nome */}
        <LinearGradient colors={Colors.primaryGradient} style={styles.profileCard}>
          <TouchableOpacity onPress={handlePickLogo} style={styles.avatarWrapper} activeOpacity={0.85}>
            {market?.logoUrl ? (
              <Image source={{ uri: market.logoUrl }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {(market?.name ?? user?.email ?? 'M').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              {uploadingLogo ? <ActivityIndicator color={Colors.primary} size="small" /> : <Camera size={14} color={Colors.primary} />}
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.marketName} numberOfLines={1}>{market?.name ?? 'Meu Mercado'}</Text>
              <TouchableOpacity onPress={() => setEditingName(true)}>
                <Edit3 size={16} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>
            <Text style={styles.emailText} numberOfLines={1}>{user?.email}</Text>
            <PlanBadge plan={plan} label={planInfo[plan].label} />
          </View>
        </LinearGradient>

        {/* Upgrade */}
        {plan !== 'business' && plan !== 'enterprise' && (
          <TouchableOpacity style={styles.upgradeCard} activeOpacity={0.85} onPress={() => setUpgradeModalVisible(true)}>
            <LinearGradient colors={['#FDCB6E', '#E17055']} style={styles.upgradeGradient}>
              <Crown size={22} color="#fff" />
              <View style={{ flex: 1 }}>
                <Text style={styles.upgradeTitle}>Fazer upgrade</Text>
                <Text style={styles.upgradeSub}>Mais produtos, alertas e reajuste automático de dólar</Text>
              </View>
              <ChevronRight size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Meu Plano */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meu Plano</Text>

          <LinearGradient colors={Colors.primaryGradient} style={styles.planCard}>
            <View style={styles.planCardHeader}>
              <Crown size={18} color="#fff" />
              <Text style={styles.planCardTitle}>Plano {planInfo[plan].label}</Text>
              <Text style={styles.planCardPrice}>{planInfo[plan].price}</Text>
            </View>
            {planInfo[plan].features.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <CheckCircle size={13} color="rgba(255,255,255,0.9)" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </LinearGradient>

          <View style={styles.usageCard}>
            <Text style={styles.usageLabel}>
              {productCount}/{Number.isFinite(productLimit) ? productLimit : '∞'} produtos cadastrados
            </Text>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, (productCount / (Number.isFinite(productLimit) ? productLimit : Math.max(productCount, 1))) * 100)}%` },
                ]}
              />
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.plansRow}>
            {PLAN_ORDER.map((p) => {
              const isCurrent = p === plan;
              return (
                <View key={p} style={[styles.planCompareCard, isCurrent && styles.planCompareCardActive]}>
                  <Text style={styles.planCompareLabel}>{planInfo[p].label}</Text>
                  <Text style={styles.planComparePrice}>{planInfo[p].price}</Text>
                  {planInfo[p].features.map((feature) => (
                    <Text key={feature} style={styles.planCompareFeature} numberOfLines={2}>• {feature}</Text>
                  ))}
                  <TouchableOpacity
                    disabled={isCurrent}
                    onPress={() => setUpgradeModalVisible(true)}
                    style={[styles.planCompareBtn, isCurrent && styles.planCompareBtnDisabled]}
                  >
                    <Text style={[styles.planCompareBtnText, isCurrent && styles.planCompareBtnTextDisabled]}>
                      {isCurrent ? 'Plano atual' : 'Fazer upgrade'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Conta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>
          <View style={styles.menuCard}>
            <MenuItem icon={<Settings size={18} color={Colors.primary} />} label="Configurações" />
            <View style={styles.divider} />
            <MenuItem icon={<HelpCircle size={18} color={Colors.textMuted} />} label="Ajuda e suporte" />
          </View>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={<FileText size={18} color={Colors.textMuted} />}
              label="Termos de Uso"
              onPress={() => router.push('/legal/terms')}
            />
            <View style={styles.divider} />
            <MenuItem
              icon={<Shield size={18} color={Colors.textMuted} />}
              label="Política de Privacidade"
              onPress={() => router.push('/legal/privacy')}
            />
          </View>
        </View>

        {/* Perigo */}
        <View style={styles.section}>
          <View style={styles.menuCard}>
            <TouchableOpacity onPress={() => logout()} style={styles.menuItem}>
              <View style={[styles.menuIcon, styles.menuIconDanger]}>
                <LogOut size={18} color={Colors.danger} />
              </View>
              <Text style={[styles.menuLabel, { color: Colors.danger }]}>Sair da conta</Text>
              <ChevronRight size={18} color={Colors.textMuted} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity onPress={handleDeleteAccount} style={styles.menuItem}>
              <View style={[styles.menuIcon, styles.menuIconDanger]}>
                <Trash2 size={18} color={Colors.danger} />
              </View>
              <Text style={[styles.menuLabel, { color: Colors.danger }]}>Excluir conta</Text>
              <ChevronRight size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <EditNameModal
        visible={editingName}
        current={market?.name ?? ''}
        onSave={handleSaveName}
        onClose={() => setEditingName(false)}
      />

      <UpgradeModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
        title="Em breve!"
        message="Pagamento via PIX e cartão chegando na próxima atualização."
      />
    </SafeAreaView>
  );
}

function MenuItem({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.menuItem} activeOpacity={0.7}>
      <View style={styles.menuIcon}>{icon}</View>
      <Text style={styles.menuLabel}>{label}</Text>
      <ChevronRight size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pageTitle: {
    fontFamily: 'Poppins_700Bold', fontSize: 22, color: Colors.text,
    paddingHorizontal: Layout.spacing.lg, paddingVertical: Layout.spacing.md,
  },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginHorizontal: Layout.spacing.lg, marginBottom: Layout.spacing.lg,
    padding: Layout.spacing.lg, borderRadius: Layout.borderRadius.lg,
    ...Layout.shadow.button,
  },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  avatarPlaceholder: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontFamily: 'Poppins_700Bold', fontSize: 26, color: '#fff' },
  cameraIcon: {
    position: 'absolute', bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  profileInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  marketName: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#fff', flex: 1 },
  emailText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  planBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)',
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  planBadgePro: { backgroundColor: Colors.warning },
  planText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: 'rgba(255,255,255,0.9)' },
  planTextPro: { color: '#fff' },
  upgradeCard: { marginHorizontal: Layout.spacing.lg, marginBottom: Layout.spacing.lg, borderRadius: Layout.borderRadius.lg, overflow: 'hidden' },
  upgradeGradient: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: Layout.spacing.md,
  },
  upgradeTitle: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: '#fff' },
  upgradeSub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  section: { marginHorizontal: Layout.spacing.lg, marginBottom: Layout.spacing.lg },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold', fontSize: 12, color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Layout.spacing.sm,
  },
  planCard: {
    borderRadius: Layout.borderRadius.lg, padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.md, ...Layout.shadow.button,
  },
  planCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Layout.spacing.sm },
  planCardTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#fff', flex: 1 },
  planCardPrice: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  featureText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.9)', flex: 1 },
  usageCard: {
    backgroundColor: Colors.card, borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md, ...Layout.shadow.card, marginBottom: Layout.spacing.md,
  },
  usageLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.text, marginBottom: 8 },
  progressBarBg: { height: 8, borderRadius: 4, backgroundColor: Colors.background, overflow: 'hidden' },
  progressBarFill: { height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  plansRow: { gap: 12, paddingRight: 4 },
  planCompareCard: {
    width: 180, backgroundColor: Colors.card, borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md, borderWidth: 1.5, borderColor: Colors.border, ...Layout.shadow.card,
  },
  planCompareCardActive: { borderColor: Colors.primary },
  planCompareLabel: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: Colors.text },
  planComparePrice: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: Colors.primary, marginBottom: 8 },
  planCompareFeature: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textMuted, lineHeight: 16, marginBottom: 2 },
  planCompareBtn: {
    marginTop: 10, paddingVertical: 9, borderRadius: Layout.borderRadius.sm,
    alignItems: 'center', backgroundColor: Colors.primary,
  },
  planCompareBtnDisabled: { backgroundColor: Colors.background },
  planCompareBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#fff' },
  planCompareBtnTextDisabled: { color: Colors.textMuted },
  menuCard: { backgroundColor: Colors.card, borderRadius: Layout.borderRadius.lg, ...Layout.shadow.card, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Layout.spacing.md, paddingVertical: 14, gap: 14 },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  menuIconDanger: { backgroundColor: Colors.danger + '15' },
  menuLabel: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 15, color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 64 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  editModal: {
    width: '85%', backgroundColor: Colors.card,
    borderRadius: Layout.borderRadius.xl, padding: Layout.spacing['2xl'],
    ...Layout.shadow.button,
  },
  editModalTitle: { fontFamily: 'Poppins_700Bold', fontSize: 17, color: Colors.text, marginBottom: Layout.spacing.lg },
  editInput: {
    borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: Layout.borderRadius.md, padding: Layout.spacing.md,
    fontFamily: 'Inter_400Regular', fontSize: 16, color: Colors.text,
    marginBottom: Layout.spacing.lg,
  },
  editModalRow: { flexDirection: 'row', gap: 12 },
  editCancel: { flex: 1, padding: 12, borderRadius: Layout.borderRadius.md, alignItems: 'center', backgroundColor: Colors.background },
  editCancelText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.textMuted },
  editSave: { flex: 1, padding: 12, borderRadius: Layout.borderRadius.md, alignItems: 'center', backgroundColor: Colors.primary },
  editSaveText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#fff' },
});
