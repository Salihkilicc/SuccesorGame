import React, {useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {theme} from '../../theme';
import type {BondCategory, BondItem} from './marketTypes';

type Props = {
  onSelect: (bond: BondItem) => void;
};

const BONDS: BondItem[] = [
  {id: 'gov-1', name: 'Saudi Gov 10y', years: 10, coupon: 4.4, risk: 'Low', category: 'government'},
  {id: 'gov-2', name: 'British 7y', years: 7, coupon: 3.2, risk: 'Low', category: 'government'},
  {id: 'gov-3', name: 'German 6y', years: 6, coupon: 2.8, risk: 'Very Low', category: 'government'},
  {id: 'gov-4', name: 'Korean 4y', years: 4, coupon: 3.9, risk: 'Medium', category: 'government'},
  {id: 'gov-5', name: 'Japan 5y', years: 5, coupon: 1.9, risk: 'Very Low', category: 'government'},
  {id: 'gov-6', name: 'Union Treasury 10y', years: 10, coupon: 3.6, risk: 'Very Low', category: 'government'},
  {id: 'gov-7', name: 'Canada 8y', years: 8, coupon: 3.4, risk: 'Low', category: 'government'},
  {id: 'gov-8', name: 'Norway 12y', years: 12, coupon: 3.1, risk: 'Low', category: 'government'},
  {id: 'gov-9', name: 'Australia 9y', years: 9, coupon: 3.7, risk: 'Low', category: 'government'},
  {id: 'gov-10', name: 'Brazil 5y', years: 5, coupon: 5.2, risk: 'Medium', category: 'government'},
  {id: 'gov-11', name: 'India 7y', years: 7, coupon: 5.9, risk: 'Medium', category: 'government'},
  {id: 'gov-12', name: 'UAE 6y', years: 6, coupon: 4.1, risk: 'Low', category: 'government'},
  {id: 'gov-13', name: 'Singapore 10y', years: 10, coupon: 2.6, risk: 'Very Low', category: 'government'},
  {id: 'gov-14', name: 'France 11y', years: 11, coupon: 2.9, risk: 'Very Low', category: 'government'},
  {id: 'gov-15', name: 'Turkey 4y', years: 4, coupon: 7.8, risk: 'Medium-High', category: 'government'},
  {id: 'local-1', name: 'New York 8y', years: 8, coupon: 4.4, risk: 'Low', category: 'local'},
  {id: 'local-2', name: 'Miami 9y', years: 9, coupon: 4.8, risk: 'Low', category: 'local'},
  {id: 'local-3', name: 'Dallas 10y', years: 10, coupon: 5, risk: 'Medium', category: 'local'},
  {id: 'local-4', name: 'Seattle 3y', years: 3, coupon: 2.1, risk: 'Very Low', category: 'local'},
  {id: 'local-5', name: 'Denver 6y', years: 6, coupon: 3.7, risk: 'Low', category: 'local'},
  {id: 'corp-1', name: 'GreenTooth Energy', years: 6, coupon: 26.8, risk: 'High', category: 'corporate'},
  {id: 'corp-2', name: 'Volta Industrial', years: 10, coupon: 18.4, risk: 'High', category: 'corporate'},
  {id: 'corp-3', name: 'TechNova Corp', years: 8, coupon: 14.2, risk: 'Medium-High', category: 'corporate'},
  {id: 'corp-4', name: 'Apex Robotics', years: 5, coupon: 12.6, risk: 'Medium', category: 'corporate'},
  {id: 'corp-5', name: 'BlueOcean Freight', years: 7, coupon: 9.4, risk: 'Medium', category: 'corporate'},
  {id: 'corp-6', name: 'Silverline Media', years: 4, coupon: 8.1, risk: 'Medium', category: 'corporate'},
  {id: 'corp-7', name: 'Quantum Motors', years: 9, coupon: 16.8, risk: 'High', category: 'corporate'},
  {id: 'corp-8', name: 'Helios Pharma', years: 6, coupon: 11.2, risk: 'Medium-High', category: 'corporate'},
];

const SUB_CATEGORIES: {label: string; value: BondCategory}[] = [
  {label: 'Government Bonds', value: 'government'},
  {label: 'Local Bonds', value: 'local'},
  {label: 'Corporate Bonds', value: 'corporate'},
];

const BondsList = ({onSelect}: Props) => {
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
              style={({pressed}) => [
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

      <View style={{gap: theme.spacing.sm}}>
        {filtered.map(bond => (
          <Pressable
            key={bond.id}
            onPress={() => onSelect(bond)}
            style={({pressed}) => [styles.card, pressed && styles.cardPressed]}>
            <View style={{gap: theme.spacing.xs}}>
              <Text style={styles.name}>{bond.name}</Text>
              <Text style={styles.meta}>{bond.years}y • Coupon {bond.coupon}%</Text>
            </View>
            <View style={styles.riskPill}>
              <Text style={[styles.riskText, {color: getRiskColor(bond.risk)}]}>{bond.risk}</Text>
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
    transform: [{scale: 0.97}],
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
