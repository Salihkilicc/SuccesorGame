// @orphan-ok superseded by features/assets/screens/MyCompanyScreen.tsx
// Kept deliberately: nothing renders this, and it is not meant to be.
import React, { useState } from 'react';
import { t, useLocale } from '../../core/i18n';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useStatsStore } from '../../core/store/useStatsStore';
import { useEquityStore } from '../../features/finance/stores/useEquityStore';
import ShareControlHub from './Shares/ShareControlHub';
import { formatMoney } from '../../core/utils';

const CompanyPortfolio = () => {
    useLocale();
  const { companyOwnership, companyValue, update } = useStatsStore();
  const goPublic = useEquityStore((state) => state.goPublic);
  const [showShareControl, setShowShareControl] = useState(false);

  const handleLaunchIPO = () => {
    // Validation
    if (companyValue <= 0) {
      Alert.alert(t('alert.cannotLaunchIpo'), t('alert.companyValuationMustBeGreater'));
      return;
    }

    // Calculate IPO details
    const cashRaised = companyValue * 0.20;

    // Show confirmation dialog
    Alert.alert(
      '🔔 Launch IPO',
      `Going public will:\n\n` +
      `• Sell 20% of shares to public investors\n` +
      `• Raise ${formatMoney(cashRaised)} in capital\n` +
      `• Reduce your ownership to 80%\n` +
      `• Apply 1.5x IPO hype multiplier\n\n` +
      `Company Valuation: ${formatMoney(companyValue)}\n\n` +
      `Are you ready to go public?`,
      [
        { text: t('ui.cancel'), style: 'cancel' },
        {
          text: t('ui.launchIpo'),
          style: 'default',
          onPress: () => {
            // Execute IPO via Equity Store
            const result = goPublic(
              companyValue,
              (amount) => {
                const currentCapital = useStatsStore.getState().companyCapital;
                update({ companyCapital: currentCapital + amount });
              }
            );

            // Update stats ownership and status
            update({
              companyOwnership: result.newOwnershipPercent,
              isPublic: true,
            });

            console.log('[CompanyPortfolio] IPO Executed:', result);

            // Success feedback
            Alert.alert(
              '🎉 IPO Successful!',
              `You raised ${formatMoney(result.cashRaised)}!\n\n` +
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
        <Text style={styles.title}>{t('ui.portfolio')}</Text>
        <View style={styles.list}>
          {/* Share Control Card */}
          <Pressable
            style={({ pressed }) => [styles.card, styles.shareCard, pressed && styles.cardPressed]}
            onPress={() => setShowShareControl(true)}>
            <View style={styles.shareHeader}>
              <Text style={styles.name}>📊 Share Control</Text>
              <Text style={styles.ownershipBadge}>{companyOwnership.toFixed(1)}%</Text>
            </View>
            <Text style={styles.revenue}>{t('ui.manageShareholdersEquity')}</Text>
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
    backgroundColor: '#31241F',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: '#31241F',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  shareCard: {
    borderColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
  },
  cardPressed: {
    backgroundColor: '#31241F',
  },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ownershipBadge: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A2A92',
    backgroundColor: '#0A2A9220',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  revenue: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.48)',
  },
});
