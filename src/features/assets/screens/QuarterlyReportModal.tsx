import React from 'react';
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
      text: 'You produced nothing this quarter. Set a production level on a product to start manufacturing.',
    });
  }

  if (r.unitsProduced > 0 && r.sellThrough < 50) {
    notes.push({
      tone: 'bad',
      text: `Only ${formatPercent(r.sellThrough)} of your available goods sold. The rest became inventory — you paid to build it, and now you pay to store it.`,
    });
  }

  // Stok tukenmesi: talep vardi ama mal yoktu.
  if (r.totalUnmetDemand > 0) {
    const missRate = r.totalMarketDemand > 0 ? (r.totalUnmetDemand / r.totalMarketDemand) * 100 : 0;
    notes.push({
      tone: 'bad',
      text: `You ran out of stock. The market wanted ${formatNumber(r.totalMarketDemand)} units but you could only supply ${formatNumber(r.unitsSold)}. ${formatNumber(r.totalUnmetDemand)} customers (${formatPercent(missRate)}) went to a competitor.`,
    });
  }

  if (r.brandChange < -0.5) {
    notes.push({
      tone: 'bad',
      text: `Brand Value fell ${Math.abs(r.brandChange).toFixed(1)} points to ${r.brandValue}. Holding it steady takes about ${formatMoney(r.brandMaintenance ?? 0)} of marketing per quarter, and that number grows with your revenue. A weaker brand means a smaller share of every market you compete in.`,
    });
  } else if (r.brandChange > 0.5) {
    notes.push({
      tone: 'good',
      text: `Brand Value rose ${r.brandChange.toFixed(1)} points to ${r.brandValue}. This lifts your share in every category.`,
    });
  }

  if (r.isRetooling) {
    notes.push({
      tone: 'warn',
      text: `Your facility is being upgraded, so it ran at 65% capacity. Output is down on purpose — it comes back, and grows, when the build lands${r.buildQuartersRemaining ? ` in ${r.buildQuartersRemaining} quarter(s)` : ''}.`,
    });
  }

  if (r.headcount < r.crewRequired) {
    notes.push({
      tone: 'warn',
      text: `You are ${formatNumber(r.crewRequired - r.headcount)} people short of the crew this facility needs. The plant is there; nobody is running part of it.`,
    });
  }

  if (r.utilization > 0 && r.utilization < 60) {
    notes.push({
      tone: 'bad',
      text: `Capacity utilization was only ${formatPercent(r.utilization)}. You are paying facility overhead and wages for a line you are not using.`,
    });
  }

  if (r.brandCeiling && r.brandValue >= r.brandCeiling - 0.5) {
    notes.push({
      tone: 'warn',
      text: `Brand Value has hit the ceiling for a ${r.facilityName} (${r.brandCeiling}). More marketing will not move it — the limit is what you can manufacture, not what you can say.`,
    });
  }

  if ((r.hiresBlocked ?? 0) > 0) {
    notes.push({
      tone: 'warn',
      text: `You asked for ${formatNumber((r.hiresQueued ?? 0) + (r.hiresBlocked ?? 0))} new people but could only recruit ${formatNumber(r.hiresQueued)}. You cannot absorb more than about a quarter of your headcount at once — a stronger brand and better morale would raise that ceiling.`,
    });
  }

  if ((r.moraleChange ?? 0) < -2) {
    notes.push({
      tone: 'bad',
      text: `Morale fell ${Math.abs(r.moraleChange ?? 0).toFixed(1)} points to ${r.employeeMorale.toFixed(0)}. At ${Math.round((r.salaryRatio ?? 1) * 100)}% of market pay it settles around ${r.moraleWageTarget ?? 70}. Morale is not a threshold: it multiplies your output by ${(r.moraleEfficiency ?? 1).toFixed(2)} and raises defects.`,
    });
  }

  if (r.overtime) {
    notes.push({
      tone: 'warn',
      text: 'Overtime was running. You got extra units, paid 1.5× for the hours, and lost morale. Fine for a spike — expensive as a habit.',
    });
  }

  if (r.layoffs > 0) {
    notes.push({
      tone: 'bad',
      text: `You let ${formatNumber(r.layoffs)} people go. The severance is paid, but the morale damage lasts longer than the saving.`,
    });
  }

  if (r.products.some(p => p.produced > 0 && (p.marketingBudget ?? 0) === 0)) {
    notes.push({
      tone: 'warn',
      text: 'Some products have zero marketing spend. Marketing is one of the five things that decide your market share — without it, fewer customers ever consider you.',
    });
  }

  if (r.totalExpenses > 0 && r.expenses.storage / r.totalExpenses > 0.1) {
    notes.push({
      tone: 'bad',
      text: `Storage is ${formatPercent((r.expenses.storage / r.totalExpenses) * 100)} of your total costs. That is pure waste from overproduction.`,
    });
  }

  if (r.operationalSetback) {
    notes.push({
      tone: 'bad',
      text: `Low morale (${Math.round(r.employeeMorale)}%) cost you ${formatNumber(r.lostUnits)} units of sales, worth ${formatMoney(r.lostRevenue)}.`,
    });
  }

  if (r.revenue > 0 && r.grossMargin < 20) {
    notes.push({
      tone: 'warn',
      text: `Gross margin is only ${formatPercent(r.grossMargin)}. Your production cost is close to your selling price.`,
    });
  }

  if (r.netProfit > 0 && r.sellThrough >= 70) {
    notes.push({
      tone: 'good',
      text: `Healthy quarter: ${formatPercent(r.sellThrough)} sell-through and ${formatPercent(r.netMargin)} net margin.`,
    });
  }

  if (r.researchGained > 0) {
    notes.push({
      tone: 'good',
      text: `Your researchers generated ${formatNumber(r.researchGained)} RP this quarter.`,
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
                {'  ·  '}share <Text style={styles.demandStrong}>{(p.marketShare ?? 0).toFixed(3)}%</Text>
              </Text>
              {(p.unmetDemand ?? 0) > 0 && (
                <Text style={styles.demandMiss}>
                  {formatNumber(p.unmetDemand ?? 0)} lost to rivals
                </Text>
              )}
            </View>
          )}

          <View style={styles.productStats}>
            <View style={styles.productStat}>
              <Text style={styles.productStatLabel}>Produced</Text>
              <Text style={styles.productStatValue}>{formatNumber(p.produced)}</Text>
            </View>
            <View style={styles.productStat}>
              <Text style={styles.productStatLabel}>Sold</Text>
              <Text style={[styles.productStatValue, { color: '#4CAF50' }]}>{formatNumber(p.sold)}</Text>
            </View>
            <View style={styles.productStat}>
              <Text style={styles.productStatLabel}>Unsold</Text>
              <Text style={[styles.productStatValue, { color: p.unsold > 0 ? '#E57373' : '#9E9E9E' }]}>
                {formatNumber(p.unsold)}
              </Text>
            </View>
            <View style={styles.productStat}>
              <Text style={styles.productStatLabel}>Stock</Text>
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
            <Text style={styles.emptyText}>No quarter has been completed yet.</Text>
            <View style={styles.footerActions}>
              <Pressable style={styles.primaryButton} onPress={onClose}>
                <Text style={styles.primaryButtonText}>Close</Text>
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
              <Text style={styles.headerTitle}>QUARTERLY REPORT</Text>
              <Text style={styles.headerSubtitle}>Income Statement</Text>
            </View>
            <View style={styles.periodBadge}>
              <Text style={styles.periodText}>{report.periodLabel}</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

            {/* Net sonuc */}
            <View style={[styles.heroCard, { borderColor: report.netProfit >= 0 ? '#FFD700' : '#F44336' }]}>
              <Text style={styles.heroLabel}>NET INCOME</Text>
              <Text style={[styles.heroValue, { color: report.netProfit >= 0 ? '#4CAF50' : '#F44336' }]}>
                {formatSignedMoney(report.netProfit)}
              </Text>
              <Text style={styles.heroSub}>
                {formatPercent(report.netMargin)} net margin · {formatPercent(report.grossMargin)} gross margin
              </Text>
            </View>

            {/* ══ GELIR TABLOSU ══ */}
            <CollapsibleSection
              title="INCOME STATEMENT"
              note="Where every dollar went, line by line"
              info="A standard income statement. Revenue minus the cost of making your goods gives Gross Profit. Subtract operating costs to get EBIT, then interest, and what remains is Net Income."
              infoDetail="Tap the ⓘ next to any line to see how that specific cost is calculated." 
              summary={formatSignedMoney(report.netProfit)}
              summaryColor={report.netProfit >= 0 ? '#4CAF50' : '#F44336'}
            >
              <View style={styles.statement}>
                <StatementLine
                  label="Revenue"
                  amount={report.revenue}
                  explanation={`${formatNumber(report.unitsSold)} units sold.`}
                />
                <StatementLine
                  label="Cost of Goods Sold"
                  amount={e.cogs}
                  negative
                  explanation={EXPENSE_EXPLANATIONS.cogs}
                  hint={`${formatNumber(report.unitsProduced)} units produced this quarter.`}
                />
                <StatementLine label="Gross Profit" amount={report.grossProfit} subtotal />

                <Text style={styles.groupLabel}>OPERATING EXPENSES</Text>

                <StatementLine
                  label="Marketing"
                  amount={e.marketing}
                  negative
                  explanation={EXPENSE_EXPLANATIONS.marketing}
                />
                <StatementLine
                  label="Storage"
                  amount={e.storage}
                  negative
                  explanation={EXPENSE_EXPLANATIONS.storage}
                  hint={`${formatNumber(report.endingInventory)} units sitting in the warehouse.`}
                />
                <StatementLine
                  label="Wages"
                  amount={e.wages}
                  negative
                  explanation={EXPENSE_EXPLANATIONS.wages}
                  hint={`${formatNumber(report.headcount)} people at ${Math.round((report.salaryRatio ?? 1) * 100)}% of market pay${report.overtime ? ', overtime on' : ''}.`}
                />
                {e.hiring > 0 && (
                  <StatementLine
                    label="Hiring"
                    amount={e.hiring}
                    negative
                    explanation={EXPENSE_EXPLANATIONS.hiring}
                    hint={`${formatNumber(report.hiresQueued)} people recruited, starting next quarter.`}
                  />
                )}
                {e.severance > 0 && (
                  <StatementLine
                    label="Severance"
                    amount={e.severance}
                    negative
                    explanation={EXPENSE_EXPLANATIONS.severance}
                    hint={`${formatNumber(report.layoffs)} people let go.`}
                  />
                )}
                <StatementLine
                  label="Facility Overhead"
                  amount={e.factoryOverhead}
                  negative
                  explanation={EXPENSE_EXPLANATIONS.factoryOverhead}
                  hint={`${report.facilityName} — paid whether the line runs or not.`}
                />
                <StatementLine
                  label="Research & Development"
                  amount={e.rnd}
                  negative
                  explanation={EXPENSE_EXPLANATIONS.rnd}
                  hint={report.researchGained > 0 ? `Bought ${formatNumber(report.researchGained)} RP.` : undefined}
                />
                <StatementLine
                  label="Fixed Costs"
                  amount={e.fixed}
                  negative
                  explanation={EXPENSE_EXPLANATIONS.fixed}
                />

                <StatementLine label="Operating Income (EBIT)" amount={report.ebit} subtotal />
                <StatementLine
                  label="Interest"
                  amount={e.interest}
                  negative
                  explanation={EXPENSE_EXPLANATIONS.interest}
                />
                <StatementLine label="Net Income" amount={report.netProfit} emphasis />
              </View>

              <Text style={styles.footnote}>
                Employee wages are not charged by the simulation yet, so they do not appear above.
              </Text>
            </CollapsibleSection>

            {/* ══ PAZAR ══ */}
            <CollapsibleSection
              title="MARKET"
              note="What the market wanted vs what you could supply"
              info="Each product category has a fixed market size. Your share of it is decided by five things: price, marketing, quality, brand and how appealing the product itself is."
              infoDetail="Producing more does NOT create demand. If you build more than the market wants, it becomes inventory. If you build less, customers go to a rival." 
              summary={
                report.totalUnmetDemand > 0
                  ? `${formatNumber(report.totalUnmetDemand)} lost`
                  : 'fully served'
              }
              summaryColor={report.totalUnmetDemand > 0 ? '#F44336' : '#4CAF50'}
            >
              <View style={styles.opsGrid}>
                <View style={styles.opsCell}>
                  <Text style={styles.opsLabel}>Market Wanted</Text>
                  <Text style={styles.opsValue}>{formatNumber(report.totalMarketDemand)}</Text>
                </View>
                <View style={styles.opsCell}>
                  <Text style={styles.opsLabel}>You Supplied</Text>
                  <Text style={[styles.opsValue, { color: '#4CAF50' }]}>
                    {formatNumber(report.unitsSold)}
                  </Text>
                </View>
                <View style={styles.opsCell}>
                  <Text style={styles.opsLabel}>Lost to Rivals</Text>
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
                  <Text style={styles.opsLabel}>Brand Value</Text>
                  <Text style={[styles.opsValue, { color: '#FFD700' }]}>
                    {report.brandValue}
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
              title="OPERATIONS"
              note="How much you built and how much of it moved"
              info="Sell-through is the share of available goods (opening stock plus this quarter's production) that actually sold. Below 100% means you built more than you could sell."
              infoDetail="Unsold units carry into next quarter and cost $5 each per quarter to store." 
              summary={`${formatPercent(report.sellThrough)} sold`}
              summaryColor={report.sellThrough >= 60 ? '#4CAF50' : '#E57373'}
            >
              {/* Tesis durumu — kapasite kullanimi oyuncunun bakacagi tek sayi */}
              <View style={styles.facilityBar}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.opsLabel}>FACILITY</Text>
                  <Text style={styles.facilityName}>
                    {report.facilityName}
                    {report.isRetooling ? '  · retooling' : ''}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.opsLabel}>UTILIZATION</Text>
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
                  <Text style={styles.opsLabel}>Headcount</Text>
                  <Text style={[
                    styles.opsValue,
                    report.headcount < report.crewRequired && { color: '#FFB74D' },
                  ]}>
                    {formatNumber(report.headcount)} / {formatNumber(report.crewRequired)}
                  </Text>
                </View>
                {report.hiresArrived > 0 && (
                  <View style={styles.opsCell}>
                    <Text style={styles.opsLabel}>Started</Text>
                    <Text style={styles.opsValue}>+{formatNumber(report.hiresArrived)}</Text>
                  </View>
                )}
                {report.attrition > 0 && (
                  <View style={styles.opsCell}>
                    <Text style={styles.opsLabel}>Left</Text>
                    <Text style={[styles.opsValue, { color: '#E57373' }]}>
                      −{formatNumber(report.attrition)}
                    </Text>
                  </View>
                )}
                <View style={styles.opsCell}>
                  <Text style={styles.opsLabel}>Morale</Text>
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
                  <Text style={styles.opsLabel}>Produced</Text>
                  <Text style={styles.opsValue}>{formatNumber(report.unitsProduced)}</Text>
                </View>
                <View style={styles.opsCell}>
                  <Text style={styles.opsLabel}>Sold</Text>
                  <Text style={[styles.opsValue, { color: '#4CAF50' }]}>
                    {formatNumber(report.unitsSold)}
                  </Text>
                </View>
                <View style={styles.opsCell}>
                  <Text style={styles.opsLabel}>Sell-through</Text>
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
                  <Text style={styles.opsLabel}>In Stock</Text>
                  <Text style={[styles.opsValue, { color: '#FFB74D' }]}>
                    {formatNumber(report.endingInventory)}
                  </Text>
                </View>
              </View>
            </CollapsibleSection>

            {/* ══ NE OLDU — varsayilan olarak ACIK, ozeti bu bolum ══ */}
            <CollapsibleSection
              title="WHAT HAPPENED"
              note="Plain-language read of this quarter"
              info="Automatic observations about what actually happened. These are statements of fact, not advice — the point is to help you connect your decisions to their results." 
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
              title="PRODUCTS"
              note="Per-product demand, sales and margin"
              info="Tap any product to expand it. Products in the same category compete for the same market, including against each other." 
              summary={`${report.products.length}`}
              summaryColor="#9E9E9E"
            >
              {report.products.length === 0 ? (
                <Text style={styles.emptyText}>No active products this quarter.</Text>
              ) : (
                report.products.map(p => <ProductRow key={p.id} p={p} />)
              )}
            </CollapsibleSection>

            {/* ══ BAKIYELER ══ */}
            <CollapsibleSection
              title="BALANCES"
              note="Where you stand at the end of the quarter"
              info="Company Capital funds the business. Personal Cash is yours. Research Points buy product upgrades and unlock new technology."
              infoDetail="The two money pools are separate on purpose — a rich company does not make you rich." 
              summary={formatMoney(report.endingCapital)}
              summaryColor="#FFFFFF"
            >
              <View style={styles.balanceRow}>
                <View style={styles.balanceCell}>
                  <Text style={styles.balanceLabel}>Company Capital</Text>
                  <Text style={styles.balanceValue}>{formatMoney(report.endingCapital)}</Text>
                </View>
                <View style={styles.balanceDivider} />
                <View style={styles.balanceCell}>
                  <Text style={styles.balanceLabel}>Personal Cash</Text>
                  <Text style={styles.balanceValue}>{formatMoney(report.endingCash)}</Text>
                </View>
                <View style={styles.balanceDivider} />
                <View style={styles.balanceCell}>
                  <Text style={styles.balanceLabel}>Research Points</Text>
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
              <Text style={styles.primaryButtonText}>Continue</Text>
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
