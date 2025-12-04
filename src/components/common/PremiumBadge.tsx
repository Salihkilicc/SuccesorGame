import React from 'react';
import {Text, StyleSheet, ViewStyle, TextStyle, View} from 'react-native';

type BadgeSize = 'small' | 'large';

type Props = {
  size?: BadgeSize;
  style?: ViewStyle | TextStyle;
};

const PremiumBadge = ({size = 'small', style}: Props) => {
  const isLarge = size === 'large';
  return (
    <View style={[styles.base, isLarge ? styles.large : styles.small, style]}>
      <Text style={[styles.label, isLarge ? styles.labelLarge : styles.labelSmall]}>
        PREMIUM
      </Text>
    </View>
  );
};

export default PremiumBadge;

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#FACC15',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#B45309',
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
    color: '#7C2D12',
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
