import React, {useMemo, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, Pressable, FlatList} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import MarketOverview from '../../../components/Market/MarketOverview';
import StockItemSkeleton from '../../../components/Market/StockItemSkeleton';
import type {AssetsStackParamList} from '../../../navigation';
import {useEventStore} from '../../../store';
import {triggerEvent} from '../../../event/eventEngine';
import {theme} from '../../../theme';
import AppScreen from '../../../components/layout/AppScreen';

type Category =
  | 'Tech'
  | 'Health'
  | 'Finance'
  | 'Energy'
  | 'Consumer'
  | 'Crypto'
  | 'High Risk';

type Stock = {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  meta?: string;
  riskTag?: string;
};

const CATEGORIES: Category[] = [
  'Tech',
  'Health',
  'Finance',
  'Energy',
  'Consumer',
  'Crypto',
  'High Risk',
];

const STOCKS: Record<Category, Stock[]> = {
  Tech: [
    {symbol: 'NVTA', name: 'NovaTech AI', price: 142.2, change: 2.1},
    {symbol: 'CLOUDX', name: 'CloudX Systems', price: 88.4, change: 1.2},
    {symbol: 'NEURO', name: 'NeuroLink Labs', price: 64, change: -0.4},
  ],
  Health: [
    {symbol: 'BIOGEN', name: 'Biogenica', price: 52.5, change: 0.9},
    {symbol: 'MEDIX', name: 'Medix Care', price: 33.2, change: 1.8},
    {symbol: 'VITAL', name: 'Vital Health', price: 41.7, change: -0.6},
  ],
  Finance: [
    {symbol: 'STABLE', name: 'Stable Bank', price: 71.3, change: 0.4},
    {symbol: 'CREDIT', name: 'Creditium', price: 55.1, change: -0.2},
    {symbol: 'DEFI', name: 'DeFi Core', price: 19.9, change: 3.5},
  ],
  Energy: [
    {symbol: 'SOLAR', name: 'SolarGrid', price: 24.5, change: 2.9},
    {symbol: 'FUEL', name: 'FuelCo', price: 31, change: -1.1},
    {symbol: 'WIND', name: 'Wind Prime', price: 18.3, change: 0.7},
  ],
  Consumer: [
    {symbol: 'SHOPX', name: 'ShopX Retail', price: 62, change: 1},
    {symbol: 'FOOD', name: 'FoodNation', price: 21.4, change: -0.3},
    {symbol: 'LEISUR', name: 'LeisureOne', price: 44.9, change: 0.5},
  ],
  Crypto: [
    {symbol: 'BTC', name: 'Bitcoin', price: 42100, change: 2.4, meta: 'Volatility: High'},
    {symbol: 'ETH', name: 'Ethereum', price: 2450, change: 1.7, meta: 'Volatility: High'},
    {symbol: 'SOL', name: 'Solana', price: 96, change: 4.2, meta: 'Volatility: High'},
  ],
  'High Risk': [
    {symbol: 'MOON', name: 'Moonshot Labs', price: 3.2, change: 12.1, riskTag: 'HIGH RISK'},
    {symbol: 'HYPE', name: 'HypeWorks', price: 1.05, change: -5.6, riskTag: 'HIGH RISK'},
    {symbol: 'GAMBLE', name: 'GambleX', price: 0.44, change: 7.8, riskTag: 'HIGH RISK'},
  ],
};

const MarketScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AssetsStackParamList>>();
  const [selectedCategory, setSelectedCategory] = useState<Category>('Tech');
  const {lastMarketEvent} = useEventStore();

  const data = useMemo(() => STOCKS[selectedCategory] ?? [], [selectedCategory]);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <MarketOverview trend="Bullish" volatility="Medium" />
      <View style={styles.tabBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}>
          {CATEGORIES.map(item => {
            const isActive = item === selectedCategory;
            return (
              <Pressable
                key={item}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setSelectedCategory(item)}>
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

  const renderFooter = () => (
    <View style={styles.eventCard}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs}}>
        <Text style={styles.eventIcon}>📈</Text>
        <Text style={styles.sectionTitle}>Today&apos;s Market Event</Text>
      </View>
      <Text style={styles.eventText}>
        {lastMarketEvent ?? 'Bugün henüz özel bir market olayı yaşanmadı.'}
      </Text>
      <Pressable
        onPress={() => {
          void triggerEvent('market');
        }}
        style={({pressed}) => [
          styles.secondaryButton,
          pressed && styles.secondaryButtonPressed,
        ]}>
        <Text style={styles.secondaryButtonText}>Trigger Market Event</Text>
      </Pressable>
    </View>
  );

  const BackButton = () => (
    <Pressable
      onPress={() => {
        if (navigation.canGoBack()) navigation.goBack();
      }}
      style={({pressed}) => [styles.backButton, pressed && styles.backButtonPressed]}>
      <Text style={styles.backIcon}>←</Text>
    </Pressable>
  );

  return (
    <AppScreen title="MARKET" subtitle="Simulated Nasdaq & Crypto" leftNode={<BackButton />}>
      <FlatList
        data={data}
        keyExtractor={item => item.symbol}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ItemSeparatorComponent={() => <View style={{height: 12}} />}
        renderItem={({item}) => (
          <Pressable
            onPress={() =>
              navigation.navigate('StockDetail', {
                symbol: item.symbol,
                price: item.price,
                change: item.change,
                category: selectedCategory,
              })
            }>
            <StockItemSkeleton
              symbol={item.symbol}
              name={item.name}
              price={item.price}
              change={item.change}
              riskTag={item.riskTag}
              meta={item.meta}
            />
          </Pressable>
        )}
        showsVerticalScrollIndicator={false}
      />
    </AppScreen>
  );
};

export default MarketScreen;

const styles = StyleSheet.create({
  listContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl + theme.spacing.md,
  },
  headerContainer: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  tabBar: {
    backgroundColor: 'transparent',
  },
  tabBarContent: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  tab: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 999,
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  tabActive: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent,
  },
  tabLabel: {
    color: theme.colors.textSecondary,
    fontWeight: '700',
    fontSize: theme.typography.caption + 1,
  },
  tabLabelActive: {
    color: theme.colors.accent,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  eventCard: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  eventIcon: {
    fontSize: 16,
  },
  eventText: {
    fontSize: theme.typography.caption + 1,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  secondaryButton: {
    backgroundColor: theme.colors.accentSoft,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  secondaryButtonPressed: {
    backgroundColor: theme.colors.card,
    transform: [{scale: 0.98}],
  },
  secondaryButtonText: {
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: theme.typography.body,
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
    transform: [{scale: 0.97}],
  },
  backIcon: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '700',
  },
});
