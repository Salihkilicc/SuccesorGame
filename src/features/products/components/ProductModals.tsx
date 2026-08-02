import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Alert } from 'react-native';
import { theme } from '../../../core/theme';
import { Product } from '../data/productsData';
import { useLaboratoryStore } from '../../../core/store/useLaboratoryStore';
import { useProductStore } from '../../../core/store/useProductStore';
import { formatNumber as formatNumberShared, formatMoney, formatPercent } from '../../../core/utils';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { getMarket } from '../../../core/market/productMarkets';
import {
    computeAttraction,
    computeShares,
    demandUnits,
    marketingBenchmark,
    shareOfVoice,
} from '../../../core/market/attraction';
import { maxUnitsPerQuarter, resolveTargetUnits } from '../../../core/market/production';
import { getTier, utilizationVerdict, UTILIZATION_NOTES } from '../../../core/market/capacity';
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
                        <Text style={styles.label}>Unlock Cost (R&D)</Text>
                        <Text style={styles.valueAccent}>{product.rndCost}</Text>
                    </View>

                    {isAnalyzed ? (
                        <View style={styles.analysisBox}>
                            <Text style={styles.sectionHeader}>📊 Market Analysis</Text>
                            <View style={styles.statRow}>
                                <Text style={styles.label}>Market Demand</Text>
                                <Text style={styles.value}>{product.marketDemand}%</Text>
                            </View>
                            {/* Demand Bar */}
                            <View style={styles.barBg}><View style={[styles.barFill, { width: `${product.marketDemand}%` }]} /></View>

                            <View style={styles.statRow}>
                                <Text style={styles.label}>Competition</Text>
                                <Text style={[styles.value, { color: theme.colors.warning }]}>{product.competition}</Text>
                            </View>
                            <View style={styles.statRow}>
                                <Text style={styles.label}>Est. Base Cost</Text>
                                <Text style={styles.value}>${product.baseProductionCost}</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.blurBox}>
                            <Text style={styles.blurText}>??? Market Data Hidden ???</Text>
                            <Text style={styles.blurSubText}>Run analysis to reveal</Text>
                        </View>
                    )}

                    <View style={styles.actions}>
                        {!isAnalyzed ? (
                            <Pressable style={styles.btnPrimary} onPress={onAnalyze}>
                                <Text style={styles.btnText}>Perform Market Analysis</Text>
                            </Pressable>
                        ) : (
                            <Pressable style={styles.btnSuccess} onPress={onLaunch}>
                                <Text style={styles.btnText}>LAUNCH PRODUCT</Text>
                            </Pressable>
                        )}
                        <Pressable style={styles.btnGhost} onPress={onClose}>
                            <Text style={styles.ghostText}>Cancel</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// --- DETAIL MODAL (NEW R&D UPGRADE SYSTEM) ---
// --- DETAIL MODAL (NEW R&D UPGRADE SYSTEM) ---
export const ProductDetailModal = ({ visible, product: initialProduct, onClose, onUpdate, onRetire, getTip, totalCapacity }: any) => {
    // 1. Get live product from store to ensure reactivity
    const product = useProductStore((state) =>
        state.products.find((p) => p.id === initialProduct?.id)
    );

    // If product doesn't exist (e.g. retired/deleted), return null or close
    if (!product) return null;

    const { totalRP } = useLaboratoryStore();
    const { optimizeProductionLine, upgradeProductQuality, randomizeProductName } = useProductStore();

    const facilityTierAtMount = useStatsStore.getState().facilityTier;
    const isRetoolingAtMount = !!useStatsStore.getState().facilityBuild;

    // Uretim hedefi ADET olarak tutulur (yuzde degil).
    // Kapasite buyudugunde bu sayi yerinde kalir — bkz. core/market/production.ts
    const [productionUnits, setProductionUnits] = useState(() =>
        resolveTargetUnits(product, totalCapacity || 0, facilityTierAtMount, isRetoolingAtMount),
    );
    // Pazarlama artik CEYREKLIK BUTCE. Eski kayitlarda birim basina tutuluyordu;
    // tasima: eski birim tutari x mevcut uretim hedefi.
    const [marketing, setMarketing] = useState(() => {
        if (typeof product.marketingBudget === 'number') return product.marketingBudget;
        const legacyPerUnit = product.marketingSpendPerUnit || 0;
        if (legacyPerUnit > 0) {
            return Math.round(legacyPerUnit * resolveTargetUnits(product, totalCapacity || 0, facilityTierAtMount, isRetoolingAtMount));
        }
        return 0;
    });
    const displayName = product.name;

    const processLevel = product.processLevel || 1;
    const qualityLevel = product.qualityLevel || 1;
    const complexity = product.complexity || 50;

    // Cost Calculator Check
    // DENGE: eskiden `complexity * 100 * 1.5^level` idi. Karmasikligi
    // 10.000.000 olan Fusion Reactor icin seviye 1 yukseltmesi 1.5 MILYAR
    // RP ediyordu — tum tech tree'nin toplamindan fazla.
    // Artik karmasikligin KAREKOKUNE bagli: buyuk urun daha pahali ama
    // ucuncu dereceden degil.
    const getUpgradeCost = (level: number) =>
        Math.floor(Math.sqrt(Math.max(1, complexity)) * 2_150 * Math.pow(1.55, level));

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
            // Adet olarak kaydediyoruz; productionLevel artik yazilmiyor.
            productionUnits: Math.min(productionUnits, maxUnits),
            marketingBudget: marketing,
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
            Alert.alert('Error', result.message);
        }
    };

    const handleQualityUpgrade = () => {
        const result = upgradeProductQuality(product.id, totalRP, (amount) => {
            useLaboratoryStore.getState().spendRP(amount);
        });
        if (!result.success) {
            Alert.alert('Error', result.message);
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
    const brandValue = useStatsStore(state => state.brandValue);
    // Kapasite artik tesis kademesinden gelir (core/market/capacity.ts).
    const facilityTier = useStatsStore(state => state.facilityTier);
    const isRetooling = useStatsStore(state => !!state.facilityBuild);
    const tier = getTier(facilityTier);
    const market = getMarket(product.category);

    const maxUnits = maxUnitsPerQuarter(employeeCount, complexity, facilityTier, isRetooling);
    // Kapasite kuculdiyse (eleman cikardin) hedef otomatik kirpilir.
    const willBuild = Math.max(0, Math.min(productionUnits, maxUnits));
    // Bar adimi: kapasitenin %5'i, en az 1
    const unitStep = Math.max(1, Math.round(maxUnits * 0.05));

    // ---- PAZARLAMA ESIKLERI ---------------------------------------------
    // Kiyas butce: kategorinin tabani ile bu urunun gecen ceyrek cirosunun
    // %25'inin buyugu. Buyudukce esik de buyur, ayni butce az gelmeye baslar.
    const effectivePrice = product.sellingPrice || product.suggestedPrice || 1;
    const benchmark = market ? marketingBenchmark(market, product.revenue || 0) : 1;
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
                qualityLevel,
                brandValue,
                marketDemand: product.marketDemand ?? 50,
            },
            market,
        )
        : null;

    const projectedShare = market && attraction
        ? computeShares([attraction.total], market).shares[0]
        : 0;

    const expectedDemand = market ? demandUnits(market, projectedShare) : 0;

    // Elde stok da satilabilir
    const available = willBuild + (product.inventory || 0);
    const expectedSales = Math.min(available, expectedDemand);
    const supplyGap = available - expectedDemand;
    const neededUnits = Math.max(0, expectedDemand - (product.inventory || 0));

    // Cubuk olcegi: uretim ve talebin buyugune gore
    const compareMax = Math.max(1, willBuild, expectedDemand);

    // Pazarlama artik sabit gider: satis adediyle carpilmaz, tumden dusulur.
    const projectedMargin =
        expectedSales * (effectivePrice - currentUnitCost) - marketing;

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
                            title="R&D UPGRADES"
                            note="Spend Research Points to cut cost or raise quality"
                            info="Optimizing the process lowers your unit cost. Raising quality increases the product's appeal, which directly increases your market share."
                            infoDetail="Each level costs more than the last, so upgrades get progressively harder."
                            summary={`${formatNumberShared(totalRP)} RP`}
                            summaryColor="#BA68C8"
                        >
                        <View style={styles.rdSection}>

                            {/* Optimize Process (Cost) */}
                            <View style={styles.upgradeCardCompact}>
                                <View style={styles.upgradeContentCompact}>
                                    <Text style={styles.upgradeLabel}>Optimize Process</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                                        <Text style={styles.heroValue}>${currentUnitCost}</Text>
                                        <Text style={{ color: theme.colors.accent, fontWeight: 'bold' }}>(-2%)</Text>
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
                                            ? 'MAX EFFICIENCY'
                                            : `${formatNumber(processUpgradeRP)} RP`}
                                    </Text>
                                </Pressable>
                            </View>

                            {/* Improve Quality (Price) */}
                            <View style={styles.upgradeCardCompact}>
                                <View style={styles.upgradeContentCompact}>
                                    <Text style={styles.upgradeLabel}>Improve Quality</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                                        <Text style={styles.heroValue}>${product.sellingPrice || product.suggestedPrice}</Text>
                                        <Text style={{ color: theme.colors.success, fontWeight: 'bold' }}>(+3%)</Text>
                                    </View>
                                    <Text style={styles.hint}>Lvl {qualityLevel} ➜ {qualityLevel + 1}</Text>
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
                                <Text style={styles.controlTitle}>Production</Text>
                                <InfoDot
                                    title="Production"
                                    text="Your factories can build a limited number of units each quarter. More complex products take longer, so the same team builds far fewer of them."
                                    detail={`Max for this product: ${formatNumber(maxUnits)} units per quarter with ${formatNumber(employeeCount)} employees.`}
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
                                            backgroundColor: supplyGap < 0 ? '#E57373' : '#4CAF50',
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
                                        ? `▏demand ${formatNumber(expectedDemand)}`
                                        : ' '}
                                </Text>
                                <Text style={styles.scaleMax}>max {formatNumber(maxUnits)}</Text>
                            </View>

                            <View style={styles.compareRow}>
                                <View>
                                    <Text style={styles.compareLabel}>You will build</Text>
                                    <Text style={styles.compareValue}>{formatNumber(willBuild)}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.compareLabel}>Market wants</Text>
                                    <Text style={[styles.compareValue, { color: '#7FB3FF' }]}>
                                        {formatNumber(expectedDemand)}
                                    </Text>
                                </View>
                            </View>

                            {/* Teshis satiri */}
                            {supplyGap < 0 ? (
                                <Text style={styles.warnLine}>
                                    Under-supplying by {formatNumber(Math.abs(supplyGap))} units. Those customers
                                    go to a rival and your brand takes a hit.
                                </Text>
                            ) : supplyGap > expectedDemand * 0.2 && expectedDemand > 0 ? (
                                <Text style={styles.warnLine}>
                                    Over-building by {formatNumber(supplyGap)} units. They become inventory and
                                    cost $5 each per quarter to store.
                                </Text>
                            ) : (
                                <Text style={styles.okLine}>Supply is close to demand.</Text>
                            )}

                            {/* Talebe esitle */}
                            {expectedDemand > 0 && (
                                <Pressable
                                    style={styles.matchBtn}
                                    onPress={() => setProductionUnits(Math.min(maxUnits, neededUnits))}
                                >
                                    <Text style={styles.matchBtnText}>
                                        Match demand — build {formatNumber(Math.min(maxUnits, neededUnits))}
                                    </Text>
                                </Pressable>
                            )}

                            {maxUnits < expectedDemand && (
                                <Text style={styles.capLine}>
                                    Even at full capacity you can only build {formatNumber(maxUnits)}. Your
                                    facility is a {tier.name} ({formatNumber(tier.capacity)} standard units,
                                    crew of {formatNumber(tier.crew)}). Hire up to the crew, or upgrade the tier.
                                </Text>
                            )}

                            {isRetooling && (
                                <Text style={styles.warnLine}>
                                    Retooling in progress — the facility is running at 65% while the upgrade
                                    is built. Capacity comes back, and grows, when it lands.
                                </Text>
                            )}

                            {qualityLevel > tier.qualityCeiling && (
                                <Text style={styles.warnLine}>
                                    This product is researched to quality {qualityLevel}, but a {tier.name}
                                    can only build to {tier.qualityCeiling}. You are shipping the lower one.
                                    Upgrade the facility to actually sell what you invented.
                                </Text>
                            )}
                        </View>

                        {/* ══ PAZARLAMA ══
                            Artik CEYREKLIK BUTCE. Barda iki isaret var:
                            bakim esigi (markanin yerinde kaldigi nokta) ve
                            kiyas butce (ses payinin %50 oldugu nokta). */}
                        <View style={styles.controlGroup}>
                            <View style={styles.controlHeader}>
                                <Text style={styles.controlTitle}>Marketing Budget</Text>
                                <InfoDot
                                    title="Marketing Budget"
                                    text="A fixed amount you spend every quarter, whether you sell anything or not. What matters is not the number itself but how it compares to what the market spends. Match the benchmark and you own about half the attention in your category."
                                    detail={`Benchmark for this product: ${formatMoney(benchmark)} per quarter. It grows with your own revenue, so defending a large share costs more than winning a small one. Brand maintenance level: ${formatMoney(maintenancePoint)} — spend below that and Brand Value erodes.`}
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
                                                    ? '#FFB74D'
                                                    : isOverSaturated
                                                        ? '#64B5F6'
                                                        : '#4CAF50',
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
                                Maintain {formatMoney(maintenancePoint)} · Benchmark {formatMoney(benchmark)} ·
                                Max {formatMoney(marketingMax)}
                            </Text>

                            <Text style={styles.costLine}>
                                Share of voice {formatPercent(sov * 100)} — that is how much of this
                                category's attention your budget buys.
                            </Text>

                            {marketing === 0 ? (
                                <Text style={styles.warnLine}>
                                    No marketing. Fewer customers will ever consider this product, and
                                    Brand Value will erode every quarter.
                                </Text>
                            ) : marketing < maintenancePoint ? (
                                <Text style={styles.warnLine}>
                                    Below the maintenance level. You are still selling, but Brand Value
                                    will slide — add {formatMoney(maintenancePoint - marketing)} to hold it.
                                </Text>
                            ) : isOverSaturated ? (
                                <Text style={styles.okLine}>
                                    Heavy spend. Good for a launch push or taking share fast, but the
                                    last dollars buy far less than the first — plan to taper back once
                                    Brand Value has built up.
                                </Text>
                            ) : (
                                <Text style={styles.okLine}>
                                    Above the maintenance level. Brand Value builds — as long as you can
                                    actually deliver the demand you create.
                                </Text>
                            )}

                            <Text style={styles.costLine}>
                                Charged every quarter regardless of sales: {formatMoney(marketing)}
                            </Text>
                        </View>

                        {/* ══ CANLI ONIZLEME ══
                            Kaydetmeden once sonucunu gor. computeAttraction
                            saf fonksiyon oldugu icin burada da cagrilabiliyor. */}
                        {market && (
                            <View style={styles.previewBox}>
                                <View style={styles.controlHeader}>
                                    <Text style={styles.previewTitle}>Projected Result</Text>
                                    <InfoDot
                                        title="Projected Result"
                                        text="What these settings are expected to produce next quarter, based on the same math the simulation uses."
                                        detail="It is an estimate — morale problems and competitor moves can still change the outcome."
                                    />
                                </View>
                                <View style={styles.previewRow}>
                                    <View style={styles.previewCell}>
                                        <Text style={styles.previewLabel}>Market Share</Text>
                                        <Text style={styles.previewValue}>
                                            {projectedShare < 1
                                                ? `${projectedShare.toFixed(3)}%`
                                                : `${projectedShare.toFixed(2)}%`}
                                        </Text>
                                    </View>
                                    <View style={styles.previewCell}>
                                        <Text style={styles.previewLabel}>Units Sold</Text>
                                        <Text style={[styles.previewValue, { color: '#4CAF50' }]}>
                                            {formatNumber(expectedSales)}
                                        </Text>
                                    </View>
                                    <View style={styles.previewCell}>
                                        <Text style={styles.previewLabel}>Gross Margin</Text>
                                        <Text
                                            style={[
                                                styles.previewValue,
                                                { color: projectedMargin >= 0 ? '#4CAF50' : '#F44336' },
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
                            <Text style={styles.hint}>Est. Storage Cost: ${formatNumber((product.inventory || 0) * 5)} / quarter</Text>
                        </View>

                        <Pressable style={styles.btnPrimary} onPress={handleSave}>
                            <Text style={styles.btnText}>Save Changes</Text>
                        </Pressable>

                        {/* Change Product Name Button */}
                        <Pressable style={styles.btnOutline} onPress={handleRandomizeName}>
                            <Text style={styles.btnOutlineText}>🎲 Change Product Name</Text>
                        </Pressable>

                        <Pressable style={styles.btnDanger} onPress={() => onRetire(product.id)}>
                            <Text style={styles.btnText}>Retire Product</Text>
                        </Pressable>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    // --- Yeni uretim / pazarlama kontrolleri ---
    controlHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    controlValueBox: { alignItems: 'center', flex: 1 },
    controlValueUnit: { color: '#6E6E6E', fontSize: 9.5, marginTop: 2 },

    capacityTrack: {
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginTop: 14,
        justifyContent: 'center',
    },
    capacityFill: { height: 10, borderRadius: 5 },
    scaleRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    scaleHint: { color: '#7FB3FF', fontSize: 9.5 },
    scaleMax: { color: '#8A8A8A', fontSize: 9.5, fontWeight: '700' },

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
        backgroundColor: '#7FB3FF',
        borderRadius: 1,
    },
    compareRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    compareLabel: { color: '#6E6E6E', fontSize: 9.5, letterSpacing: 0.5 },
    compareValue: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', marginTop: 2 },

    warnLine: { color: '#E57373', fontSize: 11, lineHeight: 16, marginTop: 10 },
    okLine: { color: '#4CAF50', fontSize: 11, marginTop: 10 },
    capLine: { color: '#FFB74D', fontSize: 10.5, lineHeight: 15, marginTop: 8 },
    costLine: { color: '#8A8A8A', fontSize: 10.5, marginTop: 10 },

    matchBtn: {
        marginTop: 12,
        borderWidth: 1,
        borderColor: 'rgba(127,179,255,0.4)',
        backgroundColor: 'rgba(127,179,255,0.1)',
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
    },
    matchBtnText: { color: '#7FB3FF', fontSize: 12, fontWeight: '700' },

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
        backgroundColor: 'rgba(244,67,54,0.12)',
    },
    mktFill: { height: 8, borderRadius: 4 },
    mktMarker: { position: 'absolute', width: 2, height: 14, backgroundColor: '#FFD700' },
    // Kiyas butce isareti — bakim esiginden ayirt edilsin diye farkli renk
    mktMarkerBenchmark: { backgroundColor: '#7FB3FF', width: 2, height: 14 },
    mktScale: { color: '#6E6E6E', fontSize: 9.5, marginTop: 6 },

    previewBox: {
        backgroundColor: 'rgba(127,179,255,0.07)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(127,179,255,0.22)',
        padding: 14,
        marginBottom: 16,
    },
    previewTitle: { color: '#7FB3FF', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
    previewRow: { flexDirection: 'row', marginTop: 6 },
    previewCell: { flex: 1, alignItems: 'center' },
    previewLabel: { color: '#6E6E6E', fontSize: 9.5 },
    previewValue: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginTop: 3 },

    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 16 },
    content: { backgroundColor: '#1A202C', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#2D3748' },
    modalTitle: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center' },
    header: { flexDirection: 'row', gap: 16, marginBottom: 20 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    icon: { fontSize: 42 },
    name: { fontSize: 18, fontWeight: '700', color: '#fff' },
    desc: { fontSize: 13, color: '#A0AEC0' },
    statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    label: { color: '#A0AEC0', fontSize: 14 },
    value: { color: '#fff', fontWeight: '700' },
    valueAccent: { color: theme.colors.accent, fontWeight: '800', fontSize: 16 },
    analysisBox: { backgroundColor: '#2D3748', padding: 12, borderRadius: 8, marginBottom: 20 },
    sectionHeader: { color: '#fff', fontWeight: '700', marginBottom: 12 },
    barBg: { height: 6, backgroundColor: '#1A202C', borderRadius: 3, marginBottom: 12 },
    barFill: { height: '100%', backgroundColor: theme.colors.success, borderRadius: 3 },
    blurBox: { height: 100, backgroundColor: '#2D3748', alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginBottom: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#4A5568' },
    blurText: { color: '#fff', fontWeight: '700' },
    blurSubText: { color: '#A0AEC0', fontSize: 12 },
    actions: { gap: 10 },
    btnPrimary: { backgroundColor: theme.colors.accent, padding: 14, borderRadius: 10, alignItems: 'center' },
    btnSuccess: { backgroundColor: theme.colors.success, padding: 14, borderRadius: 10, alignItems: 'center' },
    btnDanger: { backgroundColor: theme.colors.danger, padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
    btnOutline: {
        backgroundColor: 'transparent',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4A5568',
        marginTop: 12
    },
    btnGhost: { padding: 14, alignItems: 'center' },
    btnText: { color: '#000', fontWeight: '700', fontSize: 16 },
    btnOutlineText: { color: '#A0AEC0', fontWeight: '700', fontSize: 16 },
    ghostText: { color: '#A0AEC0', fontWeight: '600' },
    closeIcon: { fontSize: 24, color: '#A0AEC0' },
    rpBadge: {
        backgroundColor: theme.colors.accent,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    rpBadgeText: {
        color: '#000',
        fontSize: 14,
        fontWeight: '800',
    },
    progressBarContainer: {
        marginVertical: 12,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#2D3748',
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
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },
    diceBtn: { padding: 4 },
    diceIcon: { fontSize: 20 },
    insightBox: { backgroundColor: theme.colors.cardSoft, padding: 12, borderRadius: 8, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: theme.colors.accent },
    insightTitle: { color: theme.colors.accent, fontWeight: '700', marginBottom: 4 },
    insightText: { color: '#E2E8F0', fontSize: 13 },
    rdSection: { marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 12 },

    // COMPACT UPGRADE CARD STYLES
    upgradeCardCompact: {
        backgroundColor: '#2D3748',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#4A5568',
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
        color: '#A0AEC0',
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    heroValue: {
        fontSize: 36,
        fontWeight: '900',
        color: '#fff',
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
        color: '#000',
        fontWeight: '700',
        fontSize: 13,
        textAlign: 'center'
    },

    // OLD STYLES (keeping for compatibility)
    upgradeCard: { backgroundColor: '#2D3748', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#4A5568' },
    upgradeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    upgradeTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
    upgradeLevel: { fontSize: 12, color: theme.colors.accent, fontWeight: '600' },
    upgradeStats: { marginBottom: 12 },
    statItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    statLabel: { color: '#A0AEC0', fontSize: 13 },
    statValue: { color: '#fff', fontSize: 14, fontWeight: '700' },
    rpCost: { color: theme.colors.accent, fontSize: 13, fontWeight: '700' },
    upgradeBtn: { backgroundColor: theme.colors.accent, padding: 12, borderRadius: 8, alignItems: 'center' },
    upgradeBtnDisabled: { backgroundColor: '#4A5568', opacity: 0.5 },
    upgradeBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },

    controlGroup: { marginBottom: 20 },
    controlTitle: { color: '#fff', fontWeight: '600', marginBottom: 8 },
    controlValue: { color: '#fff', fontSize: 18, fontWeight: '800' },
    sliderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2D3748', padding: 8, borderRadius: 8 },
    adjBtn: { width: 36, height: 36, backgroundColor: '#4A5568', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    adjText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    hint: { fontSize: 11, color: '#718096', marginTop: 4, textAlign: 'right' },
    realStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    realStatsText: { color: '#A0AEC0', fontSize: 12, fontWeight: '600' },
});