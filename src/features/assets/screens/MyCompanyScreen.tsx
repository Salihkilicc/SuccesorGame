// src/screens/MyCompany/MyCompanyScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, Pressable, Alert, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../../core/theme';
import { useStatsStore } from '../../../core/store';
import { useProductStore } from '../../../core/store/useProductStore';
import { useGameStore } from '../../../core/store/useGameStore';
import { useEquityStore } from '../../finance/stores/useEquityStore';
import { useShareholderStore } from '../../../features/shareholders/stores/useShareholderStore';
import { formatCurrency } from '../hooks/NativeEconomy';
import { useCompanyLogic } from '../hooks/useCompanyLogic';

// --- UI Components ---
import { DashboardCard, StatColumn, VerticalDivider, SectionHeader } from '../components/MyCompany/CompanyUI';
import { CompanyModals } from '../components/MyCompany/CompanyModals';
import ManagementCard from '../../../components/MyCompany/ManagementCard';
import SectionCard from '../../../components/common/SectionCard';
import CrystalNavBar from '../../../navigation/components/CrystalNavBar';

// Helper Component
const DepartmentCard = ({ icon, title, subtitle, onPress, color = '#333' }: any) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.deptCard,
      { borderColor: color },
      pressed && { opacity: 0.8, backgroundColor: color.replace('0.5', '0.1') } // Subtle tint on press if rgba, or just opacity
    ]}>
    <Text style={{ fontSize: 32 }}>{icon}</Text>
    <Text style={styles.deptTitle}>{title}</Text>
    <Text style={styles.deptSub}>{subtitle}</Text>
  </Pressable>
);

const formatCompactNumber = (num: number) => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toString();
};

const MyCompanyScreen = () => {
  // Navigation'a <any> veriyoruz ki TypeScript hata vermesin
  const navigation = useNavigation<any>();

  // Logic Hook
  const { handlePurchaseFactory, handleHireEmployees, costs, limits } = useCompanyLogic();
  const { products } = useProductStore();
  const { employeeMorale } = useGameStore();

  // Store Data
  const stats = useStatsStore();

  // Equity Store - Dynamic Stock Price
  const stockPrice = useEquityStore((state) => state.stockPrice);
  const syncStockPrice = useEquityStore((state) => state.syncStockPrice);

  // Sync stock price when company valuation changes
  useEffect(() => {
    if (stats.companyValue > 0) {
      syncStockPrice(stats.companyValue);
    }
  }, [stats.companyValue, syncStockPrice]);

  // Initialize Board Members if empty
  const { members, initializeGame, totalShares, playerShareCount } = useShareholderStore();
  useEffect(() => {
    if (!members || members.length === 0) {
      console.log('[MyCompanyScreen] Initializing board members...');
      initializeGame();
    }
  }, [members, initializeGame]);

  // --- UI STATES ---
  const [modals, setModals] = useState<any>({});
  const toggleModal = (key: string, val: boolean) => setModals((p: any) => ({ ...p, [key]: val }));

  const [borrowConfig, setBorrowConfig] = useState({ visible: false, type: '', rate: 0 });
  const [repayConfig, setRepayConfig] = useState({ visible: false });

  // Share Actions
  const [activeShareAction, setActiveShareAction] = useState<string | null>(null);
  const [selectedShareholder, setSelectedShareholder] = useState<any>(null);

  const activeProductsCount = products.filter(p => p.status === 'active').length;

  // IPO Handler
  const goPublic = useEquityStore((state) => state.goPublic);

  const handleLaunchIPO = () => {
    // Validation
    if (stats.companyValue <= 0) {
      Alert.alert('Cannot Launch IPO', 'Company valuation must be greater than $0.');
      return;
    }

    // Calculate IPO details
    const cashRaised = stats.companyValue * 0.20;

    // Show confirmation dialog
    Alert.alert(
      '🔔 Launch IPO',
      `Going public will:\n\n` +
      `• Sell 20% of shares to public investors\n` +
      `• Raise $${(cashRaised / 1_000_000).toFixed(1)}M in capital\n` +
      `• Reduce your ownership to 80%\n` +
      `• Apply 1.5x IPO hype multiplier\n\n` +
      `Company Valuation: $${(stats.companyValue / 1_000_000).toFixed(1)}M\n\n` +
      `Are you ready to go public?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Launch IPO',
          style: 'default',
          onPress: () => {
            // Execute IPO via Equity Store
            const result = goPublic(
              stats.companyValue,
              (amount) => {
                const currentCapital = useStatsStore.getState().companyCapital;
                stats.update({ companyCapital: currentCapital + amount });
              }
            );

            // Update stats ownership and status (sync)
            stats.update({
              companyOwnership: result.newOwnershipPercent,
              isPublic: true,
            });

            console.log('[MyCompanyScreen] IPO Executed:', result);

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
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0a0a0c', '#000000', '#050505']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* FIXED HEADER */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.navigate('Home')}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && { opacity: 0.6, transform: [{ scale: 0.95 }] },
            ]}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#C5A059" />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>COMMAND CENTER</Text>
            <View style={styles.headerAccent} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 120, paddingTop: 0 }]}>

          {/* COMPANY STATS CARD */}
          <DashboardCard
            title="My Company"
            rightContent={
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Text style={styles.sharePrice}>${stockPrice.toFixed(2)}</Text>
                <Text style={{ color: (stats.companyDailyChange || 0) >= 0 ? theme.colors.success : theme.colors.danger, fontWeight: '700' }}>
                  {(stats.companyDailyChange || 0).toFixed(2)}%
                </Text>
              </View>
            }
          >
            {/* Row 1: Finances */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <StatColumn label="Valuation" value={formatCurrency(stats.companyValue)} />
              <VerticalDivider />
              <StatColumn label="Capital" value={formatCurrency(stats.companyCapital)} />
              <VerticalDivider />
              <StatColumn label="CEO Cash" value={formatCurrency(stats.money)} colorType="success" />
            </View>

            {/* Divider */}
            <View style={{ width: '100%', height: 1, backgroundColor: '#333', marginVertical: 16 }} />

            {/* Row 2: Shares */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <StatColumn label="Outstanding" value={formatCompactNumber(totalShares || 10_000_000)} />
              <VerticalDivider />
              <StatColumn label="Your Shares" value={formatCompactNumber(playerShareCount || 0)} />
              <VerticalDivider />
              {/* Ownership % */}
              <StatColumn
                label="Ownership"
                value={`${((playerShareCount || 0) / (totalShares || 10_000_000) * 100).toFixed(1)}%`}
                colorType={stats.companyOwnership >= 51 ? 'success' : 'danger'}
              />
            </View>
          </DashboardCard>

          {/* DEPARTMENTS */}
          <View style={styles.grid}>
            <DepartmentCard
              icon="🏦"
              title="Finance"
              subtitle={`Debt: ${formatCurrency(stats.companyDebtTotal)}`}
              onPress={() => toggleModal('finance', true)}
              color="rgba(255, 215, 0, 0.5)" // Gold
            />

            <DepartmentCard
              icon="🏭"
              title="Products"
              subtitle={`${activeProductsCount} Active`}
              onPress={() => navigation.navigate('Products')}
              color="rgba(10, 132, 255, 0.5)" // Blue
            />

            <DepartmentCard
              icon="📊"
              title="Financial Report"
              subtitle="Expenses, Profits & ROI"
              onPress={() => navigation.navigate('FinancialReport')}
              color="rgba(191, 90, 242, 0.5)" // Purple
            />
            <DepartmentCard
              icon="📈"
              title="Stock Market"
              subtitle={`${stats.companyOwnership.toFixed(1)}% Owned`}
              onPress={() => toggleModal('shareControl', true)}
              color="rgba(48, 209, 88, 0.5)" // Green
            />
          </View>


          {/* OPERATIONS */}
          <SectionHeader title="OPERATIONS MANAGEMENT" />
          <View style={{ gap: 12 }}>
            <ManagementCard title="Factories" icon="🏭" currentValue={stats.factoryCount} maxValue={limits.maxFactories} costPerUnit={costs.factory} onSave={handlePurchaseFactory} />

            <ManagementCard
              title="Employees"
              icon="👥"
              currentValue={stats.employeeCount}
              minValue={limits.minEmployees}
              maxValue={limits.maxEmployees}
              costPerUnit={costs.employee}
              onSave={handleHireEmployees}
              headerRight={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                  {/* Morale Bar */}
                  {/* Morale Bar with Label */}
                  <View style={{ alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 9, color: '#8E8E93', fontWeight: '800', letterSpacing: 0.5 }}>MORALE</Text>
                    <View style={{ width: 80, height: 8, backgroundColor: '#2C2C2E', borderRadius: 4, overflow: 'hidden' }}>
                      <View style={{
                        width: `${employeeMorale}%`,
                        height: '100%',
                        backgroundColor:
                          employeeMorale < 30 ? '#FF453A' : // Red
                            employeeMorale < 50 ? '#FF9F0A' : // Orange
                              employeeMorale < 70 ? '#32D74B' : // Light Green
                                '#30D158' // Success Green
                      }} />
                    </View>
                  </View>
                  <Pressable
                    onPress={() => toggleModal('employees', true)}
                    style={({ pressed }) => [{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: pressed ? '#0A84FF' : '#2C2C2E',
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: 'rgba(10, 132, 255, 0.3)',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 3,
                      elevation: 4,
                    }]}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>+ Boost</Text>
                  </Pressable>
                </View>
              }
            />
          </View>



          {/* QUICK ACTIONS */}
          <SectionHeader title="QUICK ACTIONS" />
          <View style={{ gap: 8 }}>
            <SectionCard title="🔬 R&D Investment" subtitle="Invest in future growth" onPress={() => navigation.navigate('Research')} />
            <SectionCard title="🏢 Hostile Takeover" subtitle="Buy public companies to gain their tech and buffs" onPress={() => toggleModal('acquire', true)} />
            <SectionCard title="👔 Board Members" subtitle="View shareholders" onPress={() => toggleModal('boardMembers', true)} />
            <SectionCard title="🏆 My Empire" subtitle="Manage subsidiaries" onPress={() => toggleModal('existingCompanies', true)} />
          </View>

        </ScrollView>

        {/* Universal Crystal Navigation Bar (Dark Variant) */}
        <CrystalNavBar activeTab="Company" variant="dark" />

        {/* --- MODAL MANAGER --- */}
        <CompanyModals
          modals={modals}
          toggleModal={toggleModal}
          companyCapital={stats.companyCapital}
          companyDebtTotal={stats.companyDebtTotal}
          selectedShareholder={selectedShareholder}
          financeActions={{
            borrowConfig, setBorrowConfig, repayConfig, setRepayConfig,
            handleBorrow: (amt: number, rate: number) => { stats.borrowCapital(amt, rate); setBorrowConfig(p => ({ ...p, visible: false })); setTimeout(() => toggleModal('finance', true), 300); },
            handleRepay: (amt: number) => { stats.repayCapital(amt); setRepayConfig(p => ({ ...p, visible: false })); setTimeout(() => toggleModal('finance', true), 300); }
          }}
          shareActions={{
            onOpenAction: (type: string) => { toggleModal('shareControl', false); setTimeout(() => setActiveShareAction(type), 300); },
            onSelectMember: (m: any) => {
              toggleModal('boardMembers', false);
              setSelectedShareholder(m);
              setTimeout(() => toggleModal('profile', true), 300);
            },
            handleLaunchIPO,
          }}
        />
      </SafeAreaView>
    </View>
  );
};

export default MyCompanyScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: theme.spacing.lg, gap: theme.spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(197,160,89,0.15)',
    minHeight: 80,
    backgroundColor: 'transparent',
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 16,
    bottom: 12,
    zIndex: 10,
    backgroundColor: 'rgba(197,160,89,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(197,160,89,0.2)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '300',
    color: '#E5E5E5',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  headerAccent: {
    width: 32,
    height: 2,
    backgroundColor: '#D4AF37',
    marginTop: 6,
    borderRadius: 2,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  subtitle: { color: '#888888', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  deptCard: {
    flexBasis: '48%',
    backgroundColor: 'rgba(22, 22, 24, 0.8)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    gap: 8,
    minHeight: 120,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  deptTitle: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', letterSpacing: 0.3 },
  deptSub: { fontSize: 12, color: '#888888', textAlign: 'center' },
  sharePrice: { fontSize: 18, fontWeight: '700', color: '#FFD700' }, // Gold for money
});