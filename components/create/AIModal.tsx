import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator, FlatList,
} from 'react-native';
import { X, Sparkles, Send } from 'lucide-react-native';
import { suggestTabTitle, suggestProducts, chatAssistant } from '../../lib/gemini';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

type AITab = 'titles' | 'products' | 'chat';

interface AIModalProps {
  visible: boolean;
  onClose: () => void;
  marketName: string;
  onSelectTitle: (title: string) => void;
}

export function AIModal({ visible, onClose, marketName, onSelectTitle }: AIModalProps) {
  const [activeTab, setActiveTab] = useState<AITab>('titles');
  const [loading, setLoading] = useState(false);

  const [theme, setTheme] = useState('');
  const [titles, setTitles] = useState<string[]>([]);

  const [category, setCategory] = useState('');
  const [suggestedProducts, setSuggestedProducts] = useState<Array<{ name: string; price: number }>>([]);

  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([]);

  const handleGetTitles = async () => {
    if (!theme.trim()) return;
    setLoading(true);
    try {
      const result = await suggestTabTitle(theme, 'semanal', marketName);
      setTitles(result);
    } finally {
      setLoading(false);
    }
  };

  const handleGetProducts = async () => {
    if (!category.trim()) return;
    setLoading(true);
    try {
      const result = await suggestProducts(category);
      setSuggestedProducts(result);
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const reply = await chatAssistant(userMsg, `mercado: ${marketName}`);
      setChatMessages((prev) => [...prev, { role: 'ai', text: reply }]);
    } finally {
      setLoading(false);
    }
  };

  const tabs: Array<{ key: AITab; label: string }> = [
    { key: 'titles', label: '✨ Títulos' },
    { key: 'products', label: '🛒 Produtos' },
    { key: 'chat', label: '💬 Chat' },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Sparkles size={20} color={Colors.primary} />
            <Text style={styles.headerTitle}>Assistente IA</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              style={[styles.tab, activeTab === t.key && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'titles' && (
          <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
            <Text style={styles.sectionLabel}>Tema ou período do tabloide</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Ex: Natal, Mês das Mães, Semana do Feijão..."
                placeholderTextColor={Colors.textMuted}
                value={theme}
                onChangeText={setTheme}
              />
              <TouchableOpacity onPress={handleGetTitles} disabled={loading} style={styles.goBtn}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Sparkles size={18} color="#fff" />}
              </TouchableOpacity>
            </View>
            {titles.map((title, i) => (
              <TouchableOpacity key={i} style={styles.resultCard} onPress={() => { onSelectTitle(title); onClose(); }}>
                <Text style={styles.resultTitle}>{title}</Text>
                <Text style={styles.resultHint}>Toque para usar</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {activeTab === 'products' && (
          <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
            <Text style={styles.sectionLabel}>Categoria de produtos</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Ex: Alimentos, Bebidas, Higiene..."
                placeholderTextColor={Colors.textMuted}
                value={category}
                onChangeText={setCategory}
              />
              <TouchableOpacity onPress={handleGetProducts} disabled={loading} style={styles.goBtn}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Sparkles size={18} color="#fff" />}
              </TouchableOpacity>
            </View>
            {suggestedProducts.map((p, i) => (
              <View key={i} style={styles.productRow}>
                <Text style={styles.productName}>{p.name}</Text>
                <Text style={styles.productPrice}>R$ {p.price.toFixed(2)}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {activeTab === 'chat' && (
          <View style={styles.chatContainer}>
            <ScrollView style={styles.chatMessages} contentContainerStyle={{ gap: 12 }}>
              {chatMessages.length === 0 && (
                <View style={styles.chatEmpty}>
                  <Text style={styles.chatEmptyText}>Pergunte qualquer coisa sobre como criar tabloides, sugestões de preços, estratégias de marketing e mais.</Text>
                </View>
              )}
              {chatMessages.map((m, i) => (
                <View key={i} style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                  <Text style={[styles.bubbleText, m.role === 'user' && styles.userBubbleText]}>{m.text}</Text>
                </View>
              ))}
              {loading && (
                <View style={styles.aiBubble}>
                  <ActivityIndicator color={Colors.primary} size="small" />
                </View>
              )}
            </ScrollView>
            <View style={styles.chatInput}>
              <TextInput
                style={styles.chatField}
                placeholder="Digite sua pergunta..."
                placeholderTextColor={Colors.textMuted}
                value={chatInput}
                onChangeText={setChatInput}
                multiline
              />
              <TouchableOpacity onPress={handleChat} disabled={loading} style={styles.sendBtn}>
                <Send size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
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
  content: { flex: 1 },
  contentInner: { padding: Layout.spacing.lg, gap: 12 },
  sectionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.textMuted, marginBottom: 4 },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1, backgroundColor: Colors.card, borderRadius: Layout.borderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Layout.spacing.md, height: 48,
    fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.text,
  },
  goBtn: {
    width: 48, height: 48, borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  resultCard: {
    backgroundColor: Colors.card, borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.primary,
    ...Layout.shadow.card,
  },
  resultTitle: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: Colors.text },
  resultHint: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  productRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md, ...Layout.shadow.card,
  },
  productName: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.text, flex: 1 },
  productPrice: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: Colors.primary },
  chatContainer: { flex: 1 },
  chatMessages: { flex: 1, padding: Layout.spacing.lg },
  chatEmpty: { backgroundColor: Colors.card, borderRadius: Layout.borderRadius.lg, padding: Layout.spacing.lg },
  chatEmptyText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textMuted, lineHeight: 21, textAlign: 'center' },
  bubble: {
    maxWidth: '85%', padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
  },
  userBubble: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: Colors.card, borderBottomLeftRadius: 4, ...Layout.shadow.card },
  bubbleText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.text, lineHeight: 20 },
  userBubbleText: { color: '#fff' },
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
});
