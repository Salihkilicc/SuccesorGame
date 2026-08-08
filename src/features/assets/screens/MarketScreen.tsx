// dosya: src/screens/Assets/Market/MarketScreen.tsx

import React, { useMemo, useState, useEffect } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useEventStore } from '../../../core/store';
import { useUserStore } from '../../../core/store/useUserStore';
import { useMarketStore } from '../../../core/store/useMarketStore';
import { useCorporateFinanceStore } from '../../../features/finance/stores/useCorporateFinanceStore';
import { triggerEvent } from '../../../event/eventEngine';
import { theme } from '../../../core/theme';
import { useAssetsLogic } from '../hooks/useAssetsLogic';

// Bileşenler
import AppScreen from '../../../components/layout/AppScreen';
import MarketOverview from '../../../components/Market/MarketOverview';
import StockItemSkeleton from '../../../components/Market/StockItemSkeleton';
import PortfolioModal from '../../../components/Market/PortfolioModal';
import MarketTicker from '../../../components/Market/MarketTicker';
import { CategoryTabs, TabKey, TabOption } from '../components/CategoryTabs';
import CrystalNavBar from '../../../navigation/components/CrystalNavBar';
import AppLaunchLoader from '../../../components/common/AppLaunchLoader';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Veriler ve Tipler
import { INITIAL_MARKET_ITEMS } from '../data/marketData';
import { MarketItem, StockItem, BondItem, CryptoAsset, FundItem } from '../../../components/Market/marketTypes';
import { formatMoney as formatMoneyExact } from '../../../core/utils';

// Type Guards
function isCrypto(item: MarketItem): item is CryptoAsset {
  return 'volatility' in item;
}
function isBond(item: MarketItem): item is BondItem {
  return 'issuerType' in item;
}
function isFund(item: MarketItem): item is FundItem {
  return 'expenseRatio' in item;
}
function isStock(item: MarketItem): item is StockItem {
  return !isCrypto(item) && !isBond(item) && !isFund(item);
}

// --- TABS & CONFIG ---
const MAIN_TABS: TabOption<TabKey>[] = [
  { key: 'stocks', get label() { return t('company.stocks'); } },
  { key: 'crypto', get label() { return t('company.crypto'); } },
  { key: 'bonds', get label() { return t('company.bonds'); } },
  { key: 'funds', get label() { return t('company.funds'); } },
];

type StockCategory = 'Technology' | 'Industrial' | 'Finance' | 'Health';
const STOCK_SUB_TABS: TabOption<StockCategory>[] = [
  { key: 'Technology', get label() { return t('company.technology'); } },
  { key: 'Health', get label() { return t('company.health'); } },
  { key: 'Industrial', get label() { return t('company.industrial'); } },
  { key: 'Finance', get label() { return t('company.finance'); } },
];

const MarketScreen = () => {
    useLocale();
  const navigation = useNavigation<any>();
  const [selectedTab, setSelectedTab] = useState<TabKey>('stocks');
  const [stockCategory, setStockCategory] = useState<StockCategory>('Technology');
  const [showPortfolio, setShowPortfolio] = useState(false);
  const { investmentsValue, handleLiquidation } = useAssetsLogic();

  // Use Corporate Finance Store for subsidiaries
  const { subsidiaries } = useCorporateFinanceStore();

  // Market Store for Dynamic Prices
  const marketPrices = useMarketStore(state => state.marketPrices);
  const initializePrices = useMarketStore(state => state.initializePrices);

  useEffect(() => {
    initializePrices();
  }, [initializePrices]);

  const displayedItems = useMemo(() => {
    let items: MarketItem[] = [];

    if (selectedTab === 'stocks') {
      const stockItems = INITIAL_MARKET_ITEMS.filter(item => isStock(item)) as StockItem[];
      // Filter by Category
      items = stockItems.filter(s => s.category === stockCategory);

      // Filter out owned subsidiaries
      items = items.filter(item => !subsidiaries.some(sub => sub.id === item.id || sub.name === item.name));
    }
    else if (selectedTab === 'crypto') {
      items = INITIAL_MARKET_ITEMS.filter(item => isCrypto(item));
    }
    else if (selectedTab === 'bonds') {
      items = INITIAL_MARKET_ITEMS.filter(item => isBond(item));
    }
    else if (selectedTab === 'funds') {
      items = INITIAL_MARKET_ITEMS.filter(item => isFund(item));
    }

    return items;
  }, [selectedTab, stockCategory, subsidiaries]);

  // Paylasilan bicimlendiriciye devrediyor (core/utils).
  // Eskiden her dosyada ayri kademe zinciri vardi; esikleri farkli oldugu icin
  // ayni deger farkli ekranlarda farkli gorunuyordu.
  const formatMoney = (value: number) => {
    return formatMoneyExact(value);
  };

  return (
    <AppLaunchLoader
      appName="Market"
      appIcon={<MaterialCommunityIcons name="finance" size={64} color="#FFFFFF" />}
      backgroundColor="#020626"
    >
      <AppScreen
        title={t('company.market')}
        subtitle={t('company.financialInstruments')}
        leftNode={<BackButton navigation={navigation} />}
        compact
      >
        <View style={{ flex: 1 }}>
          {/* Ticker immediately below header - STICKY */}
          <MarketTicker items={INITIAL_MARKET_ITEMS} />

          <FlatList
            data={displayedItems}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}

            ListHeaderComponent={
              <>
                <PortfolioCard
                  investmentsValue={investmentsValue}
                  handleLiquidation={handleLiquidation}
                  formatMoney={formatMoney}
                  onSeeInvestments={() => setShowPortfolio(true)}
                />
                <MarketOverview trend="Bullish" volatility="Medium" />
                {/* TAB SECTION: Premium glass container */}
                <View style={styles.tabSection}>
                  <View style={styles.tabSectionAccent} />
                  <Text style={styles.tabSectionLabel}>{t('company.browseMarket')}</Text>

                  {/* ROW 1: Main Tabs */}
                  <CategoryTabs
                    tabs={MAIN_TABS}
                    selectedTab={selectedTab}
                    onSelectTab={setSelectedTab}
                  />

                  {/* ROW 2: Sub-Category Tabs (Conditional for Stocks) */}
                  {selectedTab === 'stocks' && (
                    <CategoryTabs
                      tabs={STOCK_SUB_TABS}
                      selectedTab={stockCategory}
                      onSelectTab={setStockCategory}
                      containerStyle={styles.subTabsContainer}
                    />
                  )}
                </View>
              </>
            }
            ListFooterComponent={<MarketEventFooter />}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}

            renderItem={({ item }) => {
              // Check if acquired (redundant now if filtered, but kept for safety)
              const isAcquired = isStock(item) && subsidiaries.some(s => s.id === item.id || s.name === item.name);
              const displayName = isAcquired ? `🔐 ${item.name}` : item.name;

              // Get dynamic price if available, else static
              const currentPrice = marketPrices[item.id] || (('price' in item) ? item.price : ('faceValue' in item) ? item.faceValue : 0);

              let metaText = '';
              const riskLevel = item.risk;

              if (isBond(item)) {
                metaText = `Yield: ${(item.couponRate * 100).toFixed(2)}% | ${(item as any).duration} Yr`;
              } else if (isCrypto(item)) {
                metaText = `Vol: ${item.volatility}`;
              } else if (isFund(item)) {
                metaText = `Exp: ${(item.expenseRatio * 100).toFixed(2)}%`;
              } else if (isStock(item)) {
                metaText = item.description || '';
              }

              return (
                <Pressable
                  onPress={() => navigation.navigate('StockDetail', {
                    symbol: (item as any).symbol || item.name,
                    price: currentPrice,
                    change: (item as any).change || 0,
                    category: (item as any).category || selectedTab,
                  })
                  }>
                  <StockItemSkeleton
                    symbol={(item as any).symbol || 'BOND'}
                    name={displayName}
                    price={currentPrice}
                    change={(item as any).change || 0}
                    riskTag={riskLevel}
                    meta={metaText}
                  />
                </Pressable>
              );
            }}
            showsVerticalScrollIndicator={false}
          />
        </View>
        <PortfolioModal visible={showPortfolio} onClose={() => setShowPortfolio(false)} />
        <CrystalNavBar activeTab="Company" variant="dark" />
      </AppScreen>
    </AppLaunchLoader>
  );
};

// --- ALT BİLEŞENLER (Okunabilirlik İçin Ayrıldı) ---

const PortfolioCard = ({
  investmentsValue,
  handleLiquidation,
  formatMoney,
  onSeeInvestments
}: {
  investmentsValue: number;
  handleLiquidation: () => void;
  formatMoney: (value: number) => string;
  onSeeInvestments: () => void;
}) => (
  <View style={styles.portfolioCard}>
    <View style={styles.portfolioHeader}>
      <Text style={styles.portfolioLabel}>{t('company.totalInvestments')}</Text>
      <Text style={styles.portfolioValue}>{formatMoney(investmentsValue)}</Text>
    </View>
    <View style={styles.portfolioActions}>
      <Pressable
        onPress={onSeeInvestments}
        style={({ pressed }) => [
          styles.seeInvestmentsButton,
          pressed && styles.seeInvestmentsButtonPressed
        ]}>
        <Text style={styles.seeInvestmentsButtonText}>👁️ See Investments</Text>
      </Pressable>
      {investmentsValue > 0 && (
        <Pressable
          onPress={handleLiquidation}
          style={({ pressed }) => [
            styles.liquidateButton,
            pressed && styles.liquidateButtonPressed
          ]}>
          <Text style={styles.liquidateButtonText}>{t('company.liquidateAll')}</Text>
        </Pressable>
      )}
    </View>
  </View>
);

const BackButton = ({ navigation }: { navigation: any }) => (
  <Pressable
    onPress={() => navigation.canGoBack() && navigation.goBack()}
    style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
    <Text style={styles.backIcon}>←</Text>
  </Pressable>
);

const MarketEventFooter = () => {
  const { lastMarketEvent } = useEventStore();
  return (
    <View style={styles.eventCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
        <Text style={styles.eventIcon}>📈</Text>
        <Text style={styles.sectionTitle}>{t('company.todayAposSMarketEvent')}</Text>
      </View>
      <Text style={styles.eventText}>
        {lastMarketEvent ?? t('market.noEventToday')}
      </Text>
      <Pressable
        onPress={() => void triggerEvent('market')}
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}>
        <Text style={styles.secondaryButtonText}>{t('company.triggerMarketEvent')}</Text>
      </Pressable>
    </View>
  );
};

export default MarketScreen;

const styles = StyleSheet.create({
  listContent: { padding: theme.spacing.lg, gap: theme.spacing.md, paddingBottom: theme.spacing.xl + theme.spacing.md },
  headerContainer: { gap: theme.spacing.md, marginBottom: theme.spacing.sm },
  tabBar: { backgroundColor: 'transparent' },
  tabBarContent: { paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.sm, gap: theme.spacing.sm },
  tab: { paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.md, borderRadius: 999, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  tabActive: { backgroundColor: 'rgba(199,52,202,0.15)', borderColor: 'rgba(255,255,255,0.08)' },
  tabLabel: { color: 'rgba(255,255,255,0.48)', fontWeight: '700', fontSize: theme.typography.caption + 1 },
  tabLabelActive: { color: '#C734CA' },
  subTabsContainer: { marginTop: 0, height: 48 },
  subTab: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
  subTabActive: { backgroundColor: 'rgba(199,52,202,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  tabSection: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 14,
    gap: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  tabSectionAccent: {
    height: 2,
    width: 40,
    backgroundColor: '#0B0635',
    borderRadius: 999,
    marginBottom: 2,
  },
  tabSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C734CA',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: theme.spacing.sm, marginTop: theme.spacing.lg, letterSpacing: 0.5 },
  eventCard: { marginTop: theme.spacing.md, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: theme.spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: theme.spacing.md },
  eventIcon: { fontSize: 16 },
  eventText: { fontSize: theme.typography.caption + 1, color: 'rgba(255,255,255,0.48)', lineHeight: 18 },
  secondaryButton: { backgroundColor: 'rgba(199,52,202,0.12)', paddingVertical: theme.spacing.md, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  secondaryButtonPressed: { backgroundColor: 'rgba(199,52,202,0.2)', transform: [{ scale: 0.98 }] },
  secondaryButtonText: { color: '#C734CA', fontWeight: '700', fontSize: theme.typography.body },
  backButton: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  backButtonPressed: { backgroundColor: 'rgba(255,255,255,0.1)', transform: [{ scale: 0.97 }] },
  backIcon: { color: '#FFFFFF', fontSize: theme.typography.subtitle, fontWeight: '700' },
  portfolioCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: theme.spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: theme.spacing.md, marginBottom: theme.spacing.md },
  portfolioHeader: { gap: theme.spacing.xs },
  portfolioLabel: { fontSize: theme.typography.caption, color: 'rgba(255,255,255,0.48)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  portfolioValue: { fontSize: theme.typography.title, color: '#FFFFFF', fontWeight: '800' },
  portfolioActions: { flexDirection: 'row', gap: theme.spacing.sm },
  seeInvestmentsButton: { flex: 1, backgroundColor: 'rgba(199,52,202,0.12)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingVertical: theme.spacing.sm, alignItems: 'center' },
  seeInvestmentsButtonPressed: { backgroundColor: 'rgba(199,52,202,0.22)', transform: [{ scale: 0.98 }] },
  seeInvestmentsButtonText: { color: '#C734CA', fontWeight: '800', fontSize: theme.typography.body },
  liquidateButton: { flex: 1, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingVertical: theme.spacing.sm, alignItems: 'center' },
  liquidateButtonPressed: { backgroundColor: 'rgba(199,52,202,0.1)', transform: [{ scale: 0.98 }] },
  liquidateButtonText: { color: '#C734CA', fontWeight: '700', fontSize: theme.typography.body },
});