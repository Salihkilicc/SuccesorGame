// src/features/MyCompany/MyCompanyScreen.tsx

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../../theme';
import { useStatsStore } from '../../../store';
import { useProductStore } from '../../../store/useProductStore';
import { formatCurrency } from './NativeEconomy';
import { useCompanyLogic } from './useCompanyLogic';

// --- YENİ TEMİZ IMPORTLAR ---
import { DashboardCard, StatColumn, VerticalDivider, SectionHeader } from './components/CompanyUI';
import { CompanyModals } from './components/CompanyModals';
import ManagementCard from '../../../components/MyCompany/ManagementCard';
import SectionCard from '../../../components/common/SectionCard';

// Helper Component (Burada bıraktık çünkü çok spesifik)
const DepartmentCard = ({ icon, title, subtitle, onPress }: any) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.deptCard, pressed && { opacity: 0.8 }]}>
    <Text style={{ fontSize: 32 }}>{icon}</Text>
    <Text style={styles.deptTitle}>{title}</Text>
    <Text style={styles.deptSub}>{subtitle}</Text>
  </Pressable>
);

const MyCompanyScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Logic Hook
  const { handlePurchaseFactory, handleHireEmployees, costs, limits } = useCompanyLogic();
  const { products } = useProductStore();

  // Store Data
  const stats = useStatsStore(); // Hepsini tek objede aldım, aşağıda stats.xxx diye kullanacağız, daha temiz.

  // --- UI STATES ---
  const [modals, setModals] = useState<any>({});
  const toggleModal = (key: string, val: boolean) => setModals((p: any) => ({ ...p, [key]: val }));

  const [borrowConfig, setBorrowConfig] = useState({ visible: false, type: '', rate: 0 });
  const [repayConfig, setRepayConfig] = useState({ visible: false });

  // Share Actions (Bunu burda tutuyoruz çünkü modal zinciri var)
  const [activeShareAction, setActiveShareAction] = useState<string | null>(null);
  const [selectedShareholder, setSelectedShareholder] = useState<any>(null);

  const activeProductsCount = products.filter(p => p.status === 'active').length;

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>

        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}><Text style={styles.backTxt}>←</Text></Pressable>
          <View>
            <Text style={styles.title}>Command Center</Text>
            <Text style={styles.subtitle}>Manage your company operations</Text>
          </View>
        </View>

        {/* COMPANY STATS CARD */}
        <DashboardCard
          title="My Company"
          rightContent={
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Text style={styles.sharePrice}>${stats.companySharePrice.toFixed(2)}</Text>
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

        {/* PERSONAL FINANCE CARD */}
        <DashboardCard title="Personal Finances">
          <StatColumn label="Net Worth" value={formatCurrency(stats.netWorth)} />
          <VerticalDivider />
          <StatColumn label="Income" value={`+${formatCurrency(stats.monthlyIncome)}`} colorType="success" />
          <VerticalDivider />
          <StatColumn label="Expenses" value={`-${formatCurrency(stats.monthlyExpenses)}`} colorType="danger" />
        </DashboardCard>

        {/* OPERATIONS */}
        <SectionHeader title="OPERATIONS MANAGEMENT" />
        <View style={{ gap: 12 }}>
          <ManagementCard title="Factories" icon="🏭" currentValue={stats.factoryCount} maxValue={limits.maxFactories} costPerUnit={costs.factory} onSave={handlePurchaseFactory} />
          <ManagementCard title="Employees" icon="👥" currentValue={stats.employeeCount} maxValue={limits.maxEmployees} costPerUnit={costs.employee} onSave={handleHireEmployees} />
        </View>

        {/* DEPARTMENTS */}
        <SectionHeader title="DEPARTMENTS" />
        <View style={styles.grid}>
          <DepartmentCard icon="🏦" title="Finance" subtitle={`Debt: ${formatCurrency(stats.companyDebtTotal)}`} onPress={() => toggleModal('finance', true)} />
          <DepartmentCard icon="🏭" title="Products" subtitle={`${activeProductsCount} Active`} onPress={() => toggleModal('product', true)} />
          <DepartmentCard icon="👥" title="HR & Management" subtitle={`${stats.employeeCount} Employees`} onPress={() => toggleModal('management', true)} />
          <DepartmentCard icon="📈" title="Stock Market" subtitle={`${stats.companyOwnership.toFixed(1)}% Owned`} onPress={() => toggleModal('shareControl', true)} />
        </View>

        {/* QUICK ACTIONS */}
        <SectionHeader title="QUICK ACTIONS" />
        <View style={{ gap: 8 }}>
          <SectionCard title="🔬 R&D Investment" subtitle="Invest in future growth" onPress={() => toggleModal('rnd', true)} />
          <SectionCard title="🧩 Acquire Company" subtitle="Expand your empire" onPress={() => toggleModal('acquire', true)} />
          <SectionCard title="👔 Board Members" subtitle="View shareholders" onPress={() => toggleModal('boardMembers', true)} />
          <SectionCard title="🏢 Existing Companies" subtitle="Manage subsidiaries" onPress={() => toggleModal('existingCompanies', true)} />
        </View>

      </ScrollView>

      {/* --- MODAL MANAGER (Tüm modallar burada) --- */}
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
          }
        }}
      />

      {/* Shareholder ve diğer küçük modallar burada kalabilir veya onları da Modal dosyasına atabilirsin.
          Şimdilik karmaşıklığın %90'ını çözdük. */}

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