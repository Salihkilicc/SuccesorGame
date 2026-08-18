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
import { useLaboratoryStore } from '../../../core/store/useLaboratoryStore';
import { IPO_MIN_VALUATION, quoteIpo } from '../../../core/market/equity';
import { CONTROL_THRESHOLD } from '../../../core/market/governance';
import { formatCurrency } from '../hooks/NativeEconomy';
import { useCompanyLogic } from '../hooks/useCompanyLogic';

// --- UI Components ---
import { DashboardCard, StatColumn, VerticalDivider, SectionHeader } from '../components/MyCompany/CompanyUI';
import { CompanyModals } from '../components/MyCompany/CompanyModals';
import FacilityPanel from '../components/FacilityPanel';
import ManagementCard from '../../../components/MyCompany/ManagementCard';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import SectionCard from '../../../components/common/SectionCard';
import ConfirmPanel, { type ConfirmLine } from '../../../components/common/ConfirmPanel';
import { formatMoney, formatPrice, formatNumber, formatRP } from '../../../core/utils';
import TutorialTarget from '../../../components/tutorial/TutorialTarget';
import InfoDot from '../../../components/common/InfoDot';

// Helper Component
const DepartmentCard = ({ icon, iconColor = theme.colors.textPrimary, title, subtitle, onPress, info }: any) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.deptCard,
      pressed && styles.deptCardPressed,
    ]}>
    {info && (
      <View style={styles.deptInfoWrap}>
        <InfoDot title={info.title} text={info.text} detail={info.detail} small />
      </View>
    )}
    <View style={[styles.deptIconBadge, { backgroundColor: `${iconColor}18`, borderColor: `${iconColor}38` }]}>
      <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
    </View>
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
  const totalRP = useLaboratoryStore((state) => state.totalRP);

  // Store Data
  const stats = useStatsStore();
  const companyName = useStatsStore(st => st.companyName);

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
        note: 'Grow revenue and profit first, the multiple follows.',
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

        {/* `paddingTop: 0` was correct when the header scrolled WITH the
            content - it was the first thing in the list and brought its own
            spacing. Now that the header is fixed above the ScrollView, zero
            top padding puts the company card hard against the header's
            bottom rule, and since the card became pressable its pressed fill
            runs right into it. The content gets its top padding back. */}
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: NAV_BAR_CLEARANCE }]}>

          {/* COMPANY STATS CARD
              Pressing it opens the financial report. The card is nine numbers
              summarising the quarter and the report is those nine numbers
              explained, so it is the one destination the card was always
              implying - and until now the only way there was the app grid on
              Home, two screens away from the figures it explains. */}
          {/* The company's own card is the one place its name obviously
              belongs. `companyName` is empty only before onboarding has run,
              and the gate makes that unreachable - the fallback is there so a
              half-migrated save shows a label rather than nothing. */}
          <DashboardCard
            title={companyName || t('company.myCompany')}
            onPress={() => navigation.navigate('FinancialReport')}
            rightContent={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <InfoDot
                  title={t('tactic.companyTitle')}
                  text={t('tactic.companyText')}
                  detail={t('tactic.companyDetail')}
                />
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
              {/* Green above the control threshold, red below it.
                  The player now STARTS below it, so this reads red from the
                  first screen - which is correct rather than alarming: being
                  a minority holder is the situation, and the colour is the
                  first thing that says so. */}
              <StatColumn
                label={t('company.ownership')}
                value={`${((playerShareCount || 0) / (totalShares || 10_000_000) * 100).toFixed(1)}%`}
                colorType={stats.companyOwnership >= CONTROL_THRESHOLD ? 'success' : 'danger'}
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
              icon="bank-outline"
              iconColor="#4ADE80"
              title={t('company.financing')}
              subtitle={`Debt: ${formatCurrency(stats.companyDebtTotal)}`}
              onPress={() => navigation.navigate('Finance')}
              info={{
                title: t('tactic.financingTitle'),
                text: t('tactic.financingText'),
                detail: t('tactic.financingDetail'),
              }}
            />

            <TutorialTarget tutorialKey="products" style={styles.deptTargetWrap}>
              <DepartmentCard
                icon="package-variant-closed"
                iconColor="#60A5FA"
                title={t('company.products')}
                subtitle={`${activeProductsCount} Active`}
                onPress={() => navigation.navigate('Products')}
                info={{
                  title: t('tactic.productsTitle'),
                  text: t('tactic.productsText'),
                  detail: t('tactic.productsDetail'),
                }}
              />
            </TutorialTarget>

            <DepartmentCard
              icon="flask-outline"
              iconColor="#A78BFA"
              title={t('company.rDInvestment')}
              subtitle={`${formatRP(totalRP)} RP`}
              onPress={() => navigation.navigate('Research')}
              info={{
                title: t('tactic.rdTitle'),
                text: t('tactic.rdText'),
                detail: t('tactic.rdDetail'),
              }}
            />

            <DepartmentCard
              icon="chart-timeline-variant-shimmer"
              iconColor="#FBBF24"
              title={t('company.equity')}
              subtitle={`${stats.companyOwnership.toFixed(1)}% Owned`}
              onPress={() => navigation.navigate('StockMarket', { onOpenIPO: handleLaunchIPO })}
              info={{
                title: t('tactic.equityTitle'),
                text: t('tactic.equityText'),
                detail: t('tactic.equityDetail'),
              }}
            />
          </View>

          {/* OPERATIONS / FACILITIES */}
          <SectionHeader
            title={t('company.operations')}
            info={{
              title: t('tactic.operationsTitle'),
              text: t('tactic.operationsText'),
              detail: t('tactic.operationsDetail'),
            }}
          />
          <FacilityPanel />

          <TutorialTarget tutorialKey="teamMorale" style={{ marginTop: 12 }}>
            <SectionCard
              icon={<MaterialCommunityIcons name="heart-pulse" size={20} color="#F43F5E" />}
              title={t('company.teamMorale')}
              subtitle={`${Math.round(employeeMorale)}/100 — events, bonuses and salary policy`}
              onPress={() => navigation.navigate('TeamMorale')}
              info={{
                title: t('tactic.teamMoraleTitle'),
                text: t('tactic.teamMoraleText'),
                detail: t('tactic.teamMoraleDetail'),
              }}
            />
          </TutorialTarget>

          {/* QUICK ACTIONS */}
          <SectionHeader title={t('company.quickActions')} />
          <View style={{ gap: 8 }}>
            <SectionCard
              icon={<MaterialCommunityIcons name="domain-plus" size={20} color="#38BDF8" />}
              title={t('company.hostileTakeover')}
              subtitle={t('company.buyPublicCompaniesToGain')}
              onPress={() => navigation.navigate('HostileTakeover')}
              info={{
                title: t('tactic.takeoverTitle'),
                text: t('tactic.takeoverText'),
                detail: t('tactic.takeoverDetail'),
              }}
            />
            <SectionCard
              icon={<MaterialCommunityIcons name="account-group-outline" size={20} color="#FBBF24" />}
              title={t('company.boardMembers')}
              subtitle={t('company.viewShareholders')}
              onPress={() => navigation.navigate('BoardMembers')}
              info={{
                title: t('tactic.boardTitle'),
                text: t('tactic.boardText'),
                detail: t('tactic.boardDetail'),
              }}
            />
            <SectionCard
              icon={<MaterialCommunityIcons name="crown-outline" size={20} color="#EC4899" />}
              title={t('company.myEmpire')}
              subtitle={t('company.manageSubsidiaries')}
              onPress={() => navigation.navigate('MyEmpire')}
              info={{
                title: t('tactic.empireTitle'),
                text: t('tactic.empireText'),
                detail: t('tactic.empireDetail'),
              }}
            />
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
  /** The target wrapper must not change the grid: same width as a card. */
  deptTargetWrap: { width: '48%' },
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
  deptInfoWrap: { position: 'absolute', top: 10, right: 10, zIndex: 10 },
  deptIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  deptTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.textPrimary, textAlign: 'center', letterSpacing: 0.3 },
  deptSub: { fontSize: 12, color: 'rgba(255,255,255,0.48)', textAlign: 'center' },
  sharePrice: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary },
});