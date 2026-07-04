import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

const BADGE_OPTIONS = [
  'OFERTA!',
  'IMPERDÍVEL!',
  'NOVIDADE!',
  'QUEIMA DE ESTOQUE',
  '⚡ PROMOÇÃO',
  '🔥 HOT SALE',
  '🏷️ DESCONTO',
  '✨ ESPECIAL',
];

interface ElementsModalProps {
  visible: boolean;
  onClose: () => void;
  currentElements: string[];
  onAdd: (element: string) => void;
  onRemove: (element: string) => void;
}

export function ElementsModal({
  visible, onClose, currentElements, onAdd, onRemove,
}: ElementsModalProps) {
  const toggle = (element: string) => {
    if (currentElements.includes(element)) {
      onRemove(element);
    } else {
      onAdd(element);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Elementos Decorativos</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>Toque para adicionar ou remover badges do tabloide</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <View style={styles.grid}>
              {BADGE_OPTIONS.map((badge) => {
                const active = currentElements.includes(badge);
                return (
                  <TouchableOpacity
                    key={badge}
                    style={[styles.badge, active && styles.badgeActive]}
                    onPress={() => toggle(badge)}
                    activeOpacity={0.75}
                  >
                    {active && <Check size={14} color="#fff" strokeWidth={3} style={{ marginRight: 4 }} />}
                    <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{badge}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>Concluído</Text>
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
    maxHeight: '65%',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 17, color: Colors.text },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  hint: {
    fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textMuted,
    marginBottom: Layout.spacing.lg,
  },
  scroll: { paddingBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  badgeActive: {
    backgroundColor: Colors.primary, borderColor: Colors.primary,
  },
  badgeText: {
    fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.text,
  },
  badgeTextActive: { color: '#fff' },
  doneBtn: {
    backgroundColor: Colors.primary, borderRadius: Layout.borderRadius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: Layout.spacing.lg,
  },
  doneBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#fff' },
});
