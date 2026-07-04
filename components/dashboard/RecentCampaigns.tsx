import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Megaphone } from 'lucide-react-native';
import { FirestoreCampaign } from '../../hooks/useCampaigns';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import { EmptyState } from '../ui/EmptyState';

interface RecentCampaignsProps {
  campaigns: FirestoreCampaign[];
}

export function RecentCampaigns({ campaigns }: RecentCampaignsProps) {
  const recent = campaigns.slice(0, 5);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Campanhas Recentes</Text>
        {recent.length > 0 && (
          <TouchableOpacity onPress={() => router.push('/(tabs)/campaigns')}>
            <Text style={styles.seeAll}>Ver todas</Text>
          </TouchableOpacity>
        )}
      </View>

      {recent.length === 0 ? (
        <EmptyState
          icon={<Megaphone size={28} color={Colors.primary} />}
          title="Nenhuma campanha criada ainda"
          subtitle="Crie sua primeira campanha para divulgar suas ofertas"
          actionLabel="Criar primeira campanha"
          onAction={() => router.push('/(tabs)/campaigns')}
        />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {recent.map((campaign) => (
            <TouchableOpacity key={campaign.id} activeOpacity={0.85} style={styles.campaignCard}>
              <LinearGradient
                colors={['#0F172A', Colors.primary]}
                style={styles.gradient}
              >
                <View style={styles.cardContent}>
                  <Text style={styles.campaignName} numberOfLines={2}>{campaign.name}</Text>
                  <Text style={styles.campaignDesc} numberOfLines={1}>{campaign.description}</Text>
                  <View style={styles.statsRow}>
                    <Text style={styles.stat}>👁 {campaign.views ?? 0}</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: Layout.spacing['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: Colors.text,
  },
  seeAll: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.primary,
  },
  scroll: {
    paddingHorizontal: Layout.spacing.lg,
    gap: 12,
  },
  campaignCard: {
    width: 160,
    height: 120,
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
    ...Layout.shadow.card,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cardContent: {
    padding: 12,
  },
  campaignName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: '#fff',
    lineHeight: 17,
  },
  campaignDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  statsRow: {
    marginTop: 6,
  },
  stat: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
  },
});
