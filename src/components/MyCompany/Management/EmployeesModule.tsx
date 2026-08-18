// src/components/MyCompany/Management/EmployeesModule.tsx
//
// ============================================================================
//  EKİP — maaş, moral, etkinlikler, fazla mesai
// ============================================================================
//
//  ESKI HALI NEYDI:
//    - Uc kademeli maas butonlari (low / average / above_average). Motorla
//      senkron degildi; ekranda gosterilen gider hep yanlisti.
//    - KENDI ayri etkinlik listesi vardi (Pizza Party 50.000, Gala
//      1.000.000) ve useCompanyManagement'taki COMPANY_EVENTS listesinden
//      farkliydi. Ayni sey icin ucuncu bir kaynak.
//    - Etkinlikler sabit fiyatliydi, yani sirket buyudukce bedavaya
//      geliyordu.
//    - Metinler Turkce idi; oyunun dili Ingilizce.
//
//  SIMDI: tek kaynak core/market/workforce.ts.
//
// ============================================================================

import React, { useState } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Switch } from 'react-native';
import { theme } from '../../../core/theme';
import GameModal from '../../common/GameModal';
import InfoDot from '../../common/InfoDot';
import CollapsibleSection from '../../common/CollapsibleSection';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { useGameStore } from '../../../core/store/useGameStore';
import { getTier } from '../../../core/market/capacity';
import {
    MAX_EVENTS_PER_QUARTER,
    OVERTIME_MAX_RATIO,
    SALARY_RATIO_MAX,
    SALARY_RATIO_MIN,
    TEAM_EVENTS,
    WORKFORCE_EXPLANATIONS,
    efficiencyMultiplier,
    eventCost,
    eventMoraleGain,
    marketWage,
    payCutShock,
    quarterlyWage,
    scrapMultiplier,
    wageMoraleTarget,
} from '../../../core/market/workforce';
import { formatMoney, formatNumber, formatPercent } from '../../../core/utils';
import ConfirmPanel, { type ConfirmLine } from '../../common/ConfirmPanel';
import ScreenHeader from '../../common/ScreenHeader';

interface Props {
    /** Render as a route rather than a popup - see components/common/ScreenHost. */
    asScreen?: boolean;
    visible: boolean;
    onClose: () => void;
}

const EmployeesModule = ({ visible, onClose, asScreen }: Props) => {
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

    useLocale();
    const employeeCount = useStatsStore(s => s.employeeCount);
    const facilityTier = useStatsStore(s => s.facilityTier);
    const salaryRatio = useStatsStore(s => s.salaryRatio);
    const companyCapital = useStatsStore(s => s.companyCapital);
    const avgTenure = useStatsStore(s => s.avgTenureQuarters);

    const morale = useGameStore(s => s.employeeMorale);
    const overtimeEnabled = useGameStore(s => s.overtimeEnabled);
    const eventsHosted = useGameStore(s => s.eventsHostedThisQuarter);
    const lastQuarterProfit = useGameStore(s => s.lastQuarterProfit);
    const bonusDistributed = useGameStore(s => s.bonusDistributedThisQuarter);
    const setSalaryRatio = useGameStore(s => s.setSalaryRatio);
    const setOvertime = useGameStore(s => s.setOvertime);
    const organizeEvent = useGameStore(s => s.organizeEvent);
    const distributeBonus = useGameStore(s => s.distributeBonus);

    const tier = getTier(facilityTier);
    const market = marketWage(tier.level);
    const perPerson = quarterlyWage(tier.level, salaryRatio);
    const wageBill = perPerson * employeeCount;
    const target = wageMoraleTarget(salaryRatio);
    const efficiency = efficiencyMultiplier(morale);
    const scrap = scrapMultiplier(morale);

    const quarterStartSalaryRatio = useGameStore(s => s.quarterStartSalaryRatio ?? salaryRatio);

    const changeRatio = (next: number) => {
        const clamped = Math.min(SALARY_RATIO_MAX, Math.max(SALARY_RATIO_MIN, next));
        const shock = payCutShock(quarterStartSalaryRatio, clamped);
        if (shock > 0) {
            setPanel({
                title: t('alert.cutPay'),
                summary: 'Raising pay is easy; taking it back is not.',
                lines: [{ label: 'Immediate morale cost', value: `−${shock}`, tone: 'negative' }],
                note: 'That is on top of the lower level your pay will sustain from here on.',
                cancelLabel: t('ui.neverMind'),
                confirmLabel: t('ui.cutAnyway'),
                tone: 'danger',
                onConfirm: () => { setSalaryRatio(clamped); setPanel(null); },
            });
            return;
        }
        setSalaryRatio(clamped);
    };

    const handleEvent = (id: string) => {
        const result = organizeEvent(id);
        if (!result.success) {
            setPanel({ title: t('alert.cannotHost'), summary: result.message, confirmLabel: 'OK', tone: 'danger' });
        }
    };

    const bonusCost = Math.max(0, lastQuarterProfit) * 0.05;
    const canBonus = !bonusDistributed && lastQuarterProfit > 0 && companyCapital >= bonusCost;

    return (
        <GameModal asScreen={asScreen} visible={visible} onClose={onClose}>
            {/* This screen had no exit control of any kind - as a popup it was
                dismissed by tapping outside, which a screen cannot be. */}
            <ScreenHeader
                inset={!!asScreen}
                title={t('ui.team')}
                onBack={onClose}
                right={
                    <InfoDot
                        title={t('tactic.teamMoraleTitle')}
                        text={t('tactic.teamMoraleText')}
                        detail={t('tactic.teamMoraleDetail')}
                    />
                }
            />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screenPad}>
                {/* ══ MORAL ŞERİDİ ══ */}
                <View style={styles.stripe}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>{t('ui.morale')}</Text>
                        <Text style={styles.big}>{morale.toFixed(0)}</Text>
                        <Text style={styles.sub}>{t('company.payAloneSustainsV1', { v1: target.toFixed(0) })}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.label}>{t('ui.output')}</Text>
                        {/* Below 1 the team is producing less than you are
                            paying for, which is the loss red's widened case:
                            it is costing you. At or above, blue. */}
                        <Text style={[styles.big, {
                            color: efficiency >= 1 ? theme.colors.up : theme.colors.negative,
                        }]}>
                            ×{efficiency.toFixed(2)}
                        </Text>
                        <Text style={styles.sub}>scrap ×{scrap.toFixed(2)}</Text>
                    </View>
                </View>

                <View style={styles.moraleTrack}>
                    {/* --------------------------------------------------
                        TWO STEPS, AT THE THRESHOLD THE ENGINE ACTUALLY USES

                        This was three tiers - under 40, under 65, above -
                        painted with two colours, and the two bad ones were
                        the SAME hex. So 39 and 64 looked identical while
                        meaning different things, and neither 40 nor 65
                        corresponds to anything in the engine.

                        FIFTY DOES. Below it attrition doubles
                        (workforce.ts, attritionRate) and the quarter takes a
                        production penalty (useGameStore). That is the line
                        worth drawing, so it is the only one drawn.

                        I tried a three-step ladder first and measured it:
                        the only palette colour between the grey and the blue
                        is blueDeep, which reads 1.74 against this track -
                        invisible. The brighter alternatives are brighter
                        than the healthy blue, which would invert the ladder.
                        A middle you cannot see is worse than no middle.

                        Fills, so no signal tokens - see the production bar.
                       -------------------------------------------------- */}
                    <View style={[styles.moraleFill, {
                        width: `${morale}%`,
                        backgroundColor: morale < 50 ? theme.colors.disabled : theme.colors.primary,
                    }]} />
                    {/* Maasin tasidigi seviye isareti */}
                    <View style={[styles.moraleMarker, { left: `${target}%` }]} />
                </View>
                <Text style={styles.note}>{WORKFORCE_EXPLANATIONS.morale}</Text>

                {/* ══ MAAŞ ══ */}
                <CollapsibleSection
                    title={t('ui.pay')}
                    note={t('ui.whatYouPayAgainstThe')}
                    info={WORKFORCE_EXPLANATIONS.salaryRatio}
                    infoDetail={`Market rate for a ${tier.name} is ${formatMoney(market)} per person per quarter. You are paying ${formatMoney(perPerson)}.`}
                    summary={`${Math.round(salaryRatio * 100)}%`}
                    summaryColor={salaryRatio < 0.95 ? theme.colors.down : theme.colors.up}
                    defaultOpen
                >
                    <View style={styles.row}>
                        <Pressable onPress={() => changeRatio(salaryRatio - 0.05)} style={styles.adj}>
                            <Text style={styles.adjText}>−</Text>
                        </Pressable>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={styles.big}>{Math.round(salaryRatio * 100)}%</Text>
                            <Text style={styles.sub}>of market rate</Text>
                        </View>
                        <Pressable onPress={() => changeRatio(salaryRatio + 0.05)} style={styles.adj}>
                            <Text style={styles.adjText}>+</Text>
                        </Pressable>
                    </View>

                    <Text style={styles.line}>
                        {formatMoney(perPerson)} per person · {formatNumber(employeeCount)} people ·{' '}
                        <Text style={styles.strong}>{formatMoney(wageBill)}</Text> per quarter
                    </Text>

                    {salaryRatio < 0.95 ? (
                        <Text style={styles.warn}>
                            Below market. Morale is heading for {target.toFixed(0)}, people leave faster,
                            and defects go up. You are saving cash and paying for it in output.
                        </Text>
                    ) : salaryRatio > 1.15 ? (
                        <Text style={styles.warn}>
                            Past the point where pay still buys morale. The ceiling money can reach is 85 —
                            the rest has to come from events, bonuses and the company actually doing well.
                        </Text>
                    ) : (
                        <Text style={styles.ok}>{t('company.aroundMarketMoraleSettlesNear', { v1: target.toFixed(0) })}</Text>
                    )}
                </CollapsibleSection>

                {/* ══ ETKİNLİKLER ══ */}
                <CollapsibleSection
                    title={t('ui.teamEvents')}
                    note={t('ui.pricedPerPersonTheyNever')}
                    info={WORKFORCE_EXPLANATIONS.events}
                    summary={`${eventsHosted} / ${MAX_EVENTS_PER_QUARTER}`}
                >
                    {TEAM_EVENTS.map(ev => {
                        const cost = eventCost(ev, employeeCount);
                        const gain = eventMoraleGain(ev, eventsHosted);
                        const afford = companyCapital >= cost;
                        const used = eventsHosted >= MAX_EVENTS_PER_QUARTER;
                        return (
                            <Pressable
                                key={ev.id}
                                disabled={!afford || used}
                                onPress={() => handleEvent(ev.id)}
                                style={[styles.eventRow, (!afford || used) && styles.eventOff]}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.eventName}>{ev.name}</Text>
                                    <Text style={styles.eventDesc}>{ev.description}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    {/* The row already dims when it is out of
                                        reach; the price says which of the two
                                        reasons it is - too expensive, or the
                                        quarter's events already used up. */}
                                    <Text style={[styles.eventCost, {
                                        color: afford ? theme.colors.up : theme.colors.down,
                                    }]}>{formatMoney(cost)}</Text>
                                    <Text style={styles.eventGain}>+{gain} morale</Text>
                                </View>
                            </Pressable>
                        );
                    })}
                </CollapsibleSection>

                {/* ══ İKRAMİYE ══ */}
                <CollapsibleSection
                    title={t('ui.bonus')}
                    note={t('ui.shareLastQuarterSProfit')}
                    summary={bonusDistributed ? 'Paid' : canBonus ? 'Available' : ', '}
                    summaryColor={canBonus ? theme.colors.up : theme.colors.down}
                >
                    <Text style={styles.line}>
                        5% of last quarter's profit: {formatMoney(bonusCost)}
                    </Text>
                    <Pressable
                        disabled={!canBonus}
                        onPress={() => distributeBonus()}
                        style={[styles.primary, !canBonus && styles.primaryOff]}
                    >
                        <Text style={styles.primaryText}>
                            {bonusDistributed
                                ? 'Already paid this quarter'
                                : lastQuarterProfit <= 0
                                    ? 'No profit to share'
                                    : `Distribute ${formatMoney(bonusCost)}`}
                        </Text>
                    </Pressable>
                </CollapsibleSection>

                {/* ══ FAZLA MESAİ ══ */}
                <View style={styles.overtimeBox}>
                    <View style={{ flex: 1 }}>
                        <View style={styles.rowTight}>
                            <Text style={styles.otTitle}>{t('ui.overtime')}</Text>
                            <InfoDot title={t('ui.overtime2')} text={WORKFORCE_EXPLANATIONS.overtime} />
                        </View>
                        <Text style={styles.sub}>
                            Runs to {Math.round(OVERTIME_MAX_RATIO * 100)}% of capacity · wages ×1.5 ·
                            morale −3 every quarter it stays on
                        </Text>
                    </View>
                    <Switch value={overtimeEnabled} onValueChange={setOvertime} />
                </View>

                {avgTenure > 0 && (
                    <Text style={styles.note}>
                        Average tenure {avgTenure.toFixed(1)} quarters — experienced teams produce more,
                        but every hiring wave dilutes it.
                    </Text>
                )}
            </ScrollView>
        
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
        </GameModal>
    );
};

const styles = StyleSheet.create({
    screenPad: { padding: theme.spacing.md, paddingBottom: 120 },
    stripe: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
    label: { color: '#FFFFFF', fontSize: 9.5, fontWeight: '800', letterSpacing: 0.8 },
    big: { color: theme.colors.textPrimary, fontSize: 26, fontWeight: '800', marginTop: 2 },
    sub: { color: 'rgba(255,255,255,0.48)', fontSize: 11, marginTop: 2 },
    strong: { color: theme.colors.textPrimary, fontWeight: '800' },

    moraleTrack: {
        height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden', marginBottom: 8,
    },
    moraleFill: { height: '100%', borderRadius: 5 },
    moraleMarker: { position: 'absolute', width: 2, height: 10, backgroundColor: '#434B50' },

    note: { color: 'rgba(255,255,255,0.48)', fontSize: 11, lineHeight: 16, marginBottom: 14 },
    line: { color: 'rgba(255,255,255,0.48)', fontSize: 12, lineHeight: 17, marginTop: 6 },
    warn: { color: theme.colors.warning, fontSize: 11.5, lineHeight: 16, marginTop: 8 },
    ok: { color: '#FFFFFF', fontSize: 11.5, lineHeight: 16, marginTop: 8 },

    row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 6 },
    rowTight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    adj: {
        width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.07)',
    },
    adjText: { color: theme.colors.textPrimary, fontSize: 22, fontWeight: '700' },

    eventRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    eventOff: { opacity: 0.4 },
    eventName: { color: theme.colors.textPrimary, fontSize: 13.5, fontWeight: '700' },
    eventDesc: { color: '#FFFFFF', fontSize: 10.5, marginTop: 2 },
    eventCost: { color: theme.colors.textPrimary, fontSize: 13, fontWeight: '800' },
    eventGain: { color: '#FFFFFF', fontSize: 11, marginTop: 2 },

    primary: {
        marginTop: 10, paddingVertical: 12, borderRadius: 12,
        alignItems: 'center', backgroundColor: theme.colors.primary,
    },
    /**
     * Disabled stays a LIGHT fill on purpose - the label does not change
     * colour when a button greys out, so the off state has to stay on the
     * same side of theme rule 1 as the on state.
     */
    primaryOff: { backgroundColor: theme.colors.disabled },
    primaryText: { color: theme.colors.onLight, fontSize: 13, fontWeight: '800' },

    overtimeBox: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        padding: 14, marginTop: 12, marginBottom: 12,
    },
    otTitle: { color: theme.colors.textPrimary, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
});

export default EmployeesModule;
