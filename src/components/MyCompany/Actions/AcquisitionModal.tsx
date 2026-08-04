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
import CrystalNavBar from '../../../navigation/components/CrystalNavBar';
import { formatMoney as formatMoneyExact } from '../../../core/utils';
import { findCompetitorByStockId } from '../../../core/market/productMarkets';
import {
  FinancingMethod,
  FinancingQuote,
  TargetRisk,
  quoteAcquisition,
  quoteFinancing,
} from '../../../core/market/mergers';
import { useShareholderStore } from '../../../features/shareholders/stores/useShareholderStore';
import { useEquityStore } from '../../../features/finance/stores/useEquityStore';

const { width } = Dimensions.get('window');

interface AcquisitionModalProps {
  visible: boolean;
  onClose: () => void;
}

const formatMoney = (value: number) => {
  return formatMoneyExact(value);
};

export const AcquisitionModal = ({ visible, onClose }: AcquisitionModalProps) => {
    useLocale();
  const navigation = useNavigation<any>();
  const { marketPrices } = useMarketStore();
  const { subsidiaries, executeAcquisition } = useCorporateFinanceStore();
  const { companyCapital } = useStatsStore();

  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [selectedTarget, setSelectedTarget] = useState<any | null>(null);

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
      Alert.alert(
        t('alert.cannotFinanceThisDeal'),
        options.map(o => `${o.method.toUpperCase()}: ${o.reason}`).join('\n\n')
      );
      return;
    }

    const describe = (o: FinancingQuote) => {
      if (o.method === 'cash') return `Cash — ${formatMoney(o.cashUsed)} from the treasury`;
      if (o.method === 'debt') return `Debt — ${formatMoney(o.annualInterest)}/yr interest`;
      return `Shares — you drop to ${o.playerOwnershipAfter.toFixed(2)}%`;
    };

    Alert.alert(
      `How do you pay for ${selectedTarget.name}?`,
      `Price ${formatMoney(q.price)} · your company is worth ${formatMoney(acquirerValuation)}\n` +
      `This deal is ${(q.relativeSize * 100).toFixed(1)}% of your size.\n\n` +
      feasible.map(o => `${describe(o)}`).join('\n'),
      [
        { text: t('action.cancel'), style: 'cancel' },
        ...feasible.map(o => ({
          text: o.method === 'cash' ? 'Pay cash' : o.method === 'debt' ? 'Borrow' : 'Issue shares',
          onPress: () => confirmDeal(q, o, hostile, acquirerValuation),
        })),
      ]
    );
  };

  const confirmDeal = (
    q: ReturnType<typeof quoteAcquisition>,
    fin: FinancingQuote,
    hostile: boolean,
    acquirerValuation: number,
  ) => {
    if (!selectedTarget) return;

    Alert.alert(
      hostile ? `Hostile bid for ${selectedTarget.name}` : `Acquire ${selectedTarget.name}`,
      `Market value        ${formatMoney(q.fairValue)}\n` +
      `Premium (${Math.round(q.premiumRatio * 100)}%)      +${formatMoney(q.premium)}\n` +
      `You pay             ${formatMoney(q.price)}\n\n` +
      `Their annual profit ${formatMoney(q.targetAnnualEbit)}\n` +
      `Integration cost    −${formatMoney(q.firstYearIntegration)}\n` +
      `Synergies (full)    +${formatMoney(q.annualSynergyAtFullRun)}\n\n` +
      `First year impact   ${q.firstYearEbitImpact >= 0 ? '+' : ''}${formatMoney(q.firstYearEbitImpact)}` +
      ` (${q.accretive ? 'accretive' : 'DILUTIVE'})\n` +
      `At full run rate    +${formatMoney(q.steadyStateEbitImpact)}\n` +
      `Payback             ${isFinite(q.paybackYears) ? q.paybackYears.toFixed(1) + ' years' : 'never at this price'}\n\n` +
      `Expected share reaction on announcement: ${q.announcementImpactPercent.toFixed(1)}%\n\n` +
      (fin.method === 'stock'
        ? `PAID IN SHARES: ${fin.sharesIssued.toLocaleString()} new shares go to their owners. ` +
          `Your ownership falls to ${fin.playerOwnershipAfter.toFixed(2)}%.\n\n`
        : fin.method === 'debt'
          ? `PAID WITH DEBT: ${formatMoney(fin.annualInterest)} of interest every year, and the debt ` +
            `sits against your valuation until it is repaid.\n\n`
          : '') +
      `The ${formatMoney(q.premium)} premium goes to their shareholders on day one and does not come back. ` +
      `Integration lands first; the benefits take about six quarters.`,
      [
        { text: t('action.walkAway'), style: 'cancel' },
        {
          text: hostile ? 'Launch hostile bid' : 'Sign the deal',
          style: hostile ? 'destructive' : 'default',
          onPress: () => {
            // TEK KAPI — finansman, anlasma kaydi, buff ve piyasa tepkisi
            // hepsi orada. Bkz. useCorporateFinanceStore.executeAcquisition
            const result = executeAcquisition({
              target: {
                id: selectedTarget.id || selectedTarget.symbol,
                name: selectedTarget.name,
                marketCap: currentValuationOf(selectedTarget),
                risk: selectedTarget.risk,
                category: selectedTarget.category,
                acquisitionBuff: selectedTarget.acquisitionBuff,
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
              const lines = vote!.votes
                .map(v => `${v.vote === 'YES' ? '✓' : '✕'}  ${v.name} — ${v.reason}`)
                .join('\n');
              Alert.alert(
                vote!.passed ? 'The board approved it' : 'The board voted it down',
                `${vote!.summary}\n\n${lines}` +
                (vote!.overrode
                  ? '\n\n⚠️ It carried on your shares alone. The board was against you, and they will remember.'
                  : ''),
              );
            }

            if (!result.success) {
              if (!votedOnThis) Alert.alert(t('alert.dealFailed'), result.message);
              return;
            }

            Alert.alert(
              t('alert.dealClosed'),
              `${selectedTarget.name} is yours.\n\n` +
              `Integration starts now and runs for four quarters. Their profit will reach you ` +
              `gradually, and synergies take about six quarters to arrive.\n\n` +
              `${q.accretive
                ? 'The deal should add to profit within the first year.'
                : 'The first year will be dilutive — that is normal, but the market will be watching.'}`
            );
            setSelectedTarget(null);
            onClose();
          },
        },
      ]
    );
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
          <Text style={styles.itemSector}>{item.category || 'Technology'}</Text>
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
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t('action.mergersAcquisitions')}</Text>
            <Text style={styles.subtitle}>{t('action.expandYourCorporateEmpire')}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>{t('action.done')}</Text>
          </TouchableOpacity>
        </View>

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
        <CrystalNavBar activeTab="Company" variant="dark" />

        {/* NEGOTIATION OVERLAY */}
        {selectedTarget && (
          <View style={styles.overlayBackdrop}>
            <View style={styles.negotiationCard}>
              <View style={styles.negHeader}>
                <Text style={styles.negTitle}>Acquire {selectedTarget.name}</Text>
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
                      <Text style={[styles.infoValue, { color: '#4CAF50' }]}>
                        {found.competitor.share.toFixed(1)}% of {found.market.category}
                      </Text>
                    </View>
                  );
                })()}

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('action.synergyBuff')}</Text>
                  <Text style={styles.buffValue}>{selectedTarget.acquisitionBuff?.label || 'None'}</Text>
                </View>
              </View>

              <View style={styles.negActions}>
                {/* Friendly Offer */}
                <TouchableOpacity
                  style={styles.optionBtn}
                  onPress={() => handleAcquire('FRIENDLY')}
                >
                  <View style={styles.optionHeader}>
                    <Text style={styles.optionTitle}>🤝 Friendly Offer</Text>
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
                    <Text style={[styles.optionTitle, styles.hostileText]}>⚔️ Hostile Takeover</Text>
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
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 20,
    paddingTop: 60, // Increased to prevent status bar overlap
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: '#222',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  closeText: {
    color: '#fff',
    fontWeight: '600',
  },
  capitalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  capitalLabel: {
    color: '#888',
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
    borderBottomColor: '#222',
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
  },
  activeTab: {
    backgroundColor: '#D4AF37', // Gold
    borderColor: '#D4AF37',
  },
  tabText: {
    color: '#888',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#000',
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
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  itemInitial: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemSector: {
    color: '#666',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  valueLabel: {
    color: '#666',
    fontSize: 11,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#444',
  },

  // Negotiation Overlay
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  negotiationCard: {
    width: '100%',
    backgroundColor: '#111',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#333',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  negHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  negTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  negSubtitle: {
    color: '#666',
    fontSize: 14,
  },
  negBody: {
    marginBottom: 24,
    gap: 12,
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    color: '#888',
  },
  infoValue: {
    color: '#fff',
    fontWeight: '700',
  },
  buffValue: {
    color: theme.colors.success,
    fontWeight: '600',
  },
  negActions: {
    gap: 12,
  },
  optionBtn: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  optionTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  optionPrice: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  optionDesc: {
    color: '#666',
    fontSize: 12,
  },
  hostileBtn: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderColor: theme.colors.danger,
  },
  hostileText: {
    color: theme.colors.danger,
  },
  hostileDesc: {
    color: '#FF6B6B',
  },
  cancelBtn: {
    marginTop: 16,
    alignItems: 'center',
    padding: 12,
  },
  cancelText: {
    color: '#666',
    fontWeight: '600',
  },

});
