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
    backgroundColor: '#f9fafb',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
  },
  rowLocked: {
    opacity: 0.8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  description: {
    fontSize: 13,
    color: '#4b5563',
    marginTop: 2,
  },
  descriptionLocked: {
    color: '#6b7280',
  },
});
