import React from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, ScrollView, Pressable, type ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../../core/theme';
import { useProductsLogic } from '../logic/useProductsLogic';
import { ProductLaunchModal, ProductDetailModal } from '../components/ProductModals';
import MarketPositionPanel from '../../../core/market/MarketPositionPanel';
import { formatMoney, formatNumber } from '../../../core/utils';
import ScreenHeader from '../../../components/common/ScreenHeader';
import TutorialTarget from '../../../components/tutorial/TutorialTarget';
import InfoDot from '../../../components/common/InfoDot';

/**
 * The first product card, and only the first, is what the tutorial points at.
 *
 * A component rather than a ternary at the call site so the card markup is
 * written once - two copies of it would be two places to change a price
 * format and one place to forget.
 */
const Wrap = ({ target, style, children }: {
    target: boolean; style: ViewStyle; children: React.ReactNode;
}) => (target
    ? <TutorialTarget tutorialKey="products" style={style}>{children}</TutorialTarget>
    : <View style={style}>{children}</View>);

const ProductsScreen = () => {
    useLocale();
  const navigation = useNavigation<any>();
  const {
    activeProducts,
    lockedProducts,
    selectedProduct,
    analysisData,
    maxCapacityUnits, // Destructured here
    actions
  } = useProductsLogic();

  const handleHomePress = () => {
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t('product.productLines')}
        right={
          <InfoDot
            title={t('tactic.productsTitle')}
            text={t('tactic.productsText')}
            detail={t('tactic.productsDetail')}
          />
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ACTIVE PRODUCTS */}
        <Text style={styles.sectionTitle}>{t('product.activeProductsV1', { v1: activeProducts.length })}</Text>
        <View style={styles.activeList}>
          {activeProducts.map((prod, i) => (
            // ------------------------------------------------------------------
            //  THE FIRST CARD IS WHAT THE TUTORIAL MEANS BY "products", HERE
            // ------------------------------------------------------------------
            //  Same key the department tile on My Company uses, deliberately.
            //  A target publishes its position only while its own screen has
            //  focus, so one lock lights the tile that gets you here and then
            //  the card you actually have to press once you have arrived -
            //  which is the control the instruction is about.
            //
            //  Before this the step went dark on arrival, and worse: the rect
            //  measured on My Company survived the push and put the hole over
            //  the Discover New Tech card, so the only pressable thing on the
            //  screen was the one control that could not clear the step.
            //
            //  The wrapper carries the card's own width. A plain View here
            //  defaults to auto and collapses the two-column layout to one.
            // ------------------------------------------------------------------
            //  Only the FIRST card is a target. Wrapping all of them would
            //  publish a rect for every product that no lock ever names, and
            //  a store full of coordinates nobody reads is how the last bug
            //  in this file started.
            <Wrap key={prod.id} target={i === 0} style={styles.activeCardWrap}>
            <Pressable style={styles.activeCardFill} onPress={() => actions.openDetailModal(prod)}>
              <View style={styles.activeHeader}>
                <Text style={styles.activeIcon}>{prod.icon}</Text>
                <View style={styles.statusBadge}><Text style={styles.statusText}>{t('product.active')}</Text></View>
              </View>
              <Text style={styles.activeName}>{prod.name}</Text>
              <Text style={styles.activeProfit}>{t('product.prodV1', { v1: formatNumber(prod.productionUnits ?? 0) })}</Text>
              {/* Kategorisindeki pazar payi — son ceyregin gercek satisindan.
                  Bkz. core/market/useMarketPosition.ts */}
              <MarketPositionPanel category={prod.category} compact />
              <Text style={styles.activePrice}>{formatMoney(prod.sellingPrice)}</Text>
            </Pressable>
            </Wrap>
          ))}
          {/* Discover New Tech Card */}
          <Pressable
            style={[styles.activeCard, { borderStyle: 'dashed', backgroundColor: 'transparent', borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }]}
            onPress={() => navigation.navigate('TechTree' as never)}
          >
            <Text style={{ fontSize: 30 }}>⚛️</Text>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: theme.colors.textPrimary, fontWeight: '700', fontSize: 13, textAlign: 'center' }}>{t('product.discoverNewTech')}</Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 10, marginTop: 4 }}>{t('product.goToRDLab')}</Text>
            </View>
          </Pressable>

          {activeProducts.length === 0 && <Text style={styles.emptyText}>{t('product.noActiveProductsYetStart')}</Text>}
        </View>

        {/* LOCKED PRODUCTS REMOVED AS REQUESTED */}
      </ScrollView>

      {/* Persistent Bottom Bar */}
      {/* MODALS */}
      {selectedProduct?.status === 'locked' && (
        <ProductLaunchModal
          visible={!!selectedProduct}
          product={selectedProduct}
          onClose={actions.closeModal}
          onAnalyze={actions.performMarketAnalysis}
          onLaunch={actions.launchProduct}
          analysisData={analysisData}
        />
      )}

      {selectedProduct?.status === 'active' && (
        <ProductDetailModal
          visible={!!selectedProduct}
          product={selectedProduct}
          totalCapacity={maxCapacityUnits} // Passed dynamically
          onClose={actions.closeModal}
          onUpdate={actions.updateProductSettings}
          onRetire={actions.retireProduct}
          getTip={actions.getInsightTip}
        />
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  content: { paddingBottom: 80 }, // Adjusted for BottomStatsBar
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginLeft: 20, marginBottom: 16, marginTop: 20 },
  activeList: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  /** The tutorial wrapper takes the card's width so the grid keeps two columns. */
  activeCardWrap: { width: '48%', minWidth: 150 },
  /** The card itself then fills the wrapper rather than sizing itself. */
  activeCardFill: {
    width: '100%',
    height: 160,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeCard: {
    width: '48%', // Approx 2 columns accounting for gap. Or calculation. 
    // gap: 12 -> 20 padding left + 20 right = 40. Gap 12. 
    // Width = (100% - 12) / 2 = ~48% is safe.
    minWidth: 150,
    height: 160,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  activeIcon: { fontSize: 32 },
  statusBadge: { backgroundColor: 'rgba(207,208,210,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusText: { color: theme.colors.textPrimary, fontSize: 8, fontWeight: 'bold' },
  activeName: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  activeProfit: { color: 'rgba(255,255,255,0.48)', fontSize: 12 },
  activePrice: { color: theme.colors.textPrimary, fontWeight: '800', fontSize: 16 },
  emptyText: { color: '#FFFFFF', fontStyle: 'italic', marginLeft: 20 },
  lockedList: { paddingHorizontal: 20, gap: 12 },
  lockedCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#434B50', padding: 16, borderRadius: 12, opacity: 0.8 },
  iconBox: { width: 48, height: 48, backgroundColor: '#434B50', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  lockedIcon: { fontSize: 24 },
  infoBox: { flex: 1 },
  lockedName: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  lockedCost: { color: theme.colors.textPrimary, fontSize: 13, fontWeight: '600', marginTop: 2 },
  arrow: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
});

export default ProductsScreen;