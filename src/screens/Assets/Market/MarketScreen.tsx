import React, {useMemo, useState} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import StatBar from '../../../components/common/StatBar';
import MarketOverview from '../../../components/Market/MarketOverview';
import StockItemSkeleton from '../../../components/Market/StockItemSkeleton';
import type {AssetsStackParamList} from '../../../navigation';
import {useEventStore} from '../../../store';
import {triggerEvent} from '../../../event/eventEngine';

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
      <Text style={styles.title}>MARKET</Text>
      <Text style={styles.subtitle}>Simulated Nasdaq & Crypto</Text>
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
      <Text style={styles.sectionTitle}>Today&apos;s Market Event</Text>
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatBar />
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
    </SafeAreaView>
  );
};

export default MarketScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#05060A',
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  headerContainer: {
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#E8EDF5',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#A3AEC2',
  },
  tabBar: {
    backgroundColor: '#0C0F1A',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#181C2A',
  },
  tabBarContent: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 8,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#0C0F1A',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#181C2A',
  },
  tabActive: {
    backgroundColor: '#1B2340',
    borderColor: '#263157',
  },
  tabLabel: {
    color: '#9AA7BC',
    fontWeight: '700',
    fontSize: 13,
  },
  tabLabelActive: {
    color: '#E6ECF7',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EEF2FF',
    letterSpacing: 0.3,
  },
  eventCard: {
    marginTop: 12,
    backgroundColor: '#0C0F1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#181C2A',
    gap: 12,
  },
  eventText: {
    fontSize: 13,
    color: '#A3AEC2',
    lineHeight: 18,
  },
  secondaryButton: {
    backgroundColor: '#1B2340',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#263157',
  },
  secondaryButtonPressed: {
    backgroundColor: '#202A4A',
    transform: [{scale: 0.98}],
  },
  secondaryButtonText: {
    color: '#E6ECF7',
    fontWeight: '700',
    fontSize: 14,
  },
});
