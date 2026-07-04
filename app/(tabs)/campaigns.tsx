import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Megaphone } from 'lucide-react-native';
import { router } from 'expo-router';
import { CampaignCard } from '../../components/campaigns/CampaignCard';
import { useCampaigns } from '../../hooks/useCampaigns';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import { EmptyState } from '../../components/ui/EmptyState';

const TABS = [
  { key: 'active', label: 'Ativas' },
  { key: 'scheduled', label: 'Programadas' },
  { key: 'finished', label: 'Finalizadas' },
] as const;

export default function CampaignsScreen() {
  const { campaigns, activeTab, setActiveTab } = useCampaigns();

  const handleNewCampaign = () => {
    router.push('/campaign/new');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Campanhas</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleNewCampaign}>
          <Plus size={18} color="#fff" />
          <Text style={styles.addBtnText}>Nova campanha</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
        <View style={styles.listCard}>
          {campaigns.length === 0 ? (
            <EmptyState
              icon={<Megaphone size={28} color={Colors.primary} />}
              title={`Nenhuma campanha ${TABS.find((t) => t.key === activeTab)?.label.toLowerCase()}`}
              subtitle="Crie uma campanha para divulgar suas ofertas"
              actionLabel="Nova campanha"
              onAction={handleNewCampaign}
            />
          ) : (
            campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                onPress={() => router.push(`/campaign/${campaign.id}`)}
                campaign={{
                  ...campaign,
                  tabCount: campaign.tabloidIds?.length ?? 0,
                }}
              />
            ))
          )}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: Colors.text,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Layout.borderRadius.full,
  },
  addBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.textMuted,
  },
  tabLabelActive: {
    color: '#fff',
  },
  list: {
    flex: 1,
    paddingHorizontal: Layout.spacing.lg,
  },
  listCard: {
    backgroundColor: Colors.card,
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
    ...Layout.shadow.card,
  },
});
