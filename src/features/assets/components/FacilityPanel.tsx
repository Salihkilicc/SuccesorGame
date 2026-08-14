// src/features/assets/components/FacilityPanel.tsx
//
// ============================================================================
//  TESİS VE KADRO PANELİ
// ============================================================================
//
//  ESKI EKRAN NEYDI:
//    "Factories: 12" ve yaninda +1 / -1 / +10 / -10 butonlari. Fabrika
//    sayisini tek tek tiklayarak buyutuyordun ve fabrika HICBIR ISE
//    yaramiyordu — sadece gider yaziyordu.
//
//  SIMDI:
//    Tek bir tesisin var, kademe kademe yukseliyor. Ceyrekte en fazla bir
//    buyuk karar veriyorsun. Kadro da tek tek degil HEDEF olarak veriliyor;
//    sirket ona dogru yuruyor.
//
//  Panel uc soruya cevap verir:
//    1. Neredeyim?          -> kademe karti, kapasite kullanimi
//    2. Ne bekliyorum?      -> taahhut kuyrugu
//    3. Ne yapabilirim?     -> yukseltme ve hedef kadro
//
// ============================================================================

import React, { useState, useCallback } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, Pressable, Alert, LayoutAnimation } from 'react-native';
import { theme } from '../../../core/theme';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { useGameStore } from '../../../core/store/useGameStore';
import { useLaboratoryStore } from '../../../core/store/useLaboratoryStore';
import {
    FACILITY_TIERS,
    MAX_TIER_LEVEL,
    UTILIZATION_NOTES,
    availableStandardUnits,
    getNextTier,
    getTier,
    staffingRatio,
    utilizationVerdict,
} from '../../../core/market/capacity';
import {
    WORKFORCE_EXPLANATIONS,
    hiringCap,
    hiringFee,
    quarterlyWage,
    severancePay,
} from '../../../core/market/workforce';
import { formatMoney, formatNumber, formatPercent } from '../../../core/utils';
import CollapsibleSection from '../../../components/common/CollapsibleSection';
import StepperBar from '../../../components/common/StepperBar';
import InfoDot from '../../../components/common/InfoDot';

const FacilityPanel: React.FC = () => {
    useLocale();
    const facilityTier = useStatsStore(s => s.facilityTier);
    const facilityBuild = useStatsStore(s => s.facilityBuild);
    const employeeCount = useStatsStore(s => s.employeeCount);
    const incomingHires = useStatsStore(s => s.incomingHires);
    const targetHeadcount = useStatsStore(s => s.targetHeadcount);
    const companyCapital = useStatsStore(s => s.companyCapital);
    const startFacilityUpgrade = useStatsStore(s => s.startFacilityUpgrade);
    const cancelFacilityUpgrade = useStatsStore(s => s.cancelFacilityUpgrade);
    const setTargetHeadcount = useStatsStore(s => s.setTargetHeadcount);
    const salaryRatio = useStatsStore(s => s.salaryRatio);
    const totalRP = useLaboratoryStore(s => s.totalRP);
    const employeeMorale = useGameStore(s => s.employeeMorale);
    const lastReport = useGameStore(s => s.lastQuarterReport);

    const tier = getTier(facilityTier);
    const next = getNextTier(facilityTier);
    const isBuilding = !!facilityBuild;

    const [target, setTarget] = useState(targetHeadcount ?? employeeCount);
    /** The stripe IS the facility header now - tapping it opens the details. */
    const [facilityOpen, setFacilityOpen] = useState(false);
    const toggleFacility = useCallback(() => {
        // Same easing CollapsibleSection uses, so the two open the same way.
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setFacilityOpen(o => !o);
    }, []);

    const capacityNow = availableStandardUnits(employeeCount, tier.level, isBuilding);
    const staffing = staffingRatio(employeeCount, tier.level);
    const utilization = lastReport?.utilization ?? 0;
    const verdict = utilizationVerdict(utilization);

    const delta = target - employeeCount;
    const changeCost =
        delta > 0
            ? delta * hiringFee(tier.level, salaryRatio)
            : Math.abs(delta) * severancePay(tier.level, salaryRatio);
    const wageBill = target * quarterlyWage(tier.level, salaryRatio);
    const perQuarterHiringCap = hiringCap(employeeCount, useStatsStore.getState().brandValue, employeeMorale);

    const handleUpgrade = () => {
        if (!next) return;
        Alert.alert(
            t('fac.upgradeTo', { v1: next.name }),
            t('fac.upgradeBody', {
                v1: formatMoney(next.upgradeCost) + (next.upgradeRP > 0 ? ` + ${formatNumber(next.upgradeRP)} RP` : ''),
                v2: next.buildQuarters,
                v3: Math.round(tier.retoolingRatio * 100),
                v4: formatNumber(next.capacity),
                v5: formatNumber(next.crew),
                v6: next.unitCostMultiplier.toFixed(2),
                v7: next.brandCeiling,
                v8: next.qualityCeiling,
            }),
            [
                { text: t('company.notNow'), style: 'cancel' },
                {
                    text: t('company.startBuild'),
                    onPress: () => {
                        const result = startFacilityUpgrade();
                        if (!result.success) Alert.alert(t('alert.cannotStart'), result.message);
                    },
                },
            ],
        );
    };

    const handleCancel = () => {
        Alert.alert(
            t('alert.cancelTheBuild'),
            t('alert.youGet40OfWhat'),
            [
                { text: t('company.keepBuilding'), style: 'cancel' },
                { text: t('company.cancelBuild'), style: 'destructive', onPress: cancelFacilityUpgrade },
            ],
        );
    };

    const applyTarget = () => setTargetHeadcount(target);

    const step = Math.max(1, Math.round(tier.crew * 0.1));

    return (
        <View style={styles.wrap}>
            {/* ══ KOMPAKT SIRIT — her zaman gorunur ══
                Panel cok yer kapliyordu. Ilk bakista sadece uc sey lazim:
                hangi kademedeyim, ekip tam mi, hat ne kadar dolu.
                Gerisi asagida katli duruyor. */}
            {/* ══ THE STRIPE IS THE HEADER ══
                It used to sit above a separate "Facility" section that then
                repeated its numbers. One thing now: the strip you always see
                is the control that opens the detail behind it. */}
            <Pressable
                onPress={toggleFacility}
                style={({ pressed }) => [styles.stripe, pressed && styles.stripePressed]}
                accessibilityRole="button"
                accessibilityState={{ expanded: facilityOpen }}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.tierLabel}>
                        {t('fac.tierBadge', { v1: tier.level, v2: MAX_TIER_LEVEL })}{isBuilding ? `  ·  ${t('fac.retooling')}` : ''}
                    </Text>
                    <Text style={styles.tierName}>{tier.name}</Text>
                    <Text style={styles.stripeMeta}>
                        {formatNumber(capacityNow)} units · crew {formatNumber(employeeCount)}/
                        {formatNumber(tier.crew)}
                    </Text>
                </View>
                {!!lastReport && (
                    <View style={styles.stripeUtil}>
                        <Text style={[styles.utilValue, styles[`util_${verdict}`]]}>
                            {formatPercent(utilization)}
                        </Text>
                        <Text style={styles.utilLabel}>{t('company.used')}</Text>
                    </View>
                )}
                <Text style={styles.stripeChevron}>{facilityOpen ? '⌃' : '⌄'}</Text>
            </Pressable>

            {/* Ekip eksikse bu uyari KATLANMAZ — en ucuz uretim artisi budur */}
            {staffing < 1 && (
                <Pressable style={styles.alertBox} onPress={() => setTarget(tier.crew)}>
                    <Text style={styles.alertText}>
                        {t('company.understaffedShort', {
                            v1: formatNumber(tier.crew - employeeCount),
                            v2: formatPercent(staffing * 100),
                        })}
                    </Text>
                    <Text style={styles.alertCta}>{t('company.tapToSetTheTarget', { v1: formatNumber(tier.crew) })}</Text>
                </Pressable>
            )}

            {/* ══ KADEME DETAYI — opened by the stripe above ══ */}
            {facilityOpen && (
            <View style={styles.facilityBody}>
                <View style={styles.facilityHead}>
                    <Text style={styles.tierDesc}>{tier.description}</Text>
                    <InfoDot
                        title={t('company.facility')}
                        text={t('company.yourProductionCapabilityItSets')}
                        detail={t('fac.productionFormula')}
                        small
                    />
                </View>

                {/* Capacity and crew are NOT repeated here: the stripe above is
                    always visible and already carries them. What is left is
                    what the stripe cannot show - the limits this tier imposes. */}
                <View style={styles.statRow}>
                    <Stat label={t('company.unitCost')} value={`×${tier.unitCostMultiplier.toFixed(2)}`} />
                    <Stat label={t('company.yield')} value={formatPercent(tier.yieldRate * 100)} />
                </View>

                <View style={styles.statRow}>
                    <Stat label={t('company.brandCeiling')} value={`${tier.brandCeiling}`} />
                    <Stat label={t('company.qualityCeiling')} value={`${tier.qualityCeiling}`} />
                </View>

                {/* The number lives in the stripe. This adds the shape and the
                    reading of it, not the figure again. */}
                {lastReport && (
                    <View style={styles.utilBox}>
                        <View style={styles.utilTrack}>
                            <View style={[styles.utilFill, {
                                width: `${Math.min(100, utilization)}%`,
                                // A FILL, so it cannot use the signal tokens -
                                // see the note on util_tight. `borderStrong`
                                // stands in for the red at the ceiling: the
                                // bar being full is already the alarm, and the
                                // figure above it is red.
                                backgroundColor: verdict === 'idle' ? theme.colors.disabled
                                    : verdict === 'tight' ? theme.colors.borderStrong
                                        : theme.colors.primary,
                            }]} />
                        </View>
                        <Text style={styles.utilNote}>{UTILIZATION_NOTES[verdict]}</Text>
                    </View>
                )}
            </View>
            )}

            {/* ══ TAAHHUT KUYRUGU ══
                Zaman bu oyunun ana mekaniklerinden biri. Neyin ne zaman
                gelecegini tek yerde gormek CEO'nun bakacagi tablo. */}
            {(isBuilding || incomingHires > 0) && (
                <View style={styles.queue}>
                    <Text style={styles.queueTitle}>{t('company.inProgress')}</Text>

                    {isBuilding && facilityBuild && (
                        <View style={styles.queueRow}>
                            <Text style={styles.queueIcon}>🏗</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.queueName}>
                                    {getTier(facilityBuild.targetTier).name}
                                </Text>
                                <Text style={styles.queueSub}>
                                    {facilityBuild.quartersRemaining} quarter(s) left · running at{' '}
                                    {Math.round(tier.retoolingRatio * 100)}% until then
                                </Text>
                            </View>
                            <Pressable onPress={handleCancel} style={styles.cancelBtn}>
                                <Text style={styles.cancelText}>{t('company.cancel')}</Text>
                            </Pressable>
                        </View>
                    )}

                    {incomingHires > 0 && (
                        <View style={styles.queueRow}>
                            <Text style={styles.queueIcon}>👥</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.queueName}>
                                    {formatNumber(incomingHires)} people hired
                                </Text>
                                <Text style={styles.queueSub}>{t('company.arrivingNextQuarterHalfProductivity')}</Text>
                            </View>
                        </View>
                    )}
                </View>
            )}

            {/* ══ YUKSELTME ══ */}
            {/* "Affordable" was light grey and "Saving" was a fainter grey -
                the same colour twice, so the word was doing all the work.
                Blue when you can pay for it, grey when you cannot. */}
            {next ? (
                <CollapsibleSection
                    title={t('company.nextTier')}
                    note={`${next.name} — ${formatMoney(next.upgradeCost)}, ${next.buildQuarters}q`}
                    info={t('company.youCannotSkipTiersYou')}
                    infoDetail={t('company.thatDowntimeIsTheReal')}
                    summary={companyCapital >= next.upgradeCost ? t('fac.affordable') : t('fac.saving')}
                    summaryColor={
                        companyCapital >= next.upgradeCost ? theme.colors.up : theme.colors.down
                    }
                >
                    <Text style={styles.nextName}>{next.name}</Text>
                    <Text style={styles.tierDesc}>{next.description}</Text>

                    <View style={styles.compareRow}>
                        <Compare label={t('company.capacity')} from={formatNumber(tier.capacity)} to={formatNumber(next.capacity)} />
                        <Compare label={t('company.crew')} from={formatNumber(tier.crew)} to={formatNumber(next.crew)} />
                    </View>
                    <View style={styles.compareRow}>
                        <Compare label={t('company.unitCost')} from={`×${tier.unitCostMultiplier.toFixed(2)}`} to={`×${next.unitCostMultiplier.toFixed(2)}`} />
                        <Compare label={t('company.brandCap')} from={`${tier.brandCeiling}`} to={`${next.brandCeiling}`} />
                    </View>

                    <Text style={styles.costLine}>
                        {formatMoney(next.upgradeCost)}
                        {next.upgradeRP > 0 ? ` + ${formatNumber(next.upgradeRP)} RP` : ''} up front ·{' '}
                        {next.buildQuarters} quarter(s) to build ·{' '}
                        {Math.round(tier.retoolingRatio * 100)}% capacity while building
                    </Text>

                    {/* The research requirement, in the research colour when
                        it is met and grey when it is not - "nothing good is
                        happening here" rather than the caution blue, which
                        this shared with unrelated warnings. */}
                    {next.upgradeRP > 0 && (
                        <Text style={totalRP >= next.upgradeRP ? styles.rpLine : styles.rpLineShort}>
                            {t('fac.researchProgress', { v1: formatNumber(Math.floor(totalRP)), v2: formatNumber(next.upgradeRP) })}
                            {totalRP < next.upgradeRP
                                ? ', money alone will not build this. Fund the lab.'
                                : ', cleared.'}
                        </Text>
                    )}

                    <Pressable
                        style={({ pressed }) => [
                            styles.primaryBtn,
                            (isBuilding || companyCapital < next.upgradeCost) && styles.primaryBtnOff,
                            pressed && !(isBuilding || companyCapital < next.upgradeCost) && styles.primaryBtnPressed,
                        ]}
                        disabled={
                            isBuilding ||
                            companyCapital < next.upgradeCost ||
                            totalRP < next.upgradeRP
                        }
                        onPress={handleUpgrade}
                    >
                        <Text style={[
                            styles.primaryBtnText,
                            (isBuilding || companyCapital < next.upgradeCost) && styles.primaryBtnTextOff,
                        ]}>
                            {isBuilding
                                ? t('fac.buildInProgress')
                                : companyCapital < next.upgradeCost
                                    ? t('fac.needMoreCash', { v1: formatMoney(next.upgradeCost - companyCapital) })
                                    : totalRP < next.upgradeRP
                                        ? t('fac.needMoreRp', { v1: formatNumber(next.upgradeRP - Math.floor(totalRP)) })
                                        : t('fac.startBuild', { v1: next.name })}
                        </Text>
                    </Pressable>
                </CollapsibleSection>
            ) : (
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>{t('company.topTierReached')}</Text>
                    <Text style={styles.tierDesc}>
                        There is nothing left to build. From here, growth comes from products,
                        pricing and acquisitions.
                    </Text>
                </View>
            )}

            {/* ══ KADRO ══ */}
            <CollapsibleSection
                title={t('company.headcount')}
                note={t('company.setATargetTheCompany')}
                info={t('company.youSetATargetAnd')}
                infoDetail={`Hiring costs ${formatMoney(hiringFee(tier.level, salaryRatio))} per person. Severance is ${formatMoney(severancePay(tier.level, salaryRatio))} per person, and cutting a large share of the workforce hits morale hard — worse if you just reported a profit.`}
                summary={`${formatNumber(employeeCount)} / ${formatNumber(tier.crew)}`}
                summaryColor={staffing < 1 ? '#FF8A8A' : '#CFD0D2'}
                defaultOpen={staffing < 1}
            >
                {/* Yuzdelik stepper KALDIRILDI. Kadro artik mutlak sayi;
                    bar tavani kademe buyudukce buyur, hedef yerinde kalir.
                    Bkz. components/common/StepperBar.tsx */}
                <StepperBar
                    value={target}
                    onChange={setTarget}
                    max={Math.max(tier.crew * 2, employeeCount + perQuarterHiringCap * 4)}
                    unit="target headcount"
                    softLimit={tier.crew}
                    softLimitLabel="Crew"
                    markers={[
                        { value: employeeCount, label: 'Now', color: '#FFFFFF' },
                    ]}
                    steps={[1, 10, 100]}
                />

                <Text style={styles.costLine}>{t('company.wageBillAtThisSize', { v1: formatMoney(wageBill) })}</Text>

                {delta !== 0 && (
                    <Text style={delta > 0 ? styles.okLine : styles.warn}>
                        {delta > 0
                            ? t('fac.hiringCost', { v1: formatNumber(delta), v2: formatMoney(changeCost) })
                            : t('fac.layoffCost', { v1: formatNumber(-delta), v2: formatMoney(changeCost) })}
                    </Text>
                )}

                {delta > perQuarterHiringCap && (
                    <Text style={styles.warn}>
                        {t('fac.hiringCapWarn', { v1: formatNumber(perQuarterHiringCap) })}
                    </Text>
                )}

                {target > tier.crew && (
                    <Text style={styles.warn}>
                        {formatNumber(target - tier.crew)} of these people have no line to work on.
                        You pay them; they produce nothing. Upgrade the facility first.
                    </Text>
                )}

                <Pressable
                    style={({ pressed }) => [
                        styles.primaryBtn,
                        delta === 0 && styles.primaryBtnOff,
                        pressed && delta !== 0 && styles.primaryBtnPressed,
                    ]}
                    disabled={delta === 0}
                    onPress={applyTarget}
                >
                    <Text style={[styles.primaryBtnText, delta === 0 && styles.primaryBtnTextOff]}>
                        {delta === 0 ? t('fac.noChange') : t('fac.confirmTarget')}
                    </Text>
                </Pressable>

                {/* ══ WHAT COMES NEXT ══
                    This was a separate "The Ladder" section listing all eight
                    tiers, most of which were behind you and could not be acted
                    on. It belongs with the facility it describes, and it only
                    needs to show where you are and what is ahead - the rungs
                    you already climbed are history, not a decision. */}
                {/* SHELVED: the tier ladder.
                    It listed tiers you cannot act on - the current one IS this
                    section and the next one has its own block with the build
                    button. FACILITY_TIERS still holds the data if it comes
                    back as something you can actually do. */}
            </CollapsibleSection>

        </View>
    );
};

const Stat: React.FC<{ label: string; value: string; tone?: 'ok' | 'warn' }> = ({ label, value, tone }) => (
    <View style={styles.stat}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, tone === 'warn' && styles.statWarn]}>{value}</Text>
    </View>
);

const Compare: React.FC<{ label: string; from: string; to: string }> = ({ label, from, to }) => (
    <View style={styles.stat}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.compareValue}>
            <Text style={styles.compareFrom}>{from}</Text>
            <Text style={styles.compareArrow}>  →  </Text>
            <Text style={styles.compareTo}>{to}</Text>
        </Text>
    </View>
);

const styles = StyleSheet.create({
    wrap: { gap: 10 },
    stripe: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        paddingVertical: 12, paddingHorizontal: 14,
    },
    stripeMeta: { color: 'rgba(255,255,255,0.48)', fontSize: 11.5, marginTop: 3 },
    stripeUtil: { alignItems: 'flex-end' },
    alertBox: {
        backgroundColor: 'rgba(5,168,246,0.09)',
        borderRadius: 12,
        borderWidth: 1, borderColor: 'rgba(5,168,246,0.28)',
        padding: 12,
    },
    alertText: { color: theme.colors.warning, fontSize: 11.5, lineHeight: 16.5 },
    alertCta: { color: theme.colors.warning, fontSize: 11, fontWeight: '800', marginTop: 6 },
    card: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 16,
    },
    cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    tierLabel: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    tierName: { color: theme.colors.textPrimary, fontSize: 22, fontWeight: '800', marginTop: 2 },
    tierDesc: { color: 'rgba(255,255,255,0.48)', fontSize: 12, lineHeight: 17, marginBottom: 12 },
    sectionTitle: { color: theme.colors.textPrimary, fontSize: 12, fontWeight: '800', letterSpacing: 1, flex: 1 },
    nextName: { color: theme.colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 4 },

    statRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    stat: { flex: 1 },
    statLabel: { color: '#FFFFFF', fontSize: 9.5, fontWeight: '700', letterSpacing: 0.5 },
    statValue: { color: theme.colors.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 2 },
    statWarn: { color: theme.colors.warning },

    compareRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    compareValue: { marginTop: 2 },
    compareFrom: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
    compareArrow: { color: '#FFFFFF', fontSize: 11 },
    compareTo: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

    warn: { color: theme.colors.warning, fontSize: 11.5, lineHeight: 16, marginTop: 4 },
    okLine: { color: '#FFFFFF', fontSize: 11.5, lineHeight: 16, marginTop: 4 },
    /** Research cleared. */
    rpLine: { color: theme.colors.rp, fontSize: 11.5, lineHeight: 16, marginTop: 4 },
    /** Research short. */
    rpLineShort: { color: theme.colors.down, fontSize: 11.5, lineHeight: 16, marginTop: 4 },
    costLine: { color: 'rgba(255,255,255,0.48)', fontSize: 11.5, lineHeight: 16, marginTop: 6 },

    utilBox: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)' },
    utilHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    utilLabel: { color: '#FFFFFF', fontSize: 9.5, fontWeight: '800', letterSpacing: 0.8 },
    utilValue: { fontSize: 18, fontWeight: '800' },
    // ------------------------------------------------------------------
    //  "99% USED" AND YOU COULD NOT TELL IF THAT WAS GOOD
    // ------------------------------------------------------------------
    //  All three verdicts were white. The engine had been sorting
    //  utilization into idle / healthy / tight since the day it was
    //  written, and the screen threw that away by painting the answer the
    //  same colour in every case. The player's words: "99% used yaziyor ama
    //  ben iyi mi kotu mu anlamiyorum."
    //
    //  TIGHT IS RED, and this is the widened red doing exactly the job it
    //  was widened for: a ceiling you have hit is not a loss on the books,
    //  but it costs you the same way - the next jump in demand becomes a
    //  stockout, and stockouts burn brand.
    //
    //  IDLE IS GREY rather than red. Paying for plant you are not using is
    //  waste, but it is not a wall; nothing good is happening, which is
    //  what grey says. Two different problems should not look identical,
    //  and before this they did - both were painted #FF8A8A on the bar.
    // ------------------------------------------------------------------
    util_idle: { color: theme.colors.down },
    util_healthy: { color: theme.colors.up },
    util_tight: { color: theme.colors.negative },
    utilTrack: {
        height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden', marginTop: 6,
    },
    utilFill: { height: '100%', borderRadius: 4 },
    utilNote: { color: 'rgba(255,255,255,0.48)', fontSize: 11, lineHeight: 16, marginTop: 8 },

    queue: {
        backgroundColor: 'rgba(207,208,210,0.07)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(207,208,210,0.22)',
        padding: 14,
    },
    queueTitle: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
    queueRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    queueIcon: { fontSize: 18 },
    queueName: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '700' },
    queueSub: { color: 'rgba(255,255,255,0.48)', fontSize: 11, marginTop: 2 },
    cancelBtn: {
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
        borderWidth: 1, borderColor: 'rgba(5,168,246,0.4)',
    },
    cancelText: { color: theme.colors.textPrimary, fontSize: 11, fontWeight: '700' },

    headRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 },
    adjBtn: {
        width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.07)',
    },
    adjText: { color: theme.colors.textPrimary, fontSize: 22, fontWeight: '700' },
    headValue: { flex: 1, alignItems: 'center' },
    headNumber: { color: theme.colors.textPrimary, fontSize: 26, fontWeight: '800' },
    headUnit: { color: '#FFFFFF', fontSize: 10.5, marginTop: 1 },

    matchBtn: {
        paddingVertical: 9, borderRadius: 10, alignItems: 'center',
        backgroundColor: 'rgba(207,208,210,0.12)', marginBottom: 4,
    },
    matchBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

    primaryBtn: {
        marginTop: 12, paddingVertical: 13, borderRadius: 12,
        // The token, not a raw hex - every other primary button in the app
        // uses this, and the contrast pass cannot resolve a literal.
        alignItems: 'center', backgroundColor: theme.colors.primary,
    },
    primaryBtnOff: { backgroundColor: theme.colors.surfaceHigh },
    primaryBtnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    primaryBtnText: { color: theme.colors.onLight, fontSize: 13.5, fontWeight: '800' },
    /* Disabled the fill goes DARK, so the label has to go light with it -
       black on a dark disabled button measured 1.8 and could not be read. */
    primaryBtnTextOff: { color: theme.colors.textMuted },

    stripePressed: { opacity: 0.92 },
    stripeChevron: {
        color: theme.colors.textMuted,
        fontSize: theme.typography.body,
        marginLeft: theme.spacing.sm,
        width: 12,
        textAlign: 'center',
    },
    facilityBody: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        marginTop: theme.spacing.xs,
        gap: theme.spacing.sm,
    },
    facilityHead: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm },
    ladderBlock: {
        marginTop: theme.spacing.md,
        paddingTop: theme.spacing.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.border,
    },
    ladderHeading: {
        color: theme.colors.textMuted,
        fontSize: theme.typography.caption,
        fontWeight: '700',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: theme.spacing.xs,
    },
    ladderRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    ladderNow: { backgroundColor: 'rgba(207,208,210,0.08)', borderRadius: 8, paddingHorizontal: 8 },
    ladderNum: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', width: 20 },
    ladderName: { color: theme.colors.textPrimary, fontSize: 13, fontWeight: '700' },
    ladderMeta: { color: '#FFFFFF', fontSize: 10, marginTop: 2 },
    ladderCost: { color: 'rgba(255,255,255,0.48)', fontSize: 11, fontWeight: '700' },
    ladderDim: { opacity: 0.45 },
});

export default FacilityPanel;
