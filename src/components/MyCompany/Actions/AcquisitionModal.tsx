import React, { useState, useMemo } from 'react';
import { t, useLocale } from '../../../core/i18n';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Alert,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../../core/theme';
import { useMarketStore } from '../../../core/store/useMarketStore';
import { useCorporateFinanceStore } from '../../../features/finance/stores/useCorporateFinanceStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { INITIAL_MARKET_ITEMS } from '../../../features/assets/data/marketData';
import { formatMoney as formatMoneyExact } from '../../../core/utils';
import { findCompetitorByStockId } from '../../../core/market/productMarkets';
import {
  FinancingMethod,
  FinancingQuote,
  TargetRisk,
  estimateTargetEbit,
  quoteAcquisition,
  quoteFinancing,
} from '../../../core/market/mergers';
import { useShareholderStore } from '../../../features/shareholders/stores/useShareholderStore';
import { useEquityStore } from '../../../features/finance/stores/useEquityStore';
import ConfirmPanel, { type ConfirmLine } from '../../common/ConfirmPanel';
import ScreenHost from '../../common/ScreenHost';
import ScreenHeader from '../../common/ScreenHeader';

const { width } = Dimensions.get('window');

interface AcquisitionModalProps {
  /** Render as a route rather than a popup - see components/common/ScreenHost. */
  asScreen?: boolean;
  visible: boolean;
  onClose: () => void;
}

const formatMoney = (value: number) => {
  return formatMoneyExact(value);
};

export const AcquisitionModal = ({ visible, onClose, asScreen }: AcquisitionModalProps) => {
    useLocale();
  const navigation = useNavigation<any>();
  const { marketPrices } = useMarketStore();
  const { subsidiaries, executeAcquisition } = useCorporateFinanceStore();
  const { companyCapital } = useStatsStore();

  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [selectedTarget, setSelectedTarget] = useState<any | null>(null);
  const [panel, setPanel] = useState<null | {
    title: string;
    summary?: string;
    lines?: ConfirmLine[];
    note?: string;
    confirmLabel: string;
    cancelLabel?: string;
    onConfirm?: () => void;
    tone?: 'default' | 'danger';
    choices?: { label: string; description?: string; onPress: () => void }[];
  }>(null);

  // 1. Prepare Data
  const availableCompanies = useMemo(() => {
    return INITIAL_MARKET_ITEMS.filter((item: any) => {
      // Must be a stock (has marketCap/acquisitionCost and NOT crypto/bond)
      const isStock = ('acquisitionCost' in item || 'marketCap' in item) && !('volatility' in item) && !('issuerType' in item);
      if (!isStock) return false;

      // Must not be already owned
      const isOwned = subsidiaries.some((sub: any) => sub.id === item.id);
      if (isOwned) return false;

      return true;
    });
  }, [subsidiaries]);

  // 2. Extract Categories
  const categories = useMemo(() => {
    const sectors = new Set(availableCompanies.map((c: any) => c.category || 'Other'));
    return ['All', ...Array.from(sectors)];
  }, [availableCompanies]);

  // 3. Filter by Sector
  const filteredList = useMemo(() => {
    if (selectedSector === 'All') return availableCompanies;
    return availableCompanies.filter((c: any) => c.category === selectedSector);
  }, [selectedSector, availableCompanies]);

  // 4. Calculate Current Valuation Helper
  const currentValuationOf = (item: any) => getValuation(item);
  const getValuation = (item: any) => {
    const baseStockPrice = item.price || 100;
    const currentStockPrice = marketPrices[item.id] || baseStockPrice;
    const priceRatio = currentStockPrice / baseStockPrice;
    return (item.marketCap || 1_000_000_000) * priceRatio;
  };

  // ------------------------------------------------------------------
  //  SATIN ALMA
  // ------------------------------------------------------------------
  //  ESKIDEN: fiyati ode, sirket listene eklensin. Bitti.
  //  Dusmanca devralma "%20 prim" diyordu ama o prim hicbir yere
  //  yansimıyordu — ne hisseye, ne kara, ne gelecek ceyreklere.
  //
  //  SIMDI: her islem bir finansal kayit dogurur ve ceyreklere yayilir.
  //  Bkz. core/market/mergers.ts
  // ------------------------------------------------------------------
  const handleAcquire = (type: 'FRIENDLY' | 'HOSTILE') => {
    if (!selectedTarget) return;

    const hostile = type === 'HOSTILE';
    const currentValuation = getValuation(selectedTarget);
    const stats = useStatsStore.getState();
    const acquirerValuation = stats.companyValue || 0;
    const risk: TargetRisk = (selectedTarget.risk as TargetRisk) || 'Medium';

    const q = quoteAcquisition(currentValuation, risk, hostile, acquirerValuation);

    // ------------------------------------------------------------------
    //  FINANSMAN SECIMI
    // ------------------------------------------------------------------
    //  Once yalnizca nakit vardi, yani kendinden buyuk bir sirketi asla
    //  alamiyordun. Gercekte kucuk sirket buyugu alir — borcla veya
    //  hisse takasiyla. Agirlik da oradan gelir: hisseyle alirsan
    //  seyrelirsin, ve cok buyuk bir seyi alirsan sonunda sirketin
    //  sahibi sen olmazsin.
    // ------------------------------------------------------------------
    const cap = useShareholderStore.getState();
    const rate = useCorporateFinanceStore.getState().getInterestRate();
    const options = (['cash', 'debt', 'stock'] as FinancingMethod[]).map(m =>
      quoteFinancing(
        m, q.price, companyCapital, acquirerValuation,
        stats.companyDebtTotal || 0, stats.companySharePrice || 0,
        cap.totalShares, cap.playerShareCount, rate,
      ),
    );

    const feasible = options.filter(o => o.feasible);
    if (feasible.length === 0) {
      setPanel({
        title: t('alert.cannotFinanceThisDeal'),
        lines: options.map(o => ({ label: o.method.toUpperCase(), value: o.reason || '' })),
        confirmLabel: 'OK',
        tone: 'danger',
      });
      return;
    }

    const describe = (o: FinancingQuote) => {
      if (o.method === 'cash') return t('acq.payCashDesc', { v1: formatMoney(o.cashUsed) });
      if (o.method === 'debt') return t('acq.payDebtDesc', { v1: formatMoney(o.annualInterest) });
      return t('acq.payStockDesc', { v1: o.playerOwnershipAfter.toFixed(2) });
    };

    // Each financing route needs a sentence of its own, which a system Alert
    // could not give it - the terms had to be packed into the message body
    // above three unlabelled buttons. They are rows now.
    setPanel({
      title: t('acq.howDoYouPay', { v1: selectedTarget.name }),
      lines: [
        { label: 'Price', value: formatMoney(q.price) },
        { label: 'Your valuation', value: formatMoney(acquirerValuation) },
        { label: 'Relative size', value: `${(q.relativeSize * 100).toFixed(1)}%`, strong: true },
      ],
      choices: feasible.map(o => ({
        label: o.method === 'cash' ? t('acq.payCash') : o.method === 'debt' ? t('acq.borrow') : t('acq.issueShares'),
        description: describe(o),
        onPress: () => { setPanel(null); confirmDeal(q, o, hostile, acquirerValuation); },
      })),
      cancelLabel: t('action.cancel'),
      confirmLabel: '',
    });
  };

  const confirmDeal = (
    q: ReturnType<typeof quoteAcquisition>,
    fin: FinancingQuote,
    hostile: boolean,
    acquirerValuation: number,
  ) => {
    if (!selectedTarget) return;

    setPanel({
      title: hostile ? t('acq.hostileBidFor', { v1: selectedTarget.name }) : t('acq.acquireTitle', { v1: selectedTarget.name }),
      // The deal sheet: twelve figures that used to be one interpolated
      // paragraph. Same numbers, one per row.
      lines: [
        { label: 'Fair value', value: formatMoney(q.fairValue) },
        { label: `Premium (${Math.round(q.premiumRatio * 100)}%)`, value: formatMoney(q.premium) },
        { label: 'Price', value: formatMoney(q.price), strong: true },
        { label: 'Their annual EBIT', value: formatMoney(q.targetAnnualEbit) },
        { label: 'First-year integration', value: `−${formatMoney(q.firstYearIntegration)}`, tone: 'negative' },
        { label: 'Synergy at full run', value: formatMoney(q.annualSynergyAtFullRun) },
        {
          label: 'First-year EBIT impact',
          value: (q.firstYearEbitImpact >= 0 ? '+' : '') + formatMoney(q.firstYearEbitImpact),
          tone: q.firstYearEbitImpact >= 0 ? 'positive' : 'negative',
        },
        { label: 'Steady state', value: formatMoney(q.steadyStateEbitImpact) },
        { label: 'Payback', value: isFinite(q.paybackYears) ? t('acq.paybackYears', { v1: q.paybackYears.toFixed(1) }) : t('acq.neverAtThisPrice') },
        { label: 'Announcement impact', value: `${q.announcementImpactPercent.toFixed(1)}%` },
        { label: q.accretive ? t('acq.accretive') : t('acq.dilutive'), value: '', strong: true },
      ],
      note:
        (fin.method === 'stock'
          ? t('acq.paidInShares', {
              v1: fin.sharesIssued.toLocaleString(),
              v2: fin.playerOwnershipAfter.toFixed(2),
            })
          : fin.method === 'debt'
            ? t('acq.paidWithDebt', { v1: formatMoney(fin.annualInterest) })
            : '') + t('acq.premiumWarning', { v1: formatMoney(q.premium) }),
      tone: hostile ? 'danger' : 'default',
      cancelLabel: t('action.walkAway'),
      confirmLabel: hostile ? t('acq.launchHostile') : t('acq.signDeal'),
      onConfirm: () => {
          {
            // TEK KAPI — finansman, anlasma kaydi ve piyasa tepkisi hepsi
            // orada. Bkz. useCorporateFinanceStore.executeAcquisition
            const result = executeAcquisition({
              target: {
                id: selectedTarget.id || selectedTarget.symbol,
                name: selectedTarget.name,
                marketCap: currentValuationOf(selectedTarget),
                risk: selectedTarget.risk,
                category: selectedTarget.category,
                // acquisitionBuff no longer passed - nothing reads it.
              },
              hostile,
              financing: fin.method,
            });

            // ------------------------------------------------------------
            //  OYLAMA SONUCUNU GOSTER
            // ------------------------------------------------------------
            //  Oyuncu "%50'nin altina dusup sirket aldim, kimse oylamadi"
            //  dedi. Oylama ASLINDA OLUYORDU — sessizce. Gectiginde hicbir
            //  sey gorunmuyordu; sistemin var oldugunu ancak KAYBEDINCE
            //  anliyordun. Kurulu gorunmez yapan sey buydu.
            // ------------------------------------------------------------
            const vote = useShareholderStore.getState().lastVote;
            const votedOnThis = vote && vote.title.includes(selectedTarget.name);
            if (votedOnThis) {
              setPanel({
                title: vote!.passed ? t('acq.boardApproved') : t('acq.boardVotedDown'),
                summary: vote!.summary,
                lines: vote!.votes.map(v => ({
                  label: `${v.vote === 'YES' ? '✓' : '✕'}  ${v.name}`,
                  value: v.reason,
                })),
                note: vote!.overrode ? t('acq.carriedOnYourShares') : undefined,
                confirmLabel: 'OK',
                tone: vote!.passed ? 'default' : 'danger',
              });
            }

            if (!result.success) {
              if (!votedOnThis) {
                setPanel({ title: t('alert.dealFailed'), summary: result.message, confirmLabel: 'OK', tone: 'danger' });
              }
              return;
            }

            setPanel({
              title: t('alert.dealClosed'),
              summary: t('acq.dealClosedBody', { v1: selectedTarget.name })
                + (q.accretive ? t('acq.accretiveNote') : t('acq.dilutiveNote')),
              confirmLabel: 'OK',
            });
            setSelectedTarget(null);
            onClose();
          }
      },
    });
  };

  const renderCompanyItem = ({ item }: { item: any }) => {
    const valuation = getValuation(item);

    return (
      <TouchableOpacity
        style={styles.itemRow}
        activeOpacity={0.7}
        onPress={() => setSelectedTarget({ ...item, currentValuation: valuation })}
      >
        <View style={styles.itemIcon}>
          <Text style={styles.itemInitial}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemSector}>{item.category || t('common.technology')}</Text>
        </View>
        <View style={styles.itemValue}>
          <Text style={styles.marketCap}>{formatMoney(valuation)}</Text>
          <Text style={styles.valueLabel}>{t('action.marketCap')}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const handleHomePress = () => {
    onClose();
    navigation.navigate('Home');
  };

  return (
    <ScreenHost asScreen={asScreen} visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>

        {/* HEADER */}
        <ScreenHeader
          title={t('action.mergersAcquisitions')}
          subtitle={t('action.expandYourCorporateEmpire')}
          onBack={onClose}
        />

        {/* CAPITAL INDICATOR */}
        <View style={styles.capitalBar}>
          <Text style={styles.capitalLabel}>{t('action.acquisitionPower')}</Text>
          <Text style={styles.capitalValue}>{formatMoney(companyCapital)}</Text>
        </View>

        {/* CATEGORY TABS */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.tab, selectedSector === cat && styles.activeTab]}
                onPress={() => setSelectedSector(cat)}
              >
                <Text style={[styles.tabText, selectedSector === cat && styles.activeTabText]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* STOCK LIST */}
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id}
          renderItem={renderCompanyItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t('action.noCompaniesAvailableInThis')}</Text>
            </View>
          }
        />

        {/* Persistent Bottom Bar */}
        {/* NEGOTIATION OVERLAY */}
        {selectedTarget && (
          <View style={styles.overlayBackdrop}>
            <View style={styles.negotiationCard}>
              <View style={styles.negHeader}>
                <Text style={styles.negTitle}>{t('action.acquireV1', { v1: selectedTarget.name })}</Text>
                <Text style={styles.negSubtitle}>{t('action.chooseYourApproach')}</Text>
              </View>

              <View style={styles.negBody}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('action.currentValuation')}</Text>
                  <Text style={styles.infoValue}>{formatMoney(selectedTarget.currentValuation)}</Text>
                </View>

                {/* PAZAR PAYI — satin almanin asil gerekcesi.
                    Bu sirket senin urun kategorilerinden birinde rakipse
                    payini gosteriyoruz. Bkz. core/market/productMarkets.ts */}
                {(() => {
                  const found = findCompetitorByStockId(selectedTarget.id);
                  if (!found) {
                    return (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{t('action.marketPosition')}</Text>
                        <Text style={styles.infoValue}>{t('action.notADirectCompetitor')}</Text>
                      </View>
                    );
                  }
                  return (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>{t('action.marketShare')}</Text>
                      <Text style={[styles.infoValue, { color: '#FFFFFF' }]}>
                        {found.competitor.share.toFixed(1)}% of {found.market.category}
                      </Text>
                    </View>
                  );
                })()}

                {/* ----------------------------------------------------------
                    WHAT YOU ARE ACTUALLY BUYING

                    This row used to read "R&D Speed +15%" off the target's
                    `acquisitionBuff`. The engine no longer applies those, so
                    the row was a promise nothing kept - the worst kind of
                    stale UI, because it reads as a reason to sign.

                    Their annual profit replaces it: the number the price, the
                    payback and the impairment test are all derived from, and
                    the one an actual buyer asks for first.
                ---------------------------------------------------------- */}
                {(() => {
                  const ebit = estimateTargetEbit(
                    selectedTarget.currentValuation,
                    selectedTarget.risk as TargetRisk,
                  );
                  return (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>{t('acq.theirAnnualProfit')}</Text>
                      <Text style={[
                        styles.infoValue,
                        // Sign only. A target that loses money should look
                        // like one before you have opened the deal sheet.
                        { color: ebit >= 0 ? theme.colors.positive : theme.colors.negative },
                      ]}>
                        {formatMoney(ebit)}
                      </Text>
                    </View>
                  );
                })()}
              </View>

              <View style={styles.negActions}>
                {/* Friendly Offer */}
                <TouchableOpacity
                  style={styles.optionBtn}
                  onPress={() => handleAcquire('FRIENDLY')}
                >
                  <View style={styles.optionHeader}>
                    <Text style={styles.optionTitle}>🤝 {t('acq.friendlyOffer')}</Text>
                    <Text style={styles.optionPrice}>{formatMoney(selectedTarget.currentValuation)}</Text>
                  </View>
                  <Text style={styles.optionDesc}>{t('action.purchaseAtFairMarketValue')}</Text>
                </TouchableOpacity>

                {/* Hostile Takeover */}
                <TouchableOpacity
                  style={[styles.optionBtn, styles.hostileBtn]}
                  onPress={() => handleAcquire('HOSTILE')}
                >
                  <View style={styles.optionHeader}>
                    <Text style={[styles.optionTitle, styles.hostileText]}>⚔️ {t('acq.hostileTakeover')}</Text>
                    <Text style={[styles.optionPrice, styles.hostileText]}>
                      {formatMoney(selectedTarget.currentValuation * 1.2)}
                    </Text>
                  </View>
                  <Text style={[styles.optionDesc, styles.hostileDesc]}>{t('action.pay20PremiumInstantClose')}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSelectedTarget(null)}
              >
                <Text style={styles.cancelText}>{t('action.cancelNegotiation')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </View>

      <ConfirmPanel
        visible={!!panel}
        title={panel?.title || ''}
        summary={panel?.summary}
        lines={panel?.lines}
        note={panel?.note}
        tone={panel?.tone}
        choices={panel?.choices}
        confirmLabel={panel?.confirmLabel || 'OK'}
        cancelLabel={panel?.cancelLabel}
        onConfirm={panel?.onConfirm}
        onCancel={() => setPanel(null)}
      />
    </ScreenHost>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C242C',
  },
  header: {
    padding: 20,
    paddingTop: 60, // Increased to prevent status bar overlap
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: '#323A40',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  closeText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  capitalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#434B50',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  capitalLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  capitalValue: {
    color: theme.colors.success,
    fontSize: 18,
    fontWeight: '900',
  },

  // Tabs
  tabsContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#434B50',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  activeTab: {
    backgroundColor: '#434B50', // Gold
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // List
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 80, // Space for Bottom Bar
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#434B50',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#323A40',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  itemInitial: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemSector: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemValue: {
    alignItems: 'flex-end',
  },
  marketCap: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  valueLabel: {
    color: '#FFFFFF',
    fontSize: 11,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#FFFFFF',
  },

  // Negotiation Overlay
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28,36,44,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  negotiationCard: {
    width: '100%',
    backgroundColor: '#434B50',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 24,
    shadowColor: '#1C242C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  negHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  negTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  negSubtitle: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  negBody: {
    marginBottom: 24,
    gap: 12,
    backgroundColor: '#434B50',
    padding: 16,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    color: '#FFFFFF',
  },
  infoValue: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // SHELVED with the buff row above - the only thing styled green here was
  // the stat bonus the engine no longer applies.
  // buffValue: {
  //   color: theme.colors.success,
  //   fontWeight: '600',
  // },
  negActions: {
    gap: 12,
  },
  optionBtn: {
    backgroundColor: '#323A40',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  optionTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  optionPrice: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  optionDesc: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  hostileBtn: {
    backgroundColor: 'rgba(5,168,246,0.1)',
    borderColor: theme.colors.destructive,
  },
  hostileText: {
    color: theme.colors.danger,
  },
  hostileDesc: {
    color: theme.colors.textMuted,
  },
  cancelBtn: {
    marginTop: 16,
    alignItems: 'center',
    padding: 12,
  },
  cancelText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

});
