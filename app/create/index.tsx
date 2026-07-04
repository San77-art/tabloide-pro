import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Sparkles, Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import { StepIndicator } from '../../components/ui/StepIndicator';
import { SearchBar } from '../../components/ui/SearchBar';
import { CategoryChip } from '../../components/ui/CategoryChip';
import { ProductListItem } from '../../components/create/ProductListItem';
import { ImageBankTab } from '../../components/create/ImageBankTab';
import { AIModal } from '../../components/create/AIModal';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useProducts } from '../../hooks/useProducts';
import { useMarket } from '../../hooks/useMarket';
import { useTabStore } from '../../stores/useTabStore';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import { Package } from 'lucide-react-native';

const CATEGORIES = ['Todos', 'Alimentos', 'Bebidas', 'Limpeza', 'Higiene'] as const;
type SourceTab = 'mine' | 'bank';

export default function CreateScreen() {
  const { products, allProducts, loading, search, setSearch, category, setCategory } = useProducts();
  const { market } = useMarket();
  const { selectedProducts, toggleProduct, setTitle } = useTabStore();
  const [sourceTab, setSourceTab] = useState<SourceTab>('mine');
  const [aiVisible, setAiVisible] = useState(false);

  const handleNext = () => router.push('/editor/new');

  const handleBankAdd = (product: { id: string; name: string; price: number; imageUrl: string; category: string }) => {
    toggleProduct({
      id: `bank_${product.id}`,
      name: product.name,
      price: product.price,
      category: product.category as any,
      imageUrl: product.imageUrl,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Tab</Text>
        <View style={{ width: 38 }} />
      </View>

      <StepIndicator currentStep={0} />

      <View style={styles.sourceTabs}>
        <TouchableOpacity
          style={[styles.srcTab, sourceTab === 'mine' && styles.srcTabActive]}
          onPress={() => setSourceTab('mine')}
        >
          <Text style={[styles.srcTabText, sourceTab === 'mine' && styles.srcTabTextActive]}>Meus Produtos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.srcTab, sourceTab === 'bank' && styles.srcTabActive]}
          onPress={() => setSourceTab('bank')}
        >
          <Text style={[styles.srcTabText, sourceTab === 'bank' && styles.srcTabTextActive]}>Banco de Imagens</Text>
        </TouchableOpacity>
      </View>

      {sourceTab === 'mine' && (
        <TouchableOpacity style={styles.newProductBtn} onPress={() => router.push('/product/new')} activeOpacity={0.8}>
          <Plus size={16} color={Colors.primary} />
          <Text style={styles.newProductBtnText}>Cadastrar produto com custo em dólar</Text>
        </TouchableOpacity>
      )}

      {sourceTab === 'mine' ? (
        <>
          <View style={styles.searchContainer}>
            <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar produtos..." />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories} style={styles.categoriesScroll}>
            {CATEGORIES.map((cat) => (
              <CategoryChip key={cat} label={cat} active={category === cat} onPress={() => setCategory(cat as any)} />
            ))}
          </ScrollView>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ProductListItem
                  product={{ id: item.id, name: item.name, price: item.price, category: item.category as any, costUSD: item.costUSD }}
                  selected={selectedProducts.some((p) => p.id === item.id)}
                  onToggle={() => toggleProduct({ id: item.id, name: item.name, price: item.price, category: item.category as any })}
                  onEdit={() => router.push(`/product/${item.id}`)}
                />
              )}
              style={styles.list}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                allProducts.length === 0 ? (
                  <EmptyState
                    icon={<Package size={28} color={Colors.primary} />}
                    title="Nenhum produto cadastrado"
                    subtitle="Cadastre seu primeiro produto para começar"
                    actionLabel="Cadastrar primeiro produto"
                    onAction={() => router.push('/product/new')}
                  />
                ) : (
                  <View style={styles.center}>
                    <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
                  </View>
                )
              }
            />
          )}
        </>
      ) : (
        <ImageBankTab onAdd={handleBankAdd} />
      )}

      <View style={styles.footer}>
        {selectedProducts.length > 0 && (
          <Text style={styles.selectionCount}>
            {selectedProducts.length} produto{selectedProducts.length > 1 ? 's' : ''} selecionado{selectedProducts.length > 1 ? 's' : ''}
          </Text>
        )}
        <Button
          label="Próximo passo"
          onPress={handleNext}
          disabled={selectedProducts.length === 0}
          style={styles.nextBtn}
        />
      </View>

      {/* Botão flutuante IA */}
      <TouchableOpacity style={styles.aiButton} onPress={() => setAiVisible(true)} activeOpacity={0.85}>
        <LinearGradient colors={Colors.primaryGradient} style={styles.aiButtonInner}>
          <Sparkles size={22} color="#fff" />
          <Text style={styles.aiButtonText}>IA</Text>
        </LinearGradient>
      </TouchableOpacity>

      <AIModal
        visible={aiVisible}
        onClose={() => setAiVisible(false)}
        marketName={market?.name ?? 'Meu Mercado'}
        onSelectTitle={(t) => { setTitle(t); setAiVisible(false); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md, paddingVertical: Layout.spacing.sm,
  },
  closeBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 17, color: Colors.text },
  sourceTabs: {
    flexDirection: 'row', marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md, backgroundColor: Colors.card,
    borderRadius: Layout.borderRadius.md, padding: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  srcTab: { flex: 1, paddingVertical: 10, borderRadius: Layout.borderRadius.sm, alignItems: 'center' },
  srcTabActive: { backgroundColor: Colors.primary },
  srcTabText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.textMuted },
  srcTabTextActive: { color: '#fff' },
  newProductBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginHorizontal: Layout.spacing.lg, marginBottom: Layout.spacing.md,
    paddingVertical: 10, borderRadius: Layout.borderRadius.md,
    borderWidth: 1, borderColor: Colors.primary, borderStyle: 'dashed',
  },
  newProductBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.primary },
  searchContainer: { paddingHorizontal: Layout.spacing.lg, marginBottom: Layout.spacing.md },
  categoriesScroll: { flexGrow: 0, marginBottom: Layout.spacing.sm },
  categories: { paddingHorizontal: Layout.spacing.lg },
  list: { flex: 1, backgroundColor: Colors.card },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textMuted },
  footer: {
    padding: Layout.spacing.lg, backgroundColor: Colors.card,
    borderTopWidth: 1, borderTopColor: Colors.border, gap: 8,
  },
  selectionCount: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.primary, textAlign: 'center' },
  nextBtn: { width: '100%' },
  aiButton: {
    position: 'absolute', bottom: 100, right: 20,
    borderRadius: 28, ...Layout.shadow.button,
  },
  aiButtonInner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 28,
  },
  aiButtonText: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#fff' },
});
