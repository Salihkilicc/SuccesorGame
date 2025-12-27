import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme';
import type { StockItem } from './marketTypes';

type Props = {
  onSelect: (stock: StockItem) => void;
};

const SECTORS = [
  'Technology',
  'Materials',
  'Industrials',
  'Healthcare',
  'Financial',
  'Energy',
  'Consumer',
  'Communication',
];

export const STOCKS: StockItem[] = [
  { id: 'NOVA', symbol: 'NOVA', company: 'Nova Devices', price: 188.3, dailyChange: 1.2, yearlyChange: 21.3, sector: 'Technology', risk: 'Low', marketCap: 180 },
  { id: 'ZENT', symbol: 'ZENT', company: 'Zentrix Chips', price: 468.2, dailyChange: 2.4, yearlyChange: 85.1, sector: 'Technology', risk: 'Medium', marketCap: 520 },
  { id: 'METX', symbol: 'METX', company: 'Metaflux Networks', price: 312.6, dailyChange: 0.8, yearlyChange: 46.2, sector: 'Technology', risk: 'Medium', marketCap: 260 },
  { id: 'ORBX', symbol: 'ORBX', company: 'Orbital Systems', price: 142.5, dailyChange: -0.4, yearlyChange: 9.8, sector: 'Technology', risk: 'Medium', marketCap: 90 },
  { id: 'PIXEL', symbol: 'PIXEL', company: 'Pixelwave Labs', price: 74.2, dailyChange: 1.1, yearlyChange: 18.2, sector: 'Technology', risk: 'Medium', marketCap: 45 },
  { id: 'CYGR', symbol: 'CYGR', company: 'Cygnus Robotics', price: 226.3, dailyChange: -0.6, yearlyChange: 14.7, sector: 'Technology', risk: 'Medium-High', marketCap: 70 },
  { id: 'FERM', symbol: 'FERM', company: 'Ferromine Metals', price: 52.9, dailyChange: -0.4, yearlyChange: 5.1, sector: 'Materials', risk: 'Medium', marketCap: 65 },
  { id: 'OREL', symbol: 'OREL', company: 'Orel Core Mining', price: 15.2, dailyChange: 0.6, yearlyChange: 3.4, sector: 'Materials', risk: 'Medium-High', marketCap: 22 },
  { id: 'STEEL', symbol: 'STEEL', company: 'Steelcraft Works', price: 23.5, dailyChange: -1.1, yearlyChange: -4.2, sector: 'Materials', risk: 'High', marketCap: 15 },
  { id: 'GEMX', symbol: 'GEMX', company: 'GemX Minerals', price: 31.4, dailyChange: 0.3, yearlyChange: 6.9, sector: 'Materials', risk: 'Medium', marketCap: 18 },
  { id: 'ALUM', symbol: 'ALUM', company: 'Alumina Forge', price: 19.7, dailyChange: 1.5, yearlyChange: 4.2, sector: 'Materials', risk: 'Medium', marketCap: 12 },
  { id: 'QUAR', symbol: 'QUAR', company: 'QuarryOne', price: 27.6, dailyChange: -0.8, yearlyChange: 2.5, sector: 'Materials', risk: 'Medium-High', marketCap: 10 },
  { id: 'MECH', symbol: 'MECH', company: 'Mechline Heavy', price: 261.4, dailyChange: 0.9, yearlyChange: 14.2, sector: 'Industrials', risk: 'Medium', marketCap: 140 },
  { id: 'VOLT', symbol: 'VOLT', company: 'Volt Engine Corp', price: 117.8, dailyChange: -0.3, yearlyChange: 18.6, sector: 'Industrials', risk: 'Medium', marketCap: 60 },
  { id: 'AERX', symbol: 'AERX', company: 'AeroShield Systems', price: 432.1, dailyChange: 0.4, yearlyChange: 7.5, sector: 'Industrials', risk: 'Low', marketCap: 210 },
  { id: 'TRAX', symbol: 'TRAX', company: 'Trax Logistics', price: 62.3, dailyChange: 0.2, yearlyChange: 3.1, sector: 'Industrials', risk: 'Medium', marketCap: 35 },
  { id: 'HYDR', symbol: 'HYDR', company: 'Hydra Pumps', price: 48.9, dailyChange: -0.5, yearlyChange: -1.2, sector: 'Industrials', risk: 'Medium', marketCap: 28 },
  { id: 'BOLTX', symbol: 'BOLTX', company: 'BoltX Tools', price: 36.8, dailyChange: 0.7, yearlyChange: 5.5, sector: 'Industrials', risk: 'Low', marketCap: 12 },
  { id: 'HEAL', symbol: 'HEAL', company: 'Healica Labs', price: 38.4, dailyChange: -0.6, yearlyChange: -5.4, sector: 'Healthcare', risk: 'Medium', marketCap: 34 },
  { id: 'VITAL', symbol: 'VITAL', company: 'Vitalline Care', price: 514.2, dailyChange: 1.1, yearlyChange: 12.7, sector: 'Healthcare', risk: 'Low', marketCap: 380 },
  { id: 'GENE', symbol: 'GENE', company: 'GeneFlux Biotech', price: 108.7, dailyChange: 2.9, yearlyChange: -9.4, sector: 'Healthcare', risk: 'High', marketCap: 60 },
  { id: 'MEDI', symbol: 'MEDI', company: 'Medisphere', price: 72.1, dailyChange: 0.4, yearlyChange: 4.7, sector: 'Healthcare', risk: 'Medium', marketCap: 30 },
  { id: 'NEUR', symbol: 'NEUR', company: 'NeuroVale', price: 189.5, dailyChange: -0.3, yearlyChange: 7.2, sector: 'Healthcare', risk: 'Medium', marketCap: 120 },
  { id: 'PURE', symbol: 'PURE', company: 'PureLife Pharma', price: 254.3, dailyChange: 1.5, yearlyChange: 10.1, sector: 'Healthcare', risk: 'Medium', marketCap: 160 },
  { id: 'FORT', symbol: 'FORT', company: 'Fortress Capital', price: 147.1, dailyChange: 0.5, yearlyChange: 9.1, sector: 'Financial', risk: 'Low', marketCap: 210 },
  { id: 'GILD', symbol: 'GILD', company: 'Gild Crest Bank', price: 353.6, dailyChange: 0.9, yearlyChange: 6.4, sector: 'Financial', risk: 'Medium', marketCap: 290 },
  { id: 'TILL', symbol: 'TILL', company: 'TillPay', price: 61.4, dailyChange: -1.8, yearlyChange: -3.2, sector: 'Financial', risk: 'High', marketCap: 45 },
  { id: 'SAFE', symbol: 'SAFE', company: 'Safeguard Mutual', price: 42.8, dailyChange: 0.6, yearlyChange: 3.9, sector: 'Financial', risk: 'Low', marketCap: 25 },
  { id: 'CRED', symbol: 'CRED', company: 'Credify Lending', price: 28.5, dailyChange: -0.2, yearlyChange: 1.1, sector: 'Financial', risk: 'Medium', marketCap: 18 },
  { id: 'LEDG', symbol: 'LEDG', company: 'LedgerWorks', price: 75.9, dailyChange: 1.3, yearlyChange: 6.5, sector: 'Financial', risk: 'Medium', marketCap: 55 },
  { id: 'FUEL', symbol: 'FUEL', company: 'Fuelgrid Energy', price: 112.3, dailyChange: -0.2, yearlyChange: 4.3, sector: 'Energy', risk: 'Medium', marketCap: 130 },
  { id: 'DRIL', symbol: 'DRIL', company: 'Drillium Corp', price: 152.7, dailyChange: 0.4, yearlyChange: 3.9, sector: 'Energy', risk: 'Medium', marketCap: 115 },
  { id: 'SOLR', symbol: 'SOLR', company: 'Solrise Renewables', price: 64.2, dailyChange: 1.9, yearlyChange: 12.4, sector: 'Energy', risk: 'Medium', marketCap: 40 },
  { id: 'WINDY', symbol: 'WINDY', company: 'WindyCape', price: 41.6, dailyChange: 0.7, yearlyChange: 7.9, sector: 'Energy', risk: 'Medium', marketCap: 28 },
  { id: 'HYDN', symbol: 'HYDN', company: 'Hydon Storage', price: 88.3, dailyChange: -0.5, yearlyChange: 2.3, sector: 'Energy', risk: 'Medium', marketCap: 52 },
  { id: 'LUXO', symbol: 'LUXO', company: 'LuxOil Partners', price: 134.1, dailyChange: 0.3, yearlyChange: 4.1, sector: 'Energy', risk: 'Medium', marketCap: 75 },
  { id: 'MART', symbol: 'MART', company: 'Martello Commerce', price: 136.9, dailyChange: 1.6, yearlyChange: 28.5, sector: 'Consumer', risk: 'Medium', marketCap: 180 },
  { id: 'STAGE', symbol: 'STAGE', company: 'StageLight Media', price: 91.5, dailyChange: -0.7, yearlyChange: -2.4, sector: 'Consumer', risk: 'Medium', marketCap: 70 },
  { id: 'BREW', symbol: 'BREW', company: 'BrewLuxe', price: 101.2, dailyChange: 0.3, yearlyChange: 5.6, sector: 'Consumer', risk: 'Low', marketCap: 65 },
  { id: 'GLAM', symbol: 'GLAM', company: 'Glamora Beauty', price: 54.7, dailyChange: 0.9, yearlyChange: 6.8, sector: 'Consumer', risk: 'Medium', marketCap: 22 },
  { id: 'NEST', symbol: 'NEST', company: 'Nestable Living', price: 72.9, dailyChange: -0.2, yearlyChange: 3.1, sector: 'Consumer', risk: 'Low', marketCap: 30 },
  { id: 'FOODX', symbol: 'FOODX', company: 'FoodX Delivery', price: 29.4, dailyChange: 1.4, yearlyChange: 9.2, sector: 'Consumer', risk: 'Medium', marketCap: 12 },
  { id: 'STREAM', symbol: 'STREAM', company: 'Streamora', price: 414.8, dailyChange: 2.1, yearlyChange: 19.3, sector: 'Communication', risk: 'Medium', marketCap: 260 },
  { id: 'TELX', symbol: 'TELX', company: 'Telenix', price: 33.8, dailyChange: -0.4, yearlyChange: -1.8, sector: 'Communication', risk: 'Low', marketCap: 35 },
  { id: 'WAVEL', symbol: 'WAVEL', company: 'Wavelink Mobile', price: 144.4, dailyChange: 0.8, yearlyChange: 11.4, sector: 'Communication', risk: 'Low', marketCap: 110 },
  { id: 'CHAT', symbol: 'CHAT', company: 'ChatterBox', price: 18.6, dailyChange: 0.5, yearlyChange: 2.9, sector: 'Communication', risk: 'Medium', marketCap: 6 },
  { id: 'BCAST', symbol: 'BCAST', company: 'BroadCastly', price: 62.1, dailyChange: -0.3, yearlyChange: 1.4, sector: 'Communication', risk: 'Low', marketCap: 40 },
  { id: 'PING', symbol: 'PING', company: 'PingReach', price: 27.5, dailyChange: 1.7, yearlyChange: 8.8, sector: 'Communication', risk: 'Medium', marketCap: 18 },
];

const capSlowdown = (marketCap: number) => {
  if (marketCap >= 400) return 0.35;
  if (marketCap >= 250) return 0.45;
  if (marketCap >= 150) return 0.6;
  if (marketCap >= 80) return 0.75;
  if (marketCap >= 30) return 0.9;
  return 1;
};

const adjustedChange = (baseChange: number, marketCap: number) =>
  Number((baseChange * capSlowdown(marketCap)).toFixed(1));

const formatCap = (marketCap: number) => `$${marketCap.toLocaleString()}B`;

const StocksList = ({ onSelect }: Props) => {
  const [activeSector, setActiveSector] = useState(SECTORS[0]);

  const filtered = useMemo(
    () => STOCKS.filter(stock => stock.sector === activeSector),
    [activeSector],
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}>
        {SECTORS.map(sector => {
          const isActive = sector === activeSector;
          return (
            <Pressable
              key={sector}
              onPress={() => setActiveSector(sector)}
              style={({ pressed }) => [
                styles.filter,
                isActive && styles.filterActive,
                pressed && styles.filterPressed,
              ]}>
              <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>
                {sector}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ gap: theme.spacing.sm }}>
        {filtered.map(stock => {
          const change = adjustedChange(stock.dailyChange, stock.marketCap);
          const isPositive = change >= 0;
          return (
            <Pressable
              key={stock.id}
              onPress={() => onSelect(stock)}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
              <View style={{ gap: theme.spacing.xs }}>
                <Text style={styles.symbol}>{stock.symbol}</Text>
                <Text style={styles.company}>{stock.company}</Text>
                <Text style={styles.meta}>
                  Sector: {stock.sector} • Market Cap: {formatCap(stock.marketCap)}
                </Text>
              </View>
              <View style={styles.priceBlock}>
                <Text style={styles.price}>${stock.price.toFixed(2)}</Text>
                <Text style={[styles.change, { color: isPositive ? theme.colors.success : theme.colors.danger }]}>
                  {isPositive ? '+' : ''}{change}%
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default StocksList;

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  filters: {
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  filter: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  filterActive: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent,
  },
  filterPressed: {
    transform: [{ scale: 0.97 }],
  },
  filterLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
    fontWeight: '700',
  },
  filterLabelActive: {
    color: theme.colors.accent,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  cardPressed: {
    backgroundColor: theme.colors.cardSoft,
    transform: [{ scale: 0.99 }],
  },
  symbol: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
  },
  company: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
  },
  meta: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption + 1,
  },
  priceBlock: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs / 2,
  },
  price: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
  },
  change: {
    fontSize: theme.typography.caption + 1,
  },
});
