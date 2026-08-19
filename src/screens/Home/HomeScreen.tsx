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
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUserStore, useGameStore, useStatsStore, useEventStore, useMarketStore } from '../../core/store';
import { useLaboratoryStore } from '../../core/store/useLaboratoryStore';
import { useProductStore } from '../../core/store/useProductStore';
import { useAssetsLogic } from '../../features/assets/hooks/useAssetsLogic';
import { theme } from '../../core/theme';
import { formatMoney, formatNumber } from '../../core/utils';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { MaterialTopTabNavigationProp } from '@react-navigation/material-top-tabs';
import type { RootStackParamList, SwipeTabParamList } from '../../navigation';
import QuarterlyReportModal, { FinancialData as ReportFinancialData } from '../../features/assets/screens/QuarterlyReportModal';
// ADDED: Education System Import
import { useEducationSystem } from '../../features/life/components/Education/store/useEducationSystem';
import { EducationExamModal } from '../../features/life/components/Education/modals/EducationExamModal';
// ADDED: Sanctuary System Import
import { startNewQuarter } from '../../features/life/components/Sanctuary/store/useSanctuarySystem';
import { useShareholderStore } from '../../features/shareholders/stores/useShareholderStore';
import { useEquityStore } from '../../features/finance/stores/useEquityStore';
import { FEATURES, filterByFeature, type FeatureKey } from '../../core/featureFlags';
import { startNewGameAsking } from '../../core/newGamePrompt';
import { useIdentityStore } from '../../core/store/useIdentityStore';
import { fullName } from '../../core/identity';
import UnreadBadge from '../../components/common/UnreadBadge';
import { useMessageStore, unreadCount } from '../../core/store/useMessageStore';
import { useMailStore, unreadMailCount } from '../../core/store/useMailStore';
import { t, useLocale, useLocaleStore } from '../../core/i18n';
import { START_EMPLOYEES } from '../../core/store/useStatsStore';
import { useNewsStore } from '../../core/store/useNewsStore';
import { SiliconNewsModal } from '../../features/news';
import { useStoryStore } from '../../core/store/useStoryStore';
import { endingById, ENDING_FOR_STATUS } from '../../data/story/endings';

type HomeNavProp = CompositeNavigationProp<
  NativeStackNavigationProp<RootStackParamList, 'Home'>,
  MaterialTopTabNavigationProp<SwipeTabParamList>
>;



const GRADIENTS = {
  purplePink: ['#05A8F6', '#05A8F6'],
  pinkRed: ['#FF8A8A', '#FF8A8A'],
  orangeYellow: ['#FF8A8A', '#FF8A8A'],
  blueSky: ['#CFD0D2', '#CFD0D2'],
  bluePurple: ['#CFD0D2', '#05A8F6'],
  darkGrey: ['#1C242C', '#535B5F'],
  networkBlue: ['#05A8F6', '#CFD0D2'],
  tealCyan: ['#CFD0D2', '#CFD0D2'],
};

// Home artık CEO hub'ı. Kapalı modüller `feature` alanı üzerinden süzülür.
const HOMESCREEN_APPS: Array<{
  key: string;
  label: string;
  icon: string;
  gradient: string[];
  feature?: FeatureKey;
}> = [
    { key: 'mail', get label() { return t('home.mail'); }, icon: 'email-outline', gradient: GRADIENTS.blueSky },
    { key: 'messages', get label() { return t('home.messages'); }, icon: 'message-processing-outline', gradient: GRADIENTS.networkBlue },
    { key: 'education', get label() { return t('home.education'); }, icon: 'school-outline', gradient: GRADIENTS.purplePink, feature: 'education' },
    { key: 'casino', get label() { return t('home.casino'); }, icon: 'cards-playing-outline', gradient: GRADIENTS.bluePurple, feature: 'casino' },
    { key: 'news', get label() { return t('home.news'); }, icon: 'newspaper-variant-outline', gradient: GRADIENTS.tealCyan },
  ];

/** SHELVED: see the gear button in the header. */
const SHOW_SETTINGS_DRAWER: boolean = false;

const ACTIVE_HOMESCREEN_APPS = filterByFeature(HOMESCREEN_APPS);

const NewsItem = ({ text }: { text: string }) => (
  <View style={styles.newsItem}>
    <Text style={styles.newsBullet}>•</Text>
    <Text style={styles.newsText}>{text}</Text>
  </View>
);

const HomeScreen = () => {
  const navigation = useNavigation<HomeNavProp>();
  // ------------------------------------------------------------------
  //  THE NAME COMES FROM THE IDENTITY STORE, NOT FROM HERE
  // ------------------------------------------------------------------
  //  This read `useUserStore().name`, which still holds the old default of
  //  'John Rich' - so onboarding wrote a name into one store and the home
  //  screen went on displaying another. Two places holding the same fact is
  //  the bug; having asked the player for it and then ignored the answer is
  //  just how it showed up.
  //
  //  useUserStore's `name` and `gender` are superseded (they are marked
  //  there) but kept, because shelved modules still reference them. The
  //  distinction that matters: useUserStore is wiped by a new game, and who
  //  you are is not.
  // ------------------------------------------------------------------
  const { bio, hasPremium, partner } = useUserStore();
  const firstName = useIdentityStore(s => s.firstName);
  const lastName = useIdentityStore(s => s.lastName);
  const gender = useIdentityStore(s => s.gender);
  const { age, currentMonth, advanceMonth, employeeMorale } = useGameStore();
  // Using useAssetsLogic for real-time financial data
  const { cash, netWorth, report: finances, investmentsValue } = useAssetsLogic();
  const { setField, factoryCount, employeeCount, brandValue, brandChange } = useStatsStore();
  const totalRP = useLaboratoryStore(s => s.totalRP);
  const { reset: resetProducts } = useProductStore();

  // Real Net Worth Calculation
  const { playerShareCount } = useShareholderStore();
  const { stockPrice } = useEquityStore();

  const equityValue = (playerShareCount || 0) * (stockPrice || 0);
  const realNetWorth = cash + equityValue + investmentsValue; // Total Wealth

  const { lastLifeEvent } = useEventStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  // OLU PLACEHOLDER KALDIRILDI: `useState<'EN'|'TR'>('EN')` idi, dugmeye
  // basinca yalnizca buradaki etiket degisiyordu ve ekran kapaninca
  // kayboluyordu. Artik tek kaynak: core/i18n.
  const locale = useLocale();
  const [showNews, setShowNews] = useState(false);
  // Subscribed rather than read once: a headline published while the player
  // is standing on the home screen should appear without a navigation.
  const newsItems = useNewsStore(state => state.items);
  // ------------------------------------------------------------------
  //  A STORY ENDING IS A GAME OVER TOO
  // ------------------------------------------------------------------
  //  The two that existed - bankrupt and removed - are decided inside the
  //  quarterly tick and arrive as a status on its result. An ending chosen
  //  in a CONVERSATION cannot travel that way: the decision happens four
  //  screens from here, between ticks, and this component's local state
  //  knows nothing about it.
  //
  //  So it goes through the story store, which is also what makes it
  //  survive a reload. A player who closes the app on the last screen
  //  should not come back to a company they no longer own.
  // ------------------------------------------------------------------
  const storyEnding = useStoryStore(state => state.ending);

  // --- Quarterly Report State ---
  const [reportVisible, setReportVisible] = useState(false);
  const [lastReportData, setLastReportData] = useState<ReportFinancialData | null>(null);

  // ------------------------------------------------------------------
  //  THE BACKSTOP, AND WHY IT IS AN ID RATHER THAN A SCREEN STATE
  // ------------------------------------------------------------------
  //  This was `gameOverReason: 'bankrupt' | 'removed'` plus a boolean, and
  //  the overlay chose its title and body from them with a nested ternary
  //  over four translation keys. So the screen held the words for two of
  //  the endings and the endings file held the words for the third.
  //
  //  The tick now names an ending for both of its terminal statuses, so
  //  `storyEnding` is normally all that is needed. This is kept anyway
  //  because `endGame` is called inside a try/catch that swallows a store
  //  that is not ready, and the fallback for "the ending did not get
  //  written" must not be "the game carries on after bankruptcy".
  //
  //  It holds an ID, not prose. Two things may DECIDE the game is over;
  //  only endings.ts says what that looks like.
  // ------------------------------------------------------------------
  const [fallbackEnding, setFallbackEnding] = useState<string | null>(null);
  const ending = endingById(storyEnding ?? fallbackEnding ?? '');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (ending) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 2000, // 2 saniye fade-in
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [ending]);

  /**
   * Temiz yeni oyun.
   *
   * ESKIDEN: "New Game+" adiyla 100 MILYAR sermaye ve 1 MILYAR nakit
   * veriyordu. Sacma baslangicin kaynagi buydu — iflas edince oyuncu
   * oyunun geri kalanini anlamsiz kilan bir servetle devam ediyordu.
   *
   * Artik startNewGame() tum store'lari ve diski temizleyip
   * initialStatsState, whose figures are the single source (see START_EMPLOYEES).
   */
  const handleRestart = async () => {
    // Both halves of it. `startNewGame` resets the story store, which clears
    // `ending`; the fallback is this screen's own and nothing else will.
    setFallbackEnding(null);
    fadeAnim.setValue(0);

    try {
      // Asks first, for somebody who has been through the first year - see
      // core/newGamePrompt.ts.
      await startNewGameAsking();
      Alert.alert(
        'New Game',
        t('newgame.freshStartBody', { v1: String(START_EMPLOYEES) }),
      );
    } catch (e) {
      console.error('[HomeScreen] Yeni oyun baslatilamadi', e);
      Alert.alert('Error', 'Could not start a new game. Check the console.');
    }
  };

  const handleAdvanceTime = async () => {
    try {
      console.log('>>> HomeScreen: Advancing 3 Months (Quarter)...');

      // 1. Advance by 3 months (Quarterly gameplay)
      const result = await advanceMonth(3);

      // 2. Advance Education System (Degrees, Certificates, Refresh Library)
      if (FEATURES.education) {
        useEducationSystem.getState().progressQuarter();
      }

      // 3. Sanctuary Cleanup (Reset Limits, Remove Temporary Luck Buffs)
      if (FEATURES.sanctuary) {
        startNewQuarter();
      }

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
          productBreakdown: result.data.productBreakdown || [], // PASS THE DATA!
        };
        setLastReportData(mappedData);
        setReportVisible(true);

        // IKI FARKLI BITIS. Ikisi de oyunu bitirir ama sebepleri
        // tamamen farkli ve oyuncunun hangisini yasadigini bilmesi
        // gerekir: parasi mi bitti, yoksa sirketi elinden mi alindi.
        //
        // The tick has already written the ending to the story store by the
        // time this runs. This translates the status into the SAME id, so
        // that if that write was swallowed the overlay still comes up with
        // the right text on it. See the note by `fallbackEnding`.
        if (result.status === 'bankrupt' || result.status === 'removed') {
          setFallbackEnding(ENDING_FOR_STATUS[result.status]);
        }
      }
    } catch (e) {
      console.error("Home Advance Error", e);
      Alert.alert("Error", "Could not advance time.");
    }
  };

  const unreadMessages = useMessageStore(st => unreadCount(st.threads));
  const unreadMail = useMailStore(st => unreadMailCount(st.inbox));

  const displayName = fullName(firstName, lastName) || 'New Player';
  const displayBio = bio || 'New to the rich life.';
  const genderSymbol = useMemo(() => {
    if (gender === 'male') return '♂';
    if (gender === 'female') return '♀';
    return '⚪';
  }, [gender]);

  const moraleBrief =
    employeeMorale >= 70
      ? `High (${Math.round(employeeMorale)}%)`
      : employeeMorale >= 40
        ? `Stable (${Math.round(employeeMorale)}%)`
        : `Critical (${Math.round(employeeMorale)}%)`;

  const rpBrief = `${formatNumber(Math.floor(totalRP || 0))} RP`;
  const brandBrief = `${Math.round(brandValue || 0)}`;
  const brandDelta = typeof brandChange === 'number' && Math.abs(brandChange) >= 0.05 ? brandChange : undefined;

  // Status widget satırları: CEO ve Şirket Yönetim Paneli
  const statusRows: { key: string; label: string; value: string; delta?: number }[] = [
    { key: 'team', label: 'Team Morale', value: moraleBrief },
    { key: 'research', label: t('company.research') || 'R&D Points', value: rpBrief },
    { key: 'brand', label: t('company.brandValue') || 'Brand Value', value: brandBrief, delta: brandDelta },
  ];

  const handleNavigateTabs = (screen: keyof SwipeTabParamList) => {
    navigation.navigate(screen as any);
  };

  const handleNavigateStack = (screen: keyof RootStackParamList) => {
    navigation.navigate(screen as never);
  };

  const handleAppAction = (key: string) => {
    switch (key) {
      case 'calendar': handleNavigateStack('Calendar'); break;
      case 'mail': navigation.navigate('Mail'); break;
      case 'messages': handleNavigateStack('Messages'); break;
      case 'education': handleNavigateStack('Education'); break;
      // The casino is its own stack, so it opens at the lobby rather than at
      // whichever screen that stack happens to list first.
      case 'casino':
        (navigation as any).navigate('Casino', { screen: 'CasinoLobby' });
        break;
      case 'settings': handleNavigateStack('Settings'); break;
      case 'news': setShowNews(true); break;
    }
  };

  // Each channel badges its OWN tile. Mail is the corporate wall and Messages
  // is your pocket; one merged number would say "four things" without saying
  // whether they are four letters from the board or four texts at midnight.
  const badgeFor = (key: string) =>
    key === 'messages' ? unreadMessages : key === 'mail' ? unreadMail : 0;

  const renderAppIcon = (item: { key: string; label: string; icon: string; gradient: string[] }) => (
    <Pressable key={item.key} style={({ pressed }) => [styles.appCard, pressed && styles.appCardPressed]} onPress={() => handleAppAction(item.key)}>
      <View>
        <LinearGradient
          colors={item.gradient}
          style={styles.appCardInner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons name={item.icon} size={34} color="#FFFFFF" style={styles.appIconVector} />
        </LinearGradient>
        <UnreadBadge count={badgeFor(item.key)} floating />
      </View>
      <Text style={styles.appIconLabel} numberOfLines={1}>{item.label}</Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#1C242C' }}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2874&auto=format&fit=crop' }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['rgba(28,36,44,0.3)', 'rgba(28,36,44,0.7)', 'rgba(28,36,44,0.9)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* ------------------------------------------------------------
            A FIXED DASHBOARD, NOT A SCROLLING PAGE
            ------------------------------------------------------------
            With Calendar off the grid the content fits, so the vertical
            drift served no purpose - the screen just wobbled under the
            thumb. `scrollEnabled={false}` keeps the ScrollView (nothing
            below needs rewriting) while pinning it, and the content is
            centred so it sits slightly lower rather than jammed under the
            wordmark.
           ------------------------------------------------------------ */}
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}>
          {/* ── Brand Logo + Ayarlar ── */}
          <View style={styles.brandContainer}>
            <Text style={styles.brandText}>{t('home.successor')}</Text>
            {/* The gear is now the ONE way into settings.
                It used to open a small drawer that duplicated the real
                Settings screen - language, notifications, terms, new game -
                while the screen itself sat behind an app icon further down.
                Two half-copies of the same thing, and the drawer's version
                was the poorer one. */}
            <Pressable
              onPress={() => handleNavigateStack('Settings')}
              hitSlop={12}
              style={styles.brandSettingsButton}
              accessibilityLabel="Settings"
            >
              <MaterialCommunityIcons name="cog-outline" size={22} color="rgba(255,255,255,0.55)" />
            </Pressable>
          </View>

          {/* ── Premium Player Header ── */}
          <View style={styles.headerCard}>
            {/* Top Row: Avatar + Name/Bio + Age/Month chips */}
            <View style={styles.headerTopRow}>
              {/* Avatar */}
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary, theme.colors.surfaceRaised]}
                style={styles.avatarCircle}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarInitial}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>

              {/* Name + Bio */}
              <View style={styles.headerNameBlock}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{displayName}</Text>
                  <Text style={styles.gender}>{genderSymbol}</Text>
                </View>
                <Text style={styles.bio} numberOfLines={1}>{displayBio}</Text>
              </View>

              {/* Age / Month chips — right-aligned, same row as name */}
              <View style={styles.ageChips}>
                <View style={styles.ageChip}>
                  <Text style={styles.ageChipLabel}>{t('home.age')}</Text>
                  <Text style={styles.ageChipValue}>{age}</Text>
                </View>
                <View style={styles.ageChipDivider} />
                <View style={styles.ageChip}>
                  <Text style={styles.ageChipLabel}>{t('home.mth')}</Text>
                  <Text style={styles.ageChipValue}>{currentMonth}</Text>
                </View>
              </View>
            </View>

            {/* Bottom Row: Full-width Next Quarter Button */}
            <Pressable
              onPress={handleAdvanceTime}
              style={({ pressed }) => [
                styles.nextMonthButton,
                pressed && styles.nextMonthButtonPressed,
              ]}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary, theme.colors.surfaceRaised]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.nextMonthContent}>
                <Text style={styles.nextMonthText}>{t('home.advanceToNextQuarter')}</Text>
                <MaterialCommunityIcons name="chevron-double-right" size={16} color="#FFFFFF" />
              </View>
            </Pressable>
          </View>

          <View style={styles.widgetsContainer}>
            {/* Overview Widget */}
            <TouchableOpacity
              style={[styles.widgetColumn, { flex: 1.25 }]}
              activeOpacity={0.8}
              onPress={() => handleNavigateStack('Assets')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs, justifyContent: 'space-between' }}>
                <Text style={styles.sectionTitle}>{t('home.overview')}</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.48)" />
              </View>
              <LinearGradient
                colors={['rgba(255,255,255,0.48)', '#1C242C', '#1C242C', '#CFD0D2']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                locations={[0, 0.2, 0.8, 1]}
                style={[styles.card, styles.widgetCard, styles.modernCard]}
              >
                <View style={styles.widgetRowBetween}>
                  <Text style={styles.widgetLabel}>{t('home.netWorth')}</Text>
                  <Text style={styles.widgetValue} numberOfLines={1} adjustsFontSizeToFit>{formatMoney(realNetWorth)}</Text>
                </View>
                <View style={styles.widgetRowBetween}>
                  <Text style={styles.widgetLabel}>{t('home.cash')}</Text>
                  <Text style={styles.widgetValue} numberOfLines={1} adjustsFontSizeToFit>{formatMoney(cash)}</Text>
                </View>
                <View style={styles.widgetRowBetween}>
                  <Text style={styles.widgetLabel}>{t('home.income')}</Text>
                  <Text style={[styles.widgetValue, { color: theme.colors.success }]} numberOfLines={1} adjustsFontSizeToFit>
                    {finances.totalIncome ? formatMoney(finances.totalIncome) : '$0'}
                  </Text>
                </View>
                <View style={[styles.widgetRowBetween, { marginBottom: 0 }]}>
                  <Text style={styles.widgetLabel}>{t('home.expenses')}</Text>
                  <Text style={[styles.widgetValue, { color: theme.colors.danger }]} numberOfLines={1} adjustsFontSizeToFit>
                    {finances.totalExpenses ? formatMoney(finances.totalExpenses) : '$0'}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Status Widget */}
            <View style={[styles.widgetColumn, { flex: 2 }]}>
              <Text style={[styles.sectionTitle, { marginBottom: theme.spacing.xs }]}>{t('home.status')}</Text>
              <LinearGradient
                colors={['rgba(255,255,255,0.48)', '#1C242C', '#1C242C', '#CFD0D2']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                locations={[0, 0.2, 0.8, 1]}
                style={[styles.widgetCard, styles.modernCard, styles.statusCardAdjuster]}
              >
                {statusRows.map((row, index) => (
                  <View
                    key={row.key}
                    style={[
                      styles.widgetStatusRow,
                      index === statusRows.length - 1 ? { marginBottom: 0 } : null,
                    ]}
                  >
                    <Text style={styles.statusLabel}>{row.label}</Text>
                    <View style={styles.statusValueContainer}>
                      <Text style={styles.widgetStatusText} numberOfLines={1}>{row.value}</Text>
                      {row.delta !== undefined && (
                        <Text
                          style={[
                            styles.statusDeltaText,
                            { color: row.delta > 0 ? theme.colors.up : theme.colors.down },
                          ]}
                          numberOfLines={1}
                        >
                          {row.delta > 0 ? `+${(Math.round(row.delta * 10) / 10).toFixed(1)}` : (Math.round(row.delta * 10) / 10).toFixed(1)}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </LinearGradient>
            </View>
          </View>

          <View style={styles.appsSection}>
            <Text style={[styles.sectionTitle, { marginBottom: theme.spacing.md }]}>{t('home.applications')}</Text>
            <View style={styles.appsGrid}>
              {ACTIVE_HOMESCREEN_APPS.map(renderAppIcon)}
            </View>
          </View>

        </ScrollView>

        {/* SHELVED: the settings drawer. Superseded by the Settings screen
            the gear now opens; kept behind the flag rather than removed. */}
        {
          SHOW_SETTINGS_DRAWER && drawerOpen ? (
            <View style={styles.drawerOverlay}>
              <Pressable style={StyleSheet.absoluteFill} onPress={() => setDrawerOpen(false)} />
              <View style={styles.drawer}>
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>{t('home.settings')}</Text>
                  {/* @exit-ok shelved drawer - SHOW_SETTINGS_DRAWER is false,
                      so this close is unreachable code kept on purpose. */}
                  <Pressable onPress={() => setDrawerOpen(false)}>
                    <Text style={styles.drawerClose}>✕</Text>
                  </Pressable>
                </View>
                <DrawerItem label={t('home.privacyPolicy')} onPress={() => console.log('Privacy Policy')} />
                <DrawerItem label={t('home.termsConditions')} onPress={() => console.log('Terms')} />
                <DrawerItem
                  label={t('home.notifications')}
                  onPress={() => setNotificationsEnabled(prev => !prev)}
                  rightNode={
                    <Text style={styles.drawerMeta}>{notificationsEnabled ? 'On' : 'Off'}</Text>
                  }
                />
                <DrawerItem
                  label={t('home.language')}
                  onPress={() => useLocaleStore.getState().setLocale(locale === 'en' ? 'tr' : 'en')}
                  rightNode={<Text style={styles.drawerMeta}>{locale.toUpperCase()}</Text>}
                />
                <DrawerItem
                  label={t('home.bePremium')}
                  onPress={() => {
                    setDrawerOpen(false);
                    handleNavigateStack('Premium');
                  }}
                />

                {/* Yeni oyun. Eskiden bu secenek yalnizca iflas ekraninda ve
                    God Mode'da vardi; God Mode Underworld sekmesinden
                    aciliyordu ve o sekme rafa kaldirildi (featureFlags).
                    Yani hicbir erisim yolu kalmamisti. */}
                <DrawerItem
                  label={t('home.newGame')}
                  rightNode={<Text style={styles.drawerMeta}>{t('home.reset')}</Text>}
                  onPress={() => {
                    setDrawerOpen(false);
                    Alert.alert(
                      'New Game',
                      'All progress will be erased and a fresh run will be set up. Are you sure?',
                      [
                        { text: t('home.cancel'), style: 'cancel' },
                        {
                          text: t('home.reset'),
                          style: 'destructive',
                          onPress: () => { void handleRestart(); },
                        },
                      ],
                    );
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
        <SiliconNewsModal
          visible={showNews}
          onClose={() => setShowNews(false)}
        />

        {/* --- GAME OVER OVERLAY --- */}
        {/*
          There is no ternary left in here, which was the point of the
          exercise. Every ending renders the same way and a new one is a
          record in data/story/endings.ts and nothing else.

          SHELVED, the version this replaces:

            {(isGameOver || !!ending) && (
              <Text style={styles.gameOverText}>
                {ending ? ending.title
                  : gameOverReason === 'removed' ? t('gameover.removed') : t('gameover.bankrupt')}
              </Text>
              <Text style={styles.gameOverSubText}>
                {ending ? ending.body
                  : gameOverReason === 'removed' ? t('gameover.removedBody') : t('gameover.bankruptBody')}
              </Text>
            )}
        */}
        {
          !!ending && (
            <Animated.View style={[styles.gameOverOverlay, { opacity: fadeAnim }]}>
              <Text style={styles.gameOverText}>{ending.title}</Text>
              <Text style={styles.gameOverSubText}>{ending.body}</Text>

              <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
                <Text style={styles.restartButtonText}>{t('gameover.newGame')}</Text>
              </TouchableOpacity>
            </Animated.View>
          )
        }

        {/* Education Exam Modal - Only show when report is closed */}
        {FEATURES.education && !reportVisible && <EducationExamModal />}

        {/* Universal Crystal Navigation Bar (Dark Variant) */}
      </SafeAreaView >
    </View>
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
    // Background is handled by AbsoluteFill LinearGradient
  },
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    // Clear of the nav bar. The old 160 was there so a scrolling page could
    // reach its end; nothing scrolls now.
    paddingBottom: 110,
    // ------------------------------------------------------------------
    //  THE WHOLE PAGE, A FEW POINTS HIGHER
    // ------------------------------------------------------------------
    //  The wordmark, the gear and the player card sat a touch low against
    //  the status bar. A translate rather than trimming the brand's own
    //  marginTop: this container centres its children, so taking eight
    //  points off the first child's margin moves the group up by four and
    //  changes the gap under the wordmark as a side effect. A transform
    //  moves everything by exactly the number written here and leaves every
    //  spacing relationship inside the page alone.
    //
    //  Six points. Enough to read as deliberate, small enough that nobody
    //  who has not been told will notice.
    // ------------------------------------------------------------------
    transform: [{ translateY: -6 }],
  },
  // ── Premium Header Card ──
  headerCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    padding: 14,
    gap: 12,
    marginBottom: 4,
    shadowColor: '#1C242C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' }, // legacy stub
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 }, // legacy stub
  headerRight: { alignItems: 'flex-end' }, // legacy stub
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1C242C', // Dark gold shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  headerNameBlock: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  gender: {
    fontSize: 13,
    color: '#FFFFFF',
  },
  premiumTag: {
    marginLeft: theme.spacing.xs,
    backgroundColor: theme.colors.accentSoft,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 999,
    fontWeight: '800',
    fontSize: theme.typography.caption,
  },
  bio: {
    color: '#FFFFFF',
    fontSize: 11,
    letterSpacing: 0.1,
  },
  ageChips: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5,168,246,0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(5,168,246,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
  },
  ageChip: {
    alignItems: 'center',
  },
  ageChipLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  ageChipValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  ageChipDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(5,168,246,0.3)',
  },
  // --- Legacy stubs ---
  ageRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  ageGroup: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  ageLabel: { color: theme.colors.textMuted, fontSize: theme.typography.caption },
  ageValue: { color: theme.colors.textPrimary, fontSize: theme.typography.subtitle, fontWeight: '700' },
  monthBadge: { color: theme.colors.textPrimary, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs },
  nextMonthButton: {
    shadowColor: '#1C242C', // Dark gold shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8, // Increased opacity for better glow
    shadowRadius: 12,
    elevation: 8,
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
    marginTop: 6,
  },
  nextMonthContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 14,
    gap: 8,
  },
  nextMonthButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  nextMonthText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11.3,
    letterSpacing: 4,
    textTransform: 'uppercase',
    textAlign: 'center',
    textShadowColor: 'rgba(5,168,246,0.4)', // Softer glow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
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
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  widgetsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'stretch',
  },
  widgetColumn: {
    flex: 1,
  },
  widgetCard: {
    flex: 1,
    paddingVertical: 32,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    minHeight: 250,
  },
  widgetRowBetween: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  widgetLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
  },
  widgetValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.caption + 2,
    fontWeight: '700',
  },
  appsSection: {
    marginTop: theme.spacing.sm,
  },
  appsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
    paddingHorizontal: 0,
  },
  appCard: {
    // 19% x 5 = 95%, the remaining 5% spread as four gaps by space-between.
    // As large as five-across allows without wrapping.
    width: '19%',
    aspectRatio: 0.75, // Matching Apple ratio
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#1C242C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  appCardPressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.85,
  },
  appCardInner: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  appIconVector: {
    textShadowColor: 'rgba(28,36,44,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  appIconLabel: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  widgetStatusRow: {
    marginBottom: theme.spacing.xs,
  },
  statusValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  widgetStatusText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.caption + 1,
    marginTop: 0,
  },
  statusDeltaText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusCardAdjuster: {
    justifyContent: 'flex-start',
    paddingTop: 30,
    gap: theme.spacing.xl || 24,
  },
  card: {
    backgroundColor: '#434B50',
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: theme.spacing.sm,
    shadowColor: '#1C242C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: theme.typography.caption + 1,
  },
  value: {
    color: '#FFFFFF',
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
    color: theme.colors.textPrimary,
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
    backgroundColor: '#434B50',
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: theme.spacing.md,
    shadowColor: '#1C242C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
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
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    padding: theme.spacing.lg * 0.9,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    justifyContent: 'center',
  },
  entryAssets: {
    flex: 1.15,
    backgroundColor: '#434B50',
    padding: theme.spacing.lg * 0.9,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
  },
  entryLove: {
    flex: 1,
    backgroundColor: '#434B50',
    padding: theme.spacing.lg * 0.9,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
  },
  entryTitleDark: {
    color: '#FFFFFF',
    fontSize: (theme.typography.subtitle + 2) * 0.9,
    fontWeight: '800',
  },
  entrySubtitleDark: {
    color: '#FFFFFF',
    marginTop: 4 * 0.9,
    fontSize: (theme.typography.caption + 1) * 0.9,
  },
  entryTitleLight: {
    color: '#FFFFFF',
    fontSize: (theme.typography.subtitle + 2) * 0.9,
    fontWeight: '800',
  },
  entrySubtitleLight: {
    color: '#FFFFFF',
    marginTop: 4 * 0.9,
    fontSize: (theme.typography.caption + 1) * 0.9,
  },
  entryPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28,36,44,0.35)',
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
    backgroundColor: 'rgba(28,36,44,0.4)',
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
    color: theme.colors.textPrimary,
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
    backgroundColor: 'rgba(28,36,44,0.85)',
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
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
  },
  restartButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    elevation: 5,
  },
  restartButtonText: {
    color: theme.colors.onLight,
    fontWeight: '800',
    fontSize: 16,
  },
  brandContainer: {
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandSettingsButton: {
    padding: 4,
  },
  brandText: {
    fontSize: 22,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 6,
    textShadowColor: 'rgba(255,255,255,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    textTransform: 'uppercase',
  },
  modernCard: {
    backgroundColor: 'transparent',
    borderRadius: 33,
    borderWidth: 0,
    shadowColor: '#CFD0D2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
    marginHorizontal: -12,
    marginVertical: -8,
    padding: 30,
    paddingBottom: 10,
  },
});