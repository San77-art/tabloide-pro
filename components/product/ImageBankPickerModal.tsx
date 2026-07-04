import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal, View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Switch, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { X, Search, Lock, Scissors } from 'lucide-react-native';
import { useProducts, PublicProduct } from '../../hooks/useProducts';
import { useSubscription } from '../../hooks/useSubscription';
import { removeBackground, checkRemoveBgUsage } from '../../lib/removeBg';
import { auth } from '../../lib/firebase';
import { UpgradeModal } from '../ui/UpgradeModal';
import { PexelsSearchView } from './PexelsBankModal';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

type BankTab = 'tab' | 'pexels';

interface SelectedImage { name?: string; category?: string; imageUrl: string }

interface ImageBankPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (product: SelectedImage) => void;
}

export function ImageBankPickerModal({ visible, onClose, onSelect }: ImageBankPickerModalProps) {
  const { publicProducts, loadPublicProducts, uploadProductImage } = useProducts();
  const { plan, imageBankLimit, planInfo } = useSubscription();
  const [activeTab, setActiveTab] = useState<BankTab>('tab');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');

  const [selectedProduct, setSelectedProduct] = useState<PublicProduct | null>(null);
  const [removeBgEnabled, setRemoveBgEnabled] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [removeBgUpgradeVisible, setRemoveBgUpgradeVisible] = useState(false);
  const [lockUpgradeVisible, setLockUpgradeVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    loadPublicProducts().finally(() => setLoading(false));
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setSelectedProduct(null);
      setRemoveBgEnabled(false);
      setActiveTab('tab');
    }
  }, [visible]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(publicProducts.map((p) => p.category)));
    return ['Todos', ...unique];
  }, [publicProducts]);

  const filtered = publicProducts.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'Todos' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  const handleToggleRemoveBg = async (value: boolean) => {
    if (!value) { setRemoveBgEnabled(false); return; }
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const allowed = await checkRemoveBgUsage(uid, plan);
    if (!allowed) { setRemoveBgUpgradeVisible(true); return; }
    setRemoveBgEnabled(true);
  };

  const handleUseSelected = async () => {
    if (!selectedProduct) return;
    setProcessing(true);
    try {
      let finalUrl = selectedProduct.imageUrl;
      if (removeBgEnabled) {
        const noBgUri = await removeBackground(selectedProduct.imageUrl);
        finalUrl = await uploadProductImage(noBgUri);
      }
      onSelect({ name: selectedProduct.name, category: selectedProduct.category, imageUrl: finalUrl });
    } catch (e: any) {
      Alert.alert('Erro ao usar foto', e.message ?? 'Não foi possível processar a imagem.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Banco de Imagens</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setActiveTab('tab')}
            style={[styles.tab, activeTab === 'tab' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'tab' && styles.tabTextActive]}>Banco Tab</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('pexels')}
            style={[styles.tab, activeTab === 'pexels' && styles.tabActive]}
          >
            <View style={styles.tabIconRow}>
              <Search size={13} color={activeTab === 'pexels' ? '#fff' : Colors.textMuted} />
              <Text style={[styles.tabText, activeTab === 'pexels' && styles.tabTextActive]}>Buscar online</Text>
            </View>
          </TouchableOpacity>
        </View>

        {activeTab === 'pexels' ? (
          <PexelsSearchView
            onSelect={(url) => { onSelect({ imageUrl: url }); onClose(); }}
            uploadProductImage={uploadProductImage}
            plan={plan}
          />
        ) : (
          <>
            <View style={styles.searchBox}>
              <Search size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar produto..."
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.chipsRow}
              style={styles.chipsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setCategory(item)}
                  style={[styles.chip, category === item && styles.chipActive]}
                >
                  <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text>
                </TouchableOpacity>
              )}
            />

            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                numColumns={3}
                contentContainerStyle={styles.grid}
                columnWrapperStyle={styles.row}
                ListEmptyComponent={
                  <View style={styles.center}>
                    <Text style={styles.emptyText}>Nenhuma imagem encontrada</Text>
                  </View>
                }
                renderItem={({ item, index }) => {
                  const locked = Number.isFinite(imageBankLimit) && index >= imageBankLimit;
                  const isSelected = selectedProduct?.id === item.id;
                  return (
                    <TouchableOpacity
                      style={[styles.card, isSelected && styles.cardSelected]}
                      onPress={() => locked ? setLockUpgradeVisible(true) : setSelectedProduct(item)}
                      activeOpacity={0.85}
                    >
                      <Image source={{ uri: item.imageUrl }} style={styles.img} contentFit="cover" />
                      {locked && (
                        <View style={styles.lockOverlay}>
                          <Lock size={18} color="#fff" />
                        </View>
                      )}
                      <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            {selectedProduct && (
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
                <TouchableOpacity style={styles.useBtn} onPress={handleUseSelected} disabled={processing} activeOpacity={0.85}>
                  {processing
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.useBtnText}>Usar esta foto</Text>}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      <UpgradeModal
        visible={removeBgUpgradeVisible}
        onClose={() => setRemoveBgUpgradeVisible(false)}
        title="Recurso exclusivo Pro"
        message="Remover fundo disponível a partir do plano Pro."
      />

      <UpgradeModal
        visible={lockUpgradeVisible}
        onClose={() => setLockUpgradeVisible(false)}
        title="Imagem bloqueada"
        message={`Seu plano ${planInfo[plan].label} libera ${Number.isFinite(imageBankLimit) ? `${imageBankLimit} fotos` : 'todas as fotos'} do banco de imagens. Faça upgrade para desbloquear mais.`}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: 50 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg, marginBottom: Layout.spacing.md,
  },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: Colors.text },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: Layout.spacing.lg, marginBottom: Layout.spacing.sm },
  tab: {
    flex: 1, paddingVertical: 9, borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.card, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: Colors.textMuted },
  tabTextActive: { color: '#fff' },
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
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textMuted },
  grid: { paddingHorizontal: Layout.spacing.lg, paddingBottom: 24 },
  row: { gap: 10, marginBottom: 10 },
  card: {
    flex: 1, backgroundColor: Colors.card, borderRadius: Layout.borderRadius.md,
    overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', ...Layout.shadow.card,
  },
  cardSelected: { borderColor: Colors.primary },
  img: { width: '100%', height: 90 },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject, height: 90,
    backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  cardName: { fontFamily: 'Inter_500Medium', fontSize: 11, color: Colors.text, padding: 6, lineHeight: 14 },
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
