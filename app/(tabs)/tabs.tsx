import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, FileImage } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTabloids, FirestoreTab } from '../../hooks/useTabloids';
import { formatDate } from '../../utils/formatDate';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import { EmptyState } from '../../components/ui/EmptyState';

type StatusFilter = 'all' | 'draft' | 'published';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'draft', label: 'Rascunho' },
  { key: 'published', label: 'Publicado' },
];

const TYPE_LABELS: Record<FirestoreTab['type'], string> = {
  weekly: 'Semanal',
  monthly: 'Mensal',
  special: 'Especial',
};

function tabCreatedAtLabel(value: unknown): string {
  if (value && typeof value === 'object' && 'toDate' in value) {
    return formatDate((value as { toDate: () => Date }).toDate());
  }
  return '—';
}

export default function TabsScreen() {
  const { tabs, loading, deleteTab, duplicateTab } = useTabloids();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = tabs.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'draft') return t.status === 'draft';
    if (filter === 'published') return t.status === 'published';
    return true;
  });

  const handleLongPress = (tab: FirestoreTab) => {
    Alert.alert(tab.title, 'O que deseja fazer?', [
      {
        text: 'Editar',
        onPress: () => router.push(`/editor/${tab.id}`),
      },
      {
        text: 'Duplicar',
        onPress: async () => {
          setActionLoading(tab.id);
          try {
            await duplicateTab(tab.id);
            Alert.alert('Duplicado!', 'Tabloide duplicado com sucesso.');
          } catch (e: any) {
            Alert.alert('Erro', e.message);
          } finally {
            setActionLoading(null);
          }
        },
      },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Excluir tabloide',
            `"${tab.title}" será excluído permanentemente.`,
            [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Excluir',
                style: 'destructive',
                onPress: async () => {
                  setActionLoading(tab.id);
                  try {
                    await deleteTab(tab.id);
                  } catch (e: any) {
                    Alert.alert('Erro', e.message);
                  } finally {
                    setActionLoading(null);
                  }
                },
              },
            ],
          );
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Tabs</Text>
        <TouchableOpacity onPress={() => router.push('/create')} style={styles.addBtn}>
          <Plus size={18} color="#fff" />
          <Text style={styles.addBtnText}>Novo</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      <View style={styles.filtersRow}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileImage size={28} color={Colors.primary} />}
          title={filter === 'all' ? 'Nenhum tabloide criado ainda' : `Nenhum tabloide ${STATUS_FILTERS.find((f) => f.key === filter)?.label.toLowerCase()}`}
          subtitle="Crie seu primeiro tabloide para divulgar suas ofertas"
          actionLabel="Criar tabloide"
          onAction={() => router.push('/create')}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {filtered.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={styles.card}
              onPress={() => router.push(`/editor/${tab.id}`)}
              onLongPress={() => handleLongPress(tab)}
              activeOpacity={0.85}
              delayLongPress={500}
            >
              {actionLoading === tab.id && (
                <View style={styles.cardOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
              <LinearGradient colors={['#1A0A4D', Colors.primary]} style={styles.thumbnail}>
                <FileImage size={28} color="rgba(255,255,255,0.7)" />
                <Text style={styles.thumbnailTitle} numberOfLines={2}>{tab.title}</Text>
              </LinearGradient>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>{tab.title}</Text>
                <View style={styles.cardMeta}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeText}>{TYPE_LABELS[tab.type]}</Text>
                  </View>
                  <Text style={styles.metaText}>{tab.products.length} produtos</Text>
                  <View style={[styles.statusDot, { backgroundColor: tab.status === 'published' ? Colors.success : Colors.warning }]} />
                  <Text style={styles.metaText}>{tab.status === 'published' ? 'Publicado' : 'Rascunho'}</Text>
                </View>
                <Text style={styles.dateText}>Criado em {tabCreatedAtLabel(tab.createdAt)}</Text>
                <Text style={styles.longPressHint}>Pressione e segure para mais opções</Text>
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg, paddingVertical: Layout.spacing.md,
  },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: Colors.text },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: Layout.borderRadius.full,
  },
  addBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#fff' },
  filtersRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: Layout.spacing.lg, marginBottom: Layout.spacing.md,
  },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.textMuted },
  filterChipTextActive: { color: '#fff' },
  list: { paddingHorizontal: Layout.spacing.lg, paddingTop: 8, gap: 16 },
  card: {
    backgroundColor: Colors.card, borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden', ...Layout.shadow.card, position: 'relative',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 10, alignItems: 'center', justifyContent: 'center',
  },
  thumbnail: { height: 140, alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8 },
  thumbnailTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#fff', textAlign: 'center' },
  cardInfo: { padding: Layout.spacing.md },
  cardTitle: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: Colors.text, marginBottom: 6 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  typeBadge: { backgroundColor: Colors.primary + '20', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  typeText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: Colors.primary },
  metaText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textMuted },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  dateText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textMuted },
  longPressHint: { fontFamily: 'Inter_400Regular', fontSize: 10, color: Colors.textLight, marginTop: 4 },
});
