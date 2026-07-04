import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LayoutDashboard, FileImage, Plus, Megaphone, MoreHorizontal, DollarSign, Tag } from 'lucide-react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import { router } from 'expo-router';

type LucideIcon = React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;

function TabIcon({ Icon, size, focused, color }: { Icon: LucideIcon; size: number; focused: boolean; color: string }) {
  if (focused) {
    return (
      <LinearGradient colors={Colors.primaryGradient} style={styles.activeIconBg}>
        <Icon size={size - 2} color="#fff" strokeWidth={2} />
      </LinearGradient>
    );
  }
  return <Icon size={size} color={color} strokeWidth={1.8} />;
}

function PlusButton() {
  const pulse = useSharedValue(1);
  const press = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 800 }),
        withTiming(1.0, { duration: 800 }),
      ),
      -1,
      false,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));

  const handlePress = () => {
    press.value = withSpring(0.9, {}, () => { press.value = withSpring(1); });
    router.push('/create');
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={styles.plusWrapper}>
      <Animated.View style={pulseStyle}>
        <Animated.View style={pressStyle}>
          <LinearGradient colors={Colors.primaryGradient} style={styles.plusButton}>
            <Plus size={28} color="#fff" strokeWidth={2.5} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.tabBarActive,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        tabBarLabelStyle: styles.tabLabel,
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon Icon={LayoutDashboard} size={size} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tabs"
        options={{
          title: 'Tabs',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon Icon={FileImage} size={size} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create-tab"
        options={{
          title: '',
          tabBarIcon: () => null,
          tabBarButton: () => <PlusButton />,
        }}
      />
      <Tabs.Screen
        name="campaigns"
        options={{
          title: 'Campanhas',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon Icon={Megaphone} size={size} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="exchange"
        options={{
          title: 'Cotação',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon Icon={DollarSign} size={size} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="promotions"
        options={{
          title: 'Promoções',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon Icon={Tag} size={size} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Mais',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon Icon={MoreHorizontal} size={size} focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBarBg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: 68,
    paddingBottom: 10,
    paddingTop: 8,
    elevation: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  tabLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    marginTop: 2,
  },
  activeIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  plusButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
});
