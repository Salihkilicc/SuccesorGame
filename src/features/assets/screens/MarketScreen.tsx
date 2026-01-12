// dosya: src/screens/Assets/Market/MarketScreen.tsx

import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useEventStore } from '../../../core/store';
import { useUserStore } from '../../../core/store/useUserStore';
import { useMarketStore } from '../../../core/store/useMarketStore';
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

// Veriler ve Tipler
import { INITIAL_MARKET_ITEMS } from '../data/marketData';
import { MarketItem, StockItem, BondItem, CryptoAsset, FundItem } from '../../../components/Market/marketTypes';

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
  { key: 'stocks', label: 'Stocks' },
  { key: 'crypto', label: 'Crypto' },
  { key: 'bonds', label: 'Bonds' },
  { key: 'funds', label: 'Funds' },
];

type StockCategory = 'Technology' | 'Industrial' | 'Finance' | 'Health';
const STOCK_SUB_TABS: TabOption<StockCategory>[] = [
  { key: 'Technology', label: 'Technology' },
  { key: 'Health', label: 'Health' },
  { key: 'Industrial', label: 'Industrial' },
  { key: 'Finance', label: 'Finance' },
];

const MarketScreen = () => {
  const navigation = useNavigation<any>();
  const [selectedTab, setSelectedTab] = useState<TabKey>('stocks');
  const [stockCategory, setStockCategory] = useState<StockCategory>('Technology');
  const [showPortfolio, setShowPortfolio] = useState(false);
  const { investmentsValue, handleLiquidation } = useAssetsLogic();
  const subsidiaries = useUserStore(state => state.subsidiaries);

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
      items = stockItems.filter(s => s.category === stockCategory);
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
  }, [selectedTab, stockCategory]);

  const formatMoney = (value: number) => {
    const absolute = Math.abs(value);
    if (absolute >= 1_000_000) {
      const formatted = (value / 1_000_000).toFixed(1);
      return `$${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}M`;
    }
    if (absolute >= 1_000) {
      const formatted = (value / 1_000).toFixed(1);
      return `$${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  return (
    <AppScreen
      title="MARKET"
      subtitle="Financial Instruments"
      leftNode={<BackButton navigation={navigation} />}
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
              <View style={{ height: 16 }} />

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
                  tabStyle={styles.subTab}
                  activeTabStyle={styles.subTabActive}
                />
              )}
            </>
          }
          ListFooterComponent={<MarketEventFooter />}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}

          renderItem={({ item }) => {
            const isAcquired = isStock(item) && subsidiaries.some(s => s.symbol === item.symbol);
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
    </AppScreen>
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
      <Text style={styles.portfolioLabel}>Total Investments</Text>
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
          <Text style={styles.liquidateButtonText}>Liquidate All</Text>
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

const MarketHeader = ({ selectedCategory, onSelectCategory }: { selectedCategory: Category, onSelectCategory: (c: Category) => void }) => (
  <View style={styles.headerContainer}>
    <MarketOverview trend="Bullish" volatility="Medium" />
    <View style={styles.tabBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarContent}>
        {CATEGORIES.map(item => {
          const isActive = item === selectedCategory;
          return (
            <Pressable
              key={item}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => onSelectCategory(item)}>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {item}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
    <Text style={styles.sectionTitle}>Stock List</Text>
  </View>
);

const MarketEventFooter = () => {
  const { lastMarketEvent } = useEventStore();
  return (
    <View style={styles.eventCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
        <Text style={styles.eventIcon}>📈</Text>
        <Text style={styles.sectionTitle}>Today&apos;s Market Event</Text>
      </View>
      <Text style={styles.eventText}>
        {lastMarketEvent ?? 'Bugün henüz özel bir market olayı yaşanmadı.'}
      </Text>
      <Pressable
        onPress={() => void triggerEvent('market')}
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}>
        <Text style={styles.secondaryButtonText}>Trigger Market Event</Text>
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
  tab: { paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.md, borderRadius: 999, backgroundColor: 'transparent', borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  tabActive: { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.accent },
  tabLabel: { color: theme.colors.textSecondary, fontWeight: '700', fontSize: theme.typography.caption + 1 },
  tabLabelActive: { color: theme.colors.accent },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: theme.spacing.sm, marginTop: theme.spacing.lg },
  eventCard: { marginTop: theme.spacing.md, backgroundColor: theme.colors.card, borderRadius: theme.radius.md, padding: theme.spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, gap: theme.spacing.md },
  eventIcon: { fontSize: 16 },
  eventText: { fontSize: theme.typography.caption + 1, color: theme.colors.textSecondary, lineHeight: 18 },
  secondaryButton: { backgroundColor: theme.colors.accentSoft, paddingVertical: theme.spacing.md, borderRadius: theme.radius.sm, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  secondaryButtonPressed: { backgroundColor: theme.colors.card, transform: [{ scale: 0.98 }] },
  secondaryButtonText: { color: theme.colors.accent, fontWeight: '700', fontSize: theme.typography.body },
  backButton: { width: 36, height: 36, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.card },
  backButtonPressed: { backgroundColor: theme.colors.cardSoft, transform: [{ scale: 0.97 }] },
  backIcon: { color: theme.colors.textPrimary, fontSize: theme.typography.subtitle, fontWeight: '700' },
  portfolioCard: { backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: theme.spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, gap: theme.spacing.md, marginBottom: theme.spacing.md },
  portfolioHeader: { gap: theme.spacing.xs },
  portfolioLabel: { fontSize: theme.typography.caption, color: theme.colors.textSecondary, fontWeight: '600' },
  portfolioValue: { fontSize: theme.typography.title, color: theme.colors.textPrimary, fontWeight: '700' },
  portfolioActions: { flexDirection: 'row', gap: theme.spacing.sm },
  seeInvestmentsButton: { flex: 1, backgroundColor: theme.colors.accentSoft, borderWidth: 1.5, borderColor: theme.colors.accent, borderRadius: theme.radius.md, paddingVertical: theme.spacing.sm, alignItems: 'center' },
  seeInvestmentsButtonPressed: { backgroundColor: theme.colors.accent + '20', transform: [{ scale: 0.98 }] },
  seeInvestmentsButtonText: { color: theme.colors.accent, fontWeight: '700', fontSize: theme.typography.body },
  liquidateButton: { flex: 1, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.colors.danger, borderRadius: theme.radius.md, paddingVertical: theme.spacing.sm, alignItems: 'center' },
  liquidateButtonPressed: { backgroundColor: theme.colors.danger + '10', transform: [{ scale: 0.98 }] },
  liquidateButtonText: { color: theme.colors.danger, fontWeight: '700', fontSize: theme.typography.body },
});