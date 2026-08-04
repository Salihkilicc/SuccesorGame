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

import React, { useState } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
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
            `Upgrade to ${next.name}?`,
            `${formatMoney(next.upgradeCost)}${next.upgradeRP > 0 ? ` and ${formatNumber(next.upgradeRP)} RP` : ''} now, ` +
            `${next.buildQuarters} quarter(s) to build.\n\n` +
            `While it is being built your facility runs at ${Math.round(tier.retoolingRatio * 100)}% ` +
            `capacity. You will produce less, and you may lose share.\n\n` +
            `When it lands: ${formatNumber(next.capacity)} capacity, crew of ${formatNumber(next.crew)}, ` +
            `unit cost ×${next.unitCostMultiplier.toFixed(2)}, Brand Value ceiling ${next.brandCeiling}, ` +
            `quality ceiling ${next.qualityCeiling}.`,
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
            <View style={styles.stripe}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.tierLabel}>
                        TIER {tier.level}/{MAX_TIER_LEVEL}{isBuilding ? '  ·  RETOOLING' : ''}
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
            </View>

            {/* Ekip eksikse bu uyari KATLANMAZ — en ucuz uretim artisi budur */}
            {staffing < 1 && (
                <Pressable style={styles.alertBox} onPress={() => setTarget(tier.crew)}>
                    <Text style={styles.alertText}>
                        Understaffed — {formatNumber(tier.crew - employeeCount)} people short.
                        You are getting {formatPercent(staffing * 100)} of what this facility can build.
                    </Text>
                    <Text style={styles.alertCta}>Tap to set the target to {formatNumber(tier.crew)}</Text>
                </Pressable>
            )}

            {/* ══ KADEME DETAYI ══ */}
            <CollapsibleSection
                title={t('company.facility')}
                note={t('company.whatThisTierGivesYou')}
                info={t('company.yourProductionCapabilityItSets')}
                infoDetail={`Production = capacity × min(1, employees / crew) × yield. Hiring past the crew adds cost and no output; upgrading the tier without hiring raises the ceiling you cannot reach. The two go together.`}
                summary={tier.name}
            >
                <Text style={styles.tierDesc}>{tier.description}</Text>

                <View style={styles.statRow}>
                    <Stat label={t('company.capacityNow')} value={formatNumber(capacityNow)} />
                    <Stat label={t('company.crew')} value={`${formatNumber(employeeCount)} / ${formatNumber(tier.crew)}`}
                        tone={staffing < 1 ? 'warn' : 'ok'} />
                    <Stat label={t('company.unitCost')} value={`×${tier.unitCostMultiplier.toFixed(2)}`} />
                </View>

                <View style={styles.statRow}>
                    <Stat label={t('company.yield')} value={formatPercent(tier.yieldRate * 100)} />
                    <Stat label={t('company.brandCeiling')} value={`${tier.brandCeiling}`} />
                    <Stat label={t('company.qualityCeiling')} value={`${tier.qualityCeiling}`} />
                </View>

                {lastReport && (
                    <View style={styles.utilBox}>
                        <View style={styles.utilTrack}>
                            <View style={[styles.utilFill, {
                                width: `${Math.min(100, utilization)}%`,
                                backgroundColor: verdict === 'idle' ? '#FFB74D'
                                    : verdict === 'tight' ? '#EF5350' : '#4CAF50',
                            }]} />
                        </View>
                        <Text style={styles.utilNote}>{UTILIZATION_NOTES[verdict]}</Text>
                    </View>
                )}
            </CollapsibleSection>

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
            {next ? (
                <CollapsibleSection
                    title={t('company.nextTier')}
                    note={`${next.name} — ${formatMoney(next.upgradeCost)}, ${next.buildQuarters}q`}
                    info={t('company.youCannotSkipTiersYou')}
                    infoDetail={t('company.thatDowntimeIsTheReal')}
                    summary={companyCapital >= next.upgradeCost ? 'Affordable' : 'Saving'}
                    summaryColor={companyCapital >= next.upgradeCost ? '#4CAF50' : '#8A8A8A'}
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

                    {next.upgradeRP > 0 && (
                        <Text style={totalRP >= next.upgradeRP ? styles.okLine : styles.warn}>
                            Research: {formatNumber(Math.floor(totalRP))} / {formatNumber(next.upgradeRP)} RP
                            {totalRP < next.upgradeRP
                                ? ' — money alone will not build this. Fund the lab.'
                                : ' — cleared.'}
                        </Text>
                    )}

                    <Pressable
                        style={[
                            styles.primaryBtn,
                            (isBuilding || companyCapital < next.upgradeCost) && styles.primaryBtnOff,
                        ]}
                        disabled={
                            isBuilding ||
                            companyCapital < next.upgradeCost ||
                            totalRP < next.upgradeRP
                        }
                        onPress={handleUpgrade}
                    >
                        <Text style={styles.primaryBtnText}>
                            {isBuilding
                                ? 'Build already in progress'
                                : companyCapital < next.upgradeCost
                                    ? `Need ${formatMoney(next.upgradeCost - companyCapital)} more`
                                    : totalRP < next.upgradeRP
                                        ? `Need ${formatNumber(next.upgradeRP - Math.floor(totalRP))} more RP`
                                        : `Start ${next.name}`}
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
                summaryColor={staffing < 1 ? '#FFB74D' : '#4CAF50'}
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
                        { value: employeeCount, label: 'Now', color: '#7FB3FF' },
                    ]}
                    steps={[1, 10, 100]}
                />

                <Text style={styles.costLine}>
                    Wage bill at this size: {formatMoney(wageBill)} per quarter
                </Text>

                {delta !== 0 && (
                    <Text style={delta > 0 ? styles.okLine : styles.warn}>
                        {delta > 0
                            ? `Hiring ${formatNumber(delta)} costs ${formatMoney(changeCost)} up front. They start next quarter.`
                            : `Letting ${formatNumber(-delta)} go costs ${formatMoney(changeCost)} in severance, plus a morale hit.`}
                    </Text>
                )}

                {delta > perQuarterHiringCap && (
                    <Text style={styles.warn}>
                        You can only take on about {formatNumber(perQuarterHiringCap)} people per quarter.
                        The rest will follow in later quarters — a stronger brand and better morale
                        raise that ceiling.
                    </Text>
                )}

                {target > tier.crew && (
                    <Text style={styles.warn}>
                        {formatNumber(target - tier.crew)} of these people have no line to work on.
                        You pay them; they produce nothing. Upgrade the facility first.
                    </Text>
                )}

                <Pressable
                    style={[styles.primaryBtn, delta === 0 && styles.primaryBtnOff]}
                    disabled={delta === 0}
                    onPress={applyTarget}
                >
                    <Text style={styles.primaryBtnText}>
                        {delta === 0 ? 'No change' : 'Confirm target'}
                    </Text>
                </Pressable>
            </CollapsibleSection>

            {/* ══ TUM MERDIVEN ══ */}
            <CollapsibleSection
                title={t('company.theLadder')}
                note={t('company.everyTierAndWhatIt')}
                summary={`${tier.level} / ${MAX_TIER_LEVEL}`}
            >
                {FACILITY_TIERS.map(t => {
                    const state = t.level < tier.level ? 'past' : t.level === tier.level ? 'current' : 'future';
                    return (
                        <View key={t.level} style={[styles.ladderRow, state === 'current' && styles.ladderNow]}>
                            <Text style={[styles.ladderNum, state === 'past' && styles.ladderDim]}>
                                {t.level}
                            </Text>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.ladderName, state === 'future' && styles.ladderDim]}>
                                    {t.name}
                                </Text>
                                <Text style={styles.ladderMeta}>
                                    {formatNumber(t.capacity)} cap · crew {formatNumber(t.crew)} · cost ×
                                    {t.unitCostMultiplier.toFixed(2)} · brand ≤{t.brandCeiling} · quality ≤
                                    {t.qualityCeiling}
                                    {t.upgradeRP > 0 ? ` · ${formatNumber(t.upgradeRP)} RP` : ''}
                                </Text>
                            </View>
                            <Text style={styles.ladderCost}>
                                {t.upgradeCost > 0 ? formatMoney(t.upgradeCost) : '—'}
                            </Text>
                        </View>
                    );
                })}
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
    stripeMeta: { color: '#8A8A8A', fontSize: 11.5, marginTop: 3 },
    stripeUtil: { alignItems: 'flex-end' },
    alertBox: {
        backgroundColor: 'rgba(255,183,77,0.09)',
        borderRadius: 12,
        borderWidth: 1, borderColor: 'rgba(255,183,77,0.28)',
        padding: 12,
    },
    alertText: { color: '#FFB74D', fontSize: 11.5, lineHeight: 16.5 },
    alertCta: { color: '#FFB74D', fontSize: 11, fontWeight: '800', marginTop: 6 },
    card: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 16,
    },
    cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    tierLabel: { color: '#7FB3FF', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    tierName: { color: theme.colors.textPrimary, fontSize: 22, fontWeight: '800', marginTop: 2 },
    tierDesc: { color: '#8A8A8A', fontSize: 12, lineHeight: 17, marginBottom: 12 },
    sectionTitle: { color: theme.colors.textPrimary, fontSize: 12, fontWeight: '800', letterSpacing: 1, flex: 1 },
    nextName: { color: theme.colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 4 },

    statRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    stat: { flex: 1 },
    statLabel: { color: '#6E6E6E', fontSize: 9.5, fontWeight: '700', letterSpacing: 0.5 },
    statValue: { color: theme.colors.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 2 },
    statWarn: { color: '#FFB74D' },

    compareRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    compareValue: { marginTop: 2 },
    compareFrom: { color: '#6E6E6E', fontSize: 13, fontWeight: '600' },
    compareArrow: { color: '#4A4A4A', fontSize: 11 },
    compareTo: { color: '#4CAF50', fontSize: 14, fontWeight: '800' },

    warn: { color: '#FFB74D', fontSize: 11.5, lineHeight: 16, marginTop: 4 },
    okLine: { color: '#4CAF50', fontSize: 11.5, lineHeight: 16, marginTop: 4 },
    costLine: { color: '#8A8A8A', fontSize: 11.5, lineHeight: 16, marginTop: 6 },

    utilBox: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)' },
    utilHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    utilLabel: { color: '#6E6E6E', fontSize: 9.5, fontWeight: '800', letterSpacing: 0.8 },
    utilValue: { fontSize: 18, fontWeight: '800' },
    util_idle: { color: '#FFB74D' },
    util_healthy: { color: '#4CAF50' },
    util_tight: { color: '#EF5350' },
    utilTrack: {
        height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden', marginTop: 6,
    },
    utilFill: { height: '100%', borderRadius: 4 },
    utilNote: { color: '#8A8A8A', fontSize: 11, lineHeight: 16, marginTop: 8 },

    queue: {
        backgroundColor: 'rgba(127,179,255,0.07)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(127,179,255,0.22)',
        padding: 14,
    },
    queueTitle: { color: '#7FB3FF', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
    queueRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    queueIcon: { fontSize: 18 },
    queueName: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '700' },
    queueSub: { color: '#8A8A8A', fontSize: 11, marginTop: 2 },
    cancelBtn: {
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
        borderWidth: 1, borderColor: 'rgba(239,83,80,0.4)',
    },
    cancelText: { color: '#EF5350', fontSize: 11, fontWeight: '700' },

    headRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 },
    adjBtn: {
        width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.07)',
    },
    adjText: { color: theme.colors.textPrimary, fontSize: 22, fontWeight: '700' },
    headValue: { flex: 1, alignItems: 'center' },
    headNumber: { color: theme.colors.textPrimary, fontSize: 26, fontWeight: '800' },
    headUnit: { color: '#6E6E6E', fontSize: 10.5, marginTop: 1 },

    matchBtn: {
        paddingVertical: 9, borderRadius: 10, alignItems: 'center',
        backgroundColor: 'rgba(127,179,255,0.12)', marginBottom: 4,
    },
    matchBtnText: { color: '#7FB3FF', fontSize: 12, fontWeight: '700' },

    primaryBtn: {
        marginTop: 12, paddingVertical: 13, borderRadius: 12,
        alignItems: 'center', backgroundColor: '#2E7D32',
    },
    primaryBtnOff: { backgroundColor: 'rgba(255,255,255,0.07)' },
    primaryBtnText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '800' },

    ladderRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    ladderNow: { backgroundColor: 'rgba(76,175,80,0.08)', borderRadius: 8, paddingHorizontal: 8 },
    ladderNum: { color: '#7FB3FF', fontSize: 13, fontWeight: '800', width: 20 },
    ladderName: { color: theme.colors.textPrimary, fontSize: 13, fontWeight: '700' },
    ladderMeta: { color: '#6E6E6E', fontSize: 10, marginTop: 2 },
    ladderCost: { color: '#8A8A8A', fontSize: 11, fontWeight: '700' },
    ladderDim: { opacity: 0.45 },
});

export default FacilityPanel;
