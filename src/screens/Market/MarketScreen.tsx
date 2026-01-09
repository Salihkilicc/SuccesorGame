import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../core/theme';
import TickerBand from '../../components/Market/TickerBand';
import FinancialNewsButton from '../../components/Market/FinancialNewsButton';
import FinancialAdvisorsButton from '../../components/Market/FinancialAdvisorsButton';
import CategoryTabs from '../../components/Market/CategoryTabs';
import BondsList from '../../components/Market/BondsList';
import CryptoList from '../../components/Market/CryptoList';
import StocksList from '../../components/Market/StocksList';
import BondDetailsModal from '../../components/Market/BondDetailsModal';
import CryptoDetailsModal from '../../components/Market/CryptoDetailsModal';
import StockDetailsModal from '../../components/Market/StockDetailsModal';
import PortfolioSummary from '../../components/Market/PortfolioSummary';
import PortfolioModal from '../../components/Market/PortfolioModal';
import type {
  BondItem,
  CategoryKey,
  CryptoAsset,
  HoldingItem,
  StockItem,
} from '../../components/Market/marketTypes';
import type { AssetsStackParamList } from '../../navigation';
import { useMarketStore } from '../../core/store';

const capSlowdown = (marketCap: number) => {
  if (marketCap >= 400) return 0.35;
  if (marketCap >= 250) return 0.45;
  if (marketCap >= 150) return 0.6;
  if (marketCap >= 80) return 0.75;
  if (marketCap >= 30) return 0.9;
  return 1;
};

const adjustedChange = (baseChange: number, marketCap: number) =>
  baseChange * capSlowdown(marketCap);

const MarketScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AssetsStackParamList>>();
  const insets = useSafeAreaInsets();
  const { holdings, buyAsset, reset } = useMarketStore();

  const [category, setCategory] = useState<CategoryKey>('bonds');
  const [selectedBond, setSelectedBond] = useState<BondItem | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoAsset | null>(null);
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);
  const [portfolioVisible, setPortfolioVisible] = useState(false);

  const totalInvested = useMemo(
    () => holdings.reduce((sum, item) => sum + item.amount, 0),
    [holdings],
  );
  const totalValue = useMemo(
    () => holdings.reduce((sum, item) => sum + item.estimatedValue, 0),
    [holdings],
  );
  const returnPct = totalInvested
    ? ((totalValue - totalInvested) / totalInvested) * 100
    : 0;

  const handleBondBuy = (bond: BondItem, amount: number) => {
    if (!amount) {
      console.log('Enter amount before buying');
      return;
    }
    const estimatedValue = amount * (1 + bond.coupon / 100);
    const pl = amount ? ((estimatedValue - amount) / amount) * 100 : 0;

    buyAsset({
      id: `${bond.id}-${Date.now()}`,
      name: bond.name,
      type: 'bond',
      amount,
      estimatedValue,
      pl: Number(pl.toFixed(1)),
    });
    console.log('Bond purchase placeholder');
    setSelectedBond(null);
  };

  const handleCryptoBuy = (asset: CryptoAsset, amount: number) => {
    if (!amount) {
      console.log('Enter amount before buying');
      return;
    }
    const effectiveChange = adjustedChange(asset.change, asset.marketCap);
    const estimatedValue = amount * (1 + effectiveChange / 100);
    const pl = amount ? ((estimatedValue - amount) / amount) * 100 : 0;

    buyAsset({
      id: `${asset.id}-${Date.now()}`,
      name: asset.name,
      type: 'crypto',
      amount,
      estimatedValue,
      pl: Number(pl.toFixed(1)),
    });
    console.log('Crypto purchase placeholder');
    setSelectedCrypto(null);
  };

  const handleStockBuy = (stock: StockItem, shares: number) => {
    if (!shares) {
      console.log('Enter shares before buying');
      return;
    }
    const amount = stock.price * shares;
    const effectiveChange = adjustedChange(stock.dailyChange, stock.marketCap);
    const estimatedValue = amount * (1 + effectiveChange / 100);
    const pl = amount ? ((estimatedValue - amount) / amount) * 100 : 0;

    buyAsset({
      id: `${stock.id}-${Date.now()}`,
      name: `${stock.company} (${stock.symbol})`,
      type: 'stock',
      amount,
      estimatedValue,
      pl: Number(pl.toFixed(1)),
    });
    console.log('Stock purchase placeholder');
    setSelectedStock(null);
  };

  const holdingsCount = holdings.length;

  const liquidateAll = () => {
    console.log('Liquidated all holdings');
    reset();
  };

  const BackButton = () => (
    <Pressable
      onPress={() => {
        if (navigation.canGoBack()) navigation.goBack();
      }}
      style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
      <Text style={styles.backIcon}>←</Text>
    </Pressable>
  );

  return (
    <View style={styles.safeArea}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + theme.spacing.xl * 2,
            paddingTop: insets.top + theme.spacing.md,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <BackButton />
          <Text style={styles.title}>Stock Market</Text>
        </View>

        <TickerBand />

        <PortfolioSummary
          totalInvested={totalInvested}
          returnPct={returnPct}
          holdingsCount={holdingsCount}
          onOpen={() => setPortfolioVisible(true)}
        />

        <View style={styles.buttonRow}>
          <FinancialNewsButton />
          <FinancialAdvisorsButton />
        </View>

        <CategoryTabs initial={category} onChange={setCategory} />

        <View style={styles.sectionCard}>
          {category === 'bonds' && (
            <BondsList onSelect={bond => setSelectedBond(bond)} />
          )}
          {category === 'crypto' && (
            <CryptoList onSelect={asset => setSelectedCrypto(asset)} />
          )}
          {category === 'stocks' && (
            <StocksList onSelect={stock => setSelectedStock(stock)} />
          )}
        </View>
      </ScrollView>

      <BondDetailsModal
        visible={!!selectedBond}
        bond={selectedBond}
        onClose={() => setSelectedBond(null)}
        onBuy={handleBondBuy}
      />

      <CryptoDetailsModal
        visible={!!selectedCrypto}
        asset={selectedCrypto}
        onClose={() => setSelectedCrypto(null)}
        onBuy={handleCryptoBuy}
      />

      <StockDetailsModal
        visible={!!selectedStock}
        stock={selectedStock}
        onClose={() => setSelectedStock(null)}
        onBuy={handleStockBuy}
      />

      <PortfolioModal
        visible={portfolioVisible}
        holdings={holdings}
        onClose={() => setPortfolioVisible(false)}
        onLiquidate={liquidateAll}
      />
    </View>
  );
};

export default MarketScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
  },
  backButtonPressed: {
    backgroundColor: theme.colors.cardSoft,
    transform: [{ scale: 0.97 }],
  },
  backIcon: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '700',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  sectionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
});
