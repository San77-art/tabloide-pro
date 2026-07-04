import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Platform, Modal, Linking, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Undo2, Redo2, Save, Share2 } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import { TabPreview } from '../../components/editor/TabPreview';
import { EditorToolbar } from '../../components/editor/EditorToolbar';
import { BackgroundModal } from '../../components/editor/BackgroundModal';
import { AIBackgroundModal } from '../../components/editor/AIBackgroundModal';
import { TextModal } from '../../components/editor/TextModal';
import { ElementsModal } from '../../components/editor/ElementsModal';
import { useTabStore } from '../../stores/useTabStore';
import { useTabloids } from '../../hooks/useTabloids';
import { useMarket } from '../../hooks/useMarket';
import { useProducts } from '../../hooks/useProducts';
import { useSubscription } from '../../hooks/useSubscription';
import { auth } from '../../lib/firebase';
import { uploadImageToCloudinary } from '../../lib/cloudinary';
import { logActivity } from '../../lib/activity';
import { formatDate } from '../../utils/formatDate';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

const TYPE_LABELS = { weekly: 'Semanal', monthly: 'Mensal', special: 'Especial' } as const;
const TYPE_KEYS = ['weekly', 'monthly', 'special'] as const;

export default function EditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    selectedProducts, title, backgroundColor, gradient, backgroundImageUrl,
    textColor, titleSize, elements, tabType,
    setSelectedProducts, setTitle, setBackgroundColor, setGradient,
    setBackgroundImageUrl, setTextColor, setTitleSize, addElement, removeElement,
    setTabType, pushHistory, undo, redo, history, historyIndex,
  } = useTabStore();
  const { tabs, createTab, updateTab } = useTabloids();
  const { market } = useMarket();
  const { allProducts } = useProducts();
  const { plan, watermark, tabloidLimit } = useSubscription();

  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [bgModalVisible, setBgModalVisible] = useState(false);
  const [aiBgModalVisible, setAIBgModalVisible] = useState(false);
  const [textModalVisible, setTextModalVisible] = useState(false);
  const [elementsModalVisible, setElementsModalVisible] = useState(false);
  const hydrated = useRef(false);
  const previewRef = useRef<View>(null);

  const validUntil = formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const publicLink = id !== 'new' ? `https://tab-ofertas.web.app/t/${id}` : null;

  useEffect(() => {
    if (id === 'new' || hydrated.current || tabs.length === 0) return;
    const existing = tabs.find((t) => t.id === id);
    if (!existing) return;
    hydrated.current = true;
    setTitle(existing.title);
    setTabType(existing.type);
    if (existing.theme) {
      if (existing.theme.includes(',')) {
        const parts = existing.theme.split(',');
        setGradient([parts[0], parts[1]]);
        setBackgroundColor(parts[0]);
      } else {
        setBackgroundColor(existing.theme);
        setGradient(null);
      }
    }
    const products = existing.products
      .map((productId) => allProducts.find((p) => p.id === productId))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((p) => ({ id: p.id, name: p.name, price: p.price, category: p.category as any, imageUrl: p.imageUrl }));
    setSelectedProducts(products);
  }, [id, tabs, allProducts]);

  const getThemeString = () => gradient ? `${gradient[0]},${gradient[1]}` : backgroundColor;

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) { Alert.alert('Erro', 'Você precisa estar autenticado.'); return; }
    setSaving(true);
    try {
      const data = {
        title,
        type: tabType,
        theme: getThemeString(),
        products: selectedProducts.map((p) => p.id),
        status: 'draft' as const,
      };
      if (id === 'new') {
        const newId = await createTab(data, tabloidLimit);
        await logActivity(uid, 'tabloid_created', `Tabloide "${title}" foi criado`);
        setSaving(false);
        Alert.alert('Salvo!', 'Tabloide salvo com sucesso.', [
          { text: 'OK', onPress: () => router.replace(`/editor/${newId}`) },
        ]);
      } else {
        await updateTab(id, data);
        setSaving(false);
        Alert.alert('Salvo!', 'Tabloide salvo com sucesso.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (e: any) {
      setSaving(false);
      Alert.alert('Erro ao salvar', e.message ?? 'Não foi possível salvar o tabloide. Tente novamente.');
    }
  };

  const handleShare = async () => {
    if (!previewRef.current) return;
    setSharing(true);
    try {
      const uri = await captureRef(previewRef, { format: 'png', quality: 1.0 });

      if (id !== 'new') {
        try {
          const thumbnailUrl = await uploadImageToCloudinary(uri, `thumbnails/${auth.currentUser?.uid}`);
          await updateTab(id, { thumbnailUrl });
        } catch {
          // thumbnail upload failure is non-critical
        }
      }

      Alert.alert(
        'Compartilhar tabloide',
        'Como deseja exportar?',
        [
          {
            text: 'Compartilhar',
            onPress: async () => {
              const canShare = await Sharing.isAvailableAsync();
              if (canShare) {
                await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Compartilhar tabloide' });
              } else {
                Alert.alert('Erro', 'Compartilhamento não disponível neste dispositivo.');
              }
            },
          },
          {
            text: 'Salvar na galeria',
            onPress: async () => {
              const { status } = await MediaLibrary.requestPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permissão necessária', 'Permita acesso à galeria para salvar a imagem.');
                return;
              }
              await MediaLibrary.createAssetAsync(uri);
              Alert.alert('Salvo!', 'Tabloide salvo na galeria com sucesso.');
            },
          },
          { text: 'Cancelar', style: 'cancel' },
        ],
      );
    } catch (e: any) {
      Alert.alert('Erro ao exportar', e.message ?? 'Não foi possível capturar o tabloide.');
    } finally {
      setSharing(false);
    }
  };

  const handleShareLink = async () => {
    if (id === 'new' || !publicLink) {
      Alert.alert('Salve primeiro', 'Salve o tabloide antes de gerar o link público.');
      return;
    }

    try {
      const productSnapshots = selectedProducts.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        imageUrl: p.imageUrl,
      }));
      await updateTab(id, {
        status: 'published',
        productSnapshots,
        validUntil,
      });
    } catch {
      // non-critical — still show the link
    }

    setLinkModalVisible(true);
  };

  const handleWhatsApp = async () => {
    if (!publicLink) return;
    const marketName = market?.name ?? 'nosso mercado';
    const message = `Confira as ofertas de ${marketName}! 🔥\n${publicLink}`;
    const encoded = encodeURIComponent(message);

    try {
      const canOpen = await Linking.canOpenURL(`whatsapp://send?text=${encoded}`);
      if (canOpen) {
        await Linking.openURL(`whatsapp://send?text=${encoded}`);
      } else {
        await Linking.openURL(`https://wa.me/?text=${encoded}`);
      }
    } catch {
      await Linking.openURL(`https://wa.me/?text=${encoded}`);
    }
  };

  const handleCopyLink = async () => {
    if (!publicLink) return;
    try {
      await Share.share({ message: publicLink, url: publicLink });
    } catch {
      // user cancelled share sheet — do nothing
    }
  };

  const handleOpenInBrowser = async () => {
    if (!publicLink) return;
    setLinkModalVisible(false);
    await Linking.openURL(publicLink);
  };

  const handleBackgroundPress = () => setBgModalVisible(true);
  const handleTextPress = () => setTextModalVisible(true);
  const handleElementsPress = () => setElementsModalVisible(true);
  const handleAddPress = () => router.push('/create');

  const handleImagePress = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permissão necessária', 'Permita acesso à galeria.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.9,
    });
    if (result.canceled) return;
    try {
      setSharing(true);
      const url = await uploadImageToCloudinary(result.assets[0].uri, `backgrounds/${auth.currentUser?.uid}`);
      pushHistory();
      setBackgroundImageUrl(url);
    } catch (e: any) {
      Alert.alert('Erro ao enviar imagem', e.message);
    } finally {
      setSharing(false);
    }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {id === 'new' ? 'Novo Tab' : 'Editar Tab'}
        </Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconBtn, !canUndo && styles.iconBtnDisabled]}
            onPress={() => { if (canUndo) undo(); }}
            disabled={!canUndo}
          >
            <Undo2 size={20} color={canUndo ? Colors.text : Colors.border} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, !canRedo && styles.iconBtnDisabled]}
            onPress={() => { if (canRedo) redo(); }}
            disabled={!canRedo}
          >
            <Redo2 size={20} color={canRedo ? Colors.text : Colors.border} />
          </TouchableOpacity>

          {/* Link público */}
          <TouchableOpacity
            onPress={handleShareLink}
            style={styles.emojiBtn}
            activeOpacity={0.75}
          >
            <Text style={styles.emojiBtnText}>🔗</Text>
          </TouchableOpacity>

          {/* WhatsApp direto */}
          <TouchableOpacity
            onPress={handleWhatsApp}
            style={styles.emojiBtn}
            activeOpacity={0.75}
          >
            <Text style={styles.emojiBtnText}>📱</Text>
          </TouchableOpacity>

          {/* Compartilhar imagem */}
          <TouchableOpacity
            onPress={handleShare}
            disabled={sharing}
            style={styles.shareBtn}
            activeOpacity={0.85}
          >
            {sharing
              ? <ActivityIndicator color={Colors.primary} size="small" />
              : <Share2 size={18} color={Colors.primary} />}
          </TouchableOpacity>

          {/* Fundo com IA */}
          <TouchableOpacity
            onPress={() => setAIBgModalVisible(true)}
            style={styles.aiBtn}
            activeOpacity={0.75}
          >
            <LinearGradient
              colors={['#7C3AED', '#2563EB']}
              style={styles.aiBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.aiBtnText}>✨ IA</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSave} activeOpacity={0.85} disabled={saving}>
            <LinearGradient
              colors={Colors.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtn}
            >
              <Save size={16} color="#fff" />
              <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Seletor de tipo */}
      <View style={styles.typeRow}>
        <View style={styles.typeButtons}>
          {TYPE_KEYS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeBtn, tabType === t && styles.typeBtnActive]}
              onPress={() => { pushHistory(); setTabType(t); }}
            >
              <Text style={[styles.typeBtnText, tabType === t && styles.typeBtnTextActive]}>
                {TYPE_LABELS[t]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {plan === 'free' && (
          <TouchableOpacity
            onPress={() => router.push('/upgrade')}
            style={styles.upgradePill}
            activeOpacity={0.8}
          >
            <Text style={styles.upgradePillText}>⭐ Free</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View ref={previewRef} collapsable={false}>
          <TabPreview
            title={title}
            products={selectedProducts}
            marketName={market?.name ?? 'Meu Mercado'}
            validUntil={validUntil}
            gradient={gradient}
            backgroundColor={backgroundColor}
            backgroundImageUrl={backgroundImageUrl}
            textColor={textColor}
            titleSize={titleSize}
            elements={elements}
            showWatermark={watermark}
          />
        </View>
        <View style={styles.hint}>
          <Text style={styles.hintText}>Use a barra abaixo para personalizar o tabloide</Text>
        </View>
      </ScrollView>

      <EditorToolbar
        pageCount={1}
        onAddPress={handleAddPress}
        onTextPress={handleTextPress}
        onImagePress={handleImagePress}
        onElementsPress={handleElementsPress}
        onBackgroundPress={handleBackgroundPress}
      />

      <BackgroundModal
        visible={bgModalVisible}
        onClose={() => setBgModalVisible(false)}
        currentColor={backgroundColor}
        currentGradient={gradient}
        onSelectColor={(color) => { pushHistory(); setBackgroundColor(color); setGradient(null); setBackgroundImageUrl(undefined); }}
        onSelectGradient={(grad) => { pushHistory(); setGradient(grad); setBackgroundColor(grad[0]); setBackgroundImageUrl(undefined); }}
      />

      <AIBackgroundModal
        visible={aiBgModalVisible}
        onClose={() => setAIBgModalVisible(false)}
        onSelect={(url) => {
          pushHistory();
          setBackgroundImageUrl(url);
          setGradient(null);
          setAIBgModalVisible(false);
        }}
      />

      <TextModal
        visible={textModalVisible}
        onClose={() => setTextModalVisible(false)}
        currentTitle={title}
        currentTextColor={textColor}
        currentTitleSize={titleSize}
        onApply={(t, tc, ts) => { pushHistory(); setTitle(t); setTextColor(tc); setTitleSize(ts); }}
      />

      <ElementsModal
        visible={elementsModalVisible}
        onClose={() => setElementsModalVisible(false)}
        currentElements={elements}
        onAdd={(el) => { pushHistory(); addElement(el); }}
        onRemove={(el) => { pushHistory(); removeElement(el); }}
      />

      {/* Modal de link público */}
      <Modal
        visible={linkModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLinkModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.linkOverlay}
          activeOpacity={1}
          onPress={() => setLinkModalVisible(false)}
        />
        <View style={styles.linkSheet}>
          <View style={styles.linkSheetHandle} />
          <Text style={styles.linkSheetTitle}>Link público do tabloide</Text>
          <Text style={styles.linkSheetSubtitle}>
            Seu tabloide foi publicado e está disponível em:
          </Text>
          <View style={styles.linkBox}>
            <Text style={styles.linkText} selectable numberOfLines={2}>
              {publicLink}
            </Text>
          </View>
          <TouchableOpacity style={styles.linkActionRow} onPress={handleCopyLink} activeOpacity={0.75}>
            <Text style={styles.linkActionIcon}>📋</Text>
            <Text style={styles.linkActionText}>Copiar link</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkActionRow} onPress={handleOpenInBrowser} activeOpacity={0.75}>
            <Text style={styles.linkActionIcon}>🌐</Text>
            <Text style={styles.linkActionText}>Abrir no navegador</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkActionRow}
            onPress={() => { setLinkModalVisible(false); handleWhatsApp(); }}
            activeOpacity={0.75}
          >
            <Text style={styles.linkActionIcon}>💬</Text>
            <Text style={styles.linkActionText}>Compartilhar no WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkCloseBtn}
            onPress={() => setLinkModalVisible(false)}
          >
            <Text style={styles.linkCloseBtnText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Layout.spacing.md, paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  iconBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconBtnDisabled: { opacity: 0.4 },
  headerTitle: {
    flex: 1, fontFamily: 'Poppins_700Bold', fontSize: 15, color: Colors.text, marginHorizontal: 6,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  emojiBtn: {
    width: 34, height: 34, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  emojiBtnText: { fontSize: 17 },
  shareBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary + '15',
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: Layout.borderRadius.md,
  },
  saveBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#fff' },
  aiBtn: { borderRadius: 8, overflow: 'hidden' },
  aiBtnGradient: { paddingHorizontal: 12, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 4 },
  aiBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#fff' },
  typeRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg, paddingVertical: Layout.spacing.sm,
    backgroundColor: Colors.card,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  typeButtons: {
    flexDirection: 'row', gap: 8, flex: 1,
  },
  typeBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1, borderColor: Colors.border,
  },
  typeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: Colors.textMuted },
  typeBtnTextActive: { color: '#fff' },
  upgradePill: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.warning + '25',
    borderWidth: 1, borderColor: Colors.warning,
  },
  upgradePillText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#92400E' },
  scroll: { flex: 1 },
  scrollContent: { paddingVertical: Layout.spacing.lg },
  hint: { alignItems: 'center', marginTop: Layout.spacing.md },
  hintText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textMuted },
  // Link modal
  linkOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  linkSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  linkSheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center', marginBottom: 16,
  },
  linkSheetTitle: {
    fontFamily: 'Poppins_800ExtraBold', fontSize: 18,
    color: Colors.text, marginBottom: 6,
  },
  linkSheetSubtitle: {
    fontFamily: 'Inter_400Regular', fontSize: 13,
    color: Colors.textMuted, marginBottom: 14, lineHeight: 18,
  },
  linkBox: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: 12, marginBottom: 16,
  },
  linkText: {
    fontFamily: 'Inter_500Medium', fontSize: 13,
    color: Colors.primary, lineHeight: 18,
  },
  linkActionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  linkActionIcon: { fontSize: 20 },
  linkActionText: {
    fontFamily: 'Inter_500Medium', fontSize: 15, color: Colors.text,
  },
  linkCloseBtn: {
    marginTop: 18,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.background,
  },
  linkCloseBtnText: {
    fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.textMuted,
  },
});
