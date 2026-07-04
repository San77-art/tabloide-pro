import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, Type, ImageIcon, Shapes, PaintBucket, Layers, BookCopy } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}

function ToolbarButton({ icon, label, onPress }: ToolbarButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.toolBtn} activeOpacity={0.7}>
      {icon}
      <Text style={styles.toolLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

interface EditorToolbarProps {
  pageCount?: number;
  onAddPress?: () => void;
  onTextPress?: () => void;
  onImagePress?: () => void;
  onElementsPress?: () => void;
  onBackgroundPress?: () => void;
}

export function EditorToolbar({
  pageCount = 1,
  onAddPress,
  onTextPress,
  onImagePress,
  onElementsPress,
  onBackgroundPress,
}: EditorToolbarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.mainToolbar}>
        <ToolbarButton
          icon={<Plus size={20} color={Colors.text} />}
          label="Adicionar"
          onPress={onAddPress ?? (() => {})}
        />
        <ToolbarButton
          icon={<Type size={20} color={Colors.text} />}
          label="Texto"
          onPress={onTextPress ?? (() => {})}
        />
        <ToolbarButton
          icon={<ImageIcon size={20} color={Colors.text} />}
          label="Imagem"
          onPress={onImagePress ?? (() => {})}
        />
        <ToolbarButton
          icon={<Shapes size={20} color={Colors.text} />}
          label="Elementos"
          onPress={onElementsPress ?? (() => {})}
        />
        <ToolbarButton
          icon={<PaintBucket size={20} color={Colors.text} />}
          label="Fundo"
          onPress={onBackgroundPress ?? (() => {})}
        />
      </View>
      <View style={styles.secondaryToolbar}>
        <View style={styles.secondaryBtn}>
          <Layers size={16} color={Colors.textMuted} />
          <Text style={styles.secondaryLabel}>Camadas</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.secondaryBtn}>
          <BookCopy size={16} color={Colors.textMuted} />
          <Text style={styles.secondaryLabel}>Páginas</Text>
          <View style={styles.pageBadge}>
            <Text style={styles.pageBadgeText}>{pageCount}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  mainToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  toolBtn: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  toolLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: Colors.text,
  },
  secondaryToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Layout.spacing.xl,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  secondaryLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.textMuted,
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
    marginHorizontal: 20,
  },
  pageBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  pageBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    color: '#fff',
  },
});
