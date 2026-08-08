import React from 'react';
import { t, useLocale } from '../../core/i18n';
import {Text, StyleSheet, ViewStyle, TextStyle, View} from 'react-native';

type BadgeSize = 'small' | 'large';

type Props = {
  size?: BadgeSize;
  style?: ViewStyle | TextStyle;
};

const PremiumBadge = ({size = 'small', style}: Props) => {
    useLocale();
  const isLarge = size === 'large';
  return (
    <View style={[styles.base, isLarge ? styles.large : styles.small, style]}>
      <Text style={[styles.label, isLarge ? styles.labelLarge : styles.labelSmall]}>{t('ui.premium')}</Text>
    </View>
  );
};

export default PremiumBadge;

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#533D35',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  small: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  large: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  label: {
    color: '#E9B8C9',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: 11,
  },
  labelLarge: {
    fontSize: 13,
  },
});
