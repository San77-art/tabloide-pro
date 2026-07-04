import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, ImagePlus, Images, Lock, Scissors, Search } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CategoryChip } from '../../components/ui/CategoryChip';
import { Slider } from '../../components/ui/Slider';
import { Button } from '../../components/ui/Button';
import { UpgradeModal } from '../../components/ui/UpgradeModal';
import { ImageBankPickerModal } from '../../components/product/ImageBankPickerModal';
import { PexelsBankModal } from '../../components/product/PexelsBankModal';
import { useProducts } from '../../hooks/useProducts';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import { useSubscription } from '../../hooks/useSubscription';
import { calculateSellPrice } from '../../lib/exchangeRate';
import { removeBackground, checkRemoveBgUsage } from '../../lib/removeBg';
import { auth } from '../../lib/firebase';
import { formatPrice } from '../../utils/formatCurrency';
import { formatRelativeDate } from '../../utils/formatDate';
import { PRODUCT_CATEGORIES } from '../../constants/categories';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const { allProducts, addProduct, updateProduct, uploadProductImage } = useProducts();
  const { currentRate, baseCurrency, lastUpdatedAt, rateError } = useExchangeRate();
  const { limitReached, planInfo, plan } = useSubscription();

  const existing = useMemo(() => allProducts.find((p) => p.id === id), [allProducts, id]);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(PRODUCT_CATEGORIES[0]);
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [costUSD, setCostUSD] = useState('');
  const [marginPercent, setMarginPercent] = useState(30);
  const [manualOverride, setManualOverride] = useState(false);
  const [manualPrice, setManualPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [bankVisible, setBankVisible] = useState(false);
  const [pexelsVisible, setPexelsVisible] = useState(false);
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [bgUpgradeModalVisible, setBgUpgradeModalVisible] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setName(existing.name);
    setCategory(existing.category);
    setImageUrl(existing.imageUrl);
    setCostUSD(existing.costUSD != null ? String(existing.costUSD) : '');
    setMarginPercent(existing.marginPercent ?? 30);
    setManualOverride(!!existing.manualOverride);
    setManualPrice(String(existing.price ?? ''));
  }, [existing]);

  const costUSDNumber = parseFloat(costUSD.replace(',', '.')) || 0;
  const calculatedPrice = currentRate != null ? calculateSellPrice(costUSDNumber, currentRate, marginPercent) : 0;
  const manualPriceNumber = parseFloat(manualPrice.replace(',', '.')) || 0;
  const sellPrice = manualOverride ? manualPriceNumber : calculatedPrice;

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permissão necessária', 'Permita acesso à galeria.'); return; }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    setUploadingImage(true);
    try {
      const url = await uploadProductImage(result.assets[0].uri);
      setImageUrl(url);
    } catch (e: any) {
      Alert.alert('Erro ao enviar imagem', e.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleBankSelect = (product: { name?: string; category?: string; imageUrl: string }) => {
    if (product.name) setName(product.name);
    if (product.category) setCategory(product.category);
    setImageUrl(product.imageUrl);
    setBankVisible(false);
  };

  const handlePexelsSelect = (photoUrl: string) => {
    setImageUrl(photoUrl);
    setPexelsVisible(false);
  };

  const handleRemoveBackground = async () => {
    const uid = auth.currentUser?.uid;
    if (!imageUrl || !uid) return;

    const allowed = await checkRemoveBgUsage(uid, plan);
    if (!allowed) { setBgUpgradeModalVisible(true); return; }

    setRemovingBg(true);
    try {
      const noBgUri = await removeBackground(imageUrl);
      const uploadedUrl = await uploadProductImage(noBgUri);
      setImageUrl(uploadedUrl);
    } catch (e: any) {
      Alert.alert('Erro ao remover fundo', e.message);
    } finally {
      setRemovingBg(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Atenção', 'Informe o nome do produto.'); return; }
    if (!manualOverride && costUSDNumber <= 0) { Alert.alert('Atenção', 'Informe o custo em dólar.'); return; }
    if (isNew && limitReached) { setLimitModalVisible(true); return; }

    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        category,
        imageUrl,
        price: sellPrice,
        costUSD: manualOverride ? (costUSDNumber || undefined) : costUSDNumber,
        marginPercent,
        sellPriceCurrency: baseCurrency,
        manualOverride,
        isActive: true,
      };

      if (isNew) {
        await addProduct(data);
      } else {
        await updateProduct(id, data);
      }
      router.back();
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isNew ? 'Novo Produto' : 'Editar Produto'}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Foto */}
        <View style={styles.photoSection}>
          <View style={styles.photoPreview}>
            {uploadingImage ? (
              <ActivityIndicator color={Colors.primary} />
            ) : imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.photoImage} contentFit="cover" />
            ) : (
              <ImagePlus size={28} color={Colors.textMuted} />
            )}
          </View>
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoBtn} onPress={handlePickImage} activeOpacity={0.8}>
              <ImagePlus size={16} color={Colors.primary} />
              <Text style={styles.photoBtnText}>Enviar foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={() => setBankVisible(true)} activeOpacity={0.8}>
              <Images size={16} color={Colors.primary} />
              <Text style={styles.photoBtnText}>Escolher do banco</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={() => setPexelsVisible(true)} activeOpacity={0.8}>
              <Search size={16} color={Colors.primary} />
              <Text style={styles.photoBtnText}>Buscar online</Text>
            </TouchableOpacity>
            {imageUrl && (
              <TouchableOpacity style={styles.photoBtn} onPress={handleRemoveBackground} disabled={removingBg} activeOpacity={0.8}>
                {removingBg
                  ? <ActivityIndicator color={Colors.primary} size="small" />
                  : <Scissors size={16} color={Colors.primary} />}
                <Text style={styles.photoBtnText}>{removingBg ? 'Removendo fundo...' : 'Remover fundo'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Nome */}
        <Text style={styles.label}>Nome do produto</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ex: Fone de Ouvido Bluetooth"
          placeholderTextColor={Colors.textMuted}
        />

        {/* Categoria */}
        <Text style={styles.label}>Categoria</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll} contentContainerStyle={styles.categoriesRow}>
          {PRODUCT_CATEGORIES.map((cat) => (
            <CategoryChip key={cat} label={cat} active={category === cat} onPress={() => setCategory(cat)} />
          ))}
        </ScrollView>

        {/* Custo USD */}
        <Text style={styles.label}>Custo em dólar</Text>
        <View style={styles.usdInputWrapper}>
          <Text style={styles.usdPrefix}>US$</Text>
          <TextInput
            style={styles.usdInput}
            value={costUSD}
            onChangeText={setCostUSD}
            keyboardType="decimal-pad"
            placeholder="0,00"
            placeholderTextColor={Colors.textMuted}
            editable={!manualOverride}
          />
        </View>

        {/* Margem */}
        <View style={styles.marginHeader}>
          <Text style={styles.label}>Margem de lucro</Text>
          <Text style={styles.marginValue}>{marginPercent}%</Text>
        </View>
        <Slider
          value={marginPercent}
          min={0}
          max={200}
          step={1}
          onChange={setMarginPercent}
        />

        {/* Preço calculado */}
        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>Preço de venda</Text>
          {manualOverride ? (
            <TextInput
              style={styles.priceInput}
              value={manualPrice}
              onChangeText={setManualPrice}
              keyboardType="decimal-pad"
              placeholder="0,00"
              placeholderTextColor="rgba(255,255,255,0.6)"
            />
          ) : (
            <Text style={styles.priceValue}>{formatPrice(sellPrice, baseCurrency)}</Text>
          )}
          <Text style={styles.priceHint}>
            {rateError
              ? 'Cotação indisponível — usando último valor salvo'
              : currentRate != null
                ? `Cotação usada: ${formatPrice(currentRate, baseCurrency)} (${lastUpdatedAt ? formatRelativeDate(lastUpdatedAt) : 'agora'})`
                : 'Buscando cotação...'}
          </Text>
        </View>

        {/* Trava manual */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleLabelWrapper}>
            <Lock size={16} color={Colors.textMuted} />
            <Text style={styles.toggleLabel}>Travar preço manualmente</Text>
          </View>
          <Switch
            value={manualOverride}
            onValueChange={setManualOverride}
            trackColor={{ false: Colors.border, true: Colors.secondary }}
            thumbColor={manualOverride ? Colors.primary : '#fff'}
          />
        </View>
        {manualOverride && (
          <Text style={styles.toggleHint}>
            O preço não será recalculado automaticamente quando o dólar mudar.
          </Text>
        )}

        <Button label={saving ? 'Salvando...' : 'Salvar produto'} onPress={handleSave} disabled={saving} loading={saving} style={styles.saveBtn} />

        <View style={{ height: 32 }} />
      </ScrollView>

      <ImageBankPickerModal
        visible={bankVisible}
        onClose={() => setBankVisible(false)}
        onSelect={handleBankSelect}
      />

      <PexelsBankModal
        visible={pexelsVisible}
        onClose={() => setPexelsVisible(false)}
        onSelect={handlePexelsSelect}
        uploadProductImage={uploadProductImage}
        plan={plan}
      />

      <UpgradeModal
        visible={limitModalVisible}
        onClose={() => setLimitModalVisible(false)}
        title="Limite de produtos atingido"
        message={`Seu plano ${planInfo[plan].label} permite ${Number.isFinite(planInfo[plan].productLimit) ? `até ${planInfo[plan].productLimit} produtos` : 'produtos ilimitados'}. Faça upgrade para cadastrar mais produtos.`}
        ctaLabel="Ver planos"
        onCta={() => { setLimitModalVisible(false); router.push('/(tabs)/more'); }}
      />

      <UpgradeModal
        visible={bgUpgradeModalVisible}
        onClose={() => setBgUpgradeModalVisible(false)}
        title="Recurso exclusivo Pro"
        message="Remover fundo disponível a partir do plano Pro."
        ctaLabel="Ver planos"
        onCta={() => { setBgUpgradeModalVisible(false); router.push('/(tabs)/more'); }}
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
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 17, color: Colors.text },
  scroll: { paddingHorizontal: Layout.spacing.lg, paddingBottom: 24 },
  photoSection: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: Layout.spacing.lg },
  photoPreview: {
    width: 84, height: 84, borderRadius: Layout.borderRadius.lg, overflow: 'hidden',
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  photoImage: { width: '100%', height: '100%' },
  photoButtons: { flex: 1, gap: 8 },
  photoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Layout.borderRadius.md, paddingHorizontal: 12, paddingVertical: 10,
  },
  photoBtnText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.primary },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.text, marginBottom: 8, marginTop: Layout.spacing.md },
  input: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Layout.borderRadius.md, paddingHorizontal: Layout.spacing.md, height: 48,
    fontFamily: 'Inter_400Regular', fontSize: 15, color: Colors.text,
  },
  categoriesScroll: { flexGrow: 0 },
  categoriesRow: { gap: 8, paddingRight: 8 },
  usdInputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Layout.borderRadius.md, paddingHorizontal: Layout.spacing.md, height: 48,
  },
  usdPrefix: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: Colors.primary, marginRight: 8 },
  usdInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15, color: Colors.text },
  marginHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Layout.spacing.md },
  marginValue: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: Colors.primary },
  priceCard: {
    backgroundColor: Colors.primary, borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg, marginTop: Layout.spacing.lg, ...Layout.shadow.button,
  },
  priceLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  priceValue: { fontFamily: 'Poppins_800ExtraBold', fontSize: 30, color: '#fff' },
  priceInput: {
    fontFamily: 'Poppins_800ExtraBold', fontSize: 30, color: '#fff',
    borderBottomWidth: 2, borderBottomColor: 'rgba(255,255,255,0.5)', paddingVertical: 2,
  },
  priceHint: { fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 8 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: Layout.spacing.lg,
  },
  toggleLabelWrapper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.text },
  toggleHint: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 6 },
  saveBtn: { marginTop: Layout.spacing['2xl'] },
});
