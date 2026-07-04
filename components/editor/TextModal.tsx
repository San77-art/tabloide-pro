import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { TitleSize } from '../../stores/useTabStore';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

const TEXT_COLORS = [
  { label: 'Dourado', value: '#F59E0B' },
  { label: 'Branco', value: '#FFFFFF' },
  { label: 'Preto', value: '#0F172A' },
  { label: 'Azul', value: '#2563EB' },
  { label: 'Vermelho', value: '#EF4444' },
  { label: 'Verde', value: '#10B981' },
];

const SIZES: { label: string; value: TitleSize; fontSize: number }[] = [
  { label: 'P', value: 'sm', fontSize: 14 },
  { label: 'M', value: 'md', fontSize: 18 },
  { label: 'G', value: 'lg', fontSize: 22 },
  { label: 'GG', value: 'xl', fontSize: 28 },
];

interface TextModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (title: string, textColor: string, titleSize: TitleSize) => void;
  currentTitle: string;
  currentTextColor: string;
  currentTitleSize: TitleSize;
}

export function TextModal({
  visible, onClose, onApply, currentTitle, currentTextColor, currentTitleSize,
}: TextModalProps) {
  const [title, setTitle] = useState(currentTitle);
  const [textColor, setTextColor] = useState(currentTextColor);
  const [titleSize, setTitleSize] = useState<TitleSize>(currentTitleSize);

  const previewFontSize = SIZES.find((s) => s.value === titleSize)?.fontSize ?? 22;

  const handleApply = () => {
    if (title.trim()) onApply(title.trim().toUpperCase(), textColor, titleSize);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Editar Título</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Preview */}
            <View style={styles.previewCard}>
              <Text style={[styles.previewText, { color: textColor, fontSize: previewFontSize }]} numberOfLines={2}>
                {title || 'Título do tabloide'}
              </Text>
            </View>

            <Text style={styles.label}>Título</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: OFERTAS DA SEMANA"
              placeholderTextColor={Colors.textMuted}
              maxLength={60}
              autoCapitalize="characters"
            />

            <Text style={styles.label}>Tamanho</Text>
            <View style={styles.sizeRow}>
              {SIZES.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  style={[styles.sizeBtn, titleSize === s.value && styles.sizeBtnActive]}
                  onPress={() => setTitleSize(s.value)}
                >
                  <Text style={[styles.sizeBtnText, titleSize === s.value && styles.sizeBtnTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Cor do texto</Text>
            <View style={styles.colorRow}>
              {TEXT_COLORS.map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c.value },
                    textColor === c.value && styles.colorCircleSelected,
                    c.value === '#FFFFFF' && styles.colorCircleWhite,
                  ]}
                  onPress={() => setTextColor(c.value)}
                />
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
            <Text style={styles.applyBtnText}>Aplicar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Layout.borderRadius.xl,
    borderTopRightRadius: Layout.borderRadius.xl,
    padding: Layout.spacing['2xl'],
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 17, color: Colors.text },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  previewCard: {
    backgroundColor: Colors.primary, borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg, marginBottom: Layout.spacing.lg,
    minHeight: 80, alignItems: 'center', justifyContent: 'center',
  },
  previewText: { fontFamily: 'Poppins_900Black', textAlign: 'center', letterSpacing: 1 },
  label: {
    fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: Layout.spacing.sm, marginTop: Layout.spacing.md,
  },
  input: {
    backgroundColor: Colors.background, borderRadius: Layout.borderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Layout.spacing.md, height: 50,
    fontFamily: 'Poppins_700Bold', fontSize: 15, color: Colors.text,
  },
  sizeRow: { flexDirection: 'row', gap: 10 },
  sizeBtn: {
    flex: 1, paddingVertical: 12, borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.background, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border,
  },
  sizeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sizeBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: Colors.textMuted },
  sizeBtnTextActive: { color: '#fff' },
  colorRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginTop: 4 },
  colorCircle: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 3, borderColor: 'transparent',
  },
  colorCircleSelected: { borderColor: Colors.primary },
  colorCircleWhite: { borderColor: Colors.border },
  applyBtn: {
    backgroundColor: Colors.primary, borderRadius: Layout.borderRadius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: Layout.spacing.lg,
  },
  applyBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#fff' },
});
