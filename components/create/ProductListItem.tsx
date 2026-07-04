import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, GripVertical, Pencil, DollarSign } from 'lucide-react-native';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

interface ProductListItemProps {
  product: Product;
  selected: boolean;
  onToggle: () => void;
  onEdit?: () => void;
}

export function ProductListItem({ product, selected, onToggle, onEdit }: ProductListItemProps) {
  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.7} style={styles.item}>
      <View style={[styles.thumbnail, { backgroundColor: Colors.primary + '20' }]}>
        <Text style={styles.thumbnailEmoji}>🛒</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatCurrency(product.price)}</Text>
          {product.costUSD != null && (
            <View style={styles.usdBadge}>
              <DollarSign size={10} color={Colors.success} />
              <Text style={styles.usdBadgeText}>US$ {product.costUSD.toFixed(2)}</Text>
            </View>
          )}
        </View>
      </View>
      {onEdit && (
        <TouchableOpacity onPress={onEdit} style={styles.editBtn}>
          <Pencil size={15} color={Colors.textMuted} />
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={onToggle} style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected && <Check size={14} color="#fff" strokeWidth={3} />}
      </TouchableOpacity>
      <GripVertical size={18} color={Colors.textMuted} style={styles.handle} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: Layout.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailEmoji: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  price: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  usdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.success + '15',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Layout.borderRadius.sm,
  },
  usdBadgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: Colors.success,
  },
  editBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  handle: {
    marginLeft: 4,
  },
});
