import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Text, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { AssetsStackParamList } from '../../../navigation';
import StockDetailHeader from '../../../components/Market/StockDetailHeader';
import MarketHeader from '../../../components/Market/MarketHeader';
import StockInfoSection from '../../../components/Market/StockInfoSection';
import BuySellPanel from '../../../components/Market/BuySellPanel';
import { theme } from '../../../core/theme';
import AppScreen from '../../../components/layout/AppScreen';
import { useMarketStore } from '../../../core/store/useMarketStore';
import { useUserStore } from '../../../core/store/useUserStore';
import { INITIAL_MARKET_ITEMS } from '../data/marketData';
import type { StockItem, CryptoAsset, FundItem } from '../../../components/Market/marketTypes';

type Props = NativeStackScreenProps<AssetsStackParamList, 'StockDetail'>;

const StockDetailScreen = ({ route, navigation }: Props) => {
  const { symbol, price: routePrice, change: routeChange, category: routeCategory } = route.params;

  // Type guard for items with symbol
  const hasSymbol = (item: any): item is StockItem | CryptoAsset | FundItem => {
    return 'symbol' in item;
  };

  // Fetch live item data for acquisition logic
  const marketItem = useMemo(() =>
    INITIAL_MARKET_ITEMS.find(i => hasSymbol(i) && (i as any).symbol === symbol),
    [symbol]);

  // If item found in static list, use its details, otherwise fallback to route params
  const categoryLabel = (marketItem as any)?.category ?? routeCategory ?? 'Tech';
  const riskLabel = marketItem?.risk ?? 'Medium';
  const acquisitionCost = (marketItem as any)?.acquisitionCost ?? 0;

  const subsidiaries = useUserStore(state => state.subsidiaries);
  const isAcquired = subsidiaries.some(s => s.symbol === symbol);
  const acquireCompany = useMarketStore(state => state.acquireCompany);

  const handleAcquire = () => {
    if (!marketItem) return;

    Alert.alert(
      'Hostile Takeover',
      `Acquire 100% of ${marketItem.name} for $${((marketItem as any).acquisitionCost / 1_000_000).toFixed(0)}M?\n\nBuff: ${(marketItem as any).acquisitionBuff?.label}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'ACQUIRE',
          style: 'destructive',
          onPress: () => {
            const success = acquireCompany(marketItem.id);
            if (success) {
              Alert.alert('Success', `You now own ${marketItem.name}!`);
            } else {
              Alert.alert('Failed', 'Insufficient funds or transaction error.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <MarketHeader
        title={symbol}
        subtitle={`${categoryLabel} • Risk ${riskLabel}`}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        <StockDetailHeader
          symbol={symbol}
          price={routePrice}
          change={routeChange}
          category={categoryLabel}
          risk={riskLabel}
          marketCap={(marketItem as any)?.marketCap}
          volatility={(marketItem as any)?.volatility}
        />
        <StockInfoSection
          description={(marketItem as any)?.description}
        />

        {isAcquired ? (
          <View style={styles.subsidiaryBanner}>
            <Text style={styles.subsidiaryTitle}>WHOLLY OWNED SUBSIDIARY</Text>
            <Text style={styles.subsidiaryBuff}>
              ACTIVE BONUS: {(marketItem as any)?.acquisitionBuff?.label}
            </Text>
            <Ionicons name="shield-checkmark" size={32} color="white" />
          </View>
        ) : (
          <>
            <BuySellPanel symbol={symbol} price={routePrice} category={categoryLabel} />

            {acquisitionCost > 0 && (
              <View style={styles.takeoverSection}>
                <Text style={styles.takeoverTitle}>Strategic Acquisition</Text>
                <TouchableOpacity style={styles.acquireButton} onPress={handleAcquire}>
                  <Text style={styles.acquireButtonText}>
                    ACQUIRE COMPANY (100%)
                  </Text>
                  <Text style={styles.acquireCost}>
                    ${(acquisitionCost / 1_000_000).toLocaleString()}M
                  </Text>
                </TouchableOpacity>
                <Text style={styles.buffPreview}>
                  Buff: {(marketItem as any)?.acquisitionBuff?.label}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default StockDetailScreen;

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  headerRow: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.xs,
  },
  backText: {
    color: 'white',
    fontSize: theme.typography.body,
    fontWeight: '600',
  },
  subsidiaryBanner: {
    backgroundColor: theme.colors.success, // or gold/accent
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  subsidiaryTitle: {
    color: 'white',
    fontWeight: '800',
    fontSize: theme.typography.subtitle,
    letterSpacing: 1
  },
  subsidiaryBuff: {
    color: 'white',
    opacity: 0.9,
    fontWeight: '600'
  },
  takeoverSection: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border
  },
  takeoverTitle: {
    color: theme.colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: theme.typography.caption
  },
  acquireButton: {
    backgroundColor: theme.colors.danger,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    gap: 4
  },
  acquireButtonText: {
    color: 'white',
    fontWeight: '800',
    fontSize: theme.typography.body
  },
  acquireCost: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600'
  },
  buffPreview: {
    color: theme.colors.success,
    textAlign: 'center',
    fontSize: theme.typography.caption,
    fontWeight: '700'
  }
});
