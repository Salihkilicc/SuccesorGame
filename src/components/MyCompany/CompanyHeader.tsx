// @orphan-ok superseded by features/assets/screens/MyCompanyScreen.tsx
// Kept deliberately: nothing renders this, and it is not meant to be.
import React from 'react';
import { t, useLocale } from '../../core/i18n';
import { View, Text, StyleSheet } from 'react-native';
import { useUserStore } from '../../core/store';
import { theme } from '../../core/theme';
import { formatMoney, formatNumber, formatPrice } from '../../core/utils';

export type CompanyHeaderProps = {
  companyName?: string;
  valuation: number;
  sharePrice: number;
  dailyChange: number;
  ownership: number;
  debt: number;
};

// Paylasilan bicimlendiriciye devrediyor (core/utils).
// Eskiden her dosyada ayri kademe zinciri vardi; esikleri farkli oldugu icin
// ayni deger farkli ekranlarda farkli gorunuyordu.
const formatLargeMoney = (value: number) => formatMoney(value);

const formatShortMoney = (value: number) => formatNumber(value);

const CompanyHeader = ({
  companyName = 'Rich Industries',
  valuation,
  sharePrice,
  dailyChange,
  ownership,
  debt,
}: CompanyHeaderProps) => {
    useLocale();
  const { name } = useUserStore();
  const changeColor = dailyChange >= 0 ? styles.changeUp : styles.changeDown;
  const formattedChange = `${dailyChange >= 0 ? '+' : ''}${dailyChange}%`;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{companyName}</Text>
          <Text style={styles.subtitle}>{t('company.ceoV1', { v1: name })}</Text>
          <Text style={styles.subtitle}>{t('company.ownershipV1', { v1: ownership })}</Text>
        </View>
        <View style={styles.rightCol}>
          <Text style={styles.metricLabel}>{t('ui.companyValue')}</Text>
          <Text style={styles.metricValue}>${formatShortMoney(valuation)}</Text>
          <Text style={styles.meta}>{t('company.sharePriceV1', { v1: formatPrice(sharePrice) })}</Text>
          <Text style={[styles.change, changeColor]}>{formattedChange}</Text>
          <Text style={[styles.meta, styles.debt]}>{t('company.debtV1', { v1: formatShortMoney(debt) })}</Text>
        </View>
      </View>
    </View>
  );
};

export default CompanyHeader;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#020626', // Dark Gray
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  title: {
    color: '#FFFFFF', // White
    fontSize: theme.typography.subtitle + 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#C734CA', // Gold for CEO name
    fontSize: theme.typography.caption + 1,
    marginTop: theme.spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.48)', // Text Secondary
    fontSize: theme.typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metricValue: {
    color: '#7B68D7', // Green for valuation
    fontSize: theme.typography.subtitle + 4,
    fontWeight: '800',
  },
  change: {
    fontSize: theme.typography.caption + 1,
    fontWeight: '700',
  },
  changeUp: {
    color: '#7B68D7', // Green
  },
  changeDown: {
    color: '#C734CA', // Red
  },
  meta: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: theme.typography.caption + 1,
  },
  debt: {
    color: '#C734CA', // Red
  },
});
