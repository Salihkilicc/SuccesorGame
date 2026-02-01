// src/screens/MyCompany/MyCompanyScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../../core/theme';
import { useStatsStore } from '../../../core/store';
import { useProductStore } from '../../../core/store/useProductStore';
import { useGameStore } from '../../../core/store/useGameStore';
import { useEquityStore } from '../../finance/stores/useEquityStore';
import { formatCurrency } from '../hooks/NativeEconomy';
import { useCompanyLogic } from '../hooks/useCompanyLogic';

// --- UI Components ---
import { DashboardCard, StatColumn, VerticalDivider, SectionHeader } from '../components/MyCompany/CompanyUI';
import { CompanyModals } from '../components/MyCompany/CompanyModals';
import ManagementCard from '../../../components/MyCompany/ManagementCard';
import SectionCard from '../../../components/common/SectionCard';

// Helper Component
const DepartmentCard = ({ icon, title, subtitle, onPress }: any) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.deptCard, pressed && { opacity: 0.8 }]}>
    <Text style={{ fontSize: 32 }}>{icon}</Text>
    <Text style={styles.deptTitle}>{title}</Text>
    <Text style={styles.deptSub}>{subtitle}</Text>
  </Pressable>
);

const MyCompanyScreen = () => {
  // Navigation'a <any> veriyoruz ki TypeScript hata vermesin
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

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
            const result = goPublic(stats.companyValue);

            // Add cash to company capital
            stats.update({
              companyCapital: stats.companyCapital + result.cashRaised,
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
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      {/* FIXED HEADER */}
      <View style={[styles.header, { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}><Text style={styles.backTxt}>←</Text></Pressable>
        <View>
          <Text style={styles.title}>Command Center</Text>
          <Text style={styles.subtitle}>Manage your company operations</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40, paddingTop: 0 }]}>

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
          <StatColumn label="Valuation" value={formatCurrency(stats.companyValue)} />
          <VerticalDivider />
          <StatColumn label="Capital" value={formatCurrency(stats.companyCapital)} />
          <VerticalDivider />
          <StatColumn label="CEO Cash" value={formatCurrency(stats.money)} colorType="success" />
        </DashboardCard>


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
                  <Text style={{ fontSize: 9, color: theme.colors.textMuted, fontWeight: '800', letterSpacing: 0.5 }}>MORALE</Text>
                  <View style={{ width: 80, height: 8, backgroundColor: theme.colors.cardSoft, borderRadius: 4, overflow: 'hidden' }}>
                    <View style={{
                      width: `${employeeMorale}%`,
                      height: '100%',
                      backgroundColor:
                        employeeMorale < 30 ? theme.colors.danger :
                          employeeMorale < 50 ? '#F59E0B' : // Orange
                            employeeMorale < 70 ? '#10B981' : // Light Green
                              theme.colors.success // Dark Green
                    }} />
                  </View>
                </View>
                <Pressable
                  onPress={() => toggleModal('employees', true)}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: theme.colors.cardSoft, borderRadius: 8 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.textPrimary }}>+ Boost</Text>
                </Pressable>
              </View>
            }
          />
        </View>

        {/* DEPARTMENTS */}
        <SectionHeader title="DEPARTMENTS" />
        <View style={styles.grid}>
          <DepartmentCard
            icon="🏦"
            title="Finance"
            subtitle={`Debt: ${formatCurrency(stats.companyDebtTotal)}`}
            onPress={() => toggleModal('finance', true)}
          />

          {/* 👇 DÜZELTME BURADA YAPILDI: ARTIK NAVİGASYONA GİDİYOR 👇 */}
          <DepartmentCard
            icon="🏭"
            title="Products"
            subtitle={`${activeProductsCount} Active`}
            onPress={() => navigation.navigate('Products')}
          />
          {/* 👆 -------------------------------------------------- 👆 */}

          <DepartmentCard
            icon="📊"
            title="Financial Report"
            subtitle="Expenses, Profits & ROI"
            onPress={() => navigation.navigate('FinancialReport')}
          />
          <DepartmentCard
            icon="📈"
            title="Stock Market"
            subtitle={`${stats.companyOwnership.toFixed(1)}% Owned`}
            onPress={() => toggleModal('shareControl', true)}
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
    </View>
  );
};

export default MyCompanyScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, gap: theme.spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  backTxt: { fontSize: 20, color: theme.colors.textPrimary },
  title: { fontSize: 24, fontWeight: '800', color: theme.colors.textPrimary },
  subtitle: { color: theme.colors.textSecondary, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  deptCard: { flexBasis: '48%', backgroundColor: theme.colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', gap: 8, minHeight: 120, justifyContent: 'center' },
  deptTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.textPrimary, textAlign: 'center' },
  deptSub: { fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center' },
  sharePrice: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary },
});