import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FileText, Megaphone, Package, DollarSign, Clock } from 'lucide-react-native';
import { FirestoreActivity } from '../../hooks/useActivities';
import { ActivityType } from '../../lib/activity';
import { formatRelativeDate } from '../../utils/formatDate';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import { EmptyState } from '../ui/EmptyState';

const ACTIVITY_META: Record<ActivityType, { icon: React.ComponentType<{ size: number; color: string }>; color: string }> = {
  tabloid_created: { icon: FileText, color: Colors.primary },
  campaign_published: { icon: Megaphone, color: Colors.success },
  product_added: { icon: Package, color: Colors.warning },
  price_adjusted: { icon: DollarSign, color: Colors.success },
};

function timestampToDate(value: unknown): Date | null {
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}

interface ActivityFeedProps {
  activities: FirestoreActivity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { paddingHorizontal: Layout.spacing.lg }]}>Atividades Recentes</Text>
      {activities.length === 0 ? (
        <EmptyState
          icon={<Clock size={28} color={Colors.primary} />}
          title="Nenhuma atividade recente"
          subtitle="Suas ações no app aparecerão aqui"
        />
      ) : (
        <View style={styles.list}>
          {activities.map((activity, index) => {
            const meta = ACTIVITY_META[activity.type];
            const Icon = meta.icon;
            const date = timestampToDate(activity.createdAt);
            return (
              <View key={activity.id} style={[styles.item, index < activities.length - 1 && styles.itemBorder]}>
                <View style={[styles.iconWrapper, { backgroundColor: meta.color + '20' }]}>
                  <Icon size={16} color={meta.color} />
                </View>
                <View style={styles.content}>
                  <Text style={styles.description}>{activity.description}</Text>
                  <Text style={styles.timestamp}>{date ? formatRelativeDate(date) : 'Agora'}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: Layout.spacing['2xl'],
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: Colors.text,
    marginBottom: Layout.spacing.md,
  },
  list: {
    backgroundColor: Colors.card,
    marginHorizontal: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    ...Layout.shadow.card,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    gap: 12,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  description: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  timestamp: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
