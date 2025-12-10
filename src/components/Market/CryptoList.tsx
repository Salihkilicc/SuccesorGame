import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {theme} from '../../theme';
import type {CryptoAsset} from './marketTypes';

type Props = {
  onSelect: (asset: CryptoAsset) => void;
};

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

const CRYPTOS: CryptoAsset[] = [
  {id: 'Bitron', name: 'Bitron', cost: 120, trend: 'High Trend', change: 6, risk: 'High', marketCap: 180},
  {id: 'Etheriq', name: 'Etheriq', cost: 450, trend: 'High Trend', change: 8, risk: 'High', marketCap: 220},
  {id: 'Solara', name: 'Solara', cost: 22, trend: 'High Trend', change: 3, risk: 'High', marketCap: 35},
  {id: 'Lunar', name: 'Lunar', cost: 15, trend: 'Low Trend', change: -4, risk: 'High', marketCap: 12},
  {id: 'NeonX', name: 'NeonX', cost: 65, trend: 'High Trend', change: 5, risk: 'High', marketCap: 68},
  {id: 'Stellarum', name: 'Stellarum', cost: 9, trend: 'Low Trend', change: -6, risk: 'High', marketCap: 9},
  {id: 'QuantumCoin', name: 'QuantumCoin', cost: 88, trend: 'High Trend', change: 10, risk: 'High', marketCap: 95},
  {id: 'FusionCash', name: 'FusionCash', cost: 32, trend: 'High Trend', change: 2, risk: 'High', marketCap: 22},
  {id: 'Aurora', name: 'Aurora', cost: 18, trend: 'Low Trend', change: -3, risk: 'High', marketCap: 7},
  {id: 'Vertex', name: 'Vertex', cost: 55, trend: 'High Trend', change: 7, risk: 'High', marketCap: 40},
  {id: 'Hyperion', name: 'Hyperion', cost: 12, trend: 'High Trend', change: 4, risk: 'High', marketCap: 6},
  {id: 'CoreLink', name: 'CoreLink', cost: 24, trend: 'Low Trend', change: -2, risk: 'High', marketCap: 11},
  {id: 'Pulse', name: 'Pulse', cost: 6, trend: 'High Trend', change: 12, risk: 'High', marketCap: 3},
  {id: 'TerraMint', name: 'TerraMint', cost: 40, trend: 'Low Trend', change: -5, risk: 'High', marketCap: 18},
  {id: 'NovaChain', name: 'NovaChain', cost: 72, trend: 'High Trend', change: 9, risk: 'High', marketCap: 55},
  {id: 'CarbonX', name: 'CarbonX', cost: 27, trend: 'Low Trend', change: -1, risk: 'High', marketCap: 25},
  {id: 'OrbitPay', name: 'OrbitPay', cost: 19, trend: 'Low Trend', change: -2, risk: 'High', marketCap: 14},
  {id: 'MetaByte', name: 'MetaByte', cost: 95, trend: 'High Trend', change: 6, risk: 'High', marketCap: 72},
  {id: 'AtlasCoin', name: 'AtlasCoin', cost: 34, trend: 'High Trend', change: 3, risk: 'High', marketCap: 26},
  {id: 'Pyra', name: 'Pyra', cost: 14, trend: 'Low Trend', change: -4, risk: 'High', marketCap: 8},
  {id: 'Cypher', name: 'Cypher', cost: 52, trend: 'High Trend', change: 8, risk: 'High', marketCap: 38},
  {id: 'Glimmer', name: 'Glimmer', cost: 16, trend: 'High Trend', change: 5, risk: 'High', marketCap: 12},
  {id: 'Drift', name: 'Drift', cost: 11, trend: 'Low Trend', change: -3, risk: 'High', marketCap: 4},
  {id: 'Proton', name: 'Proton', cost: 28, trend: 'High Trend', change: 4, risk: 'High', marketCap: 16},
  {id: 'Radiant', name: 'Radiant', cost: 60, trend: 'High Trend', change: 2, risk: 'High', marketCap: 30},
];

const CryptoList = ({onSelect}: Props) => {
  return (
    <View style={{gap: theme.spacing.sm}}>
      {CRYPTOS.map(asset => {
        const change = adjustedChange(asset.change, asset.marketCap);
        const isPositive = change >= 0;
        const arrow = isPositive ? '↑' : '↓';
        return (
          <Pressable
            key={asset.id}
            onPress={() => onSelect(asset)}
            style={({pressed}) => [styles.card, pressed && styles.cardPressed]}>
            <View style={{gap: theme.spacing.xs}}>
              <Text style={styles.name}>{asset.name}</Text>
              <Text style={styles.meta}>
                Cost {formatMoney(asset.cost)} • Market Cap {formatCap(asset.marketCap)}
              </Text>
            </View>
            <View style={styles.trendBlock}>
              <Text style={[styles.trend, {color: isPositive ? theme.colors.success : theme.colors.danger}]}>
                {asset.trend} {arrow}
              </Text>
              <Text style={[styles.change, {color: isPositive ? theme.colors.success : theme.colors.danger}]}>
                {isPositive ? '+' : ''}{change}%
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

export default CryptoList;

const formatMoney = (value: number) => `$${value.toLocaleString()}`;

const styles = StyleSheet.create({
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
    transform: [{scale: 0.99}],
  },
  name: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
    fontSize: theme.typography.body,
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
  },
  trendBlock: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs / 2,
  },
  trend: {
    fontWeight: '700',
    fontSize: theme.typography.body,
  },
  change: {
    fontSize: theme.typography.caption + 1,
  },
});
