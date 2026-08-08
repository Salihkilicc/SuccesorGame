// @orphan-ok monetisation gating was never wired into the CEO cut
// Kept deliberately: nothing renders this, and it is not meant to be.
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import PremiumBadge from './PremiumBadge';

type Props = {
  title: string;
  description: string;
  isLocked: boolean;
};

const GatedPremiumRow = ({title, description, isLocked}: Props) => (
  <View style={[styles.row, isLocked && styles.rowLocked]}>
    <View style={{flex: 1}}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.description, isLocked && styles.descriptionLocked]}>
        {description}
      </Text>
    </View>
    {isLocked ? <PremiumBadge size="small" /> : null}
  </View>
);

export default GatedPremiumRow;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  rowLocked: {
    opacity: 0.8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  description: {
    fontSize: 13,
    color: '#FFFFFF',
    marginTop: 2,
  },
  descriptionLocked: {
    color: '#FFFFFF',
  },
});
