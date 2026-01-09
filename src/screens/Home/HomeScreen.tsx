import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUserStore, useGameStore, useStatsStore, useEventStore, useMarketStore } from '../../core/store';
import { useProductStore } from '../../core/store/useProductStore';
import { theme } from '../../core/theme';
import type { RootStackParamList, RootTabParamList, AssetsStackParamList } from '../../navigation';
import QuarterlyReportModal, { FinancialData as ReportFinancialData } from '../Assets/MyCompany/QuarterlyReportModal';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

type HomeNavProp = CompositeNavigationProp<
  NativeStackNavigationProp<RootStackParamList, 'Home'>,
  BottomTabNavigationProp<RootTabParamList>
>;

const formatMoney = (value: number) => {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000) {
    const formatted = (value / 1_000_000).toFixed(1);
    return `$${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted} M`;
  }
  if (absolute >= 1_000) {
    const formatted = (value / 1_000).toFixed(1);
    return `$${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted} K`;
  }
  return `$${value.toLocaleString()} `;
};

const NewsItem = ({ text }: { text: string }) => (
  <View style={styles.newsItem}>
    <Text style={styles.newsBullet}>•</Text>
    <Text style={styles.newsText}>{text}</Text>
  </View>
);

const HomeScreen = () => {
  const navigation = useNavigation<HomeNavProp>();
  const { name, bio, gender, hasPremium, partner } = useUserStore();
  const { age, currentMonth, advanceMonth } = useGameStore();
  // TODO: Wire monthlyIncome/monthlyExpenses to real store values when available.
  const { money, netWorth, monthlyIncome, monthlyExpenses, setField, factoryCount, employeeCount } = useStatsStore();
  const { holdings } = useMarketStore();
  const { reset: resetProducts } = useProductStore();

  const investmentsValue = holdings.reduce((sum, item) => sum + item.estimatedValue, 0);


  const { lastLifeEvent } = useEventStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState<'EN' | 'TR'>('EN');
  const [showNews, setShowNews] = useState(false);

  // --- Quarterly Report State ---
  const [reportVisible, setReportVisible] = useState(false);
  const [lastReportData, setLastReportData] = useState<ReportFinancialData | null>(null);

  // --- Game Over State ---
  const [isGameOver, setIsGameOver] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isGameOver) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 2000, // 2 saniye fade-in
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [isGameOver]);

  const handleRestart = () => {
    // 1. Reset Animation & State
    setIsGameOver(false);
    fadeAnim.setValue(0);

    // 2. New Game+ Logic
    const retainedFactories = Math.floor((factoryCount || 0) * 0.10);
    const retainedEmployees = Math.floor((employeeCount || 0) * 0.10);

    // Reset Products Logic
    resetProducts();

    // Set New Stats
    setField('companyCapital', 100_000_000_000); // 100 Billion
    setField('money', 1_000_000_000); // 1 Billion
    setField('factoryCount', retainedFactories);
    setField('employeeCount', retainedEmployees);

    Alert.alert("New Game+", `You have been reborn!\n\n+ $100B Capital\n+ $1B Cash\n+ ${retainedFactories} Factories Retained\n+ ${retainedEmployees} Employees Retained`);
  };

  const handleAdvanceTime = async () => {
    try {
      console.log('>>> HomeScreen: Advancing 3 Months (Quarter)...');

      // 1. Advance by 3 months (Quarterly gameplay)
      const result = await advanceMonth(3);
      console.log('>>> Advance Result:', result);

      if (result && result.data) {
        console.log('>>> Quarter finished! Generating Report...');
        // Map Data
        const mappedData: ReportFinancialData = {
          productionCount: result.data.reportTotalProduction || 0,
          salesCount: result.data.reportTotalSales || 0,
          revenue: result.data.reportTotalRevenue || 0,
          totalExpenses: result.data.reportTotalExpenses || 0,
          netProfit: result.data.reportNetProfit || 0,
          endingCash: result.data.playerCash || 0,
          endingCapital: result.data.companyCapital || 0,
          inventory: result.data.reportTotalInventory || 0,
          reportCurrentRP: result.data.reportCurrentRP || 0,
          operationalSetback: result.data.operationalSetback || false,
          setbackMessage: result.data.setbackMessage || '',
          lostRevenue: result.data.lostRevenue || 0,
          lostUnits: result.data.lostUnits || 0,
        };
        setLastReportData(mappedData);
        setReportVisible(true);

        if (result.status === 'bankrupt') {
          // Alert yerine Game Over ekranını tetikle
          setIsGameOver(true);
        }
      }
    } catch (e) {
      console.error("Home Advance Error", e);
      Alert.alert("Error", "Could not advance time.");
    }
  };

  const displayName = name || 'New Player';
  const displayBio = bio || 'New to the rich life.';
  const genderSymbol = useMemo(() => {
    if (gender === 'male') return '♂';
    if (gender === 'female') return '♀';
    return '⚪';
  }, [gender]);

  const partnerBrief = partner
    ? `${partner.name} — ${partner.love >= 70 ? 'Relationship stable' : 'Some drama ahead'} `
    : 'Currently single.';

  const assetsBrief =
    netWorth > 25000
      ? 'Your assets are growing steadily.'
      : netWorth > 10000
        ? 'Volatile month so far.'
        : 'Time to build momentum.';

  const lifeBrief = lastLifeEvent ?? 'Nothing remarkable happened recently.';

  const handleNavigateTabs = (screen: keyof RootTabParamList) => {
    navigation.navigate('MainTabs', { screen } as any);
  };

  const handleNavigateStack = (screen: keyof RootStackParamList) => {
    navigation.navigate(screen as never);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1, gap: theme.spacing.xs }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.gender}>{genderSymbol}</Text>
              {hasPremium ? <Text style={styles.premiumTag}>PREMIUM</Text> : null}
            </View>
            <Text style={styles.bio}>{displayBio}</Text>
            <View style={styles.ageRow}>
              <View style={styles.ageGroup}>
                <Text style={styles.ageLabel}>Age</Text>
                <Text style={styles.ageValue}>{age}</Text>
                <Text style={styles.monthBadge}>Month {currentMonth}</Text>
              </View>
              <Pressable
                onPress={handleAdvanceTime}
                style={({ pressed }) => [
                  styles.nextMonthButton,
                  pressed && styles.nextMonthButtonPressed,
                ]}>
                <Text style={styles.nextMonthText}>Next Quarter &gt;&gt;</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setDrawerOpen(true)}
              style={({ pressed }) => [styles.hamburgerButton, pressed && styles.hamburgerPressed]}>
              <Text style={styles.hamburgerText}>☰</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Net Worth</Text>
              <Text style={styles.value}>{formatMoney(netWorth)}</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Cash</Text>
              <Text style={styles.value}>${money.toLocaleString()}</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Investments</Text>
              <Text style={styles.value}>{formatMoney(investmentsValue)}</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Income (Monthly)</Text>
              <Text style={styles.value}>
                {monthlyIncome ? formatMoney(monthlyIncome) : '$0'}
              </Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Expenses (Monthly)</Text>
              <Text style={styles.value}>
                {monthlyExpenses ? formatMoney(monthlyExpenses) : '$0'}
              </Text>
            </View>

            <View style={styles.cardActions}>
              <Pressable
                onPress={() => handleNavigateStack('MyCompany')}
                style={({ pressed }) => [
                  styles.primaryCardButton,
                  pressed && styles.primaryCardButtonPressed,
                ]}>
                <Text style={styles.primaryCardButtonText}>MY COMPANY</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowNews(true)}
                style={({ pressed }) => [
                  styles.secondaryCardButton,
                  pressed && styles.secondaryCardButtonPressed,
                ]}>
                <Text style={styles.secondaryCardButtonText}>NEWS</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Love</Text>
              <Text style={styles.statusText}>{partnerBrief}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Assets</Text>
              <Text style={styles.statusText}>{assetsBrief}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Life</Text>
              <Text style={styles.statusText}>{lifeBrief}</Text>
            </View>
          </View>
        </View>

        <View style={styles.entryRow}>
          <Pressable
            onPress={() => handleNavigateTabs('Life')}
            style={({ pressed }) => [styles.entryLife, pressed && styles.entryPressed]}>
            <Text style={styles.entryTitleDark}>LIFE</Text>
            <Text style={styles.entrySubtitleDark}>Lifestyle & Events</Text>
          </Pressable>
          <Pressable
            onPress={() => handleNavigateTabs('Assets')}
            style={({ pressed }) => [styles.entryAssets, pressed && styles.entryPressed]}>
            <Text style={styles.entryTitleLight}>ASSETS</Text>
            <Text style={styles.entrySubtitleLight}>Market & Company</Text>
          </Pressable>
          <Pressable
            onPress={() => handleNavigateTabs('Love')}
            style={({ pressed }) => [styles.entryLove, pressed && styles.entryPressed]}>
            <Text style={styles.entryTitleLight}>LOVE</Text>
            <Text style={styles.entrySubtitleLight}>Relationships & Drama</Text>
          </Pressable>
        </View>
      </ScrollView>

      {
        drawerOpen ? (
          <View style={styles.drawerOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setDrawerOpen(false)} />
            <View style={styles.drawer}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Settings</Text>
                <Pressable onPress={() => setDrawerOpen(false)}>
                  <Text style={styles.drawerClose}>✕</Text>
                </Pressable>
              </View>
              <DrawerItem label="Privacy Policy" onPress={() => console.log('Privacy Policy')} />
              <DrawerItem label="Terms & Conditions" onPress={() => console.log('Terms')} />
              <DrawerItem
                label="Notifications"
                onPress={() => setNotificationsEnabled(prev => !prev)}
                rightNode={
                  <Text style={styles.drawerMeta}>{notificationsEnabled ? 'On' : 'Off'}</Text>
                }
              />
              <DrawerItem
                label="Language"
                onPress={() => setLanguage(prev => (prev === 'EN' ? 'TR' : 'EN'))}
                rightNode={<Text style={styles.drawerMeta}>{language}</Text>}
              />
              <DrawerItem
                label="Be Premium"
                onPress={() => {
                  setDrawerOpen(false);
                  handleNavigateStack('Premium');
                }}
              />
            </View>
          </View>
        ) : null
      }

      <QuarterlyReportModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        reportData={lastReportData}
      />
      <Modal transparent visible={showNews} animationType="fade" onRequestClose={() => setShowNews(false)}>
        <View style={styles.newsOverlay}>
          <View style={styles.newsModal}>
            <View style={styles.newsHeader}>
              <Text style={styles.newsTitle}>News</Text>
              <TouchableOpacity onPress={() => setShowNews(false)}>
                <Text style={styles.newsClose}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <NewsItem text="Markets rally on tech earnings." />
              <NewsItem text="Luxury real estate market shows signs of cooling." />
              <NewsItem text="Casino regulators tighten VIP controls." />
              <NewsItem text="Private equity eyes distressed assets this quarter." />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- GAME OVER OVERLAY --- */}
      {isGameOver && (
        <Animated.View style={[styles.gameOverOverlay, { opacity: fadeAnim }]}>
          <Text style={styles.gameOverText}>GAME OVER</Text>
          <Text style={styles.gameOverSubText}>Your company realized its fate.</Text>

          <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
            <Text style={styles.restartButtonText}>NEW GAME</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

    </SafeAreaView >
  );
};

type DrawerItemProps = {
  label: string;
  onPress: () => void;
  rightNode?: React.ReactNode;
};

const DrawerItem = ({ label, onPress, rightNode }: DrawerItemProps) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.drawerItem, pressed && styles.drawerItemPressed]}>
    <Text style={styles.drawerItemText}>{label}</Text>
    {rightNode ? rightNode : null}
  </Pressable>
);

export default HomeScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  name: {
    fontSize: theme.typography.title,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  gender: {
    fontSize: theme.typography.subtitle,
    color: theme.colors.textSecondary,
  },
  premiumTag: {
    marginLeft: theme.spacing.xs,
    backgroundColor: theme.colors.accentSoft,
    color: theme.colors.accent,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 999,
    fontWeight: '800',
    fontSize: theme.typography.caption,
  },
  bio: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  ageGroup: {
    gap: 2,
  },
  ageLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    letterSpacing: 0.4,
  },
  ageValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '700',
  },
  monthBadge: {
    color: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    fontWeight: '700',
    fontSize: theme.typography.caption,
  },
  nextMonthButton: {
    backgroundColor: theme.colors.accentSoft,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.accent,
  },
  nextMonthButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  nextMonthText: {
    color: theme.colors.accent,
    fontWeight: '800',
    fontSize: theme.typography.caption + 1,
  },
  hamburgerButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
  },
  hamburgerPressed: {
    backgroundColor: theme.colors.cardSoft,
  },
  hamburgerText: {
    fontSize: 20,
    color: theme.colors.textPrimary,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
  },
  value: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  primaryCardButton: {
    flex: 1,
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.accent,
  },
  primaryCardButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  primaryCardButtonText: {
    color: theme.colors.accent,
    fontWeight: '800',
    fontSize: theme.typography.body,
  },
  secondaryCardButton: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  secondaryCardButtonPressed: {
    backgroundColor: theme.colors.cardSoft,
    transform: [{ scale: 0.98 }],
  },
  secondaryCardButtonText: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: theme.typography.body,
  },
  statusCard: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  statusRow: {
    gap: theme.spacing.xs,
  },
  statusLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statusText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  entryLife: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    justifyContent: 'center',
  },
  entryAssets: {
    flex: 1.15,
    backgroundColor: '#101010',
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d4af37',
    justifyContent: 'center',
  },
  entryLove: {
    flex: 1,
    backgroundColor: '#FF4B8B',
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ffb3d6',
    justifyContent: 'center',
  },
  entryTitleDark: {
    color: '#111',
    fontSize: theme.typography.subtitle + 2,
    fontWeight: '800',
  },
  entrySubtitleDark: {
    color: '#444',
    marginTop: 4,
    fontSize: theme.typography.caption + 1,
  },
  entryTitleLight: {
    color: '#fff',
    fontSize: theme.typography.subtitle + 2,
    fontWeight: '800',
  },
  entrySubtitleLight: {
    color: '#f8f8f8',
    marginTop: 4,
    fontSize: theme.typography.caption + 1,
  },
  entryPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  drawer: {
    width: '72%',
    backgroundColor: theme.colors.card,
    height: '100%',
    padding: theme.spacing.lg,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  drawerTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
  },
  drawerClose: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.title,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  drawerItemPressed: {
    backgroundColor: theme.colors.cardSoft,
  },
  drawerItemText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: '700',
  },
  drawerMeta: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
  },
  newsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  newsModal: {
    width: '100%',
    maxHeight: '70%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  newsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newsTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
  },
  newsClose: {
    color: theme.colors.accent,
    fontWeight: '700',
  },
  newsItem: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  newsBullet: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
  },
  newsText: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    lineHeight: 20,
  },
  gameOverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gameOverText: {
    fontSize: 48,
    fontWeight: '900',
    color: theme.colors.danger,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 8,
  },
  gameOverSubText: {
    fontSize: 16,
    color: '#ddd',
    textAlign: 'center',
    marginBottom: 40,
  },
  restartButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    elevation: 5,
  },
  restartButtonText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 16,
  },
});
