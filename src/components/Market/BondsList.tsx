// @orphan-ok superseded by StockCategory/MarketOverview in features/assets/screens/MarketScreen.tsx
// Kept deliberately: nothing renders this, and it is not meant to be.
import React, { useMemo, useState } from 'react';
import { t, useLocale } from '../../core/i18n';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../core/theme';
import type { BondCategory, SimpleBondItem } from './marketTypes';

type Props = {
  onSelect: (bond: SimpleBondItem) => void;
};

const BONDS: SimpleBondItem[] = [
  { id: 'gov-1', name: t('market.saudiGov10y'), years: 10, coupon: 4.4, risk: 'Low', category: 'government' },
  { id: 'gov-2', name: t('market.british7y'), years: 7, coupon: 3.2, risk: 'Low', category: 'government' },
  { id: 'gov-3', name: t('market.german6y'), years: 6, coupon: 2.8, risk: 'Very Low', category: 'government' },
  { id: 'gov-4', name: t('market.korean4y'), years: 4, coupon: 3.9, risk: 'Medium', category: 'government' },
  { id: 'gov-5', name: t('market.japan5y'), years: 5, coupon: 1.9, risk: 'Very Low', category: 'government' },
  { id: 'gov-6', name: t('market.unionTreasury10y'), years: 10, coupon: 3.6, risk: 'Very Low', category: 'government' },
  { id: 'gov-7', name: t('market.canada8y'), years: 8, coupon: 3.4, risk: 'Low', category: 'government' },
  { id: 'gov-8', name: t('market.norway12y'), years: 12, coupon: 3.1, risk: 'Low', category: 'government' },
  { id: 'gov-9', name: t('market.australia9y'), years: 9, coupon: 3.7, risk: 'Low', category: 'government' },
  { id: 'gov-10', name: t('market.brazil5y'), years: 5, coupon: 5.2, risk: 'Medium', category: 'government' },
  { id: 'gov-11', name: t('market.india7y'), years: 7, coupon: 5.9, risk: 'Medium', category: 'government' },
  { id: 'gov-12', name: t('market.uae6y'), years: 6, coupon: 4.1, risk: 'Low', category: 'government' },
  { id: 'gov-13', name: t('market.singapore10y'), years: 10, coupon: 2.6, risk: 'Very Low', category: 'government' },
  { id: 'gov-14', name: t('market.france11y'), years: 11, coupon: 2.9, risk: 'Very Low', category: 'government' },
  { id: 'gov-15', name: t('market.turkey4y'), years: 4, coupon: 7.8, risk: 'Medium-High', category: 'government' },
  { id: 'local-1', name: t('market.newYork8y'), years: 8, coupon: 4.4, risk: 'Low', category: 'local' },
  { id: 'local-2', name: t('market.miami9y'), years: 9, coupon: 4.8, risk: 'Low', category: 'local' },
  { id: 'local-3', name: t('market.dallas10y'), years: 10, coupon: 5, risk: 'Medium', category: 'local' },
  { id: 'local-4', name: t('market.seattle3y'), years: 3, coupon: 2.1, risk: 'Very Low', category: 'local' },
  { id: 'local-5', name: t('market.denver6y'), years: 6, coupon: 3.7, risk: 'Low', category: 'local' },
  { id: 'corp-1', name: t('market.greentoothEnergy'), years: 6, coupon: 26.8, risk: 'High', category: 'corporate' },
  { id: 'corp-2', name: t('market.voltaIndustrial'), years: 10, coupon: 18.4, risk: 'High', category: 'corporate' },
  { id: 'corp-3', name: t('market.technovaCorp'), years: 8, coupon: 14.2, risk: 'Medium-High', category: 'corporate' },
  { id: 'corp-4', name: t('market.apexRobotics'), years: 5, coupon: 12.6, risk: 'Medium', category: 'corporate' },
  { id: 'corp-5', name: t('market.blueoceanFreight'), years: 7, coupon: 9.4, risk: 'Medium', category: 'corporate' },
  { id: 'corp-6', name: t('market.silverlineMedia'), years: 4, coupon: 8.1, risk: 'Medium', category: 'corporate' },
  { id: 'corp-7', name: t('market.quantumMotors'), years: 9, coupon: 16.8, risk: 'High', category: 'corporate' },
  { id: 'corp-8', name: t('market.heliosPharma'), years: 6, coupon: 11.2, risk: 'Medium-High', category: 'corporate' },
];

const SUB_CATEGORIES: { label: string; value: BondCategory }[] = [
  { label: t('market.governmentBonds'), value: 'government' },
  { label: t('market.localBonds'), value: 'local' },
  { label: t('market.corporateBonds'), value: 'corporate' },
];

const BondsList = ({ onSelect }: Props) => {
  const [active, setActive] = useState<BondCategory>('government');

  const filtered = useMemo(() => BONDS.filter(bond => bond.category === active), [active]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.subTabs}>
        {SUB_CATEGORIES.map(item => {
          const isActive = active === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => setActive(item.value)}
              style={({ pressed }) => [
                styles.subTab,
                isActive && styles.subTabActive,
                pressed && styles.subTabPressed,
              ]}>
              <Text style={[styles.subTabLabel, isActive && styles.subTabLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ gap: theme.spacing.sm }}>
        {filtered.map(bond => (
          <Pressable
            key={bond.id}
            onPress={() => onSelect(bond)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
            <View style={{ gap: theme.spacing.xs }}>
              <Text style={styles.name}>{bond.name}</Text>
              <Text style={styles.meta}>{bond.years}y • Coupon {bond.coupon}%</Text>
            </View>
            <View style={styles.riskPill}>
              <Text style={[styles.riskText, { color: getRiskColor(bond.risk) }]}>{bond.risk}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

export default BondsList;

const getRiskColor = (risk: string) => {
  if (risk === 'High' || risk === 'Medium-High') return theme.colors.danger;
  if (risk === 'Medium') return theme.colors.warning;
  return theme.colors.success;
};

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  subTabs: {
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  subTab: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  subTabActive: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent,
  },
  subTabPressed: {
    transform: [{ scale: 0.97 }],
  },
  subTabLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
    fontWeight: '700',
  },
  subTabLabelActive: {
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
  name: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
    fontSize: theme.typography.body,
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
  },
  riskPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 999,
    backgroundColor: theme.colors.cardSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  riskText: {
    fontWeight: '700',
    fontSize: theme.typography.caption + 1,
  },
});
