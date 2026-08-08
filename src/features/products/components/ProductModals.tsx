import React, { useMemo, useState } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Alert } from 'react-native';
import { theme } from '../../../core/theme';
import ConfirmPanel from '../../../components/common/ConfirmPanel';
import { Product } from '../data/productsData';
import { useLaboratoryStore } from '../../../core/store/useLaboratoryStore';
import { useProductStore } from '../../../core/store/useProductStore';
import { useCorporateFinanceStore } from '../../finance/stores/useCorporateFinanceStore';
import { brandIndex, BRAND_INDEX_SCALE } from '../../../core/market/brand';
import { formatNumber as formatNumberShared, formatMoney, formatPercent } from '../../../core/utils';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { getMarket, marketDollarSize, marketsByValue } from '../../../core/market/productMarkets';
import {
    computeAttraction,
    computeShares,
    demandUnits,
    marketingBenchmark,
    shareOfVoice,
} from '../../../core/market/attraction';
import { maxUnitsPerQuarter, productUpgradeRP, resolveTargetUnits } from '../../../core/market/production';
import {
    CONTRACT_PARTNERS,
    availablePartners,
    contractShare,
    getPartner,
    marginComparison,
    quoteContractOrder,
} from '../../../core/market/contract';
import { getTier, utilizationVerdict, UTILIZATION_NOTES } from '../../../core/market/capacity';
import { scrapMultiplier } from '../../../core/market/workforce';
import InfoDot from '../../../components/common/InfoDot';
import MarketPositionPanel from '../../../core/market/MarketPositionPanel';
import CollapsibleSection from '../../../components/common/CollapsibleSection';
// Removed obsolete imports
// import { ... } from '../../../features/products/logic/productUpgrades';

// --- LAUNCH MODAL ---
export const ProductLaunchModal = ({ visible, product, onClose, onAnalyze, onLaunch, analysisData }: any) => {
    if (!product) return null;
    const isAnalyzed = analysisData?.id === product.id;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <Text style={styles.modalTitle}>🚀 New Product Opportunity</Text>

                    <View style={styles.header}>
                        <Text style={styles.icon}>{product.icon}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.name}>{product.name}</Text>
                            <Text style={styles.desc}>{product.description}</Text>
                        </View>
                    </View>

                    <View style={styles.statRow}>
                        <Text style={styles.label}>{t('product.unlockCostRD')}</Text>
                        <Text style={styles.valueAccent}>{product.rndCost}</Text>
                    </View>

                    {isAnalyzed ? (
                        <View style={styles.analysisBox}>
                            <Text style={styles.sectionHeader}>📊 Market Analysis</Text>
                            <View style={styles.statRow}>
                                <Text style={styles.label}>{t('product.marketDemand')}</Text>
                                <Text style={styles.value}>{product.marketDemand}%</Text>
                            </View>
                            {/* Demand Bar */}
                            <View style={styles.barBg}><View style={[styles.barFill, { width: `${product.marketDemand}%` }]} /></View>

                            <View style={styles.statRow}>
                                <Text style={styles.label}>{t('product.competition2')}</Text>
                                <Text style={[styles.value, { color: theme.colors.textPrimary }]}>{product.competition}</Text>
                            </View>
                            <View style={styles.statRow}>
                                <Text style={styles.label}>{t('product.estBaseCost')}</Text>
                                <Text style={styles.value}>${product.baseProductionCost}</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.blurBox}>
                            <Text style={styles.blurText}>??? Market Data Hidden ???</Text>
                            <Text style={styles.blurSubText}>{t('product.runAnalysisToReveal')}</Text>
                        </View>
                    )}

                    <View style={styles.actions}>
                        {!isAnalyzed ? (
                            <Pressable style={styles.btnPrimary} onPress={onAnalyze}>
                                <Text style={styles.btnText}>{t('product.performMarketAnalysis')}</Text>
                            </Pressable>
                        ) : (
                            <Pressable style={styles.btnSuccess} onPress={onLaunch}>
                                <Text style={styles.btnText}>{t('product.launchProduct')}</Text>
                            </Pressable>
                        )}
                        <Pressable style={styles.btnGhost} onPress={onClose}>
                            <Text style={styles.ghostText}>{t('product.cancel')}</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// --- DETAIL MODAL (NEW R&D UPGRADE SYSTEM) ---
// --- DETAIL MODAL (NEW R&D UPGRADE SYSTEM) ---
/**
 * Stand-in used while a product is missing, so the hooks below can run
 * unconditionally. Never rendered — the component returns null first.
 */
const EMPTY_PRODUCT: any = Object.freeze({
    id: '', name: '', category: '', status: 'retired',
    inventory: 0, revenue: 0, marketingBudget: 0, qualityLevel: 1,
    complexity: 50, sellingPrice: 0, suggestedPrice: 0, marketDemand: 50,
    productionUnits: 0, contractUnits: 0, reachIndex: 1,
});

export const ProductDetailModal = ({ visible, product: initialProduct, onClose, onUpdate, onRetire, getTip, totalCapacity }: any) => {
    // Dil degisince yeniden ciz.
    useLocale();
    // 1. Get live product from store to ensure reactivity
    const liveProduct = useProductStore((state) =>
        state.products.find((p) => p.id === initialProduct?.id)
    );

    // ----------------------------------------------------------------------
    //  NO EARLY RETURN BEFORE THE HOOKS
    // ----------------------------------------------------------------------
    //  There used to be an `if (!product) return null;` right here, with
    //  another dozen hooks below it. The moment a product was retired while
    //  its modal was open, the component bailed out early, React saw fewer
    //  hooks than on the previous render and crashed ("Rendered fewer hooks
    //  than expected").
    //
    //  Now every hook runs unconditionally against a fallback, and the bail
    //  out happens further down, just before the JSX.
    // ----------------------------------------------------------------------
    const product = liveProduct ?? initialProduct ?? EMPTY_PRODUCT;
    const productMissing = !liveProduct && !initialProduct;

    const { totalRP } = useLaboratoryStore();
    const { optimizeProductionLine, upgradeProductQuality, randomizeProductName } = useProductStore();

    const facilityTierAtMount = useStatsStore.getState().facilityTier;
    const isRetoolingAtMount = !!useStatsStore.getState().facilityBuild;

    // Uretim hedefi ADET olarak tutulur (yuzde degil).
    // Kapasite buyudugunde bu sayi yerinde kalir — bkz. core/market/production.ts
    const [productionUnits, setProductionUnits] = useState(() =>
        resolveTargetUnits(product, totalCapacity || 0, facilityTierAtMount, isRetoolingAtMount),
    );
    // Pazarlama CEYREKLIK BUTCE. Eski kayitlarin tasimasi ARTIK BURADA
    // DEGIL — store yuklenirken bir kez yapiliyor (useProductStore).
    // Burada yapildiginda her acilista yeniden hesaplaniyordu ve deger
    // kendiliginden buyuyordu.
    const [marketing, setMarketing] = useState(product.marketingBudget || 0);
    // Declared with the other hooks - this file has an early return below.
    const [panel, setPanel] = useState<null | {
        title: string; summary?: string; confirmLabel: string; tone?: 'default' | 'danger';
    }>(null);
    // ---- FASON URETIM (bkz. core/market/contract.ts) ----
    const [partnerId, setPartnerId] = useState<string>(product.contractPartnerId || '');
    const [contractUnits, setContractUnits] = useState(product.contractUnits || 0);
    const displayName = product.name;

    const processLevel = product.processLevel || 1;
    // ----------------------------------------------------------------------
    //  OWNED QUALITY vs EFFECTIVE QUALITY
    // ----------------------------------------------------------------------
    //  The engine has always clamped quality to the facility ceiling
    //  (Math.min(qualityLevel, tier.qualityCeiling)) - this screen did not.
    //  With a tier-4 plant (ceiling 3) and a level-5 product the screen
    //  projected 0.810% share while the engine delivered 0.609%. The player
    //  bought upgrades that did nothing and the screen never said so.
    //
    //  `qualityLevel` is what you OWN; `effectiveQuality` is what the plant
    //  can actually build. Anything above the ceiling is QUEUED - it is not
    //  lost, it activates the moment the facility catches up.
    // ----------------------------------------------------------------------
    const qualityLevel = product.qualityLevel || 1;
    const complexity = product.complexity || 50;

    // Cost Calculator Check
    // DENGE: eskiden `complexity * 100 * 1.5^level` idi. Karmasikligi
    // 10.000.000 olan Fusion Reactor icin seviye 1 yukseltmesi 1.5 MILYAR
    // RP ediyordu — tum tech tree'nin toplamindan fazla.
    // Artik karmasikligin KAREKOKUNE bagli: buyuk urun daha pahali ama
    // ucuncu dereceden degil.
    // TEK KAYNAK — kasanin cektigi ile birebir ayni (core/market/production.ts)
    const getUpgradeCost = (level: number) => productUpgradeRP(complexity, level);

    const processUpgradeRP = getUpgradeCost(processLevel);
    const qualityUpgradeRP = getUpgradeCost(qualityLevel);

    const canUpgradeProcess = totalRP >= processUpgradeRP;
    const canUpgradeQuality = totalRP >= qualityUpgradeRP;

    // Cost Optimization Limit Check (40% of base)
    const currentUnitCost = product.unitCost ?? product.baseProductionCost;
    const minUnitCost = Math.floor(product.baseProductionCost * 0.40);
    const isMaxEfficiency = currentUnitCost <= minUnitCost;


    const handleSave = () => {
        onUpdate(product.id, {
            // OYUNCUNUN NIYETINI kaydet, kapasiteye KIRPMA.
            //
            // Once burada `Math.min(productionUnits, maxUnits)` vardi ve
            // maxUnits her ceyrek moral/kadro/insaat ile oynadigi icin
            // ekrani her acip kaydettiginde uretim hedefin bir tik geri
            // gidiyordu. Kirpma motorun isi: hedefini korur, o ceyrek
            // neyi uretebiliyorsa onu uretir.
            productionUnits,
            marketingBudget: marketing,
            contractPartnerId: partnerId || undefined,
            contractUnits: partnerId ? contractUnits : 0,
            // Eski alan artik yazilmiyor; sifirlanarak tasima tamamlaniyor.
            marketingSpendPerUnit: 0,
        });
        onClose();
    };

    const handleProcessUpgrade = () => {
        const result = optimizeProductionLine(product.id, totalRP, (amount) => {
            useLaboratoryStore.getState().spendRP(amount);
        });
        if (!result.success) {
            setPanel({ title: t('alert.error'), summary: result.message, confirmLabel: 'OK', tone: 'danger' });
        }
    };

    const handleQualityUpgrade = () => {
        const result = upgradeProductQuality(product.id, totalRP, (amount) => {
            useLaboratoryStore.getState().spendRP(amount);
        });
        if (!result.success) {
            setPanel({ title: t('alert.error'), summary: result.message, confirmLabel: 'OK', tone: 'danger' });
        }
    };

    const handleRandomizeName = () => {
        randomizeProductName(product.id);
    };

    // Helper to format large numbers
    const formatNumber = (num: number) => {
        return formatNumberShared(num);
    };

    // ======================================================================
    //  CANLI HESAPLAR
    // ======================================================================
    //  Hepsi motorun kullandigi AYNI saf fonksiyonlardan geliyor
    //  (core/market/production.ts ve core/market/attraction.ts).
    //  Boylece ekranda gordugun sayi ile ceyrek sonunda olan sey ayni olur.
    //
    //  Onceden burada `calisan * 468.75` diye ayri bir formul vardi ve
    //  motorun urettiginin 47 KATINI gosteriyordu.
    // ======================================================================

    // totalCapacity artik CALISAN SAYISI tasiyor (bkz. useProductsLogic).
    const employeeCount = totalCapacity || 0;
    // KATEGORI markasi — motor bunu kullaniyor (catBrand). Kurumsal marka
    // yalnizca yeni bir kategoriye girerken baslangic degeri verir.
    // ----------------------------------------------------------------------
    //  POINTS vs INDEX — the scale change left this screen lying again
    // ----------------------------------------------------------------------
    //  stats.brandValue holds BRAND POINTS now (share x 43.3, so 160 is an
    //  ordinary mid-game figure). This screen was handing those points
    //  straight to computeAttraction and availablePartners, both of which
    //  were written against a 0-100 brand:
    //    - brandFactor clamps at 100, so every projection ran at maximum brand
    //    - every contract partner unlocked at once (their gates are 0/25/60)
    //
    //  `brandPoints` is what the player sees; `brandValue` is what the engine
    //  is given.
    // ----------------------------------------------------------------------
    const brandPoints = useStatsStore(state => state.brandValue);
    const brandValue = brandIndex(brandPoints);

    // Kapasite artik tesis kademesinden gelir (core/market/capacity.ts).
    const facilityTier = useStatsStore(state => state.facilityTier);
    const isRetooling = useStatsStore(state => !!state.facilityBuild);
    const tier = getTier(facilityTier);
    const effectiveQuality = Math.min(qualityLevel, tier.qualityCeiling);
    const queuedQuality = Math.max(0, qualityLevel - effectiveQuality);
    const market = getMarket(product.category);

    const maxUnits = maxUnitsPerQuarter(employeeCount, complexity, facilityTier, isRetooling);
    // Kapasite kuculdiyse (eleman cikardin) hedef otomatik kirpilir.
    const willBuild = Math.max(0, Math.min(productionUnits, maxUnits));

    // ----------------------------------------------------------------------
    //  WHAT THE LINE ORDERS vs WHAT COMES OFF IT
    // ----------------------------------------------------------------------
    //  Every tier has a yield rate and morale scales the scrap on top of it.
    //  This screen ignored both: it promised 15,000 units while the engine
    //  produced 13,500 and quietly scrapped 1,500. The report never showed
    //  the scrap line either, so those units simply vanished between the
    //  order and the invoice - "I produce a lot, it doesn't say sold and it
    //  doesn't go to stock".
    //
    //  Worse than cosmetic: 'Match demand' set the order equal to demand, so
    //  after scrap it always came up short by the scrap rate. The order now
    //  grosses up for yield, and the screen states both numbers.
    // ----------------------------------------------------------------------
    const employeeMorale = useStatsStore(state => state.employeeMorale ?? 70);
    const effectiveYield = Math.max(
        0.5,
        1 - (1 - tier.yieldRate) * scrapMultiplier(employeeMorale),
    );
    const goodUnits = Math.floor(willBuild * effectiveYield);
    const scrapUnits = willBuild - goodUnits;
    // Bar adimi: kapasitenin %5'i, en az 1
    const unitStep = Math.max(1, Math.round(maxUnits * 0.05));

    // ---- FASON URETIM ----------------------------------------------------
    //  Kapasite duvarinin etrafindan dolasmanin yolu. Kendi kapasiteni
    //  KULLANMAZ, ama birim maliyeti %30-60 daha yuksek ve fasoncunun
    //  kalite tavani senin ustune bir tavan koyar.
    const openPartners = availablePartners(brandValue);
    const chosenPartner = getPartner(partnerId);
    const contractQuote = chosenPartner
        ? quoteContractOrder(chosenPartner, contractUnits, currentUnitCost, complexity)
        : null;
    const margins = chosenPartner
        ? marginComparison(product.sellingPrice || product.suggestedPrice || 0, currentUnitCost, chosenPartner)
        : null;
    const contractStep = chosenPartner
        ? Math.max(1, Math.round(chosenPartner.maxOrder * 0.02))
        : 1000;
    const outsourcedPercent = contractShare(willBuild, contractQuote?.units || 0);

    // ---- PAZARLAMA ESIKLERI ---------------------------------------------
    // Kiyas butce: kategorinin tabani ile bu urunun gecen ceyrek cirosunun
    // %25'inin buyugu. Buyudukce esik de buyur, ayni butce az gelmeye baslar.
    const effectivePrice = product.sellingPrice || product.suggestedPrice || 1;
    // Motorun kullandigi AYNI yumusatilmis kiyas. Urunde saklandigi icin
    // ekranda gordugun esik ile ceyrek sonunda uygulanan esik ayni.
    const benchmark = market
        ? marketingBenchmark(market, product.revenue || 0, product.benchmarkSmoothed)
        : 1;
    // Marka bakim esigi: kiyasin %35'i. Altinda marka erir, ustunde birikir.
    const maintenancePoint = Math.round(benchmark * 0.35);
    // Bar tavani kiyasin 3 kati: orada ses payi ~%75, otesi bosa para.
    const marketingMax = Math.max(1, Math.round(benchmark * 3));
    const marketingStep = Math.max(500, Math.round(marketingMax * 0.05));
    const sov = shareOfVoice(marketing, benchmark);
    const isOverSaturated = marketing > benchmark * 2;

    // Bu ayarlarla beklenen pay ve talep
    const attraction = market
        ? computeAttraction(
            {
                sellingPrice: effectivePrice,
                suggestedPrice: product.suggestedPrice,
                marketingBudget: marketing,
                benchmark,
                qualityLevel: effectiveQuality,
                brandValue,
                marketDemand: product.marketDemand ?? 50,
            },
            market,
        )
        : null;

    // ======================================================================
    //  PAY PROJEKSIYONU — motorun cagrisiyla BIREBIR AYNI olmali
    // ======================================================================
    //  Burada dort fark vardi ve dordu de ekrandaki talebi OLDUGUNDAN
    //  BUYUK gosteriyordu. "Talebe esitle" dedigin adet, ceyrek sonunda
    //  satabileceginden fazla cikiyor ve fark stoga kaliyordu:
    //
    //   1) Marka: ekran KURUMSAL markayi veriyordu, motor KATEGORI
    //      markasini kullaniyor. Saglikta kazandigin itibar teknolojide
    //      isine yaramaz — ekran bunu bilmiyordu.
    //   2) Kardes urunler: ekran urunu TEK BASINA hesapliyordu. Ayni
    //      kategoride uc urunun varsa ucu de birbirinin payini yer;
    //      motor hepsini birlikte veriyor.
    //   3) Erisim endeksi: gecen ceyrek talebi karsilayamadiysan motor
    //      cekiciligini kirpar. Ekran kirpmiyordu, yani toparlanma
    //      donemindeki oyuncuya asla ulasamayacagi bir talep gosteriyordu.
    //   4) Devralinan paylar: satin aldigin sirketlerin payi paydaya
    //      giriyor.
    //
    //  Artik ekran motorun gordugu sayiyi goruyor.
    // ======================================================================
    // ----------------------------------------------------------------------
    //  SELECTORS MUST NOT BUILD NEW ARRAYS
    // ----------------------------------------------------------------------
    //  These two started life as `state => state.products.filter(...)` and
    //  `state => state.subsidiaries.map(...)`. Both allocate a NEW array on
    //  every call, so zustand's useSyncExternalStore saw a changed reference
    //  every render and re-rendered forever:
    //
    //    "The result of getSnapshot should be cached to avoid an infinite loop"
    //    "Maximum update depth exceeded"
    //
    //  Rule: a selector returns a stable reference straight out of the store.
    //  Any derivation happens afterwards, in useMemo.
    // ----------------------------------------------------------------------
    const allProducts = useProductStore(state => state.products);
    const subsidiaries = useCorporateFinanceStore(state => state.subsidiaries);

    const siblings = useMemo(
        () => allProducts.filter(p => p.status === 'active' && p.category === product.category),
        [allProducts, product.category],
    );
    const acquiredStockIds = useMemo(
        () => subsidiaries.map(sub => sub.id),
        [subsidiaries],
    );

    const projectedShare = (() => {
        if (!market || !attraction) return 0;
        const others = siblings.filter(p => p.id !== product.id);
        const attractions = [
            attraction.total * (product.reachIndex ?? 1),
            ...others.map(p => {
                const b = marketingBenchmark(market, p.revenue || 0, p.benchmarkSmoothed);
                const a = computeAttraction(
                    {
                        sellingPrice: p.sellingPrice || p.suggestedPrice,
                        suggestedPrice: p.suggestedPrice,
                        marketingBudget: p.marketingBudget || 0,
                        benchmark: b,
                        qualityLevel: Math.min(p.qualityLevel || 1, tier.qualityCeiling),
                        brandValue,
                        marketDemand: p.marketDemand ?? 50,
                    },
                    market,
                );
                return a.total * (p.reachIndex ?? 1);
            }),
        ];
        return computeShares(attractions, market, acquiredStockIds).shares[0];
    })();

    const expectedDemand = market ? demandUnits(market, projectedShare) : 0;

    // Elde stok da satilabilir
    const available = goodUnits + (product.inventory || 0);
    const expectedSales = Math.min(available, expectedDemand);
    const supplyGap = available - expectedDemand;
    const neededUnits = Math.max(0, expectedDemand - (product.inventory || 0));

    // Cubuk olcegi: uretim ve talebin buyugune gore
    const compareMax = Math.max(1, willBuild, expectedDemand);

    // Pazarlama artik sabit gider: satis adediyle carpilmaz, tumden dusulur.
    const projectedMargin =
        expectedSales * (effectivePrice - currentUnitCost) - marketing;

    // Now that every hook has run, it is safe to bail out.
    if (productMissing) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.content, { height: '85%' }]}>
                    <View style={styles.headerRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={styles.modalTitle}>{product.icon} {displayName}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            {/* RP Badge */}
                            <View style={styles.rpBadge}>
                                <Text style={styles.rpBadgeText}>{formatNumberShared(totalRP)} RP</Text>
                            </View>
                            <Pressable onPress={onClose}><Text style={styles.closeIcon}>✕</Text></Pressable>
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Insight */}
                        <View style={styles.insightBox}>
                            <Text style={styles.insightTitle}>💡 AI Insight</Text>
                            <Text style={styles.insightText}>{getTip(product)}</Text>
                        </View>

                        {/* Pazar konumu — bu urunun kategorisindeki pay ve rakipler.
                            Bkz. core/market/productMarkets.ts */}
                        <MarketPositionPanel category={product.category} />

                        {/* R&D UPGRADES SECTION - COMPACT DESIGN */}
                        {/* R&D UPGRADES SECTION - COMPACT DESIGN */}
                        <CollapsibleSection
                            title={t('product.rDUpgrades')}
                            note={t('product.spendResearchPointsToCut')}
                            info={t('product.optimizingTheProcessLowersYour')}
                            infoDetail={t('product.eachLevelCostsMoreThan')}
                            summary={`${formatNumberShared(totalRP)} RP`}
                            summaryColor={theme.colors.textPrimary}
                        >
                        <View style={styles.rdSection}>

                            {/* Optimize Process (Cost) */}
                            <View style={styles.upgradeCardCompact}>
                                <View style={styles.upgradeContentCompact}>
                                    <Text style={styles.upgradeLabel}>{t('product.optimizeProcess')}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                                        <Text style={styles.heroValue}>${currentUnitCost}</Text>
                                        <Text style={{ color: theme.colors.textPrimary, fontWeight: 'bold' }}>(-2%)</Text>
                                    </View>
                                    <Text style={styles.hint}>Lvl {processLevel} ➜ {processLevel + 1}</Text>
                                </View>
                                <Pressable
                                    style={[
                                        styles.upgradeBtnCompact,
                                        (!canUpgradeProcess || isMaxEfficiency) && styles.upgradeBtnDisabled
                                    ]}
                                    onPress={handleProcessUpgrade}
                                    disabled={!canUpgradeProcess || isMaxEfficiency}
                                >
                                    <Text style={styles.upgradeBtnTextCompact}>
                                        {isMaxEfficiency
                                            ? t('product.maxEfficiency')
                                            : `${formatNumber(processUpgradeRP)} RP`}
                                    </Text>
                                </Pressable>
                            </View>

                            {/* Improve Quality (Price) */}
                            <View style={styles.upgradeCardCompact}>
                                <View style={styles.upgradeContentCompact}>
                                    <Text style={styles.upgradeLabel}>{t('product.improveQuality')}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                                        <Text style={styles.heroValue}>${product.sellingPrice || product.suggestedPrice}</Text>
                                        <Text style={{ color: theme.colors.success, fontWeight: 'bold' }}>(+3%)</Text>
                                    </View>
                                    <Text style={styles.hint}>Lvl {qualityLevel} ➜ {qualityLevel + 1}</Text>
                                    {/* Owned but not yet buildable — queued, not lost. */}
                                    {queuedQuality > 0 && (
                                        <Text style={styles.queuedLine}>
                                            {t('product.qualityQueued', {
                                                v1: String(effectiveQuality),
                                                v2: String(qualityLevel),
                                                v3: tier.name,
                                            })}
                                        </Text>
                                    )}
                                </View>
                                <Pressable
                                    style={[
                                        styles.upgradeBtnCompact,
                                        !canUpgradeQuality && styles.upgradeBtnDisabled
                                    ]}
                                    onPress={handleQualityUpgrade}
                                    disabled={!canUpgradeQuality}
                                >
                                    <Text style={styles.upgradeBtnTextCompact}>
                                        {`${formatNumber(qualityUpgradeRP)} RP`}
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                        </CollapsibleSection>

                        {/* ══ URETIM ══
                            Soyut yuzde yerine GERCEK adet ve pazarin istedigi
                            adet yan yana. Oyuncu "az mi cok mu uretiyorum"
                            sorusunu tek bakista cevaplasin. */}
                        <View style={styles.controlGroup}>
                            <View style={styles.controlHeader}>
                                <Text style={styles.controlTitle}>{t('product.production')}</Text>
                                <InfoDot
                                    title={t('product.production')}
                                    text={t('product.yourFactoriesCanBuildA')}
                                    detail={t('product.maxForThisProduct', { v1: formatNumber(maxUnits), v2: formatNumber(employeeCount) })}
                                />
                            </View>

                            <View style={styles.sliderRow}>
                                <Pressable
                                    onPress={() => setProductionUnits(Math.max(0, productionUnits - unitStep))}
                                    style={styles.adjBtn}
                                >
                                    <Text style={styles.adjText}>−</Text>
                                </Pressable>
                                <View style={styles.controlValueBox}>
                                    <Text style={styles.controlValue}>{formatNumber(willBuild)}</Text>
                                    <Text style={styles.controlValueUnit}>units per quarter</Text>
                                </View>
                                <Pressable
                                    onPress={() =>
                                        setProductionUnits(Math.min(maxUnits, productionUnits + unitStep))
                                    }
                                    style={styles.adjBtn}
                                >
                                    <Text style={styles.adjText}>+</Text>
                                </Pressable>
                            </View>

                            {/* Bar olcegi 0 -> AZAMI KAPASITE.
                                Fabrika/eleman alip kapasiteyi buyutunce bar tavani
                                buyur ama hedefin yerinde kalir: dolu kisim kucuk
                                gorunur ve tekrar artirman gerektigini gorursun. */}
                            <View style={styles.capacityTrack}>
                                <View
                                    style={[
                                        styles.capacityFill,
                                        {
                                            width: `${maxUnits > 0 ? Math.min(100, (willBuild / maxUnits) * 100) : 0}%`,
                                            backgroundColor: supplyGap < 0 ? theme.colors.warning : theme.colors.primary,
                                        },
                                    ]}
                                />
                                {/* Talep isareti — kapasite icinde nereye denk geliyor */}
                                {expectedDemand > 0 && expectedDemand <= maxUnits && (
                                    <View
                                        style={[
                                            styles.demandMarker,
                                            { left: `${(expectedDemand / maxUnits) * 100}%` },
                                        ]}
                                    />
                                )}
                            </View>

                            {/* Sol her zaman 0 oldugu icin yazilmiyor; sagda tavan */}
                            <View style={styles.scaleRow}>
                                <Text style={styles.scaleHint}>
                                    {expectedDemand > 0 && expectedDemand <= maxUnits
                                        ? `▏${t('product.demandTick', { v1: formatNumber(expectedDemand) })}`
                                        : ' '}
                                </Text>
                                <Text style={styles.scaleMax}>{t('product.maxUnits', { v1: formatNumber(maxUnits) })}</Text>
                            </View>

                            <View style={styles.compareRow}>
                                <View>
                                    <Text style={styles.compareLabel}>{t('product.youWillBuild')}</Text>
                                    <Text style={styles.compareValue}>{formatNumber(goodUnits)}</Text>
                                    {scrapUnits > 0 && (
                                        <Text style={styles.scrapNote}>
                                            {t('product.afterScrap', {
                                                v1: formatNumber(willBuild),
                                                v2: formatNumber(scrapUnits),
                                                v3: (effectiveYield * 100).toFixed(1),
                                            })}
                                        </Text>
                                    )}
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.compareLabel}>{t('product.marketWants')}</Text>
                                    <Text style={[styles.compareValue, { color: '#FFFFFF' }]}>
                                        {formatNumber(expectedDemand)}
                                    </Text>
                                </View>
                            </View>

                            {/* Teshis satiri */}
                            {supplyGap < 0 ? (
                                <Text style={styles.warnLine}>
                                    {t('product.underSupplying', { v1: formatNumber(Math.abs(supplyGap)) })}
                                </Text>
                            ) : supplyGap > expectedDemand * 0.2 && expectedDemand > 0 ? (
                                <Text style={styles.warnLine}>
                                    {t('product.overBuilding', { v1: formatNumber(supplyGap) })}
                                </Text>
                            ) : (
                                <Text style={styles.okLine}>{t('product.supplyIsCloseToDemand')}</Text>
                            )}

                            {/* Talebe esitle */}
                            {/* Stok zaten talebi karsiliyorsa dugme 0 gosteriyordu
                                ve bozuk gibi duruyordu. Artik sebebini yaziyor. */}
                            {expectedDemand > 0 && neededUnits <= 0 && (
                                <Text style={styles.matchNote}>
                                    {t('product.enoughStock', { units: formatNumber(product.inventory || 0) })}
                                </Text>
                            )}
                            {/* -----------------------------------------------
                                KAPASITE YOKKEN BUTON "0 URET" DIYORDU
                                -----------------------------------------------
                                Tesis yenilenirken ya da kadro sifirlandiginda
                                maxUnits 0 oluyor ve Math.min(0, ihtiyac) = 0.
                                Buton bozuk gibi duruyordu. Artik sebebini
                                soyluyor: uretemiyorsun, talep yok degil.
                               ----------------------------------------------- */}
                            {expectedDemand > 0 && neededUnits > 0 && maxUnits <= 0 && (
                                <Text style={styles.matchNote}>
                                    {isRetooling ? t('product.cannotBuildRetooling') : t('product.cannotBuildNoCrew')}
                                </Text>
                            )}
                            {expectedDemand > 0 && neededUnits > 0 && maxUnits > 0 && (
                                <Pressable
                                    style={styles.matchBtn}
                                    onPress={() => setProductionUnits(Math.min(maxUnits, Math.ceil(neededUnits / effectiveYield)))}
                                >
                                    <Text style={styles.matchBtnText}>
                                        {neededUnits > maxUnits
                                            ? t('product.matchDemandCapped', { units: formatNumber(maxUnits) })
                                            : t('product.matchDemand', { units: formatNumber(Math.ceil(neededUnits / effectiveYield)) })}
                                    </Text>
                                </Pressable>
                            )}

                            {maxUnits < expectedDemand && (
                                <Text style={styles.capLine}>
                                    {t('product.capacityCeiling', {
                                        v1: formatNumber(maxUnits),
                                        v2: tier.name,
                                        v3: formatNumber(tier.capacity),
                                        v4: formatNumber(tier.crew),
                                    })}
                                </Text>
                            )}

                            {isRetooling && (
                                <Text style={styles.warnLine}>
                                    {t('product.retoolingWarn')}
                                </Text>
                            )}

                            {qualityLevel > tier.qualityCeiling && (
                                <Text style={styles.warnLine}>
                                    {t('product.qualityCappedByTier', {
                                        v1: qualityLevel,
                                        v2: tier.name,
                                        v3: tier.qualityCeiling,
                                    })}
                                </Text>
                            )}
                        </View>

                        {/* ══ BU URUN NEDEN BU KADAR KAZANIYOR ══
                            Oyuncunun en cok sordugu sey: "Smart Speaker 200
                            bin, Auto-Drone 2 milyon kazandiriyor, neden?"
                            Cevap adet degil DOLAR — kategorinin buyuklugu ve
                            urunun kapasite tuketimi. */}
                        {market && (
                            <CollapsibleSection
                                title={t('product.whyThisProductEarnsWhat')}
                                note={t('product.categorySizeCapacityCostAnd')}
                                info={t('product.twoProductsCanHaveThe')}
                                summary={market.category}
                            >
                                <View style={styles.whyRow}>
                                    <Text style={styles.whyLabel}>{t('product.categoryMarket')}</Text>
                                    <Text style={styles.whyValue}>
                                        {formatNumber(market.sizeUnitsPerQuarter)} units ·{' '}
                                        {formatMoney(marketDollarSize(market))} per quarter
                                    </Text>
                                </View>
                                <View style={styles.whyRow}>
                                    <Text style={styles.whyLabel}>{t('product.yourShareHere')}</Text>
                                    <Text style={styles.whyValue}>{formatPercent(projectedShare)}</Text>
                                </View>
                                <View style={styles.whyRow}>
                                    <Text style={styles.whyLabel}>{t('product.capacityPerUnit')}</Text>
                                    <Text style={styles.whyValue}>
                                        {(complexity / 50).toFixed(2)} standard units
                                    </Text>
                                </View>
                                <View style={styles.whyRow}>
                                    <Text style={styles.whyLabel}>{t('product.revenuePerCapacityUnit')}</Text>
                                    <Text style={styles.whyValue}>
                                        {formatMoney(Math.round(effectivePrice / Math.max(0.01, complexity / 50)))}
                                    </Text>
                                </View>

                                <Text style={styles.whyNote}>
                                    Every product returns roughly the same revenue per unit of capacity —
                                    a cheap speaker uses very little of the line, an industrial arm uses a
                                    lot. What actually decides your earnings is which category you are in:
                                    the same share is worth far more in a category with a bigger dollar
                                    market. That is why moving up the tech tree matters more than
                                    optimising a small product.
                                </Text>

                                <View style={styles.whyTable}>
                                    {marketsByValue().map(({ market: m, dollarSize }) => (
                                        <View
                                            key={m.category}
                                            style={[
                                                styles.whyTableRow,
                                                m.category === market.category && styles.whyTableRowActive,
                                            ]}
                                        >
                                            <Text style={styles.whyTableName}>{m.category}</Text>
                                            <Text style={styles.whyTableValue}>
                                                {formatMoney(dollarSize)}/qtr
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </CollapsibleSection>
                        )}

                        {/* ══ FASON URETIM ══
                            Make-or-buy karari. Kendi hattin ucuz ama
                            yavas; fason hizli ama pahali. */}
                        <View style={styles.controlGroup}>
                            <View style={styles.controlHeader}>
                                <Text style={styles.controlTitle}>{t('product.contractMfg')}</Text>
                            </View>
                            <Text style={styles.contractHint}>
                                {t('product.contractHint')}
                            </Text>

                            <View style={styles.partnerRow}>
                                <Pressable
                                    style={[styles.partnerChip, !partnerId && styles.partnerChipActive]}
                                    onPress={() => { setPartnerId(''); setContractUnits(0); }}
                                >
                                    <Text style={[styles.partnerName, !partnerId && styles.partnerNameActive]}>
                                        {t('product.inHouseOnly')}
                                    </Text>
                                </Pressable>
                                {openPartners.map(pt => (
                                    <Pressable
                                        key={pt.id}
                                        style={[styles.partnerChip, partnerId === pt.id && styles.partnerChipActive]}
                                        onPress={() => setPartnerId(pt.id)}
                                    >
                                        <Text style={[styles.partnerName, partnerId === pt.id && styles.partnerNameActive]}>
                                            {pt.name}
                                        </Text>
                                        <Text style={styles.partnerMeta}>
                                            ×{pt.costMultiplier.toFixed(2)} cost · quality ≤{pt.qualityCeiling}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            {CONTRACT_PARTNERS.filter(pt => brandValue < pt.minBrand).map(pt => (
                                <Text key={pt.id} style={styles.partnerLocked}>
                                    🔒 {pt.name} — needs brand {Math.round(pt.minBrand * BRAND_INDEX_SCALE)} (you have {Math.round(brandPoints)})
                                </Text>
                            ))}

                            {!!chosenPartner && (
                                <>
                                    <Text style={styles.contractDesc}>{chosenPartner.description}</Text>

                                    <View style={styles.contractStepper}>
                                        <Pressable
                                            style={styles.stepBtn}
                                            onPress={() => setContractUnits(Math.max(0, contractUnits - contractStep))}
                                        >
                                            <Text style={styles.stepBtnText}>−</Text>
                                        </Pressable>
                                        <View style={styles.contractValueBox}>
                                            <Text style={styles.contractValue}>
                                                {formatNumber(contractUnits)}
                                            </Text>
                                            <Text style={styles.contractUnitLabel}>units / quarter</Text>
                                        </View>
                                        <Pressable
                                            style={styles.stepBtn}
                                            onPress={() =>
                                                setContractUnits(
                                                    Math.min(chosenPartner.maxOrder, contractUnits + contractStep),
                                                )
                                            }
                                        >
                                            <Text style={styles.stepBtnText}>+</Text>
                                        </Pressable>
                                    </View>

                                    {!!contractQuote?.note && (
                                        <Text style={styles.contractWarn}>⚠️ {contractQuote.note}</Text>
                                    )}

                                    {!!margins && (
                                        <View style={styles.contractCompare}>
                                            <View style={styles.cmRow}>
                                                <Text style={styles.cmLabel}>{t('product.marginInHouse')}</Text>
                                                <Text style={styles.compareGood}>
                                                    {formatMoney(margins.ownMargin)} / unit
                                                </Text>
                                            </View>
                                            <View style={styles.cmRow}>
                                                <Text style={styles.cmLabel}>{t('product.marginOutsourced')}</Text>
                                                <Text style={styles.compareBad}>
                                                    {formatMoney(margins.contractMargin)} / unit
                                                </Text>
                                            </View>
                                            <View style={styles.cmRow}>
                                                <Text style={styles.cmLabel}>{t('product.orderCosts')}</Text>
                                                <Text style={styles.cmValue}>
                                                    {formatMoney(contractQuote?.cost || 0)}
                                                    {!product.contractSetupPaid &&
                                                        ` + ${formatMoney(chosenPartner.setupCost)} setup`}
                                                </Text>
                                            </View>
                                            <View style={styles.cmRow}>
                                                <Text style={styles.cmLabel}>{t('product.outsourcedShare')}</Text>
                                                <Text style={styles.cmValue}>
                                                    {outsourcedPercent.toFixed(0)}% of your units
                                                </Text>
                                            </View>
                                        </View>
                                    )}

                                    {qualityLevel > chosenPartner.qualityCeiling && (
                                        <Text style={styles.contractWarn}>
                                            ⚠️ {t('product.qualityCapWarn', {
                                                quality: qualityLevel,
                                                ceiling: chosenPartner.qualityCeiling,
                                            })}
                                        </Text>
                                    )}
                                </>
                            )}
                        </View>

                        {/* ══ PAZARLAMA ══
                            Artik CEYREKLIK BUTCE. Barda iki isaret var:
                            bakim esigi (markanin yerinde kaldigi nokta) ve
                            kiyas butce (ses payinin %50 oldugu nokta). */}
                        <View style={styles.controlGroup}>
                            <View style={styles.controlHeader}>
                                <Text style={styles.controlTitle}>{t('product.marketingBudget')}</Text>
                                <InfoDot
                                    title={t('product.marketingBudget')}
                                    text="A fixed amount you spend every quarter, whether you sell anything or not. What matters is not the number itself but how it compares to what the market spends. Match the benchmark and you own about half the attention in your category."
                                    detail={t('product.benchmarkForThisProductV1', { v1: formatMoney(benchmark), v2: formatMoney(maintenancePoint) })}
                                />
                            </View>

                            <View style={styles.sliderRow}>
                                <Pressable
                                    onPress={() => setMarketing(Math.max(0, marketing - marketingStep))}
                                    style={styles.adjBtn}
                                >
                                    <Text style={styles.adjText}>−</Text>
                                </Pressable>
                                <View style={styles.controlValueBox}>
                                    <Text style={styles.controlValue}>{formatMoney(marketing)}</Text>
                                    <Text style={styles.controlValueUnit}>per quarter</Text>
                                </View>
                                <Pressable
                                    onPress={() =>
                                        setMarketing(Math.min(marketingMax, marketing + marketingStep))
                                    }
                                    style={styles.adjBtn}
                                >
                                    <Text style={styles.adjText}>+</Text>
                                </Pressable>
                            </View>

                            {/* Bakim ve kiyas isaretli bar */}
                            <View style={styles.mktTrack}>
                                {/* Bakimin altinda kalan bolge: marka erir */}
                                <View
                                    style={[
                                        styles.mktDeadZone,
                                        { left: 0, right: `${100 - (maintenancePoint / marketingMax) * 100}%` },
                                    ]}
                                />
                                <View
                                    style={[
                                        styles.mktFill,
                                        {
                                            width: `${Math.min(100, (marketing / marketingMax) * 100)}%`,
                                            backgroundColor:
                                                marketing < maintenancePoint
                                                    ? theme.colors.warning
                                                    : theme.colors.primary,
                                        },
                                    ]}
                                />
                                {/* Bakim esigi */}
                                <View
                                    style={[
                                        styles.mktMarker,
                                        { left: `${(maintenancePoint / marketingMax) * 100}%` },
                                    ]}
                                />
                                {/* Kiyas butce */}
                                <View
                                    style={[
                                        styles.mktMarker,
                                        styles.mktMarkerBenchmark,
                                        { left: `${(benchmark / marketingMax) * 100}%` },
                                    ]}
                                />
                            </View>
                            <Text style={styles.mktScale}>
                                {t('product.marketingScale', {
                                    v1: formatMoney(maintenancePoint),
                                    v2: formatMoney(benchmark),
                                    v3: formatMoney(marketingMax),
                                })}
                            </Text>

                            <Text style={styles.costLine}>
                                {t('product.shareOfVoice', { v1: formatPercent(sov * 100) })}
                            </Text>

                            {marketing === 0 ? (
                                <Text style={styles.warnLine}>
                                    {t('product.noMarketingWarn')}
                                </Text>
                            ) : marketing < maintenancePoint ? (
                                <Text style={styles.warnLine}>
                                    {t('product.belowMaintenance', { v1: formatMoney(maintenancePoint - marketing) })}
                                </Text>
                            ) : isOverSaturated ? (
                                <Text style={styles.okLine}>
                                    {t('product.heavySpend')}
                                </Text>
                            ) : (
                                <Text style={styles.okLine}>
                                    {t('product.aboveMaintenance')}
                                </Text>
                            )}

                            <Text style={styles.costLine}>{t('product.chargedEveryQuarterRegardlessOf', { v1: formatMoney(marketing) })}</Text>
                        </View>

                        {/* ══ CANLI ONIZLEME ══
                            Kaydetmeden once sonucunu gor. computeAttraction
                            saf fonksiyon oldugu icin burada da cagrilabiliyor. */}
                        {market && (
                            <View style={styles.previewBox}>
                                <View style={styles.controlHeader}>
                                    <Text style={styles.previewTitle}>{t('product.projectedResult')}</Text>
                                    <InfoDot
                                        title={t('product.projectedResult')}
                                        text={t('product.whatTheseSettingsAreExpected')}
                                        detail={t('product.estimateNote')}
                                    />
                                </View>
                                <View style={styles.previewRow}>
                                    <View style={styles.previewCell}>
                                        <Text style={styles.previewLabel}>{t('product.marketShare')}</Text>
                                        <Text style={styles.previewValue}>
                                            {projectedShare < 1
                                                ? `${projectedShare.toFixed(3)}%`
                                                : `${projectedShare.toFixed(2)}%`}
                                        </Text>
                                    </View>
                                    <View style={styles.previewCell}>
                                        <Text style={styles.previewLabel}>{t('product.unitsSold')}</Text>
                                        <Text style={[styles.previewValue, { color: '#FFFFFF' }]}>
                                            {formatNumber(expectedSales)}
                                        </Text>
                                    </View>
                                    <View style={styles.previewCell}>
                                        <Text style={styles.previewLabel}>{t('product.grossMargin')}</Text>
                                        <Text
                                            style={[
                                                styles.previewValue,
                                                { color: projectedMargin >= 0 ? theme.colors.positive : theme.colors.negative },
                                            ]}
                                        >
                                            {formatMoney(projectedMargin)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Inventory Status - NEW */}
                        <View style={styles.controlGroup}>
                            <Text style={styles.controlTitle}>📦 Inventory Status</Text>
                            <Text style={styles.heroValue}>{formatNumber(product.inventory || 0)} Units</Text>
                            <Text style={styles.hint}>{t('product.estStorageCostV1Quarter', { v1: formatNumber((product.inventory || 0) * 5) })}</Text>
                        </View>

                        <Pressable style={styles.btnPrimary} onPress={handleSave}>
                            <Text style={styles.btnText}>{t('product.saveChanges')}</Text>
                        </Pressable>

                        {/* Change Product Name Button */}
                        <Pressable style={styles.btnOutline} onPress={handleRandomizeName}>
                            <Text style={styles.btnOutlineText}>🎲 Change Product Name</Text>
                        </Pressable>

                        <Pressable style={styles.btnDanger} onPress={() => onRetire(product.id)}>
                            <Text style={[styles.btnText, styles.btnTextOnDark]}>{t('product.retireProduct')}</Text>
                        </Pressable>
                    </ScrollView>
                </View>
            </View>

            <ConfirmPanel
                visible={!!panel}
                title={panel?.title || ''}
                summary={panel?.summary}
                tone={panel?.tone}
                confirmLabel={panel?.confirmLabel || 'OK'}
                onCancel={() => setPanel(null)}
            />
        </Modal>
    );
};

const styles = StyleSheet.create({
    // --- Yeni uretim / pazarlama kontrolleri ---
    controlHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    controlValueBox: { alignItems: 'center', flex: 1 },
    controlValueUnit: { color: '#FFFFFF', fontSize: 9.5, marginTop: 2 },

    capacityTrack: {
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginTop: 14,
        justifyContent: 'center',
    },
    capacityFill: { height: 10, borderRadius: 5 },
    scaleRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    scaleHint: { color: '#FFFFFF', fontSize: 9.5 },
    scaleMax: { color: 'rgba(255,255,255,0.48)', fontSize: 9.5, fontWeight: '700' },

    compareTrack: {
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginTop: 14,
        overflow: 'visible',
        justifyContent: 'center',
    },
    compareFill: { height: 8, borderRadius: 4 },
    demandMarker: {
        position: 'absolute',
        width: 2,
        height: 16,
        backgroundColor: '#CFD0D2',
        borderRadius: 1,
    },
    compareRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    compareLabel: { color: '#FFFFFF', fontSize: 9.5, letterSpacing: 0.5 },
    compareValue: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', marginTop: 2 },

    warnLine: { color: theme.colors.warning, fontSize: 11, lineHeight: 16, marginTop: 10 },
    okLine: { color: '#FFFFFF', fontSize: 11, marginTop: 10 },
    capLine: { color: theme.colors.warning, fontSize: 10.5, lineHeight: 15, marginTop: 8 },
    costLine: { color: 'rgba(255,255,255,0.48)', fontSize: 10.5, marginTop: 10 },

    matchBtn: {
        marginTop: 12,
        borderWidth: 1,
        borderColor: 'rgba(207,208,210,0.4)',
        backgroundColor: 'rgba(207,208,210,0.1)',
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
    },
    matchBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

    mktTrack: {
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginTop: 14,
        overflow: 'hidden',
        justifyContent: 'center',
    },
    mktDeadZone: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: 'rgba(5,168,246,0.12)',
    },
    mktFill: { height: 8, borderRadius: 4 },
    mktMarker: { position: 'absolute', width: 2, height: 14, backgroundColor: '#434B50' },
    // Kiyas butce isareti — bakim esiginden ayirt edilsin diye farkli renk
    mktMarkerBenchmark: { backgroundColor: '#CFD0D2', width: 2, height: 14 },
    mktScale: { color: '#FFFFFF', fontSize: 9.5, marginTop: 6 },

    whyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
    whyLabel: { color: 'rgba(255,255,255,0.48)', fontSize: 11.5 },
    whyValue: { color: theme.colors.textPrimary, fontSize: 11.5, fontWeight: '700' },
    whyNote: { color: 'rgba(255,255,255,0.48)', fontSize: 11, lineHeight: 16, marginTop: 10 },
    whyTable: { marginTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', paddingTop: 8 },
    whyTableRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingVertical: 5, paddingHorizontal: 8, borderRadius: 6,
    },
    whyTableRowActive: { backgroundColor: 'rgba(207,208,210,0.12)' },
    whyTableName: { color: 'rgba(255,255,255,0.48)', fontSize: 11 },
    whyTableValue: { color: 'rgba(255,255,255,0.48)', fontSize: 11, fontWeight: '700' },

    previewBox: {
        backgroundColor: 'rgba(207,208,210,0.07)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(207,208,210,0.22)',
        padding: 14,
        marginBottom: 16,
    },
    previewTitle: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
    previewRow: { flexDirection: 'row', marginTop: 6 },
    previewCell: { flex: 1, alignItems: 'center' },
    previewLabel: { color: '#FFFFFF', fontSize: 9.5 },
    previewValue: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginTop: 3 },

    overlay: { flex: 1, backgroundColor: 'rgba(28,36,44,0.9)', justifyContent: 'center', padding: 16 },
    content: { backgroundColor: '#434B50', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    modalTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
    header: { flexDirection: 'row', gap: 16, marginBottom: 20 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    icon: { fontSize: 42 },
    name: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
    desc: { fontSize: 13, color: 'rgba(255,255,255,0.48)' },
    statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    label: { color: 'rgba(255,255,255,0.48)', fontSize: 14 },
    value: { color: '#FFFFFF', fontWeight: '700' },
    valueAccent: { color: theme.colors.textPrimary, fontWeight: '800', fontSize: 16 },
    analysisBox: { backgroundColor: '#434B50', padding: 12, borderRadius: 8, marginBottom: 20 },
    sectionHeader: { color: '#FFFFFF', fontWeight: '700', marginBottom: 12 },
    barBg: { height: 6, backgroundColor: '#434B50', borderRadius: 3, marginBottom: 12 },
    barFill: { height: '100%', backgroundColor: theme.colors.accent, borderRadius: 3 },
    blurBox: { height: 100, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginBottom: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    blurText: { color: '#FFFFFF', fontWeight: '700' },
    blurSubText: { color: 'rgba(255,255,255,0.48)', fontSize: 12 },
    actions: { gap: 10 },
    btnPrimary: { backgroundColor: theme.colors.accent, padding: 14, borderRadius: 10, alignItems: 'center' },
    btnSuccess: { backgroundColor: theme.colors.accent, padding: 14, borderRadius: 10, alignItems: 'center' },
    btnDanger: { backgroundColor: theme.colors.destructive, padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
    btnOutline: {
        backgroundColor: 'transparent',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        marginTop: 12
    },
    btnGhost: { padding: 14, alignItems: 'center' },
    // The default suits btnPrimary, which is the bright blue: light fill, so
    // black. btnDanger is the deep blue and overrides this at its call site.
    btnText: { color: theme.colors.onLight, fontWeight: '700', fontSize: 16 },
    btnTextOnDark: { color: theme.colors.textPrimary },
    btnOutlineText: { color: 'rgba(255,255,255,0.48)', fontWeight: '700', fontSize: 16 },
    ghostText: { color: 'rgba(255,255,255,0.48)', fontWeight: '600' },
    closeIcon: { fontSize: 24, color: 'rgba(255,255,255,0.48)' },
    rpBadge: {
        backgroundColor: theme.colors.accent,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    rpBadgeText: {
        color: theme.colors.onLight,
        fontSize: 14,
        fontWeight: '800',
    },
    progressBarContainer: {
        marginVertical: 12,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#434B50',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: theme.colors.accent,
        borderRadius: 4,
    },
    progressValue: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },
    diceBtn: { padding: 4 },
    diceIcon: { fontSize: 20 },
    insightBox: { backgroundColor: theme.colors.cardSoft, padding: 12, borderRadius: 8, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: theme.colors.accent },
    insightTitle: { color: theme.colors.textPrimary, fontWeight: '700', marginBottom: 4 },
    insightText: { color: '#FFFFFF', fontSize: 13 },
    rdSection: { marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 12 },
    matchNote: { fontSize: 11, color: 'rgba(255,255,255,0.48)', lineHeight: 16, marginTop: 8 },
    contractHint: { fontSize: 11, color: 'rgba(255,255,255,0.48)', marginBottom: 10 },
    contractDesc: { fontSize: 11, color: 'rgba(255,255,255,0.48)', fontStyle: 'italic', marginTop: 10, marginBottom: 4 },
    partnerRow: { gap: 8 },
    partnerChip: {
        backgroundColor: '#323A40', borderRadius: 10, padding: 10,
        borderWidth: 1, borderColor: 'transparent',
    },
    partnerChipActive: { borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#434B50' },
    partnerName: { fontSize: 13, color: 'rgba(255,255,255,0.48)', fontWeight: '700' },
    partnerNameActive: { color: '#FFFFFF' },
    partnerMeta: { fontSize: 10, color: 'rgba(255,255,255,0.48)', marginTop: 2 },
    partnerLocked: { fontSize: 10, color: 'rgba(255,255,255,0.48)', marginTop: 6 },
    contractStepper: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
    contractValueBox: { flex: 1, alignItems: 'center' },
    contractValue: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
    contractUnitLabel: { fontSize: 10, color: 'rgba(255,255,255,0.48)' },
    stepBtn: {
        width: 44, height: 44, borderRadius: 10, backgroundColor: '#323A40',
        alignItems: 'center', justifyContent: 'center',
    },
    stepBtnText: { fontSize: 22, color: theme.colors.textPrimary, fontWeight: '800' },
    contractCompare: { backgroundColor: '#323A40', borderRadius: 10, padding: 12, marginTop: 12, gap: 8 },
    cmRow: { flexDirection: 'row', justifyContent: 'space-between' },
    cmLabel: { fontSize: 12, color: 'rgba(255,255,255,0.48)' },
    cmValue: { fontSize: 12, color: '#FFFFFF', fontWeight: '700' },
    compareGood: { fontSize: 12, color: '#FFFFFF', fontWeight: '700' },
    compareBad: { fontSize: 12, color: theme.colors.warning, fontWeight: '700' },
    contractWarn: { fontSize: 11, color: theme.colors.warning, marginTop: 8, fontWeight: '600' },

    // COMPACT UPGRADE CARD STYLES
    upgradeCardCompact: {
        backgroundColor: '#434B50',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    upgradeContentCompact: {
        flex: 1,
        alignItems: 'center'
    },
    upgradeLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.48)',
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    heroValue: {
        fontSize: 36,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -1
    },
    upgradeBtnCompact: {
        backgroundColor: theme.colors.accent,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 140
    },
    upgradeBtnTextCompact: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 13,
        textAlign: 'center'
    },

    // OLD STYLES (keeping for compatibility)
    upgradeCard: { backgroundColor: 'rgba(255,255,255,0.06)', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    upgradeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    upgradeTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    upgradeLevel: { fontSize: 12, color: theme.colors.textPrimary, fontWeight: '600' },
    upgradeStats: { marginBottom: 12 },
    statItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    statLabel: { color: 'rgba(255,255,255,0.48)', fontSize: 13 },
    statValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    rpCost: { color: theme.colors.textPrimary, fontSize: 13, fontWeight: '700' },
    upgradeBtn: { backgroundColor: theme.colors.accent, padding: 12, borderRadius: 8, alignItems: 'center' },
    upgradeBtnDisabled: { backgroundColor: '#666E70', opacity: 0.5 },
    upgradeBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

    controlGroup: { marginBottom: 20 },
    controlTitle: { color: '#FFFFFF', fontWeight: '600', marginBottom: 8 },
    controlValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
    sliderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#434B50', padding: 8, borderRadius: 8 },
    adjBtn: { width: 36, height: 36, backgroundColor: '#666E70', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    adjText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
    scrapNote: { fontSize: 9, color: theme.colors.warning, marginTop: 2, lineHeight: 13 },
    queuedLine: { fontSize: 10, color: theme.colors.textMuted, marginTop: 3, lineHeight: 14 },
    hint: { fontSize: 11, color: '#FFFFFF', marginTop: 4, textAlign: 'right' },
    realStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    realStatsText: { color: 'rgba(255,255,255,0.48)', fontSize: 12, fontWeight: '600' },
});