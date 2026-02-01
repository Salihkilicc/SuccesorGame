import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useStatsStore } from '../../core/store/useStatsStore';
import { useEquityStore } from '../../features/finance/stores/useEquityStore';
import ShareControlHub from './Shares/ShareControlHub';

const CompanyPortfolio = () => {
  const { companyOwnership, companyValue, update } = useStatsStore();
  const goPublic = useEquityStore((state) => state.goPublic);
  const [showShareControl, setShowShareControl] = useState(false);

  const handleLaunchIPO = () => {
    // Validation
    if (companyValue <= 0) {
      Alert.alert('Cannot Launch IPO', 'Company valuation must be greater than $0.');
      return;
    }

    // Calculate IPO details
    const cashRaised = companyValue * 0.20;

    // Show confirmation dialog
    Alert.alert(
      '🔔 Launch IPO',
      `Going public will:\n\n` +
      `• Sell 20% of shares to public investors\n` +
      `• Raise $${(cashRaised / 1_000_000).toFixed(1)}M in capital\n` +
      `• Reduce your ownership to 80%\n` +
      `• Apply 1.5x IPO hype multiplier\n\n` +
      `Company Valuation: $${(companyValue / 1_000_000).toFixed(1)}M\n\n` +
      `Are you ready to go public?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Launch IPO',
          style: 'default',
          onPress: () => {
            // Execute IPO via Equity Store
            const result = goPublic(companyValue);

            // Add cash to company capital
            update({
              companyCapital: (useStatsStore.getState().companyCapital || 0) + result.cashRaised,
              companyOwnership: result.newOwnershipPercent,
              isPublic: true,
            });

            console.log('[CompanyPortfolio] IPO Executed:', result);

            // Success feedback
            Alert.alert(
              '🎉 IPO Successful!',
              `You raised $${(result.cashRaised / 1_000_000).toFixed(1)}M!\n\n` +
              `The market is now open for trading.\n` +
              `Your ownership: ${result.newOwnershipPercent.toFixed(1)}%`
            );
          },
        },
      ]
    );
  };

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
        onOpenIPO={handleLaunchIPO}
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
