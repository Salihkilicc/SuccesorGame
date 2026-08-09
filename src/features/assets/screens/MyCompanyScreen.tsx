// src/screens/MyCompany/MyCompanyScreen.tsx

import React, { useState, useEffect } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, ScrollView, StyleSheet, Text, Pressable, Alert, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../../core/theme';
import { useStatsStore } from '../../../core/store';
import { useProductStore } from '../../../core/store/useProductStore';
import { useGameStore } from '../../../core/store/useGameStore';
import { useEquityStore } from '../../finance/stores/useEquityStore';
import { useShareholderStore } from '../../../features/shareholders/stores/useShareholderStore';
import { useCorporateFinanceStore } from '../../finance/stores/useCorporateFinanceStore';
import { IPO_MIN_VALUATION, quoteIpo } from '../../../core/market/equity';
import { formatCurrency } from '../hooks/NativeEconomy';
import { useCompanyLogic } from '../hooks/useCompanyLogic';

// --- UI Components ---
import { DashboardCard, StatColumn, VerticalDivider, SectionHeader } from '../components/MyCompany/CompanyUI';
import { CompanyModals } from '../components/MyCompany/CompanyModals';
import FacilityPanel from '../components/FacilityPanel';
import ManagementCard from '../../../components/MyCompany/ManagementCard';
import ScreenHeader from '../../../components/common/ScreenHeader';
import SectionCard from '../../../components/common/SectionCard';
import ConfirmPanel, { type ConfirmLine } from '../../../components/common/ConfirmPanel';
import { formatMoney, formatPrice, formatNumber } from '../../../core/utils';

// Helper Component
//
//  Each of the four cards used to carry its own colour, and the colours were
//  left over from two themes ago: the comments said Gold, Blue, Purple, Green
//  while the values were all magenta or lavender. Four departments in four
//  arbitrary colours is also the thing that made the screen look scattered -
//  the colour said nothing, since none of them mean anything.
//
//  They share one surface now. The icon distinguishes them; the press state
//  lifts the card by one rung of the elevation ladder instead of tinting it.
const DepartmentCard = ({ icon, title, subtitle, onPress }: any) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.deptCard,
      pressed && styles.deptCardPressed,
    ]}>
    <Text style={{ fontSize: 32 }}>{icon}</Text>
    <Text style={styles.deptTitle}>{title}</Text>
    <Text style={styles.deptSub}>{subtitle}</Text>
  </Pressable>
);

const formatCompactNumber = (num: number) => {
  return formatNumber(num);
  // eslint-disable-next-line no-unreachable
  return num.toString();
};

const MyCompanyScreen = () => {
    useLocale();
  // Navigation'a <any> veriyoruz ki TypeScript hata vermesin
  const navigation = useNavigation<any>();

  // Logic Hook
  const { handleHireEmployees } = useCompanyLogic();
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

  const [panel, setPanel] = useState<null | {
    title: string;
    summary?: string;
    lines?: ConfirmLine[];
    note?: string;
    confirmLabel: string;
    cancelLabel?: string;
    onConfirm?: () => void;
    tone?: 'default' | 'danger';
  }>(null);

  const [borrowConfig, setBorrowConfig] = useState({ visible: false, type: '', rate: 0 });
  const [repayConfig, setRepayConfig] = useState({ visible: false });

  // Share Actions
  const [activeShareAction, setActiveShareAction] = useState<string | null>(null);
  const [selectedShareholder, setSelectedShareholder] = useState<any>(null);

  const activeProductsCount = products.filter(p => p.status === 'active').length;

  // IPO Handler
  const goPublic = useEquityStore((state) => state.goPublic);

  const handleLaunchIPO = () => {
    // ------------------------------------------------------------------
    //  HALKA ARZ
    // ------------------------------------------------------------------
    //  ESKI EKRAN YANLIS SEY VAAD EDIYORDU: "degerlemenin %20'si kadar
    //  nakit, sahiplik %80'e duser". Ikisi de yanlisti — oyuncu zaten
    //  %100'e sahip degildi (%65), ve gercek bir halka arzda paranin
    //  tamami sirkete girmez.
    //
    //  Artik teklif gercek maliyetleriyle gosteriliyor: aracilik
    //  komisyonu ve halka arz iskontosu dahil.
    // ------------------------------------------------------------------
    const cap = useShareholderStore.getState();
    const quote = quoteIpo(stats.companyValue, cap.totalShares, cap.playerShareCount, 0.20);

    if (stats.companyValue < IPO_MIN_VALUATION) {
      setPanel({
        title: t('alert.notReadyToList'),
        summary: 'Underwriters will not take a company public at this valuation.',
        lines: [
          { label: 'Minimum', value: formatMoney(IPO_MIN_VALUATION) },
          { label: 'You are at', value: formatMoney(stats.companyValue), strong: true },
        ],
        note: 'Grow revenue and profit first — the multiple follows.',
        confirmLabel: 'OK',
      });
      return;
    }

    // The IPO confirmation was nine lines of prose and a table faked with \n
    // and spaces inside a system dialog. Same figures, rendered as rows.
    setPanel({
      title: t('alert.launchIpo'),
      summary: 'Selling 20% of the company to public investors.',
      lines: [
        { label: 'Fair value per share', value: formatPrice(quote.fairPrice) },
        { label: 'Offer price (−12%)', value: formatPrice(quote.offerPrice) },
        { label: 'Gross proceeds', value: formatMoney(quote.grossProceeds) },
        { label: 'Underwriting fee (7%)', value: `−${formatMoney(quote.underwritingFee)}`, tone: 'negative' },
        { label: 'Net to the company', value: formatMoney(quote.netProceeds), strong: true },
        { label: 'Your ownership', value: `${stats.companyOwnership.toFixed(1)}% → ${quote.playerOwnershipAfter.toFixed(1)}%` },
      ],
      note: `Shares are priced below fair value on purpose so the book fills — that ${formatMoney(quote.moneyLeftOnTable)} is the cost of listing. Once public your multiples rise, but the market reprices you every quarter.`,
      confirmLabel: t('company.launchIpo'),
      cancelLabel: t('company.notYet'),
      onConfirm: () => {
        const result = goPublic(
          stats.companyValue,
          (amount) => {
            const currentCapital = useStatsStore.getState().companyCapital;
            stats.update({ companyCapital: currentCapital + amount });
          },
          0.20,
        );

        if (result.error) {
          setPanel({
            title: t('alert.cannotLaunchIpo'),
            summary: result.error,
            confirmLabel: 'OK',
            tone: 'danger',
          });
          return;
        }

        stats.update({
          companyOwnership: result.newOwnershipPercent,
          isPublic: true,
        });

        setPanel({
          title: t('alert.ipoComplete'),
          summary: 'You are a public company. Every quarter is now a scorecard.',
          lines: [
            { label: 'Raised', value: formatMoney(result.cashRaised) },
            { label: 'Fees', value: `−${formatMoney(result.fee)}`, tone: 'negative' },
            { label: 'Your ownership', value: `${result.newOwnershipPercent.toFixed(1)}%`, strong: true },
          ],
          confirmLabel: 'OK',
        });
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea} edges={[]}>
        {/* ----------------------------------------------------------------
            THIS header used to be drawn here, by hand, and it is the one the
            player picked as the standard - so it moved into ScreenHeader and
            every other screen now wears it. What is left here is the one
            thing that is genuinely local: back goes HOME rather than popping
            the stack, because My Company is the section root and popping
            would land wherever you happened to come from.

            `edges={[]}` because ScreenHeader pays the status-bar inset
            itself. Letting SafeAreaView pay it too reserved the inset twice
            and left an empty band above the title.
           ---------------------------------------------------------------- */}
        <ScreenHeader
          title={t('company.commandCenter')}
          onBack={() => navigation.navigate('Home')}
        />

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 120, paddingTop: 0 }]}>

          {/* COMPANY STATS CARD */}
          <DashboardCard
            title={t('company.myCompany')}
            rightContent={
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Text style={styles.sharePrice}>{formatPrice(stockPrice)}</Text>
                <Text style={{ color: (stats.companyDailyChange || 0) >= 0 ? theme.colors.success : theme.colors.danger, fontWeight: '700' }}>
                  {(stats.companyDailyChange || 0).toFixed(2)}%
                </Text>
              </View>
            }
          >
            {/* Row 1: Finances */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <StatColumn label={t('company.valuation')} value={formatCurrency(stats.companyValue)} />
              <VerticalDivider />
              <StatColumn label={t('company.capital')} value={formatCurrency(stats.companyCapital)} />
              <VerticalDivider />
              <StatColumn label={t('company.ceoCash')} value={formatCurrency(stats.money)} colorType="success" />
            </View>

            {/* Divider */}
            <View style={{ width: '100%', height: 1, backgroundColor: theme.colors.surfaceRaised, marginVertical: 16 }} />

            {/* Row 2: Shares */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <StatColumn label={t('company.outstanding')} value={formatCompactNumber(totalShares || 10_000_000)} />
              <VerticalDivider />
              <StatColumn label={t('company.yourShares')} value={formatCompactNumber(playerShareCount || 0)} />
              <VerticalDivider />
              {/* Ownership % */}
              <StatColumn
                label={t('company.ownership')}
                value={`${((playerShareCount || 0) / (totalShares || 10_000_000) * 100).toFixed(1)}%`}
                colorType={stats.companyOwnership >= 51 ? 'success' : 'danger'}
              />
            </View>

            <View style={{ width: '100%', height: 1, backgroundColor: theme.colors.surfaceRaised, marginVertical: 16 }} />

            {/* Row 3: Marka. Pazar payi hesabinda carpan olacak;
                su an yavas biriken bir itibar gostergesi.
                Bkz. core/market/productMarkets.ts */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <StatColumn
                label={t('company.brandValue')}
                value={`${Math.round(stats.brandValue ?? 0)}`}
                colorType={(stats.brandValue ?? 0) >= 200 ? 'success' : 'default'}
              />
              <VerticalDivider />
              <StatColumn label={t('company.employees')} value={formatCompactNumber(stats.employeeCount)} />
              <VerticalDivider />
              <StatColumn label={t('company.morale')} value={`${Math.round(employeeMorale)}%`} colorType={employeeMorale >= 50 ? 'success' : 'danger'} />
            </View>
          </DashboardCard>

          {/* DEPARTMENTS */}
          <View style={styles.grid}>
            <DepartmentCard
              icon="🏦"
              title={t('company.financing')}
              subtitle={`Debt: ${formatCurrency(stats.companyDebtTotal)}`}
              onPress={() => navigation.navigate('Finance')}
            />

            <DepartmentCard
              icon="🏭"
              title={t('company.products')}
              subtitle={`${activeProductsCount} Active`}
              onPress={() => navigation.navigate('Products')}
            />

            <DepartmentCard
              icon="📊"
              title={t('company.financialReport')}
              subtitle={t('company.expensesProfitsRoi')}
              onPress={() => navigation.navigate('FinancialReport')}
            />
            <DepartmentCard
              icon="📈"
              title={t('company.equity')}
              subtitle={`${stats.companyOwnership.toFixed(1)}% Owned`}
              onPress={() => navigation.navigate('StockMarket', { onOpenIPO: handleLaunchIPO })}
            />
          </View>


          {/* OPERATIONS */}
          {/* Fabrika +1/-1 butonlari ve "Employees" kartinin sayi kontrolu
              kaldirildi. Kapasite artik tesis KADEMESINDEN geliyor ve kadro
              HEDEF olarak veriliyor — bkz. core/market/capacity.ts */}
          <SectionHeader title={t('company.operations')} />
          <FacilityPanel />

          <View style={{ marginTop: 12 }}>
            <SectionCard
              title={`🎉 ${t('company.teamMorale')}`}
              subtitle={`${Math.round(employeeMorale)}/100 — events, bonuses and salary policy`}
              onPress={() => navigation.navigate('TeamMorale')}
            />
          </View>

          {/* QUICK ACTIONS */}
          <SectionHeader title={t('company.quickActions')} />
          <View style={{ gap: 8 }}>
            <SectionCard title={`🔬 ${t('company.rDInvestment')}`} subtitle={t('company.investInFutureGrowth')} onPress={() => navigation.navigate('Research')} />
            <SectionCard title={`🏢 ${t('company.hostileTakeover')}`} subtitle={t('company.buyPublicCompaniesToGain')} onPress={() => navigation.navigate('HostileTakeover')} />
            <SectionCard title={`👔 ${t('company.boardMembers')}`} subtitle={t('company.viewShareholders')} onPress={() => navigation.navigate('BoardMembers')} />
            <SectionCard title={`🏆 ${t('company.myEmpire')}`} subtitle={t('company.manageSubsidiaries')} onPress={() => navigation.navigate('MyEmpire')} />
          </View>

        </ScrollView>

        <ConfirmPanel
          visible={!!panel}
          title={panel?.title || ''}
          summary={panel?.summary}
          lines={panel?.lines}
          note={panel?.note}
          tone={panel?.tone}
          confirmLabel={panel?.confirmLabel || 'OK'}
          cancelLabel={panel?.cancelLabel}
          onConfirm={panel?.onConfirm}
          onCancel={() => setPanel(null)}
        />

        {/* Universal Crystal Navigation Bar (Dark Variant) */}
        {/* --- MODAL MANAGER --- */}
        <CompanyModals
          modals={modals}
          toggleModal={toggleModal}
          companyCapital={stats.companyCapital}
          companyDebtTotal={stats.companyDebtTotal}
          selectedShareholder={selectedShareholder}
          financeActions={{
            borrowConfig, setBorrowConfig, repayConfig, setRepayConfig,
            // TEK KAPI: takeLoan. Once `borrowCapital` cagriliyordu ve
            // olusan borcun taksiti hic kesilmiyordu.
            handleBorrow: (amt: number, _rate: number) => {
              const res = useCorporateFinanceStore.getState().takeLoan(
                amt, 0, 'term', 0,
                (n: number) => stats.update({ companyCapital: (stats.companyCapital || 0) + n }),
              );
              if (!res.success) {
                setPanel({ title: t('alert.loanDeclined'), summary: res.message, confirmLabel: 'OK', tone: 'danger' });
                return;
              }
              setBorrowConfig(p => ({ ...p, visible: false }));
              setTimeout(() => toggleModal('finance', true), 300);
            },
            handleRepay: (amt: number) => {
              // En eski krediden basla — gercek hayatta da once pahali
              // olan kapatilir, ama basit ve ongorulebilir olsun diye
              // siradaki ilk krediyi kapatiyoruz.
              const fin = useCorporateFinanceStore.getState();
              const first = fin.loans[0];
              if (first) {
                fin.repayLoan(first.id, amt, (n: number) =>
                  stats.update({ companyCapital: (stats.companyCapital || 0) - n }));
              }
              setRepayConfig(p => ({ ...p, visible: false }));
              setTimeout(() => toggleModal('finance', true), 300);
            }
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
    borderBottomColor: theme.colors.border,
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
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '300',
    color: theme.colors.textPrimary,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  headerAccent: {
    width: 32,
    height: 2,
    backgroundColor: theme.colors.primary,
    marginTop: 6,
    borderRadius: 2,
    shadowColor: theme.colors.background,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  subtitle: { color: 'rgba(255,255,255,0.48)', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  deptCard: {
    // Dolgu, cerceve degil: bu kart eskiden saydamdi ve yalnizca ince bir
    // kenarlikla duruyordu, o yuzden zeminin uzerinde "yokmus gibi" goruntu
    // veriyordu. Renk artik yuzeyde.
    backgroundColor: theme.colors.surfaceRaised,
    flexBasis: '48%',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    gap: 8,
    minHeight: 120,
    justifyContent: 'center',
    shadowColor: theme.colors.background,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  deptCardPressed: { backgroundColor: theme.colors.surfaceHigh, transform: [{ scale: 0.98 }] },
  deptTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.textPrimary, textAlign: 'center', letterSpacing: 0.3 },
  deptSub: { fontSize: 12, color: 'rgba(255,255,255,0.48)', textAlign: 'center' },
  // The share PRICE is not a gain or a loss, it is just a number - the
  // percentage next to it carries the direction. It was painted with the loss
  // red, so the headline figure always read as bad news.
  sharePrice: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary },
});