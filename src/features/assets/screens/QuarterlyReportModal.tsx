import React from 'react';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { t, useLocale } from '../../../core/i18n';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  LayoutAnimation,
} from 'react-native';
import { useCorporateFinanceStore } from '../../../features/finance/stores/useCorporateFinanceStore';
import { useGameStore } from '../../../core/store/useGameStore';
import { formatMoney, formatNumber, formatPercent, formatSignedMoney } from '../../../core/utils';
import CollapsibleSection from '../../../components/common/CollapsibleSection';
import InfoDot from '../../../components/common/InfoDot';
import { EXPENSE_EXPLANATIONS, type QuarterReport, normalizeQuarterReport } from '../../../core/reportTypes';

// ============================================================================
//  CEYREK RAPORU
// ============================================================================
//  Bu ekran oyunun OGRETME YUZEYI. Oyuncu nedensellik kurmayi burada ogrenir.
//  O yuzden her satirin altinda o kalemin nereden geldigi yaziyor.
//
//  Veri kaynagi: useGameStore.lastQuarterReport — motorun gercekten tahsil
//  ettigi rakamlar. Onceden bu ekran (ve FinancialReportScreen) kendi
//  tahminlerini uretiyordu ve hicbiri sermayeden dusen parayla tutmuyordu.
// ============================================================================

/** Geriye donuk uyumluluk: HomeScreen hala bu tipi import ediyor. */
export interface FinancialData {
  productionCount?: number;
  salesCount?: number;
  revenue?: number;
  totalExpenses?: number;
  netProfit?: number;
  endingCash?: number;
  endingCapital?: number;
  inventory?: number;
  reportCurrentRP?: number;
  operationalSetback?: boolean;
  setbackMessage?: string;
  lostRevenue?: number;
  lostUnits?: number;
  productBreakdown?: unknown[];
}

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Artik kullanilmiyor — veri store'dan okunuyor. Imza korundu. */
  reportData?: FinancialData | null;
};

// ─── Gelir tablosu satiri ────────────────────────────────────────────────────

type LineProps = {
  label: string;
  amount: number;
  negative?: boolean;
  subtotal?: boolean;
  emphasis?: boolean;
  explanation?: string;
  hint?: string;
};

const StatementLine = ({ label, amount, negative, subtotal, emphasis, explanation, hint }: LineProps) => {
  const color = emphasis
    ? (amount >= 0 ? '#4CAF50' : '#F44336')
    : negative
      ? '#E57373'
      : subtotal
        ? '#FFD700'
        : '#E0E0E0';

  return (
    <View style={[styles.line, subtotal && styles.lineSubtotal, emphasis && styles.lineEmphasis]}>
      <View style={styles.lineTop}>
        <View style={styles.lineLabelRow}>
          <Text style={[styles.lineLabel, (subtotal || emphasis) && styles.lineLabelStrong]}>
            {label}
          </Text>
          {/* Uzun aciklama ⓘ arkasinda — satirlar temiz kalsin */}
          {explanation ? <InfoDot title={label} text={explanation} detail={hint} small /> : null}
        </View>
        <Text style={[styles.lineAmount, { color }, emphasis && styles.lineAmountBig]}>
          {negative ? `-${formatMoney(Math.abs(amount))}` : formatMoney(amount)}
        </Text>
      </View>
    </View>
  );
};

// ─── Otomatik teshis notlari ─────────────────────────────────────────────────
//  Tavsiye degil, TESPIT. "Sunu yap" demiyoruz; "su oldu" diyoruz.
//  Oyuncunun nedensellik kurmasi icin gereken tek sey bu.

const buildObservations = (r: QuarterReport): { tone: 'bad' | 'warn' | 'good'; text: string }[] => {
  const notes: { tone: 'bad' | 'warn' | 'good'; text: string }[] = [];

  if (r.unitsProduced === 0) {
    notes.push({
      tone: 'warn',
      text: t('company.youProducedNothingThisQuarter'),
    });
  }

  if (r.unitsProduced > 0 && r.sellThrough < 50) {
    notes.push({
      tone: 'bad',
      text: t('obs.onlyVOfYour', { v1: formatPercent(r.sellThrough) }),
    });
  }

  // Stok tukenmesi: talep vardi ama mal yoktu.
  if (r.totalUnmetDemand > 0) {
    const missRate = r.totalMarketDemand > 0 ? (r.totalUnmetDemand / r.totalMarketDemand) * 100 : 0;
    notes.push({
      tone: 'bad',
      text: t('obs.youRanOutOf', { v1: formatNumber(r.totalMarketDemand), v2: formatNumber(r.unitsSold), v3: formatNumber(r.totalUnmetDemand), v4: formatPercent(missRate) }),
    });
  }

  if (r.brandChange < -0.5) {
    notes.push({
      tone: 'bad',
      text: t('obs.brandValueFellV', { v1: Math.abs(r.brandChange).toFixed(1), v2: r.brandValue, v3: formatMoney(r.brandMaintenance ?? 0) }),
    });
  } else if (r.brandChange > 0.5) {
    notes.push({
      tone: 'good',
      text: t('obs.brandValueRoseV', { v1: r.brandChange.toFixed(1), v2: r.brandValue }),
    });
  }

  if (r.isRetooling) {
    notes.push({
      tone: 'warn',
      text: t('obs.yourFacilityIsBeing', { v1: r.buildQuartersRemaining ?? 0 }),
    });
  }

  if (r.headcount < r.crewRequired) {
    notes.push({
      tone: 'warn',
      text: t('obs.youAreVPeople', { v1: formatNumber(r.crewRequired - r.headcount) }),
    });
  }

  if (r.utilization > 0 && r.utilization < 60) {
    notes.push({
      tone: 'bad',
      text: t('obs.capacityUtilizationWasOnly', { v1: formatPercent(r.utilization) }),
    });
  }

  if (r.brandCeiling && r.brandValue >= r.brandCeiling - 0.5) {
    notes.push({
      tone: 'warn',
      text: t('obs.brandValueHasHit', { v1: r.facilityName, v2: r.brandCeiling }),
    });
  }

  if ((r.hiresBlocked ?? 0) > 0) {
    notes.push({
      tone: 'warn',
      text: t('obs.youAskedForV', { v1: formatNumber((r.hiresQueued ?? 0) + (r.hiresBlocked ?? 0)), v2: formatNumber(r.hiresQueued) }),
    });
  }

  if ((r.moraleChange ?? 0) < -2) {
    notes.push({
      tone: 'bad',
      text: t('obs.moraleFellVPoints', { v1: Math.abs(r.moraleChange ?? 0).toFixed(1), v2: r.employeeMorale.toFixed(0), v3: Math.round((r.salaryRatio ?? 1) * 100), v4: r.moraleWageTarget ?? 70, v5: (r.moraleEfficiency ?? 1).toFixed(2) }),
    });
  }

  if (r.overtime) {
    notes.push({
      tone: 'warn',
      text: t('company.overtimeWasRunningYouGot'),
    });
  }

  if ((r.acquisitionImpairment ?? 0) > 0) {
    notes.push({
      tone: 'bad',
      text: t('obs.youWroteOffV', { v1: formatMoney(r.acquisitionImpairment ?? 0) }),
    });
  } else if ((r.acquisitionEbit ?? 0) < 0) {
    notes.push({
      tone: 'warn',
      text: t('obs.acquisitionsCostYouV', { v1: formatMoney(Math.abs(r.acquisitionEbit ?? 0)) }),
    });
  } else if ((r.acquisitionEbit ?? 0) > 0) {
    notes.push({
      tone: 'good',
      text: t('obs.acquisitionsAddedVTo', { v1: formatMoney(r.acquisitionEbit ?? 0), v2: formatMoney(r.acquisitionSynergy ?? 0) }),
    });
  }

  if (r.creditRating && ['BB', 'B', 'CCC', 'D'].includes(r.creditRating)) {
    notes.push({
      tone: r.creditRating === 'BB' ? 'warn' : 'bad',
      text: t('obs.yourCreditRatingIs', { v1: r.creditRating, v2: (r.leverage ?? 0).toFixed(1), v3: (r.coverage ?? 0).toFixed(1) }),
    });
  }

  if (r.covenantBreach) {
    notes.push({
      tone: 'bad',
      text: r.distressMessage || 'You have breached a loan covenant. The banks have changed your terms.',
    });
  }

  // ------------------------------------------------------------------
  //  THE BOARD ASKED FOR SOMETHING
  // ------------------------------------------------------------------
  //  A demand was being raised every quarter and written to stats, and the
  //  only place it appeared was inside the board room - so unless the player
  //  happened to open that screen, a director asked them for something and
  //  they never heard it. It belongs in the quarterly report, which is where
  //  the game tells you what happened.
  // ------------------------------------------------------------------
  {
    const demandNotice = useStatsStore.getState().boardDemandNotice as string | undefined;
    if (demandNotice) {
      notes.push({ tone: 'warn', text: demandNotice });
    }
  }

  // ------------------------------------------------------------------
  //  THE FACTORY IS THE CEILING, AND IT WAS NEVER SAID OUT LOUD
  // ------------------------------------------------------------------
  //  Capacity is one shared pool across every category. Open a second market
  //  and the first one's share falls - 5.05% to 3.97% in simulation - purely
  //  because the plant is now split. The answer is to upgrade, and the player
  //  had no way of knowing that was the answer.
  // ------------------------------------------------------------------
  {
    const util = r.capacityUtilization;
    if (typeof util === 'number' && util < 0.999) {
      notes.push({
        tone: util < 0.7 ? 'bad' : 'warn',
        text: t('report.capacitySqueeze', { v1: String(Math.round(util * 100)) }),
      });
    }
  }

  if (r.layoffs > 0) {
    notes.push({
      tone: 'bad',
      text: t('obs.youLetVPeople', { v1: formatNumber(r.layoffs) }),
    });
  }

  if (r.products.some(p => p.produced > 0 && (p.marketingBudget ?? 0) === 0)) {
    notes.push({
      tone: 'warn',
      text: t('company.someProductsHaveZeroMarketing'),
    });
  }

  if (r.totalExpenses > 0 && r.expenses.storage / r.totalExpenses > 0.1) {
    notes.push({
      tone: 'bad',
      text: t('obs.storageIsVOf', { v1: formatPercent((r.expenses.storage / r.totalExpenses) * 100) }),
    });
  }

  if (r.operationalSetback) {
    notes.push({
      tone: 'bad',
      text: t('obs.lowMoraleVCost', { v1: Math.round(r.employeeMorale), v2: formatNumber(r.lostUnits), v3: formatMoney(r.lostRevenue) }),
    });
  }

  if (r.revenue > 0 && r.grossMargin < 20) {
    notes.push({
      tone: 'warn',
      text: t('obs.grossMarginIsOnly', { v1: formatPercent(r.grossMargin) }),
    });
  }

  if (r.netProfit > 0 && r.sellThrough >= 70) {
    notes.push({
      tone: 'good',
      text: t('obs.healthyQuarterVSell', { v1: formatPercent(r.sellThrough), v2: formatPercent(r.netMargin) }),
    });
  }

  if (r.researchGained > 0) {
    notes.push({
      tone: 'good',
      text: t('obs.yourResearchersGeneratedV', { v1: formatNumber(r.researchGained) }),
    });
  }

  return notes;
};

// ─── Urun satiri ─────────────────────────────────────────────────────────────
//  Kapaliyken tek satir: isim + kar. Basinca tum detay acilir.
//  Boylece 10 urunun varsa ekran 10 kart yerine 10 satir gosterir.

const ProductRow = ({ p }: { p: QuarterReport['products'][number] }) => {
  const [open, setOpen] = React.useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(v => !v);
  };

  return (
    <View style={styles.productCard}>
      <Pressable onPress={toggle} style={styles.productHead}>
        <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
        <View style={styles.productHeadRight}>
          <Text style={styles.productShareMini}>{(p.marketShare ?? 0).toFixed(2)}%</Text>
          <Text style={[styles.productProfit, { color: p.profit >= 0 ? '#4CAF50' : '#F44336' }]}>
            {formatSignedMoney(p.profit)}
          </Text>
          <Text style={[styles.productChevron, open && styles.productChevronOpen]}>⌄</Text>
        </View>
      </Pressable>

      {open && (
        <>
          {p.marketDemandUnits !== undefined && (
            <View style={styles.demandRow}>
              <Text style={styles.demandText}>
                Market wanted <Text style={styles.demandStrong}>{formatNumber(p.marketDemandUnits)}</Text>
                {'  ·  '}{t('report.shareLabel')} <Text style={styles.demandStrong}>{(p.marketShare ?? 0).toFixed(3)}%</Text>
              </Text>
              {(p.unmetDemand ?? 0) > 0 && (
                <Text style={styles.demandMiss}>
                  {t('report.lostToRivalsV', { v1: formatNumber(p.unmetDemand ?? 0) })}
                  {(p.contractUnits ?? 0) > 0
                    ? ` — ${t('report.afterOutsourcing', { v1: formatNumber(p.contractUnits ?? 0) })}`
                    : ''}
                </Text>
              )}
            </View>
          )}

          <View style={styles.productStats}>
            <View style={styles.productStat}>
              <Text style={styles.productStatLabel}>{t('company.produced')}</Text>
              <Text style={styles.productStatValue}>{formatNumber(p.produced)}</Text>
              {/* --------------------------------------------------------
                  Outsourced units used to vanish into this one number.
                  A player who had ordered contract production saw a
                  "lost to rivals" line and concluded those units had not
                  been counted - the engine had counted them all along,
                  they were simply never shown.
                 -------------------------------------------------------- */}
              {(p.contractUnits ?? 0) > 0 && (
                <Text style={styles.productSplit}>
                  {t('report.producedSplit', {
                    v1: formatNumber(p.ownUnits ?? 0),
                    v2: formatNumber(p.contractUnits ?? 0),
                  })}
                </Text>
              )}
            </View>
            <View style={styles.productStat}>
              <Text style={styles.productStatLabel}>{t('company.sold')}</Text>
              <Text style={[styles.productStatValue, { color: '#4CAF50' }]}>{formatNumber(p.sold)}</Text>
            </View>
            <View style={styles.productStat}>
              <Text style={styles.productStatLabel}>{t('company.unsold')}</Text>
              <Text style={[styles.productStatValue, { color: p.unsold > 0 ? '#E57373' : '#9E9E9E' }]}>
                {formatNumber(p.unsold)}
              </Text>
            </View>
            <View style={styles.productStat}>
              <Text style={styles.productStatLabel}>{t('company.stock')}</Text>
              <Text style={[styles.productStatValue, { color: '#FFB74D' }]}>{formatNumber(p.stock)}</Text>
            </View>
          </View>

          <View style={styles.sellThroughTrack}>
            <View
              style={[
                styles.sellThroughFill,
                {
                  width: `${Math.min(100, Math.max(0, p.sellThrough))}%`,
                  backgroundColor:
                    p.sellThrough >= 60 ? '#4CAF50' : p.sellThrough >= 30 ? '#FFB74D' : '#F44336',
                },
              ]}
            />
          </View>
          <Text style={styles.sellThroughLabel}>
            {formatPercent(p.sellThrough)} of available units sold
          </Text>

          <Text style={styles.productEcon}>
            Price {formatMoney(p.unitPrice)} · Cost {formatMoney(p.unitCost)} · Margin{' '}
            {formatMoney(p.unitPrice - p.unitCost)}/unit
            {(p.marketingBudget ?? 0) > 0
              ? ` · Marketing ${formatMoney(p.marketingBudget ?? 0)}/quarter`
              : ' · No marketing'}
          </Text>
        </>
      )}
    </View>
  );
};

// ─── Ana bilesen ─────────────────────────────────────────────────────────────

const QuarterlyReportModal = ({ visible, onClose }: Props) => {
  // Dil degisince yeniden ciz.
  useLocale();
  const { evaluateSubsidiaries } = useCorporateFinanceStore();
  // Eski kayitlarda yeni alanlar olmayabilir — normalize et, yoksa render patlar.
  const rawReport = useGameStore(state => state.lastQuarterReport);
  const report = React.useMemo(() => normalizeQuarterReport(rawReport), [rawReport]);

  React.useEffect(() => {
    if (visible) {
      evaluateSubsidiaries();
    }
  }, [visible, evaluateSubsidiaries]);

  if (!report) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.emptyText}>{t('company.noQuarterHasBeenCompleted')}</Text>
            <View style={styles.footerActions}>
              <Pressable style={styles.primaryButton} onPress={onClose}>
                <Text style={styles.primaryButtonText}>{t('company.close')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  const observations = buildObservations(report);
  const e = report.expenses;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>

          {/* Header */}
          <View style={styles.customHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>{t('company.quarterlyReport')}</Text>
              <Text style={styles.headerSubtitle}>{t('company.incomeStatement')}</Text>
            </View>
            <View style={styles.periodBadge}>
              <Text style={styles.periodText}>{report.periodLabel}</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

            {/* Net sonuc */}
            <View style={[styles.heroCard, { borderColor: report.netProfit >= 0 ? '#FFD700' : '#F44336' }]}>
              <Text style={styles.heroLabel}>{t('company.netIncome')}</Text>
              <Text style={[styles.heroValue, { color: report.netProfit >= 0 ? '#4CAF50' : '#F44336' }]}>
                {formatSignedMoney(report.netProfit)}
              </Text>
              <Text style={styles.heroSub}>
                {formatPercent(report.netMargin)} net margin · {formatPercent(report.grossMargin)} gross margin
              </Text>
            </View>

            {/* ══ GELIR TABLOSU ══ */}
            <CollapsibleSection
              title={t('company.incomeStatement2')}
              note={t('company.whereEveryDollarWentLine')}
              info={t('company.aStandardIncomeStatementRevenue')}
              infoDetail={t('company.tapTheNextToAny')} 
              summary={formatSignedMoney(report.netProfit)}
              summaryColor={report.netProfit >= 0 ? '#4CAF50' : '#F44336'}
            >
              <View style={styles.statement}>
                <StatementLine
                  label={t("report.revenue")}
                  amount={report.revenue}
                  explanation={`${formatNumber(report.unitsSold)} units sold.`}
                />
                <StatementLine
                  label={t("report.cogs")}
                  amount={e.cogs}
                  negative
                  explanation={EXPENSE_EXPLANATIONS.cogs}
                  hint={`${formatNumber(report.unitsProduced)} units produced this quarter.`}
                />
                <StatementLine label={t("report.grossProfit")} amount={report.grossProfit} subtotal />

                <Text style={styles.groupLabel}>{t('company.operatingExpenses')}</Text>

                <StatementLine
                  label={t("report.marketing")}
                  amount={e.marketing}
                  negative
                  explanation={EXPENSE_EXPLANATIONS.marketing}
                />
                <StatementLine
                  label={t("report.storage")}
                  amount={e.storage}
                  negative
                  explanation={EXPENSE_EXPLANATIONS.storage}
                  hint={`${formatNumber(report.endingInventory)} units sitting in the warehouse.`}
                />
                <StatementLine
                  label={t("report.wages")}
                  amount={e.wages}
                  negative
                  explanation={EXPENSE_EXPLANATIONS.wages}
                  hint={`${formatNumber(report.headcount)} people at ${Math.round((report.salaryRatio ?? 1) * 100)}% of market pay${report.overtime ? ', overtime on' : ''}.`}
                />
                {e.hiring > 0 && (
                  <StatementLine
                    label={t("report.hiring")}
                    amount={e.hiring}
                    negative
                    explanation={EXPENSE_EXPLANATIONS.hiring}
                    hint={`${formatNumber(report.hiresQueued)} people recruited, starting next quarter.`}
                  />
                )}
                {e.severance > 0 && (
                  <StatementLine
                    label={t("report.severance")}
                    amount={e.severance}
                    negative
                    explanation={EXPENSE_EXPLANATIONS.severance}
                    hint={`${formatNumber(report.layoffs)} people let go.`}
                  />
                )}
                <StatementLine
                  label={t("report.factoryOverhead")}
                  amount={e.factoryOverhead}
                  negative
                  explanation={EXPENSE_EXPLANATIONS.factoryOverhead}
                  hint={`${report.facilityName} — paid whether the line runs or not.`}
                />
                <StatementLine
                  label={t('company.researchDevelopment')}
                  amount={e.rnd}
                  negative
                  explanation={EXPENSE_EXPLANATIONS.rnd}
                  hint={report.researchGained > 0 ? `Bought ${formatNumber(report.researchGained)} RP.` : undefined}
                />
                <StatementLine
                  label={t("report.fixed")}
                  amount={e.fixed}
                  negative
                  explanation={EXPENSE_EXPLANATIONS.fixed}
                />

                {/* Devralmalar EBIT'e ayri bir satir olarak girer — oyuncu
                    islemin gercekten katki mi yaptigini gorebilsin. */}
                {(report.acquisitionEbit ?? 0) !== 0 && (
                  <StatementLine
                    label={t('company.acquisitions')}
                    amount={report.acquisitionEbit ?? 0}
                    explanation="What your acquisitions did to operating profit this quarter: their earnings coming through, minus integration costs, plus whatever synergies have arrived."
                    hint={
                      `Their profit ${formatMoney(report.acquisitionEarnings ?? 0)}` +
                      ` · integration −${formatMoney(report.acquisitionIntegration ?? 0)}` +
                      ` · synergy +${formatMoney(report.acquisitionSynergy ?? 0)}`
                    }
                  />
                )}

                {(report.acquisitionImpairment ?? 0) > 0 && (
                  <StatementLine
                    label={t('company.goodwillImpairment')}
                    amount={report.acquisitionImpairment ?? 0}
                    negative
                    explanation="A target that still is not earning after two years. You are writing off what you overpaid — a public admission that the deal failed."
                  />
                )}

                <StatementLine label={t('company.operatingIncomeEbit')} amount={report.ebit} subtotal />
                <StatementLine
                  label={t("report.interest")}
                  amount={e.interest}
                  negative
                  explanation={EXPENSE_EXPLANATIONS.interest}
                />
                {(report.expenses.tax ?? 0) > 0 && (
                  <StatementLine
                    label={t("report.tax")}
                    amount={report.expenses.tax}
                    negative
                    explanation={EXPENSE_EXPLANATIONS.tax}
                  />
                )}

                <StatementLine label={t("report.netIncome")} amount={report.netProfit} emphasis />

                {/* ============================================================
                    NAKİT MUTABAKATI — "borç profitte gözükmüyor"
                    ============================================================
                    Oyuncu hakliydi ama sebebi bir hata degil, MUHASEBEDIR:

                      FAIZ  bir giderdir  -> kari dusurur (yukarida duruyor)
                      ANAPARA gider DEGIL -> kari dusurmez, ama NAKIT GOTURUR

                    Anapara odemesi bir bilanco hareketidir: borcun azalir,
                    kasan azalir, servetin degismez. O yuzden gelir
                    tablosunda yeri yoktur.

                    Ama oyuncunun ekranda gordugu kar ile kasasindaki dusus
                    birbirini tutmuyordu ve arasindaki farkin nereye gittigi
                    HICBIR YERDE yazmiyordu. Motor hep dogru hesapliyordu
                    (bkz. useGameStore: newCompanyCapital = ... - principalRepaid),
                    yalnizca gorunmuyordu.

                    Bu blok tam o farki kapatiyor. Gercek CEO'larin "karliyim
                    ama param yok" dedigi yer de burasidir.
                   ============================================================ */}
                {(report.principalRepaid ?? 0) > 0 && (
                  <>
                    <View style={styles.cashDivider} />
                    <Text style={styles.cashHeader}>{t("report.cashReconciliation")}</Text>
                    <StatementLine
                      label={t("report.principalRepaid")}
                      amount={report.principalRepaid ?? 0}
                      negative
                      explanation={
                        'Not an expense — it does not touch your profit. It pays down what you owe, ' +
                        'so your debt falls by the same amount. But it leaves the bank account all ' +
                        'the same. This is why a profitable company can still run out of cash.'
                      }
                    />
                    <StatementLine
                      label={t("report.cashChange")}
                      amount={report.netProfit - (report.principalRepaid ?? 0)}
                      emphasis
                      explanation={
                        'Net income minus principal repaid. This is the number your company balance ' +
                        'actually moved by this quarter.'
                      }
                    />
                    {report.netProfit > 0 &&
                      report.netProfit - (report.principalRepaid ?? 0) < 0 && (
                        <Text style={styles.cashWarn}>
                          ⚠️ {t('report.profitButLostCash')}
                        </Text>
                      )}
                  </>
                )}
              </View>
            </CollapsibleSection>

            {/* ══ PAZAR ══ */}
            <CollapsibleSection
              title={t("report.market")}
              note={t('company.whatTheMarketWantedVs')}
              info={t('company.eachProductCategoryHasA')}
              infoDetail={t('company.producingMoreDoesNotCreate')} 
              summary={
                report.totalUnmetDemand > 0
                  ? `${formatNumber(report.totalUnmetDemand)} lost`
                  : 'fully served'
              }
              summaryColor={report.totalUnmetDemand > 0 ? '#F44336' : '#4CAF50'}
            >
              <View style={styles.opsGrid}>
                <View style={styles.opsCell}>
                  <Text style={styles.opsLabel}>{t("report.marketWanted")}</Text>
                  <Text style={styles.opsValue}>{formatNumber(report.totalMarketDemand)}</Text>
                </View>
                <View style={styles.opsCell}>
                  <Text style={styles.opsLabel}>{t("report.youSupplied")}</Text>
                  <Text style={[styles.opsValue, { color: '#4CAF50' }]}>
                    {formatNumber(report.unitsSold)}
                  </Text>
                </View>
                <View style={styles.opsCell}>
                  <Text style={styles.opsLabel}>{t("report.lostToRivals")}</Text>
                  <Text
                    style={[
                      styles.opsValue,
                      { color: report.totalUnmetDemand > 0 ? '#F44336' : '#9E9E9E' },
                    ]}
                  >
                    {formatNumber(report.totalUnmetDemand)}
                  </Text>
                </View>
                <View style={styles.opsCell}>
                  <Text style={styles.opsLabel}>{t("report.brandValue")}</Text>
                  <Text style={[styles.opsValue, { color: '#FFD700' }]}>
                    {(report.brandValue ?? 0).toFixed(1)}
                    <Text
                      style={{
                        fontSize: 11,
                        color: report.brandChange >= 0 ? '#4CAF50' : '#F44336',
                      }}
                    >
                      {'  '}
                      {report.brandChange >= 0 ? '+' : ''}
                      {report.brandChange.toFixed(1)}
                    </Text>
                  </Text>
                </View>
              </View>
              <Text style={styles.footnote}>
                Each market has a fixed size. You earn a share of it through price, marketing,
                quality and brand — not by producing more.
              </Text>
            </CollapsibleSection>

            {/* ══ OPERASYON ══ */}
            <CollapsibleSection
              title={t('company.operations')}
              note={t('company.howMuchYouBuiltAnd')}
              info={t('company.sellThroughIsTheShare')}
              infoDetail={t('company.unsoldUnitsCarryIntoNext')} 
              summary={`${formatPercent(report.sellThrough)} sold`}
              summaryColor={report.sellThrough >= 60 ? '#4CAF50' : '#E57373'}
            >
              {/* Tesis durumu — kapasite kullanimi oyuncunun bakacagi tek sayi */}
              <View style={styles.facilityBar}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.opsLabel}>{t('company.facility')}</Text>
                  <Text style={styles.facilityName}>
                    {report.facilityName}
                    {report.isRetooling ? '  · retooling' : ''}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.opsLabel}>{t('company.utilization')}</Text>
                  <Text
                    style={[
                      styles.facilityUtil,
                      {
                        color:
                          report.utilization < 60 ? '#FFB74D'
                            : report.utilization > 95 ? '#EF5350' : '#4CAF50',
                      },
                    ]}
                  >
                    {formatPercent(report.utilization)}
                  </Text>
                </View>
              </View>

              <View style={styles.opsGrid}>
                <View style={styles.opsCell}>
                  <Text style={styles.opsLabel}>{t('company.headcount')}</Text>
                  <Text style={[
                    styles.opsValue,
                    report.headcount < report.crewRequired && { color: '#FFB74D' },
                  ]}>
                    {formatNumber(report.headcount)} / {formatNumber(report.crewRequired)}
                  </Text>
                </View>
                {report.hiresArrived > 0 && (
                  <View style={styles.opsCell}>
                    <Text style={styles.opsLabel}>{t('company.started')}</Text>
                    <Text style={styles.opsValue}>+{formatNumber(report.hiresArrived)}</Text>
                  </View>
                )}
                {report.attrition > 0 && (
                  <View style={styles.opsCell}>
                    <Text style={styles.opsLabel}>{t('company.left')}</Text>
                    <Text style={[styles.opsValue, { color: '#E57373' }]}>
                      −{formatNumber(report.attrition)}
                    </Text>
                  </View>
                )}
                <View style={styles.opsCell}>
                  <Text style={styles.opsLabel}>{t('company.morale')}</Text>
                  <Text style={[
                    styles.opsValue,
                    { color: report.employeeMorale < 50 ? '#EF5350' : report.employeeMorale < 70 ? '#FFB74D' : '#4CAF50' },
                  ]}>
                    {report.employeeMorale.toFixed(0)}
                    <Text style={styles.opsDelta}>
                      {(report.moraleChange ?? 0) >= 0 ? ' +' : ' '}
                      {(report.moraleChange ?? 0).toFixed(1)}
                    </Text>
                  </Text>
                </View>
              </View>

              <View style={styles.opsGrid}>
                <View style={styles.opsCell}>
                  <Text style={styles.opsLabel}>{t('company.produced')}</Text>
                  <Text style={styles.opsValue}>{formatNumber(report.unitsProduced)}</Text>
                </View>
                <View style={styles.opsCell}>
                  <Text style={styles.opsLabel}>{t('company.sold')}</Text>
                  <Text style={[styles.opsValue, { color: '#4CAF50' }]}>
                    {formatNumber(report.unitsSold)}
                  </Text>
                </View>
                <View style={styles.opsCell}>
                  <Text style={styles.opsLabel}>{t('company.sellThrough')}</Text>
                  <Text
                    style={[
                      styles.opsValue,
                      { color: report.sellThrough >= 60 ? '#4CAF50' : '#E57373' },
                    ]}
                  >
                    {formatPercent(report.sellThrough)}
                  </Text>
                </View>
                <View style={styles.opsCell}>
                  <Text style={styles.opsLabel}>{t('company.inStock')}</Text>
                  <Text style={[styles.opsValue, { color: '#FFB74D' }]}>
                    {formatNumber(report.endingInventory)}
                  </Text>
                </View>
              </View>
            </CollapsibleSection>

            {/* ══ NE OLDU — varsayilan olarak ACIK, ozeti bu bolum ══ */}
            <CollapsibleSection
              title={t('company.whatHappened')}
              note={t('company.plainLanguageReadOfThis')}
              info={t('company.automaticObservationsAboutWhatActually')} 
              summary={`${observations.length}`}
              summaryColor="#9E9E9E"
              defaultOpen
              hidden={observations.length === 0}
            >
              <View style={styles.notesBox}>
                {observations.map((note, i) => (
                  <View key={i} style={styles.noteRow}>
                    <View
                      style={[
                        styles.noteDot,
                        {
                          backgroundColor:
                            note.tone === 'bad'
                              ? '#F44336'
                              : note.tone === 'warn'
                                ? '#FFB74D'
                                : '#4CAF50',
                        },
                      ]}
                    />
                    <Text style={styles.noteText}>{note.text}</Text>
                  </View>
                ))}
              </View>
            </CollapsibleSection>

            {/* ══ URUNLER — her urun kendi icinde katlanir ══ */}
            <CollapsibleSection
              title={t('company.products')}
              note={t('company.perProductDemandSalesAnd')}
              info={t('company.tapAnyProductToExpand')} 
              summary={`${report.products.length}`}
              summaryColor="#9E9E9E"
            >
              {report.products.length === 0 ? (
                <Text style={styles.emptyText}>{t('company.noActiveProductsThisQuarter')}</Text>
              ) : (
                report.products.map(p => <ProductRow key={p.id} p={p} />)
              )}
            </CollapsibleSection>

            {/* ══ BAKIYELER ══ */}
            <CollapsibleSection
              title={t('company.balances')}
              note={t('company.whereYouStandAtThe')}
              info={t('company.companyCapitalFundsTheBusiness')}
              infoDetail={t('company.theTwoMoneyPoolsAre')} 
              summary={formatMoney(report.endingCapital)}
              summaryColor="#FFFFFF"
            >
              <View style={styles.balanceRow}>
                <View style={styles.balanceCell}>
                  <Text style={styles.balanceLabel}>{t('company.companyCapital')}</Text>
                  <Text style={styles.balanceValue}>{formatMoney(report.endingCapital)}</Text>
                </View>
                <View style={styles.balanceDivider} />
                <View style={styles.balanceCell}>
                  <Text style={styles.balanceLabel}>{t('company.personalCash')}</Text>
                  <Text style={styles.balanceValue}>{formatMoney(report.endingCash)}</Text>
                </View>
                <View style={styles.balanceDivider} />
                <View style={styles.balanceCell}>
                  <Text style={styles.balanceLabel}>{t('company.researchPoints')}</Text>
                  <Text style={[styles.balanceValue, { color: '#BA68C8' }]}>
                    {formatNumber(report.researchPoints)}
                  </Text>
                </View>
              </View>
            </CollapsibleSection>

          </ScrollView>

          <View style={styles.footerActions}>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
              onPress={onClose}
            >
              <Text style={styles.primaryButtonText}>{t('company.continue')}</Text>
            </Pressable>
          </View>

        </View>
      </View>
    </Modal>
  );
};

export default QuarterlyReportModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '92%',
    backgroundColor: '#0C0C10',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.18)',
    overflow: 'hidden',
  },

  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  closeButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  closeButtonText: { color: '#9E9E9E', fontSize: 17 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  headerSubtitle: { color: '#7A7A7A', fontSize: 10, marginTop: 2, letterSpacing: 1 },
  periodBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255,215,0,0.1)',
  },
  periodText: { color: '#FFD700', fontSize: 10, fontWeight: '700' },

  scrollContent: { padding: 16, paddingBottom: 24 },

  heroCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  heroLabel: { color: '#8A8A8A', fontSize: 10, letterSpacing: 2, fontWeight: '700' },
  heroValue: { fontSize: 34, fontWeight: '800', marginTop: 6 },
  heroSub: { color: '#8A8A8A', fontSize: 11, marginTop: 6 },

  sectionTitle: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 22,
    marginBottom: 10,
  },

  statement: {
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  line: { paddingVertical: 9 },
  lineSubtotal: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,215,0,0.25)',
    marginTop: 4,
  },
  lineEmphasis: {
    borderTopWidth: 2,
    borderTopColor: 'rgba(255,215,0,0.5)',
    marginTop: 6,
    paddingTop: 12,
  },
  lineTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  lineLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
  lineLabel: { color: '#C8C8C8', fontSize: 13 },
  lineLabelStrong: { color: '#FFFFFF', fontWeight: '700' },
  lineAmount: { fontSize: 14, fontWeight: '700', marginLeft: 10 },
  lineAmountBig: { fontSize: 20, fontWeight: '800' },
  lineExplain: { color: '#6E6E6E', fontSize: 10.5, lineHeight: 15, marginTop: 3, paddingRight: 40 },
  lineHint: { color: '#8E8E8E', fontSize: 10.5, marginTop: 2, fontStyle: 'italic' },

  groupLabel: {
    color: '#7A7A7A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 12,
    marginBottom: 2,
  },

  cashDivider: {
    height: 1,
    backgroundColor: '#2A2D35',
    marginVertical: 12,
  },
  cashHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8A9BA8',
    letterSpacing: 1,
    marginBottom: 8,
  },
  cashWarn: {
    fontSize: 11,
    color: '#ffdd57',
    fontWeight: '600',
    marginTop: 8,
    lineHeight: 16,
  },
  footnote: { color: '#5C5C5C', fontSize: 10, marginTop: 8, fontStyle: 'italic', lineHeight: 14 },

  opsDelta: { fontSize: 11, color: '#8A8A8A', fontWeight: '600' },
  facilityBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingBottom: 12, marginBottom: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  facilityName: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginTop: 3 },
  facilityUtil: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  opsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opsCell: {
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  opsLabel: { color: '#7A7A7A', fontSize: 10, letterSpacing: 0.8 },
  opsValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginTop: 3 },

  notesBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start' },
  noteDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5, marginRight: 9 },
  noteText: { color: '#BDBDBD', fontSize: 11.5, lineHeight: 17, flex: 1 },

  productCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  productHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productHeadRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  productShareMini: { color: '#7FB3FF', fontSize: 11, fontWeight: '700' },
  productChevron: { color: '#6E6E6E', fontSize: 15, marginTop: -3, width: 12, textAlign: 'center' },
  productChevronOpen: { color: '#FFD700', transform: [{ rotate: '180deg' }], marginTop: 3 },
  productName: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', flex: 1 },
  productProfit: { fontSize: 14, fontWeight: '800', marginLeft: 10 },
  demandRow: {
    marginTop: 9,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  demandText: { color: '#8A8A8A', fontSize: 10.5 },
  demandStrong: { color: '#D0D0D0', fontWeight: '700' },
  demandMiss: { color: '#E57373', fontSize: 10.5, marginTop: 2, fontWeight: '600' },

  productStats: { flexDirection: 'row', marginTop: 12, marginBottom: 10 },
  productStat: { flex: 1 },
  productSplit: { fontSize: 9, color: '#7FB3FF', marginTop: 2 },
  productStatLabel: { color: '#6E6E6E', fontSize: 9.5, letterSpacing: 0.5 },
  productStatValue: { color: '#E0E0E0', fontSize: 14, fontWeight: '700', marginTop: 2 },
  sellThroughTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  sellThroughFill: { height: '100%', borderRadius: 3 },
  sellThroughLabel: { color: '#8A8A8A', fontSize: 10, marginTop: 5 },
  productEcon: { color: '#6E6E6E', fontSize: 10, marginTop: 7, lineHeight: 15 },

  balanceRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    paddingVertical: 14,
  },
  balanceCell: { flex: 1, alignItems: 'center' },
  balanceLabel: { color: '#7A7A7A', fontSize: 9.5, letterSpacing: 0.6 },
  balanceValue: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginTop: 4 },
  balanceDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.07)' },

  emptyText: { color: '#6E6E6E', fontSize: 12, textAlign: 'center', paddingVertical: 20 },

  footerActions: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  primaryButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonPressed: { opacity: 0.8 },
  primaryButtonText: { color: '#0C0C10', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
});
