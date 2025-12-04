import React from 'react';
import {ScrollView, View, Text, StyleSheet, Pressable} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useStatsStore, useEventStore} from '../store';
import {theme} from '../theme';
import type {AssetsStackParamList} from '../navigation';

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

type StatPillProps = {
  label: string;
  value: string;
};

const StatPill = ({label, value}: StatPillProps) => (
  <View style={styles.pill}>
    <Text style={styles.pillLabel}>{label}</Text>
    <Text style={styles.pillValue}>{value}</Text>
  </View>
);

const AssetsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AssetsStackParamList>>();
  const {netWorth, money, monthlyIncome, monthlyExpenses, riskApetite, strategicSense} =
    useStatsStore();
  const {lastMarketEvent} = useEventStore();

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
        style={{flex: 1}}
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
              style={({pressed}) => [styles.backButton, pressed && styles.backButtonPressed]}>
              <Text style={styles.backIcon}>←</Text>
            </Pressable>
            <Text style={styles.title}>Assets</Text>
            <View style={{width: 32}} />
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
              <Text style={styles.summaryValue}>{formatMoney(netWorth)}</Text>

              <View style={{marginTop: theme.spacing.md}}>
                <Text style={styles.summaryLabel}>Cash</Text>
                <Text style={styles.summaryValue}>{formatMoney(money)}</Text>
              </View>
            </View>

            <View style={styles.summaryCol}>
              <Pressable
                onPress={() => {
                  console.log('Navigate to Investments screen (to be implemented)');
                }}
                style={({pressed}) => [styles.investmentsButton, pressed && styles.investmentsButtonPressed]}>
                <View>
                  <Text style={styles.summaryLabel}>Investments</Text>
                  {/* TODO: Replace placeholder with real investments total when available */}
                  <Text style={styles.summaryValue}>{formatMoney(0)}</Text>
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

        <View style={{gap: theme.spacing.md}}>
          <View style={styles.actionCard}>
            <View style={{gap: theme.spacing.xs}}>
              <Text style={styles.actionTitle}>Market</Text>
              <Text style={styles.actionBody}>
                Scan the latest sectors and move quickly on opportunities.
              </Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('Market')}
              style={({pressed}) => [styles.actionButton, pressed && styles.actionButtonPressed]}>
              <Text style={styles.actionButtonText}>Go to Market</Text>
            </Pressable>
          </View>

          <View style={styles.actionCard}>
            <View style={{gap: theme.spacing.xs}}>
              <Text style={styles.actionTitle}>My Company</Text>
              <Text style={styles.actionBody}>
                Review valuation, ownership, and make strategic moves.
              </Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('MyCompany')}
              style={({pressed}) => [styles.actionButton, pressed && styles.actionButtonPressed]}>
              <Text style={styles.actionButtonText}>Go to My Company</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default AssetsScreen;

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
    transform: [{scale: 0.97}],
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
    transform: [{scale: 0.98}],
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
  actionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
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
  actionButton: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.accent,
  },
  actionButtonPressed: {
    transform: [{scale: 0.98}],
  },
  actionButtonText: {
    color: theme.colors.accent,
    fontWeight: '800',
    fontSize: theme.typography.caption + 1,
  },
});
