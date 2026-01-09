import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useStatsStore } from '../../core/store/useStatsStore';
import ShareControlHub from './Shares/ShareControlHub';

const CompanyPortfolio = () => {
  const { companyOwnership } = useStatsStore();
  const [showShareControl, setShowShareControl] = useState(false);

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.title}>Portfolio</Text>
        <View style={styles.list}>
          {/* Share Control Card */}
          <Pressable
            style={({ pressed }) => [styles.card, styles.shareCard, pressed && styles.cardPressed]}
            onPress={() => setShowShareControl(true)}>
            <View style={styles.shareHeader}>
              <Text style={styles.name}>📊 Share Control</Text>
              <Text style={styles.ownershipBadge}>{companyOwnership.toFixed(1)}%</Text>
            </View>
            <Text style={styles.revenue}>Manage shareholders & equity</Text>
          </Pressable>
        </View>
      </View>

      <ShareControlHub
        visible={showShareControl}
        onClose={() => setShowShareControl(false)}
        onOpenIPO={() => console.log('IPO')}
        onOpenDilution={() => console.log('Dilution')}
        onOpenDividend={() => console.log('Dividend')}
        onOpenBuyback={() => console.log('Buyback')}
      />
    </>
  );
};

export default CompanyPortfolio;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0C0F1A',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#181C2A',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EEF2FF',
    letterSpacing: 0.3,
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: '#0F1424',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1C2335',
  },
  shareCard: {
    borderColor: '#3B82F6',
    borderWidth: 1,
  },
  cardPressed: {
    backgroundColor: '#131A2D',
  },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E6ECF7',
  },
  ownershipBadge: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3B82F6',
    backgroundColor: '#3B82F620',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  revenue: {
    fontSize: 13,
    color: '#9AA7BC',
  },
});
