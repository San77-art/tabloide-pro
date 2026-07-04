import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Eye, DollarSign, FileImage, Edit3, Trash2, Archive } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBadge } from '../../components/campaigns/StatusBadge';
import { useCampaigns } from '../../hooks/useCampaigns';
import { useTabloids } from '../../hooks/useTabloids';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { allCampaigns, updateCampaign, deleteCampaign } = useCampaigns();
  const { tabs } = useTabloids();

  const campaign = useMemo(() => allCampaigns.find((c) => c.id === id), [allCampaigns, id]);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [views, setViews] = useState('');
  const [sales, setSales] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!campaign) return;
    setName(campaign.name);
    setDescription(campaign.description);
    setViews(String(campaign.views));
    setSales(String(campaign.sales));
  }, [campaign]);

  if (!campaign) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <ArrowLeft size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Campanha</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const linkedTabs = tabs.filter((t) => campaign.tabloidIds?.includes(t.id));

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Atenção', 'Nome da campanha é obrigatório.'); return; }
    setSaving(true);
    try {
      await updateCampaign(id, {
        name: name.trim(),
        description: description.trim(),
        views: parseInt(views, 10) || 0,
        sales: parseFloat(sales) || 0,
      });
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    Alert.alert('Arquivar campanha', 'Deseja arquivar esta campanha?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Arquivar',
        onPress: async () => {
          try {
            await updateCampaign(id, { status: 'finished' });
            router.back();
          } catch (e: any) {
            Alert.alert('Erro', e.message);
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir campanha',
      'Essa ação é irreversível. A campanha será removida.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            try {
              await deleteCampaign(id);
              router.back();
            } catch (e: any) {
              Alert.alert('Erro', e.message);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {editing ? 'Editar Campanha' : campaign.name}
        </Text>
        <TouchableOpacity onPress={() => setEditing((v) => !v)} style={styles.iconBtn}>
          <Edit3 size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Cabeçalho */}
        <LinearGradient colors={Colors.primaryGradient} style={styles.heroCard}>
          <View style={styles.heroRow}>
            <Text style={styles.heroName} numberOfLines={2}>{campaign.name}</Text>
            <StatusBadge status={campaign.status} />
          </View>
          <Text style={styles.heroDesc} numberOfLines={3}>{campaign.description || 'Sem descrição'}</Text>
        </LinearGradient>

        {/* Métricas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Métricas</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <View style={styles.metricIcon}>
                <Eye size={18} color={Colors.primary} />
              </View>
              {editing ? (
                <TextInput
                  style={styles.metricInput}
                  value={views}
                  onChangeText={setViews}
                  keyboardType="number-pad"
                  placeholder="0"
                />
              ) : (
                <Text style={styles.metricValue}>{campaign.views.toLocaleString('pt-BR')}</Text>
              )}
              <Text style={styles.metricLabel}>Visualizações</Text>
            </View>
            <View style={styles.metricCard}>
              <View style={styles.metricIcon}>
                <DollarSign size={18} color={Colors.success} />
              </View>
              {editing ? (
                <TextInput
                  style={styles.metricInput}
                  value={sales}
                  onChangeText={setSales}
                  keyboardType="decimal-pad"
                  placeholder="0,00"
                />
              ) : (
                <Text style={[styles.metricValue, { color: Colors.success }]}>
                  R$ {campaign.sales.toFixed(2)}
                </Text>
              )}
              <Text style={styles.metricLabel}>Vendas</Text>
            </View>
            <View style={styles.metricCard}>
              <View style={styles.metricIcon}>
                <FileImage size={18} color={Colors.secondary} />
              </View>
              <Text style={styles.metricValue}>{campaign.tabloidIds?.length ?? 0}</Text>
              <Text style={styles.metricLabel}>Tabloides</Text>
            </View>
          </View>
        </View>

        {/* Edição do nome/descrição */}
        {editing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações</Text>
            <View style={styles.editCard}>
              <Text style={styles.fieldLabel}>Nome</Text>
              <TextInput
                style={styles.fieldInput}
                value={name}
                onChangeText={setName}
                placeholder="Nome da campanha"
                placeholderTextColor={Colors.textMuted}
              />
              <Text style={styles.fieldLabel}>Descrição</Text>
              <TextInput
                style={[styles.fieldInput, styles.multiline]}
                value={description}
                onChangeText={setDescription}
                placeholder="Descrição"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Salvar alterações</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Tabloides vinculados */}
        {linkedTabs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tabloides vinculados</Text>
            <View style={styles.tabsCard}>
              {linkedTabs.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={styles.tabRow}
                  onPress={() => router.push(`/editor/${tab.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.tabThumb}>
                    <FileImage size={16} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tabName} numberOfLines={1}>{tab.title}</Text>
                    <Text style={styles.tabMeta}>{tab.products.length} produtos</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Ações perigosas */}
        <View style={styles.section}>
          <View style={styles.dangerCard}>
            {campaign.status !== 'finished' && (
              <TouchableOpacity style={styles.dangerRow} onPress={handleArchive} activeOpacity={0.7}>
                <Archive size={18} color={Colors.warning} />
                <Text style={[styles.dangerText, { color: Colors.warning }]}>Arquivar campanha</Text>
              </TouchableOpacity>
            )}
            <View style={styles.divider} />
            <TouchableOpacity style={styles.dangerRow} onPress={handleDelete} activeOpacity={0.7}>
              <Trash2 size={18} color={Colors.danger} />
              <Text style={[styles.dangerText, { color: Colors.danger }]}>Excluir campanha</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md, paddingVertical: Layout.spacing.sm,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 17, color: Colors.text, flex: 1, textAlign: 'center' },
  scroll: { padding: Layout.spacing.lg },
  heroCard: {
    borderRadius: Layout.borderRadius.lg, padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg, ...Layout.shadow.button,
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  heroName: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: '#fff', flex: 1, marginRight: 8 },
  heroDesc: { fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  section: { marginBottom: Layout.spacing.lg },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold', fontSize: 12, color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Layout.spacing.sm,
  },
  metricsRow: { flexDirection: 'row', gap: 10 },
  metricCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md, alignItems: 'center', ...Layout.shadow.card,
  },
  metricIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: Colors.text },
  metricInput: {
    fontFamily: 'Poppins_700Bold', fontSize: 18, color: Colors.text,
    borderBottomWidth: 1, borderBottomColor: Colors.primary, width: '100%', textAlign: 'center',
  },
  metricLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  editCard: {
    backgroundColor: Colors.card, borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg, ...Layout.shadow.card,
  },
  fieldLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: Colors.textMuted, marginBottom: 6, marginTop: 12 },
  fieldInput: {
    backgroundColor: Colors.background, borderRadius: Layout.borderRadius.sm,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Layout.spacing.md, height: 44,
    fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.text,
  },
  multiline: { height: 80, paddingTop: 10, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: Layout.borderRadius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: Layout.spacing.md,
  },
  saveBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#fff' },
  tabsCard: {
    backgroundColor: Colors.card, borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden', ...Layout.shadow.card,
  },
  tabRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: Layout.spacing.md, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tabThumb: {
    width: 36, height: 36, borderRadius: Layout.borderRadius.sm,
    backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center',
  },
  tabName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.text },
  tabMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textMuted },
  dangerCard: {
    backgroundColor: Colors.card, borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden', ...Layout.shadow.card,
  },
  dangerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: Layout.spacing.md, paddingVertical: 16,
  },
  dangerText: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 52 },
});
