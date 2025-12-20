import React from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStatsStore, useEventStore, useUserStore, useMarketStore } from '../store';
import { theme } from '../theme';
import type { AssetsStackParamList } from '../navigation';

const formatMoney = (value: number) => {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000) {
    const formatted = (value / 1_000_000_000).toFixed(1);
    return `$${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}B`;
  }
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

type StatPillProps = {
  label: string;
  value: string;
};

const StatPill = ({ label, value }: StatPillProps) => (
  <View style={styles.pill}>
    <Text style={styles.pillLabel}>{label}</Text>
    <Text style={styles.pillValue}>{value}</Text>
  </View>
);

const AssetsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AssetsStackParamList>>();
  const { netWorth, money, monthlyIncome, monthlyExpenses, riskApetite, strategicSense } =
    useStatsStore();
  const { lastMarketEvent } = useEventStore();
  const { inventory } = useUserStore();
  const { holdings } = useMarketStore();
  const investmentsValue = holdings.reduce((sum, item) => sum + item.estimatedValue, 0);

  /* 
    Properties: Includes all real estate types from BelongingsModal 
    ('ranch' was missing in previous version)
  */
  const propertiesValue = inventory
    .filter(i => [
      'penthouse', 'mansion', 'villa', 'estate', 'apartment', 'yali',
      'house', 'land', 'ranch', 'chalet', 'vineyard', 'townhouse',
      'lodge', 'camp', 'riad', 'resort', 'suite', 'castle', 'island', 'marina'
    ].includes(i.type))
    .reduce((acc, item) => acc + item.price, 0);

  /* 
    Vehicles: Includes Cars, Aircrafts, and Marine 
  */
  const vehiclesValue = inventory
    .filter(i => [
      'car',
      'plane', 'helicopter', 'jet',
      'yacht', 'boat', 'submarine', 'ship', 'cruise_ship'
    ].includes(i.type))
    .reduce((acc, item) => acc + item.price, 0);

  /* 
    Belongings: Includes Artifacts, Weapons, and Jewelry 
    ('art', 'antique', 'weapon', 'jewel' were missing)
  */
  const belongingsValue = inventory
    .filter(i => [
      'art', 'antique', 'artifact',
      'weapon',
      'ring', 'watch', 'gem', 'necklace', 'bracelet', 'tiara',
      'earrings', 'brooch', 'watch_jewelry', 'jewel'
    ].includes(i.type))
    .reduce((acc, item) => acc + item.price, 0);

  const nextMove = (() => {
    if (riskApetite > 65) {
      return 'Consider adding a small position in higher risk assets.';
    }
    if (riskApetite < 40) {
      return 'Keep it safe: focus on blue-chip and lower volatility.';
    }
    return 'Balance your portfolio between growth and stability.';
  })();

  return (
    <View style={styles.safeArea}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => {
                const rootNav = navigation.getParent()?.getParent();
                if (rootNav) {
                  rootNav.navigate('Home' as never);
                  return;
                }
                if (navigation.canGoBack()) {
                  navigation.goBack();
                }
              }}
              style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
              <Text style={styles.backIcon}>←</Text>
            </Pressable>
            <Text style={styles.title}>Assets</Text>
            <View style={{ width: 32 }} />
          </View>
          <View style={styles.riskRow}>
            <StatPill label="Risk Appetite" value={`${Math.round(riskApetite)}%`} />
            <StatPill label="Strategic Sense" value={`${Math.round(strategicSense)}%`} />
          </View>
        </View>

        <View style={styles.cardGroup}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Last Market Event</Text>
            <Text style={styles.cardBody}>
              {lastMarketEvent ?? 'No significant market event yet.'}
            </Text>
          </View>
          <View style={styles.cardSoft}>
            <Text style={styles.cardTitle}>Next Move Idea</Text>
            <Text style={styles.cardBody}>{nextMove}</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Net Worth</Text>
              <Text style={styles.summaryValue}>{formatMoney(netWorth + propertiesValue + vehiclesValue + belongingsValue + investmentsValue)}</Text>

              <View style={{ marginTop: theme.spacing.md }}>
                <Text style={styles.summaryLabel}>Cash</Text>
                <Text style={styles.summaryValue}>${money.toLocaleString()}</Text>
              </View>

              <View style={{ marginTop: theme.spacing.md }}>
                <Text style={styles.summaryLabel}>Investments</Text>
                <Text style={styles.summaryValue}>{formatMoney(investmentsValue)}</Text>
              </View>
            </View>

            <View style={styles.summaryCol}>
              <Pressable
                onPress={() => navigation.navigate('Shopping')}
                style={({ pressed }) => [styles.investmentsButton, pressed && styles.investmentsButtonPressed]}>
                <View>
                  <Text style={styles.summaryLabel}>Shopping</Text>
                  <Text style={styles.summaryValue}>Go to Mall</Text>
                </View>
                <Text style={styles.investmentsCta}>›</Text>
              </Pressable>

              <View style={styles.incomeRow}>
                <View>
                  <Text style={styles.summaryLabel}>Income</Text>
                  <Text style={styles.summaryValue}>
                    {monthlyIncome ? formatMoney(monthlyIncome) : '$0'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.summaryLabel}>Expenses</Text>
                  <Text style={styles.summaryValue}>
                    {monthlyExpenses ? formatMoney(monthlyExpenses) : '$0'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.categoryGrid}>
          <Pressable
            onPress={() => navigation.navigate('Shopping')}
            style={({ pressed }) => [styles.categoryCard, pressed && styles.categoryCardPressed]}>
            <Text style={styles.categoryLabel}>Properties</Text>
            <Text style={styles.categoryValue}>{formatMoney(propertiesValue)}</Text>
            <Text style={styles.categoryMeta}>Homes, estates, islands</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Shopping')}
            style={({ pressed }) => [styles.categoryCard, pressed && styles.categoryCardPressed]}>
            <Text style={styles.categoryLabel}>Vehicles</Text>
            <Text style={styles.categoryValue}>{formatMoney(vehiclesValue)}</Text>
            <Text style={styles.categoryMeta}>Cars, jets, yachts</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Shopping')}
            style={({ pressed }) => [styles.categoryCard, pressed && styles.categoryCardPressed]}>
            <Text style={styles.categoryLabel}>Belongings</Text>
            <Text style={styles.categoryValue}>{formatMoney(belongingsValue)}</Text>
            <Text style={styles.categoryMeta}>Art, jewelry, antiques</Text>
          </Pressable>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            onPress={() => navigation.navigate('Market')}
            style={({ pressed }) => [
              styles.actionTile,
              styles.marketTile,
              pressed && styles.actionTilePressed,
            ]}>
            <View style={{ gap: theme.spacing.xs }}>
              <Text style={styles.actionTitle}>Market</Text>
              <Text style={styles.actionBody}>
                Scan the latest sectors and move quickly on opportunities.
              </Text>
            </View>
            <Text style={styles.tileCta}>›</Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('MyCompany')}
            style={({ pressed }) => [
              styles.actionTile,
              styles.companyTile,
              pressed && styles.actionTilePressed,
            ]}>
            <View style={{ gap: theme.spacing.xs }}>
              <Text style={styles.actionTitle}>My Company</Text>
              <Text style={styles.actionBody}>
                Review valuation, ownership, and make strategic moves.
              </Text>
            </View>
            <Text style={styles.tileCta}>›</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

// ... styles ...
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl * 2 + theme.spacing.sm,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
  },
  header: {
    gap: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 32,
    height: 32,
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
    fontSize: theme.typography.title,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  riskRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  pill: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  pillLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    letterSpacing: 0.4,
  },
  pillValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: '700',
  },
  cardGroup: {
    gap: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  cardSoft: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: theme.typography.body,
  },
  cardBody: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
    lineHeight: 18,
  },
  summaryCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  summaryCol: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  summaryLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
  },
  investmentsButton: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  investmentsButtonPressed: {
    backgroundColor: theme.colors.card,
    transform: [{ scale: 0.98 }],
  },
  investmentsCta: {
    color: theme.colors.accent,
    fontWeight: '800',
    fontSize: theme.typography.subtitle,
  },
  incomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
    minHeight: 110,
  },
  categoryCardPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: theme.colors.card,
  },
  categoryLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    letterSpacing: 0.4,
  },
  categoryValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
  },
  categoryMeta: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
    lineHeight: 18,
  },
  actionTile: {
    flex: 1,
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
    justifyContent: 'space-between',
    minHeight: 140,
  },
  marketTile: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  companyTile: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  actionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
  },
  actionBody: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    lineHeight: 18,
  },
  actionTilePressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.94,
  },
  tileCta: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
    fontSize: theme.typography.subtitle,
    alignSelf: 'flex-end',
  },
});

export default AssetsScreen;
