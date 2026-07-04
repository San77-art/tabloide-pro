import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity,
  RefreshControl, Modal, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, X, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing, FadeInDown,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SummaryCard } from '../../components/dashboard/SummaryCard';
import { RecentCampaigns } from '../../components/dashboard/RecentCampaigns';
import { ActivityFeed } from '../../components/dashboard/ActivityFeed';
import { useMarket } from '../../hooks/useMarket';
import { useTabloids } from '../../hooks/useTabloids';
import { useCampaigns } from '../../hooks/useCampaigns';
import { useProducts } from '../../hooks/useProducts';
import { useActivities } from '../../hooks/useActivities';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

const LAST_NOTIF_KEY = 'tab:lastNotifSeen';

function formatRelativeTime(ts: unknown): string {
  if (!ts || typeof ts !== 'object' || !('toDate' in ts)) return '';
  try {
    const date = (ts as { toDate: () => Date }).toDate();
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `há ${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `há ${hrs}h`;
    return `há ${Math.floor(hrs / 24)}d`;
  } catch {
    return '';
  }
}

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [notifVisible, setNotifVisible] = useState(false);
  const [lastNotifSeen, setLastNotifSeen] = useState<Date | null>(null);
  const insets = useSafeAreaInsets();
  const headerOpacity = useSharedValue(0);
  const headerTranslate = useSharedValue(-12);

  const { market } = useMarket();
  const { tabs } = useTabloids();
  const { allCampaigns } = useCampaigns();
  const { allProducts } = useProducts();
  const { activities } = useActivities();

  const now = new Date();
  const tabsThisMonth = tabs.filter((t) => {
    const createdAt = t.createdAt as { toDate?: () => Date } | undefined;
    const date = createdAt?.toDate ? createdAt.toDate() : null;
    return date && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;
  const activeCampaignsCount = allCampaigns.filter((c) => c.status === 'active').length;

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
    headerTranslate.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) });
    AsyncStorage.getItem(LAST_NOTIF_KEY).then((val) => {
      if (val) setLastNotifSeen(new Date(val));
    });
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslate.value }],
  }));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Os hooks onSnapshot já mantêm dados em tempo real.
    // O estado "refreshing" dá feedback visual ao usuário.
    setTimeout(() => {
      setRefreshing(false);
      setLastRefreshed(new Date());
    }, 600);
  }, []);

  const newActivitiesCount = lastNotifSeen
    ? activities.filter((a) => {
        const ts = a.createdAt as { toDate?: () => Date } | undefined;
        const date = ts?.toDate ? ts.toDate() : null;
        return date && date > lastNotifSeen;
      }).length
    : activities.length;

  const handleOpenNotif = () => {
    setNotifVisible(true);
    const now = new Date();
    setLastNotifSeen(now);
    AsyncStorage.setItem(LAST_NOTIF_KEY, now.toISOString());
  };

  const mins = Math.floor((Date.now() - lastRefreshed.getTime()) / 60000);
  const refreshedLabel = mins < 1 ? 'agora' : `há ${mins}min`;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top }]}
      >
        <Animated.View style={[styles.headerContent, headerStyle]}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Olá, {market?.name ?? 'Meu Mercado'}!</Text>
            <Text style={styles.subGreeting}>Atualizado {refreshedLabel}</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={handleOpenNotif}>
            <Bell size={22} color="#fff" strokeWidth={2} />
            {newActivitiesCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {newActivitiesCount > 9 ? '9+' : String(newActivitiesCount)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <Animated.View entering={FadeInDown.delay(0).duration(500)}>
          <SummaryCard
            tabsCount={tabsThisMonth}
            campaignsCount={activeCampaignsCount}
            productsCount={allProducts.length}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <RecentCampaigns campaigns={allCampaigns} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <ActivityFeed activities={activities} />
        </Animated.View>

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Modal de notificações */}
      <Modal visible={notifVisible} transparent animationType="fade" onRequestClose={() => setNotifVisible(false)}>
        <View style={styles.notifOverlay}>
          <View style={styles.notifSheet}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifTitle}>Notificações</Text>
              <TouchableOpacity onPress={() => setNotifVisible(false)} style={styles.notifClose}>
                <X size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {activities.length === 0 ? (
              <View style={styles.notifEmpty}>
                <Bell size={32} color={Colors.border} />
                <Text style={styles.notifEmptyText}>Nenhuma atividade recente</Text>
              </View>
            ) : (
              <FlatList
                data={activities}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.notifItem}>
                    <View style={styles.notifDotSmall} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifItemText}>{item.description}</Text>
                      <View style={styles.notifTimeRow}>
                        <Clock size={10} color={Colors.textMuted} />
                        <Text style={styles.notifTime}>{formatRelativeTime(item.createdAt)}</Text>
                      </View>
                    </View>
                  </View>
                )}
                ItemSeparatorComponent={() => <View style={styles.notifSep} />}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGradient: { paddingHorizontal: Layout.spacing.lg, paddingBottom: Layout.spacing.xl },
  headerContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Layout.spacing.md, minHeight: 72,
  },
  headerText: { flex: 1, marginRight: Layout.spacing.md },
  greeting: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: '#fff', lineHeight: 30 },
  subGreeting: { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  notifBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute', top: 6, right: 6,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.danger, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#fff', paddingHorizontal: 3,
  },
  notifBadgeText: { fontFamily: 'Poppins_700Bold', fontSize: 9, color: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: Layout.spacing.lg, paddingBottom: 24 },
  bottomPad: { height: 16 },
  notifOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  notifSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Layout.borderRadius.xl,
    borderTopRightRadius: Layout.borderRadius.xl,
    padding: Layout.spacing['2xl'],
    paddingBottom: 40,
    maxHeight: '70%',
  },
  notifHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  notifTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: Colors.text },
  notifClose: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  notifEmpty: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  notifEmptyText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textMuted },
  notifItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 },
  notifDotSmall: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primary, marginTop: 5,
  },
  notifItemText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.text, lineHeight: 18 },
  notifTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  notifTime: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textMuted },
  notifSep: { height: 1, backgroundColor: Colors.border },
});
