import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Check } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

const SOLID_COLORS = [
  '#1E3A8A', '#1D4ED8', '#7C3AED', '#DC2626',
  '#059669', '#D97706', '#0F172A', '#1E293B',
  '#0369A1', '#BE185D', '#065F46', '#FFFFFF',
];

const GRADIENTS: [string, string][] = [
  ['#1A0A4D', '#2563EB'],
  ['#3B0764', '#7C3AED'],
  ['#450A0A', '#DC2626'],
  ['#052E16', '#059669'],
  ['#451A03', '#D97706'],
  ['#0F172A', '#334155'],
];

type Mode = 'solid' | 'gradient';

interface BackgroundModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectColor: (color: string) => void;
  onSelectGradient: (gradient: [string, string]) => void;
  currentColor: string;
  currentGradient: [string, string] | null;
}

export function BackgroundModal({
  visible, onClose, onSelectColor, onSelectGradient, currentColor, currentGradient,
}: BackgroundModalProps) {
  const [mode, setMode] = useState<Mode>(currentGradient ? 'gradient' : 'solid');
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const [selectedGradient, setSelectedGradient] = useState<[string, string] | null>(currentGradient);

  const handleApply = () => {
    if (mode === 'solid') {
      onSelectColor(selectedColor);
    } else if (selectedGradient) {
      onSelectGradient(selectedGradient);
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Fundo do Tabloide</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modeRow}>
            {(['solid', 'gradient'] as Mode[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
                onPress={() => setMode(m)}
              >
                <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
                  {m === 'solid' ? 'Cor sólida' : 'Gradiente'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {mode === 'solid' ? (
              <View style={styles.grid}>
                {SOLID_COLORS.map((color) => {
                  const isSelected = selectedColor === color;
                  return (
                    <TouchableOpacity
                      key={color}
                      style={[styles.colorSwatch, { backgroundColor: color }, isSelected && styles.swatchSelected]}
                      onPress={() => setSelectedColor(color)}
                      activeOpacity={0.8}
                    >
                      {isSelected && <Check size={18} color={color === '#FFFFFF' ? '#000' : '#fff'} strokeWidth={3} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.grid}>
                {GRADIENTS.map((grad, i) => {
                  const isSelected = selectedGradient?.[0] === grad[0] && selectedGradient?.[1] === grad[1];
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.gradientSwatch, isSelected && styles.swatchSelected]}
                      onPress={() => setSelectedGradient(grad)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient colors={grad} style={styles.gradientFill}>
                        {isSelected && <Check size={18} color="#fff" strokeWidth={3} />}
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
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
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Layout.borderRadius.xl,
    borderTopRightRadius: Layout.borderRadius.xl,
    padding: Layout.spacing['2xl'],
    paddingBottom: 40,
    maxHeight: '75%',
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
  modeRow: {
    flexDirection: 'row', gap: 8,
    backgroundColor: Colors.background, borderRadius: Layout.borderRadius.md,
    padding: 4, marginBottom: Layout.spacing.lg,
  },
  modeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: Layout.borderRadius.sm, alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: Colors.primary },
  modeBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.textMuted },
  modeBtnTextActive: { color: '#fff' },
  scroll: { paddingBottom: 16 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  colorSwatch: {
    width: 58, height: 58, borderRadius: Layout.borderRadius.md,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  gradientSwatch: {
    width: 58, height: 58, borderRadius: Layout.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 2, borderColor: 'transparent',
  },
  gradientFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  swatchSelected: { borderColor: Colors.text },
  applyBtn: {
    backgroundColor: Colors.primary, borderRadius: Layout.borderRadius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: Layout.spacing.lg,
  },
  applyBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#fff' },
});
