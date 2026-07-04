import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Crown } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function UpgradeModal({ visible, onClose, title, message, ctaLabel, onCta }: UpgradeModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconWrapper}>
            <Crown size={26} color={Colors.warning} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.row}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>{ctaLabel ? 'Agora não' : 'Entendi'}</Text>
            </TouchableOpacity>
            {ctaLabel && onCta && (
              <TouchableOpacity onPress={onCta} style={styles.ctaBtn}>
                <Text style={styles.ctaText}>{ctaLabel}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal: {
    width: '100%', backgroundColor: Colors.card, borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing['2xl'], alignItems: 'center', ...Layout.shadow.button,
  },
  iconWrapper: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.warning + '20',
    alignItems: 'center', justifyContent: 'center', marginBottom: Layout.spacing.md,
  },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 17, color: Colors.text, marginBottom: 8, textAlign: 'center' },
  message: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 19, marginBottom: Layout.spacing.lg },
  row: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: { flex: 1, padding: 12, borderRadius: Layout.borderRadius.md, alignItems: 'center', backgroundColor: Colors.background },
  cancelText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.textMuted },
  ctaBtn: { flex: 1, padding: 12, borderRadius: Layout.borderRadius.md, alignItems: 'center', backgroundColor: Colors.primary },
  ctaText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#fff' },
});
