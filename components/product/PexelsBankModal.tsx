import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
  FlatList, ActivityIndicator, Animated, Switch, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { X, Search, Check, Scissors } from 'lucide-react-native';
import { searchPexels, PexelsPhoto } from '../../lib/pexels';
import { removeBackground, checkRemoveBgUsage } from '../../lib/removeBg';
import { UpgradeModal } from '../ui/UpgradeModal';
import { auth } from '../../lib/firebase';
import { PlanId } from '../../types';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

const QUICK_CHIPS: { label: string; query: string }[] = [
  { label: 'Smartphone', query: 'smartphone' },
  { label: 'Perfume', query: 'perfume' },
  { label: 'Alimentos', query: 'food products' },
  { label: 'Bebidas', query: 'beverages' },
  { label: 'Eletrônicos', query: 'electronics' },
  { label: 'Roupas', query: 'clothing' },
  { label: 'Calçados', query: 'shoes' },
  { label: 'Cosméticos', query: 'cosmetics' },
  { label: 'Brinquedos', query: 'toys' },
  { label: 'Limpeza', query: 'cleaning products' },
];

function SkeletonGrid() {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.grid}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Animated.View key={i} style={[styles.photoCard, styles.skeletonBox, { opacity: pulse }]} />
      ))}
    </View>
  );
}

interface PexelsSearchViewProps {
  onSelect: (url: string) => void;
  uploadProductImage: (uri: string) => Promise<string>;
  plan: PlanId;
}

export function PexelsSearchView({ onSelect, uploadProductImage, plan }: PexelsSearchViewProps) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedPhoto, setSelectedPhoto] = useState<PexelsPhoto | null>(null);
  const [removeBgEnabled, setRemoveBgEnabled] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [upgradeVisible, setUpgradeVisible] = useState(false);

  const runSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setSelectedPhoto(null);
    try {
      const result = await searchPexels(q, 1);
      setPhotos(result.photos);
      setHasMore(result.hasMore);
      setPage(1);
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Erro ao buscar imagens');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await searchPexels(query, nextPage);
      setPhotos((prev) => [...prev, ...result.photos]);
      setHasMore(result.hasMore);
      setPage(nextPage);
    } catch {
      // falha ao paginar é não-crítico — mantém os resultados já carregados
    } finally {
      setLoadingMore(false);
    }
  };

  const handleToggleRemoveBg = async (value: boolean) => {
    if (!value) { setRemoveBgEnabled(false); return; }
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const allowed = await checkRemoveBgUsage(uid, plan);
    if (!allowed) { setUpgradeVisible(true); return; }
    setRemoveBgEnabled(true);
  };

  const handleUse = async () => {
    if (!selectedPhoto) return;
    setProcessing(true);
    try {
      let finalUrl = selectedPhoto.url;
      if (removeBgEnabled) {
        const noBgUri = await removeBackground(selectedPhoto.url);
        finalUrl = await uploadProductImage(noBgUri);
      }
      onSelect(finalUrl);
    } catch (e: any) {
      Alert.alert('Erro ao usar foto', e.message ?? 'Não foi possível processar a imagem.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Search size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => runSearch(query)}
          placeholder="Buscar fotos (ex: perfume, smartphone...)"
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
        />
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={QUICK_CHIPS}
        keyExtractor={(item) => item.query}
        contentContainerStyle={styles.chipsRow}
        style={styles.chipsList}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => { setQuery(item.label); runSearch(item.query); }}
            style={[styles.chip, query === item.label && styles.chipActive]}
          >
            <Text style={[styles.chipText, query === item.label && styles.chipTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <SkeletonGrid />
      ) : errorMsg ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>{errorMsg}</Text>
        </View>
      ) : photos.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Digite algo ou toque em uma sugestão para buscar fotos.</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.primary} style={{ marginVertical: 12 }} /> : null}
          renderItem={({ item }) => {
            const isSelected = selectedPhoto?.id === item.id;
            return (
              <TouchableOpacity
                style={[styles.photoCard, isSelected && styles.photoCardSelected]}
                onPress={() => setSelectedPhoto(item)}
                activeOpacity={0.85}
              >
                <Image source={{ uri: item.thumbnailUrl }} style={styles.photoImg} contentFit="cover" />
                <View style={styles.photographerBadge}>
                  <Text style={styles.photographerText} numberOfLines={1}>{item.photographer}</Text>
                </View>
                {isSelected && (
                  <View style={styles.photoCheck}>
                    <Check size={14} color="#fff" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      <Text style={styles.attribution}>Fotos por Pexels</Text>

      {selectedPhoto && (
        <View style={styles.confirmBar}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabelWrapper}>
              <Scissors size={14} color={Colors.textMuted} />
              <Text style={styles.toggleLabel}>Remover fundo ao usar</Text>
            </View>
            <Switch
              value={removeBgEnabled}
              onValueChange={handleToggleRemoveBg}
              trackColor={{ false: Colors.border, true: Colors.secondary }}
              thumbColor={removeBgEnabled ? Colors.primary : '#fff'}
            />
          </View>
          <TouchableOpacity style={styles.useBtn} onPress={handleUse} disabled={processing} activeOpacity={0.85}>
            {processing
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.useBtnText}>Usar esta foto</Text>}
          </TouchableOpacity>
        </View>
      )}

      <UpgradeModal
        visible={upgradeVisible}
        onClose={() => setUpgradeVisible(false)}
        title="Recurso exclusivo Pro"
        message="Remover fundo disponível a partir do plano Pro."
      />
    </View>
  );
}

interface PexelsBankModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  uploadProductImage: (uri: string) => Promise<string>;
  plan: PlanId;
}

export function PexelsBankModal({ visible, onClose, onSelect, uploadProductImage, plan }: PexelsBankModalProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Banco de Imagens</Text>
            <Text style={styles.subtitle}>Milhões de fotos profissionais</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <PexelsSearchView
          onSelect={(url) => { onSelect(url); onClose(); }}
          uploadProductImage={uploadProductImage}
          plan={plan}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background, paddingTop: 50 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg, marginBottom: Layout.spacing.md,
  },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: Colors.text },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  container: { flex: 1 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.card, borderRadius: Layout.borderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Layout.spacing.md, height: 44,
    marginHorizontal: Layout.spacing.lg, marginBottom: Layout.spacing.sm,
  },
  searchInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.text },
  chipsList: { flexGrow: 0, marginBottom: Layout.spacing.sm },
  chipsRow: { paddingHorizontal: Layout.spacing.lg, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: Colors.textMuted },
  chipTextActive: { color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  grid: { paddingHorizontal: Layout.spacing.lg, paddingBottom: 16 },
  row: { gap: 10, marginBottom: 10 },
  photoCard: {
    flex: 1, aspectRatio: 1, backgroundColor: Colors.card, borderRadius: Layout.borderRadius.md,
    overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', ...Layout.shadow.card,
  },
  photoCardSelected: { borderColor: Colors.primary },
  photoImg: { width: '100%', height: '100%' },
  skeletonBox: { backgroundColor: Colors.border },
  photographerBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 6, paddingVertical: 3,
  },
  photographerText: { fontFamily: 'Inter_400Regular', fontSize: 9, color: '#fff' },
  photoCheck: {
    position: 'absolute', top: 6, right: 6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  attribution: {
    fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textMuted,
    textAlign: 'center', paddingVertical: 8,
  },
  confirmBar: {
    padding: Layout.spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.card, gap: 10,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabelWrapper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.text },
  useBtn: {
    backgroundColor: Colors.primary, borderRadius: Layout.borderRadius.md,
    paddingVertical: 14, alignItems: 'center',
  },
  useBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#fff' },
});
