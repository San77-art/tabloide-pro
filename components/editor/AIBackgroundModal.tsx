import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator, Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { X, Sparkles, Send, Check, ArrowLeft } from 'lucide-react-native';
import {
  TEMATICAS, generateBackgrounds, generateBackgroundsFromText, chatForBackground,
  getAIUsageCount, incrementAIUsage, PRO_MONTHLY_LIMIT, GeneratedBackground,
} from '../../lib/imageAI';
import { useSubscription } from '../../hooks/useSubscription';
import { auth } from '../../lib/firebase';
import { UpgradeModal } from '../ui/UpgradeModal';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

type AITab = 'tematicas' | 'chat';
type GenSource = { type: 'theme'; id: string } | { type: 'text'; text: string };

interface AIBackgroundModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

const CHAT_MARKER = 'Vou gerar fundos para:';

function resolveErrorMessage(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (e instanceof TypeError || /network/i.test(msg)) {
    return 'Sem conexão com a internet. Verifique sua rede.';
  }
  if (/rate.?limit|too many requests/i.test(msg)) {
    return 'Limite de gerações atingido. Tente novamente em alguns minutos.';
  }
  return 'Não foi possível gerar os fundos. Tente novamente.';
}

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
    <View style={styles.resultsGrid}>
      {[0, 1, 2, 3].map((i) => (
        <Animated.View key={i} style={[styles.imageCard, styles.skeletonBox, { opacity: pulse }]} />
      ))}
    </View>
  );
}

export function AIBackgroundModal({ visible, onClose, onSelect }: AIBackgroundModalProps) {
  const { plan } = useSubscription();
  const [activeTab, setActiveTab] = useState<AITab>('tematicas');
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedBackground[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastGenSource, setLastGenSource] = useState<GenSource | null>(null);

  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [pendingDescription, setPendingDescription] = useState<string | null>(null);

  const [upgradeVisible, setUpgradeVisible] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'plan' | 'limit'>('plan');

  useEffect(() => {
    if (visible) return;
    setActiveTab('tematicas');
    setSelectedThemeId(null);
    setGenerating(false);
    setGeneratedImages([]);
    setSelectedImageUrl(null);
    setLoadedImages({});
    setErrorMsg(null);
    setLastGenSource(null);
    setChatMessages([]);
    setChatInput('');
    setPendingDescription(null);
  }, [visible]);

  const requestGenerate = async (source: GenSource) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    if (plan === 'free') {
      setUpgradeReason('plan');
      setUpgradeVisible(true);
      return;
    }

    setErrorMsg(null);

    if (plan === 'pro') {
      const count = await getAIUsageCount(uid).catch(() => 0);
      if (count >= PRO_MONTHLY_LIMIT) {
        setUpgradeReason('limit');
        setUpgradeVisible(true);
        return;
      }
    }

    setGenerating(true);
    setGeneratedImages([]);
    setSelectedImageUrl(null);
    setLoadedImages({});
    try {
      const images = source.type === 'theme'
        ? await generateBackgrounds(source.id)
        : await generateBackgroundsFromText(source.text);
      setGeneratedImages(images);
      setLastGenSource(source);
      incrementAIUsage(uid).catch(() => {});
    } catch (e) {
      setErrorMsg(resolveErrorMessage(e));
    } finally {
      setGenerating(false);
    }
  };

  const handleSendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput('');
    setPendingDescription(null);
    const nextMessages: { role: 'user' | 'assistant'; content: string }[] = [...chatMessages, { role: 'user', content: text }];
    setChatMessages(nextMessages);
    setChatLoading(true);
    try {
      const reply = await chatForBackground(nextMessages);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      const idx = reply.indexOf(CHAT_MARKER);
      if (idx !== -1) {
        setPendingDescription(reply.slice(idx + CHAT_MARKER.length).trim());
      }
    } catch (e) {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: resolveErrorMessage(e) }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleApply = () => {
    if (!selectedImageUrl) return;
    onSelect(selectedImageUrl);
  };

  const handleRegenerate = () => {
    if (lastGenSource) requestGenerate(lastGenSource);
  };

  const showingResults = generating || generatedImages.length > 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {showingResults ? (
              <TouchableOpacity onPress={() => { setGeneratedImages([]); setErrorMsg(null); }} style={styles.closeBtn}>
                <ArrowLeft size={20} color={Colors.text} />
              </TouchableOpacity>
            ) : (
              <Sparkles size={20} color={Colors.primary} />
            )}
            <Text style={styles.headerTitle}>{showingResults ? 'Escolha um fundo' : 'Fundo com IA'}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {!showingResults && (
          <View style={styles.tabs}>
            {(['tematicas', 'chat'] as AITab[]).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setActiveTab(t)}
                style={[styles.tab, activeTab === t && styles.tabActive]}
              >
                <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                  {t === 'tematicas' ? '🎨 Temáticas' : '💬 Criar com IA'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {errorMsg && !showingResults && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {showingResults ? (
          <View style={styles.resultsContainer}>
            {generating ? (
              <>
                <SkeletonGrid />
                <Text style={styles.generatingHint}>Gerando 4 opções de fundo... isso pode levar até 30 segundos ✨</Text>
              </>
            ) : errorMsg ? (
              <View style={styles.center}>
                <Text style={styles.errorText}>{errorMsg}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={handleRegenerate}>
                  <Text style={styles.retryBtnText}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.resultsScroll}>
                <View style={styles.resultsGrid}>
                  {generatedImages.map((img) => {
                    const isSelected = selectedImageUrl === img.url;
                    return (
                      <TouchableOpacity
                        key={img.url}
                        style={[styles.imageCard, isSelected && styles.imageCardSelected]}
                        onPress={() => setSelectedImageUrl(img.url)}
                        activeOpacity={0.85}
                      >
                        <Image
                          source={{ uri: img.url }}
                          style={styles.image}
                          contentFit="cover"
                          onLoad={() => setLoadedImages((prev) => ({ ...prev, [img.url]: true }))}
                        />
                        {!loadedImages[img.url] && (
                          <View style={styles.imageLoading}>
                            <ActivityIndicator color={Colors.primary} size="small" />
                          </View>
                        )}
                        {isSelected && (
                          <View style={styles.imageCheck}>
                            <Check size={16} color="#fff" strokeWidth={3} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            {!generating && !errorMsg && (
              <View style={styles.resultsActions}>
                <TouchableOpacity style={styles.regenerateBtn} onPress={handleRegenerate}>
                  <Text style={styles.regenerateBtnText}>🔄 Gerar novamente</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.applyBtn, !selectedImageUrl && styles.applyBtnDisabled]}
                  onPress={handleApply}
                  disabled={!selectedImageUrl}
                >
                  <Text style={styles.applyBtnText}>Aplicar este fundo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : activeTab === 'tematicas' ? (
          <>
            <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
              <View style={styles.themeGrid}>
                {TEMATICAS.map((theme) => {
                  const isSelected = selectedThemeId === theme.id;
                  return (
                    <TouchableOpacity
                      key={theme.id}
                      style={[styles.themeCard, isSelected && styles.themeCardSelected]}
                      onPress={() => setSelectedThemeId(theme.id)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.themeLabel}>{theme.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={[styles.generateBtn, !selectedThemeId && styles.generateBtnDisabled]}
                onPress={() => selectedThemeId && requestGenerate({ type: 'theme', id: selectedThemeId })}
                disabled={!selectedThemeId}
              >
                <Text style={styles.generateBtnText}>✨ Gerar fundos</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.chatContainer}>
            <ScrollView style={styles.chatMessages} contentContainerStyle={{ gap: 12 }}>
              {chatMessages.length === 0 && (
                <View style={styles.chatEmpty}>
                  <Text style={styles.chatEmptyText}>
                    Me conte como você imagina o fundo do seu tabloide: tipo de loja, cores, estilo, data especial... e eu gero pra você! 🎨
                  </Text>
                </View>
              )}
              {chatMessages.map((m, i) => (
                <View key={i} style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                  <Text style={[styles.bubbleText, m.role === 'user' && styles.userBubbleText]}>{m.content}</Text>
                </View>
              ))}
              {chatLoading && (
                <View style={styles.aiBubble}>
                  <ActivityIndicator color={Colors.primary} size="small" />
                </View>
              )}
            </ScrollView>

            {pendingDescription && !chatLoading && (
              <TouchableOpacity
                style={styles.generateNowBtn}
                onPress={() => requestGenerate({ type: 'text', text: pendingDescription })}
              >
                <Text style={styles.generateNowBtnText}>🎨 Gerar agora</Text>
              </TouchableOpacity>
            )}

            <View style={styles.chatInput}>
              <TextInput
                style={styles.chatField}
                placeholder="Descreva o fundo que você imagina..."
                placeholderTextColor={Colors.textMuted}
                value={chatInput}
                onChangeText={setChatInput}
                multiline
              />
              <TouchableOpacity onPress={handleSendChat} disabled={chatLoading} style={styles.sendBtn}>
                <Send size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <UpgradeModal
        visible={upgradeVisible}
        onClose={() => setUpgradeVisible(false)}
        title={upgradeReason === 'limit' ? 'Limite mensal atingido' : 'Recurso exclusivo Pro'}
        message={
          upgradeReason === 'limit'
            ? `Você atingiu o limite de ${PRO_MONTHLY_LIMIT} fundos com IA este mês. Faça upgrade para o plano Business e gere sem limites.`
            : 'A geração de fundo com IA está disponível no plano Pro.'
        }
        ctaLabel="Ver planos"
        onCta={() => { setUpgradeVisible(false); onClose(); router.push('/upgrade'); }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Layout.spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: Colors.text },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', padding: Layout.spacing.md, gap: 8, backgroundColor: Colors.card },
  tab: {
    flex: 1, paddingVertical: 8, borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.background, alignItems: 'center',
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: Colors.textMuted },
  tabTextActive: { color: '#fff' },
  errorBanner: {
    backgroundColor: Colors.danger + '15', marginHorizontal: Layout.spacing.lg,
    marginTop: Layout.spacing.md, padding: Layout.spacing.md, borderRadius: Layout.borderRadius.md,
  },
  errorText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.danger, textAlign: 'center', lineHeight: 19 },
  content: { flex: 1 },
  contentInner: { padding: Layout.spacing.lg },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  themeCard: {
    width: '47%', backgroundColor: Colors.card, borderRadius: Layout.borderRadius.md,
    paddingVertical: 20, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent', ...Layout.shadow.card,
  },
  themeCardSelected: { borderColor: Colors.primary },
  themeLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.text, textAlign: 'center' },
  bottomBar: {
    padding: Layout.spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.card,
  },
  generateBtn: {
    backgroundColor: Colors.primary, borderRadius: Layout.borderRadius.md,
    paddingVertical: 14, alignItems: 'center',
  },
  generateBtnDisabled: { backgroundColor: Colors.border },
  generateBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#fff' },
  chatContainer: { flex: 1 },
  chatMessages: { flex: 1, padding: Layout.spacing.lg },
  chatEmpty: { backgroundColor: Colors.card, borderRadius: Layout.borderRadius.lg, padding: Layout.spacing.lg },
  chatEmptyText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textMuted, lineHeight: 21, textAlign: 'center' },
  bubble: { maxWidth: '85%', padding: Layout.spacing.md, borderRadius: Layout.borderRadius.lg },
  userBubble: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: Colors.card, borderBottomLeftRadius: 4, ...Layout.shadow.card },
  bubbleText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.text, lineHeight: 20 },
  userBubbleText: { color: '#fff' },
  generateNowBtn: {
    marginHorizontal: Layout.spacing.lg, marginBottom: Layout.spacing.sm,
    backgroundColor: Colors.secondary, borderRadius: Layout.borderRadius.md,
    paddingVertical: 12, alignItems: 'center',
  },
  generateNowBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#fff' },
  chatInput: {
    flexDirection: 'row', padding: Layout.spacing.md, gap: 10,
    borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.card,
  },
  chatField: {
    flex: 1, backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md, paddingHorizontal: Layout.spacing.md,
    paddingVertical: 10, fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  resultsContainer: { flex: 1 },
  resultsScroll: { padding: Layout.spacing.lg },
  resultsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingHorizontal: Layout.spacing.lg, paddingTop: Layout.spacing.lg,
  },
  imageCard: {
    width: '47%', aspectRatio: 16 / 9, borderRadius: Layout.borderRadius.md,
    overflow: 'hidden', borderWidth: 2, borderColor: 'transparent',
    backgroundColor: Colors.card,
  },
  imageCardSelected: { borderColor: Colors.primary },
  image: { width: '100%', height: '100%' },
  imageLoading: {
    ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  imageCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  skeletonBox: { backgroundColor: Colors.border },
  generatingHint: {
    fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textMuted,
    textAlign: 'center', marginTop: Layout.spacing.lg, paddingHorizontal: Layout.spacing.xl,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Layout.spacing['2xl'], gap: 16 },
  retryBtn: {
    backgroundColor: Colors.primary, borderRadius: Layout.borderRadius.md,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  retryBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#fff' },
  resultsActions: {
    flexDirection: 'row', gap: 10, padding: Layout.spacing.lg,
    borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.card,
  },
  regenerateBtn: {
    flex: 1, paddingVertical: 14, borderRadius: Layout.borderRadius.md,
    alignItems: 'center', backgroundColor: Colors.background,
  },
  regenerateBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.textMuted },
  applyBtn: {
    flex: 1.4, paddingVertical: 14, borderRadius: Layout.borderRadius.md,
    alignItems: 'center', backgroundColor: Colors.primary,
  },
  applyBtnDisabled: { backgroundColor: Colors.border },
  applyBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#fff' },
});
