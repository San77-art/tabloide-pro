import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, FileImage, DollarSign } from 'lucide-react-native';
import { StatusBadge } from './StatusBadge';
import { formatCurrency, formatNumber } from '../../utils/formatCurrency';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

interface CampaignCardProps {
  onPress?: () => void;
  campaign: {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'scheduled' | 'finished';
    tabCount: number;
    views: number;
    sales: number;
    thumbnailUrl?: string;
  };
}

export function CampaignCard({ campaign, onPress }: CampaignCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <LinearGradient colors={['#2D1B69', Colors.primary]} style={styles.thumbnail}>
          <Text style={styles.thumbnailText}>{campaign.name.slice(0, 2).toUpperCase()}</Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.name} numberOfLines={1}>{campaign.name}</Text>
            <StatusBadge status={campaign.status} />
          </View>
          <Text style={styles.description} numberOfLines={1}>{campaign.description}</Text>
          <View style={styles.metrics}>
            <View style={styles.metric}>
              <FileImage size={12} color={Colors.textMuted} />
              <Text style={styles.metricText}>{campaign.tabCount} tabs</Text>
            </View>
            {campaign.views > 0 && (
              <View style={styles.metric}>
                <Eye size={12} color={Colors.textMuted} />
                <Text style={styles.metricText}>{formatNumber(campaign.views)}</Text>
              </View>
            )}
            {campaign.sales > 0 && (
              <View style={styles.metric}>
                <DollarSign size={12} color={Colors.success} />
                <Text style={[styles.metricText, { color: Colors.success }]}>
                  {formatCurrency(campaign.sales)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  metrics: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metricText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: Colors.textMuted,
  },
});
