import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { Plus, Search } from 'lucide-react-native';
import { useProducts, PublicProduct } from '../../hooks/useProducts';
import { formatCurrency } from '../../utils/formatCurrency';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

function PriceEditModal({
  product,
  onConfirm,
  onClose,
}: {
  product: PublicProduct | null;
  onConfirm: (price: number) => void;
  onClose: () => void;
}) {
  const [price, setPrice] = useState(product?.price.toString() ?? '');
  if (!product) return null;
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Image source={{ uri: product.imageUrl }} style={styles.modalImage} contentFit="cover" />
          <Text style={styles.modalName}>{product.name}</Text>
          <Text style={styles.modalLabel}>Editar preço de oferta</Text>
          <TextInput
            style={styles.priceInput}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="0,00"
            placeholderTextColor={Colors.textMuted}
          />
          <View style={styles.modalRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onConfirm(parseFloat(price.replace(',', '.')))}
              style={styles.confirmBtn}
            >
              <Text style={styles.confirmText}>Adicionar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface ImageBankTabProps {
  onAdd: (product: { id: string; name: string; price: number; imageUrl: string; category: string }) => void;
}

export function ImageBankTab({ onAdd }: ImageBankTabProps) {
  const { publicProducts, loadPublicProducts } = useProducts();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<PublicProduct | null>(null);

  useEffect(() => {
    setLoading(true);
    loadPublicProducts().finally(() => setLoading(false));
  }, []);

  const filtered = publicProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAdd = (price: number) => {
    if (!editing) return;
    onAdd({ ...editing, price });
    setEditing(null);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando banco de imagens...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setEditing(item)} activeOpacity={0.85}>
            <Image source={{ uri: item.imageUrl }} style={styles.img} contentFit="cover" />
            <View style={styles.cardInfo}>
              <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.cardPrice}>{formatCurrency(item.price)}</Text>
            </View>
            <View style={styles.addIcon}>
              <Plus size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        )}
      />

      <PriceEditModal product={editing} onConfirm={handleAdd} onClose={() => setEditing(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textMuted },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.card, borderRadius: Layout.borderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Layout.spacing.md, height: 44,
    marginHorizontal: Layout.spacing.lg, marginBottom: Layout.spacing.md,
  },
  searchInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.text },
  grid: { paddingHorizontal: Layout.spacing.lg, paddingBottom: 24 },
  row: { gap: 12, marginBottom: 12 },
  card: {
    flex: 1, backgroundColor: Colors.card,
    borderRadius: Layout.borderRadius.md, overflow: 'hidden',
    ...Layout.shadow.card,
  },
  img: { width: '100%', height: 110 },
  cardInfo: { padding: 10 },
  cardName: { fontFamily: 'Inter_500Medium', fontSize: 12, color: Colors.text, lineHeight: 16 },
  cardPrice: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: Colors.primary, marginTop: 4 },
  addIcon: {
    position: 'absolute', bottom: 8, right: 8,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  modal: {
    width: '80%', backgroundColor: Colors.card,
    borderRadius: Layout.borderRadius.xl, overflow: 'hidden',
    ...Layout.shadow.button,
  },
  modalImage: { width: '100%', height: 160 },
  modalName: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: Colors.text, padding: 16, paddingBottom: 4 },
  modalLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textMuted, paddingHorizontal: 16 },
  priceInput: {
    margin: 16, borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: Layout.borderRadius.md, padding: 12,
    fontFamily: 'Poppins_700Bold', fontSize: 22, color: Colors.primary,
  },
  modalRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.border },
  cancelBtn: { flex: 1, padding: 16, alignItems: 'center' },
  cancelText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: Colors.textMuted },
  confirmBtn: { flex: 1, padding: 16, alignItems: 'center', backgroundColor: Colors.primary },
  confirmText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#fff' },
});
