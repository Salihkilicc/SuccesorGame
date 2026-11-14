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
// SHELVED with the handler below: `import { IPO_MIN_VALUATION, quoteIpo }
// from '../../../core/market/equity';` - the quote lives in IpoModal now,
// which is the only place that should be pricing a listing.
import { CONTROL_THRESHOLD } from '../../../core/market/governance';
import { brandDisplay, CATEGORY_UNLOCK_BRAND } from '../../../core/market/brand';
import { formatCurrency } from '../hooks/NativeEconomy';
import { useCompanyLogic } from '../hooks/useCompanyLogic';

// --- UI Components ---
import { DashboardCard, StatColumn, VerticalDivider, SectionHeader } from '../components/MyCompany/CompanyUI';
import { CompanyModals } from '../components/MyCompany/CompanyModals';
import FacilityPanel from '../components/FacilityPanel';
import ManagementCard from '../../../components/MyCompany/ManagementCard';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { jumpToTab } from '../../../navigation/jumpToCompany';
import { rootNavigationRef } from '../../../navigation/navigationRef';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import SectionCard from '../../../components/common/SectionCard';
import ConfirmPanel, { type ConfirmLine } from '../../../components/common/ConfirmPanel';
import IpoModal from '../../../components/MyCompany/Shares/IpoModal';
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
    {/* ------------------------------------------------------------------
        THE FOUR CARDS ARE THE SAME HEIGHT BY CONSTRUCTION
        ------------------------------------------------------------------
        In Turkish the equity card ran taller than the other three, and the
        cause was the TITLE rather than the figure under it: "Hisse &
        Sahiplik" wraps to two lines where "Finansman", "Urunler" and
        "Ar-Ge Yatirimi" do not, and `minHeight: 120` lets a card grow.

        Tuning a font size until it happens to fit would fix it in Turkish
        and break it in the next language, so the box is reserved instead.
        Two lines for the title and one for the figure, always, whether the
        words need them or not, and the text shrinks to fit rather than
        adding a line. Nothing here depends on how long a word is.
       ------------------------------------------------------------------ */}
    <Text
      style={styles.deptTitle}
      numberOfLines={2}
      adjustsFontSizeToFit
      minimumFontScale={0.75}>
      {title}
    </Text>
    {/* ------------------------------------------------------------------
        NO adjustsFontSizeToFit HERE, AND THAT IS THE FIX
        ------------------------------------------------------------------
        Raising the point size did nothing on the device, and the reason is
        that this prop fits text to the BOX IN BOTH DIRECTIONS. The box was
        `height: 17` and a fourteen point font wants about twenty points of
        line, so the system did what it was told: it shrank the text until
        the height fitted, and threw away the larger size on the way.

        So the figure stayed ant sized through two attempts at making it
        bigger, which is what was reported both times. Font size was never
        the lever; the lever was the prop that overrides it.

        The cards still cannot grow with their words, because the box is
        still fixed. What changed is which way round it is sized: the box is
        now cut for the font instead of the font being cut for the box.

        `numberOfLines={1}` stays as the safety valve. Nothing here should
        ever reach it - the longest string is about thirteen characters
        ("Debt: $999.9M") against roughly 110 points of width on the
        narrowest phone this ships to - but if something does, one ellipsis
        is better than a card that is taller than the three beside it.
       ------------------------------------------------------------------ */}
    <Text style={styles.deptSub} numberOfLines={1}>
      {subtitle}
    </Text>
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

  // --------------------------------------------------------------------
  //  BUILD THE BOARD ONLY IF IT WAS NEVER BUILT
  // --------------------------------------------------------------------
  //  This tested `members.length === 0`, which is true both for a save from
  //  before the board existed AND for a player who has just bought every
  //  director out. It could not tell winning from never having started, so
  //  taking 100% of the company reset the holding to the opening 35%.
  //
  //  `initializeGame` now refuses on a register that has been played, so
  //  this call is safe whatever the array says; the condition stays only to
  //  keep it from running on every render.
  // --------------------------------------------------------------------
  const { members, initializeGame, totalShares, playerShareCount } = useShareholderStore();
  useEffect(() => {
    if (!members || members.length === 0) {
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

  // ------------------------------------------------------------------
  //  THE LISTING MOVED INTO ITS OWN MODAL
  // ------------------------------------------------------------------
  //  SHELVED: forty lines that built a ConfirmPanel here - the not-ready
  //  check, the offer table, the failure branch and the receipt - plus the
  //  `goPublic` binding they used.
  //
  //  It had to move because of WHERE it ran. The Launch IPO button is on
  //  the Stock Market screen, this handler was handed over as a route
  //  param, and all it did was `setPanel` on MY COMPANY'S state. My Company
  //  is not the screen in front of you at that moment, so the button
  //  appeared to do nothing and the confirmation was found later, on the
  //  way back.
  //
  //  A screen cannot raise a dialog on another screen. Everything the flow
  //  needs is in components/MyCompany/Shares/IpoModal.tsx now, and both
  //  entry points open it: this one and the Stock Market screen, each with
  //  its own visibility flag and neither holding a copy of the quote.
  //
  //  The old body is in git. Reproducing it here would be forty lines of
  //  panel plumbing that must never be called again.
  // ------------------------------------------------------------------
  const [ipoOpen, setIpoOpen] = useState(false);
  const handleLaunchIPO = () => setIpoOpen(true);

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
          // ------------------------------------------------------------
          //  AND IT DID NOTHING, FOR THE REASON THE FILE ABOVE DESCRIBES
          // ------------------------------------------------------------
          //  SHELVED: `onBack={() => navigation.navigate('Home')}`
          //
          //  My Company is a SWIPE TAB inside the navigator RootStack
          //  registers as 'Home'. So from here `navigate('Home')` resolves
          //  to the route RootStack is already on, and a navigate to the
          //  route you are already on is a no-op that never reaches the
          //  child navigator. The button pressed and nothing moved.
          //
          //  This is the third time this exact shape has appeared: the
          //  bar's Company button, the bar's Home button, and now this.
          //  navigation/jumpToCompany.ts was written for it and aims the
          //  action at the swipe navigator directly, so RootStack is never
          //  asked and cannot swallow it.
          //
          //  'Dashboard' rather than 'Home' because the inner tab was
          //  RENAMED to end the `Home > Home` collision - see the note
          //  above SwipeTabParamList. Writing 'Home' here would have been
          //  the same bug with a working helper.
          // ------------------------------------------------------------
          onBack={() => jumpToTab(rootNavigationRef, 'Dashboard')}
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
                // Points, which is the scale the player remembers and the
                // scale this line's own 200 threshold was written against.
                // See brand.brandDisplay.
                value={`${brandDisplay(stats.brandValue ?? 0)}`}
                colorType={brandDisplay(stats.brandValue ?? 0) >= CATEGORY_UNLOCK_BRAND ? 'success' : 'default'}
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
              subtitle={t('company.debtSub', { v1: formatCurrency(stats.companyDebtTotal) })}
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
                subtitle={t('company.activeSub', { v1: activeProductsCount })}
                onPress={() => navigation.navigate('Products')}
                info={{
                  title: t('tactic.productsTitle'),
                  text: t('tactic.productsText'),
                  detail: t('tactic.productsDetail'),
                }}
              />
            </TutorialTarget>

            {/* --------------------------------------------------------
                THE DOOR INTO THE WHOLE RESEARCH LESSON.

                The lesson was a chain that could only start once the
                player had ALREADY found this screen: `rnd-lab` is gated on
                `rndOpened`, which ResearchScreen raises when it mounts. So
                the tutorial waited for somebody who already knew where to
                go, and a player who never wandered in was never taught
                that research exists at all.

                Nothing in the first year pointed at it. This is the tile
                that does. See data/tutorial/sequence.ts, `q1-research`.
               -------------------------------------------------------- */}
            <TutorialTarget tutorialKey="rndDepartment" style={styles.deptTargetWrap}>
              <DepartmentCard
                icon="flask-outline"
                iconColor="#A78BFA"
                title={t('company.rDInvestment')}
                subtitle={t('company.rpSub', { v1: formatRP(totalRP) })}
                onPress={() => navigation.navigate('Research')}
                info={{
                  title: t('tactic.rdTitle'),
                  text: t('tactic.rdText'),
                  detail: t('tactic.rdDetail'),
                }}
              />
            </TutorialTarget>

            <DepartmentCard
              icon="chart-timeline-variant-shimmer"
              iconColor="#FBBF24"
              title={t('company.equity')}
              subtitle={t('company.ownedSub', { v1: stats.companyOwnership.toFixed(1) })}
              onPress={() => navigation.navigate('StockMarket')}
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
              icon={
                <MaterialCommunityIcons
                  name="heart-pulse"
                  size={20}
                  color={
                    employeeMorale >= 70
                      ? theme.colors.highlight
                      : employeeMorale >= 40
                      ? theme.colors.primary
                      : theme.colors.warning
                  }
                />
              }
              title={t('company.teamMorale')}
              subtitle={t('company.moraleSubtitle', { value: Math.round(employeeMorale) })}
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

        <IpoModal visible={ipoOpen} onClose={() => setIpoOpen(false)} />

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
  // `height` rather than `minHeight`: the point is that a card with a short
  // title occupies exactly as much room as one with a long title.
  // ------------------------------------------------------------------
  //  THE SAME SQUEEZE, ONE RUNG MILDER
  // ------------------------------------------------------------------
  //  `lineHeight: 19` against `fontSize: 15` is a ratio of 1.27, which is
  //  under what the glyphs occupy, so `adjustsFontSizeToFit` was shrinking
  //  this line on every card in every language rather than only on the one
  //  Turkish title that genuinely needs two lines.
  //
  //  Nobody reported it, because these four words are white and heavy and
  //  stay legible at eleven points where the grey figure under them did not.
  //  It is the same defect and it was found by measuring the one next to it.
  //
  //  The prop STAYS here. "Hisse & Sahiplik" really does wrap where "Equity"
  //  does not, and reserving two lines is what keeps the four cards level.
  //  What changes is that the shrink is now a response to long words rather
  //  than to a box that was too tight for its own font.
  // ------------------------------------------------------------------
  deptTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 20,
    height: 40,
  },
  // ------------------------------------------------------------------
  //  THIS LINE IS THE INFORMATION, NOT THE CAPTION
  // ------------------------------------------------------------------
  //  The title says "Financing" and this says how much the debt actually
  //  is. The figure is the reason anybody looks at the card, and it was
  //  styled as though it were a footnote: twelve points, at a hardcoded
  //  48% white, which measures 3.42 against surfaceRaised.
  //
  //  Worse, `adjustsFontSizeToFit` with `minimumFontScale: 0.7` let it
  //  shrink to 8.4 points. Reported from a device as not being able to
  //  tell what the debt was, which is exactly right: 3.42 is the audit's
  //  floor for LARGE text and this was the smallest text on the screen.
  //
  //  textSecondary measures 5.56 there. It is not a new colour - white
  //  turned down is documented as still being white in core/theme.ts -
  //  and the hardcoded rgba it replaces was the same idea written worse.
  //
  //  The fixed `height` stays. The four cards are the same height by
  //  construction and the note on deptTitle explains why that must not
  //  become a thing that depends on how long a word is.
  // ------------------------------------------------------------------
  //  The box is cut for the font. `lineHeight` is what a fourteen point font
  //  actually occupies rather than the smallest number it fits in, and
  //  `height` matches it so the four cards stay level. Seventeen was the
  //  smallest number, which is how `adjustsFontSizeToFit` ended up shrinking
  //  the text to reach it.
  deptSub: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    height: 20,
  },
  sharePrice: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary },
});