// @orphan-ok superseded by MarketTicker in features/assets/screens/MarketScreen.tsx
// Kept deliberately: nothing renders this, and it is not meant to be.
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../core/theme';

const sampleTickers = [
  { symbol: 'NEOA', change: 1.4 },
  { symbol: 'TORQ', change: -0.8 },
  { symbol: 'MICROX', change: 0.2 },
  { symbol: 'METAA', change: 3.1 },
];

const extendedTickers = Array.from({ length: 6 })
  .map((_, idx) =>
    sampleTickers.map(ticker => ({
      ...ticker,
      key: `${ticker.symbol}-${idx}`,
    })),
  )
  .flat();

const TickerBand = () => {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: -600,
          duration: 13200,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [translateX]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.inner, { transform: [{ translateX }] }]}>
        {extendedTickers.map((item, index) => {
          const isPositive = item.change >= 0;
          return (
            <View key={`${item.key ?? item.symbol}-${index}`} style={styles.tickerItem}>
              <Text style={styles.symbol}>{item.symbol}</Text>
              <Text style={[styles.change, { color: isPositive ? theme.colors.success : theme.colors.danger }]}>
                {isPositive ? '+' : ''}{item.change}%
              </Text>
              <Text style={styles.separator}>|</Text>
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
};

export default TickerBand;

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    height: 34,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  tickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  symbol: {
    color: '#C734CA',
    fontWeight: '800',
    fontSize: theme.typography.body,
    letterSpacing: 0.4,
  },
  change: {
    fontWeight: '700',
    fontSize: theme.typography.caption + 1,
  },
  separator: {
    color: 'rgba(255,255,255,0.48)',
    paddingHorizontal: theme.spacing.xs,
  },
});
