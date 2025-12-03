import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  StyleSheet,
  Pressable,
  Text,
} from 'react-native';
import StatBar from '../../../components/common/StatBar';
import CompanyHeader from '../../../components/MyCompany/CompanyHeader';
import CompanyActions from '../../../components/MyCompany/CompanyActions';
import CompanyPortfolio from '../../../components/MyCompany/CompanyPortfolio';
import FinancialSummary from '../../../components/MyCompany/FinancialSummary';
import {useStatsStore, useEventStore} from '../../../store';
import {triggerEvent} from '../../../event/eventEngine';

const MyCompanyScreen = () => {
  const {
    companyValue,
    companySharePrice,
    companyDailyChange,
    companyDebt,
    companyOwnership,
  } = useStatsStore();
  const {lastCompanyEvent} = useEventStore();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatBar />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>MY COMPANY</Text>
          <Text style={styles.subtitle}>Rich Industries — Main Holding Company</Text>
        </View>

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
    </SafeAreaView>
  );
};

export default MyCompanyScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#05060A',
  },
  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#E8EDF5',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#A3AEC2',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EEF2FF',
    letterSpacing: 0.3,
  },
  eventCard: {
    backgroundColor: '#0C0F1A',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#181C2A',
  },
  eventText: {
    fontSize: 13,
    color: '#A3AEC2',
    lineHeight: 18,
  },
  secondaryButton: {
    backgroundColor: '#1B2340',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#263157',
  },
  secondaryButtonPressed: {
    backgroundColor: '#202A4A',
    transform: [{scale: 0.98}],
  },
  secondaryButtonText: {
    color: '#E6ECF7',
    fontWeight: '700',
    fontSize: 14,
  },
});
