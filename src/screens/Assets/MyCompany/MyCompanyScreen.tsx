import React from 'react';
import {ScrollView, View, StyleSheet, Pressable, Text} from 'react-native';
import CompanyHeader from '../../../components/MyCompany/CompanyHeader';
import CompanyActions from '../../../components/MyCompany/CompanyActions';
import CompanyPortfolio from '../../../components/MyCompany/CompanyPortfolio';
import FinancialSummary from '../../../components/MyCompany/FinancialSummary';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useStatsStore, useEventStore} from '../../../store';
import {triggerEvent} from '../../../event/eventEngine';
import {theme} from '../../../theme';
import AppScreen from '../../../components/layout/AppScreen';
import type {AssetsStackParamList} from '../../../navigation';

const MyCompanyScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AssetsStackParamList>>();
  const {
    companyValue,
    companySharePrice,
    companyDailyChange,
    companyDebt,
    companyOwnership,
  } = useStatsStore();
  const {lastCompanyEvent} = useEventStore();

  const BackButton = () => (
    <Pressable
      onPress={() => {
        if (navigation.canGoBack()) navigation.goBack();
      }}
      style={({pressed}) => [styles.backButton, pressed && styles.backButtonPressed]}>
      <Text style={styles.backIcon}>←</Text>
    </Pressable>
  );

  return (
    <AppScreen
      title="MY COMPANY"
      subtitle="Rich Industries — Main Holding Company"
      leftNode={<BackButton />}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <CompanyHeader
          valuation={companyValue}
          sharePrice={companySharePrice}
          dailyChange={companyDailyChange}
          ownership={companyOwnership}
          debt={companyDebt}
        />

        <CompanyActions />
        <CompanyPortfolio />
        <FinancialSummary />

        <View style={styles.eventCard}>
          <Text style={styles.sectionTitle}>Last Company Event</Text>
          <Text style={styles.eventText}>
            {lastCompanyEvent ?? 'Henüz önemli bir şirket olayı yaşanmadı.'}
          </Text>
          <Pressable
            onPress={() => {
              void triggerEvent('company');
            }}
            style={({pressed}) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
            ]}>
            <Text style={styles.secondaryButtonText}>Trigger Company Event</Text>
          </Pressable>
        </View>
      </ScrollView>
    </AppScreen>
  );
};

export default MyCompanyScreen;

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  eventCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  eventText: {
    fontSize: theme.typography.caption + 1,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  secondaryButton: {
    backgroundColor: theme.colors.accentSoft,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  secondaryButtonPressed: {
    backgroundColor: theme.colors.card,
    transform: [{scale: 0.98}],
  },
  secondaryButtonText: {
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: theme.typography.body,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
  },
  backButtonPressed: {
    backgroundColor: theme.colors.cardSoft,
    transform: [{scale: 0.97}],
  },
  backIcon: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '700',
  },
});
