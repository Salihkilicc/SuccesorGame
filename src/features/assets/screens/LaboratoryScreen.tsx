import React, { useState, useEffect, useMemo } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../../core/theme';
import { useLaboratoryStore } from '../../../core/store/useLaboratoryStore';
import StepperBar from '../../../components/common/StepperBar';
import { researchOutput, researcherWage } from '../../../core/market/workforce';
import { useStatsStore } from '../../../core/store';
import {
    getFacilityByTier,
    getNextTier,
    calculateQuarterlyCost,
    calculateQuarterlyRP,
    RESEARCHER_ECONOMICS,
} from '../../../features/laboratory/data/laboratoryData';
import { formatMoney, formatNumber, formatRP, formatCompact } from '../../../core/utils';
import ScreenHeader from '../../../components/common/ScreenHeader';
import TutorialTarget from '../../../components/tutorial/TutorialTarget';
import { useStoryStore } from '../../../core/store/useStoryStore';
import { currentQuarter } from '../../../core/story/world';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import InfoDot from '../../../components/common/InfoDot';

const LaboratoryScreen = ({ onBack }: { onBack?: () => void } = {}) => {
    useLocale();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const { currentTier, researcherCount, totalRP, upgradeFacility, hireResearchers, fireResearchers } =
        useLaboratoryStore();
    const { companyCapital, setField } = useStatsStore();

    // Local state for draft changes
    const [tempCount, setTempCount] = useState(researcherCount);
    const [hiredNotice, setHiredNotice] = useState<{ count: number; quarter: number; type: 'hired' | 'reduced' } | null>(null);

    // Sync tempCount when actual researcherCount changes (e.g. after confirm or external change)
    useEffect(() => {
        setTempCount(researcherCount);
    }, [researcherCount]);

    const facility = getFacilityByTier(currentTier);
    const nextTier = getNextTier(currentTier);

    // Derived calculations
    const facilityTier = useStatsStore(st => st.facilityTier);
    const salaryRatio = useStatsStore(st => st.salaryRatio);
    const quarterlyCost = tempCount * researcherWage(facilityTier, salaryRatio);
    const quarterlyRP = calculateQuarterlyRP(tempCount);
    const costDiff = (tempCount - researcherCount) * researcherWage(facilityTier, salaryRatio);

    // NOTE: hireResearchers assumes immediate payment of first quarter salary? 
    // Based on user prompt "Expenses will be deducted from Capital", checking if we need to show immediate cost.
    // The store logic deducts (count * Salary). 
    // If tempCount > researcherCount, we need to pay (tempCount - researcherCount) * Salary * 1 (now).
    // Maas artik tek kaynaktan: core/market/workforce.ts. Eskiden sabit
    // 500.000 dolardi ve sirket olcegiyle hicbir ilgisi yoktu.
    const perResearcher = researcherWage(facilityTier, salaryRatio);
    const immediateCost = Math.max(0, tempCount - researcherCount) * perResearcher;

    const canAfford = companyCapital >= immediateCost;

    const deductCapital = (amount: number) => {
        setField('companyCapital', companyCapital - amount);
    };

    const handleUpgrade = () => {
        // Upgrade uses same capital logic? The store calls deductCash. 
        // We should pass a deduct function that uses Company Capital effectively since they want expenses from Capital.
        const result = upgradeFacility(companyCapital, deductCapital);
        Alert.alert(result.success ? 'Success' : 'Error', result.message);
    };

    const handleAdjust = (delta: number) => {
        if (!facility) return;
        const newCount = Math.max(0, Math.min(facility.capacity, tempCount + delta));
        setTempCount(newCount);
    };

    const handlePercentage = (percent: number) => {
        if (!facility) return;
        const delta = Math.floor(facility.capacity * percent);
        handleAdjust(delta);
    };

    const handleConfirm = () => {
        if (tempCount === researcherCount) return;

        if (tempCount > researcherCount) {
            // Hiring
            const toHire = tempCount - researcherCount;
            const result = hireResearchers(toHire, companyCapital, deductCapital);
            if (result.success) {
                // The research lesson's second step clears here, and only on
                // success - a failed hire teaches nothing and should not end
                // the instruction that was asking for one.
                useStoryStore.getState().raise('rndHired');
                const nextQ = currentQuarter() + 1;
                setHiredNotice({ count: toHire, quarter: nextQ, type: 'hired' });
            } else {
                Alert.alert(t('alert.error'), result.message);
                // Reset temp count on failure
                setTempCount(researcherCount);
            }
        } else {
            // Firing
            const toFire = researcherCount - tempCount;
            fireResearchers(toFire);
            const nextQ = currentQuarter() + 1;
            setHiredNotice({ count: toFire, quarter: nextQ, type: 'reduced' });
        }
    };

    if (!facility) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>{t('company.invalidFacilityTier')}</Text>
            </View>
        );
    }

    const canUpgrade = nextTier && companyCapital >= (nextTier.upgradeCost?.cash || 0) && totalRP >= (nextTier.upgradeCost?.rp || 0);
    const hasChanges = tempCount !== researcherCount;

    return (
        <View style={styles.container}>
            {/* ----------------------------------------------------------
                This screen is RENDERED INSIDE ResearchScreen as a tab, not
                pushed as its own route. Its back button called goBack(),
                which popped the whole Research route and landed the player on
                Home - skipping the screen they had just come from. It now
                returns to the research hub, and only falls back to popping
                when it really is standalone.
               ---------------------------------------------------------- */}
            <ScreenHeader
                title={t('company.rDLaboratory')}
                subtitle={t('company.targetOutputV1Q', { v1: formatRP(quarterlyRP) })}
                onBack={onBack}
                right={
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <InfoDot
                            title={t('tactic.rdTitle')}
                            text={t('tactic.rdText')}
                            detail={t('tactic.rdDetail')}
                        />
                        <View style={styles.rpBadge}>
                            <Text style={styles.rpBadgeText}>{formatRP(totalRP)}</Text>
                        </View>
                    </View>
                }
            />
            {/* ------------------------------------------------------------
                SHELVED: A LONE MICROSCOPE ON A STRIP OF ITS OWN

                An icon with no label, in a band under the header, doing the
                one job the header band is worst at. It read as a leftover.

                Nothing is orphaned by taking it out: the tech tree is
                reached from the research hub one screen back and from the
                Discover New Tech card in Products, both of which say in
                words where they go.

                    <View style={styles.shortcutRow}>
                        <Pressable
                            style={styles.techTreeBtn}
                            onPress={() => (navigation as any).navigate('TechTree')}
                        >
                            <Text style={styles.techTreeIcon}>🔬</Text>
                        </Pressable>
                    </View>
               ------------------------------------------------------------ */}

            <ScrollView contentContainerStyle={styles.content}>
                {/* FACILITY CARD */}
                <View style={styles.card}>
                    <View style={styles.facilityHeader}>
                        <Text style={styles.facilityIcon}>{facility.icon}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.facilityName}>{facility.name}</Text>
                            <Text style={styles.facilityDesc}>{facility.description}</Text>
                        </View>
                        <View style={styles.tierBadge}>
                            <Text style={styles.tierBadgeText}>{t('company.tierV1', { v1: currentTier })}</Text>
                        </View>
                    </View>

                    <View style={styles.capacityBar}>
                        <View style={styles.capacityBarBg}>
                            <View
                                style={[
                                    styles.capacityBarFill,
                                    { width: `${(researcherCount / facility.capacity) * 100}%`, backgroundColor: theme.colors.textSecondary, opacity: 0.3 }
                                ]}
                            />
                            {/* Target Line / Fill */}
                            <View
                                style={[
                                    styles.capacityBarFill,
                                    {
                                        position: 'absolute',
                                        width: `${(tempCount / facility.capacity) * 100}%`,
                                        backgroundColor: hasChanges ? (canAfford ? theme.categories.research : theme.colors.danger) : theme.categories.research
                                    }
                                ]}
                            />
                        </View>
                        <Text style={styles.capacityText}>
                            {formatNumber(tempCount)} / {formatNumber(facility.capacity)}
                        </Text>
                    </View>

                    {nextTier && (
                        <Pressable
                            style={[styles.upgradeBtn, !canUpgrade && styles.upgradeBtnDisabled]}
                            onPress={handleUpgrade}
                            disabled={!canUpgrade}
                        >
                            <Text style={[styles.upgradeBtnText, !canUpgrade && styles.upgradeBtnTextDisabled]}>{t('company.upgradeToV1', { v1: nextTier.name })}</Text>
                            {nextTier.upgradeCost && (
                                <Text style={[styles.upgradeCost, !canUpgrade && styles.upgradeCostDisabled]}>
                                    {formatMoney(nextTier.upgradeCost.cash)} + {formatRP(nextTier.upgradeCost.rp)}
                                </Text>
                            )}
                        </Pressable>
                    )}

                    {!nextTier && (
                        <View style={styles.maxTierBadge}>
                            <Text style={styles.maxTierText}>🏆 Maximum Tier Reached</Text>
                        </View>
                    )}
                </View>

                {/* MANUAL CONTROLS */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{t('company.staffingControls')}</Text>

                    {/* Yuzdelik kontroller KALDIRILDI.
                        ±%5 / ±%10 mevcut sayinin yuzdesiydi, yani sayi
                        buyudukce adim da buyuyordu ve kontrolden cikiyordu.
                        Artik urun uretim barindaki mantik: mutlak sayi,
                        buyuyen tavan, 1/10/100 butonlari ve KUCUK yuzde
                        kisayollari. Bkz. components/common/StepperBar.tsx */}
                    <Text style={{ color: 'rgba(255,255,255,0.48)', fontSize: 11.5, lineHeight: 16, marginBottom: 10 }}>
                        {formatNumber(tempCount)} researchers produce{' '}
                        <Text style={{ color: theme.colors.rp, fontWeight: '800' }}>
                            {formatRP(researchOutput(tempCount))}
                        </Text>{' '}
                        per quarter, at {formatMoney(perResearcher)} each. Output scales with the
                        power of 0.85 — doubling the team does not double the discoveries.
                    </Text>

                    {/* The control the research lesson points at. */}
                    <TutorialTarget tutorialKey="rndHire">
                    <StepperBar
                        value={tempCount}
                        onChange={(val) => {
                            setTempCount(val);
                            if (hiredNotice) setHiredNotice(null);
                        }}
                        max={facility.capacity}
                        unit="researchers"
                        markers={[{ value: researcherCount, label: 'Now', color: '#FFFFFF' }]}
                        steps={[1, 10, 100]}
                        fillColor={canAfford ? theme.colors.rp : '#FF8A8A'}
                    />
                    </TutorialTarget>

                    {/* Summary & Confirm */}
                    <View style={styles.confirmSection}>
                        <View style={styles.costInfo}>
                            <Text style={styles.costLabel}>{t('company.estQuarterlyExpenses')}</Text>
                            <Text style={styles.costValue}>{formatMoney(quarterlyCost)}</Text>
                            <Text style={styles.costSource}>{t('company.deductedFromCapital')}</Text>
                            {immediateCost > 0 && (
                                <Text style={[styles.immediateCost, !canAfford && styles.textDanger]}>{t('company.initialCostV1', { v1: formatMoney(immediateCost) })}</Text>
                            )}
                        </View>

                        <Pressable
                            style={[
                                styles.confirmBtn,
                                !hasChanges && !hiredNotice && styles.confirmBtnDisabled,
                                !hasChanges && !!hiredNotice && styles.confirmBtnConfirmed,
                                (hasChanges && !canAfford && tempCount > researcherCount) && styles.confirmBtnDanger
                            ]}
                            onPress={handleConfirm}
                            disabled={!hasChanges}
                        >
                            <Text style={[
                                styles.confirmBtnText,
                                !hasChanges && !hiredNotice && styles.confirmBtnTextDisabled,
                            ]}>
                                {hasChanges
                                    ? 'CONFIRM'
                                    : (hiredNotice
                                        ? (hiredNotice.type === 'hired'
                                            ? `ARRIVES IN Q${hiredNotice.quarter}`
                                            : `UPDATED IN Q${hiredNotice.quarter}`)
                                        : 'NO CHANGE')}
                            </Text>
                        </Pressable>
                    </View>
                </View>

                {/* STATS CARD */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{t('company.quarterlyEconomics')}</Text>
                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>{t('company.totalSalaryCost')}</Text>
                        <Text style={[styles.statValue, styles.statDanger]}>{formatMoney(quarterlyCost)}</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>{t('company.totalRpOutput')}</Text>
                        <Text style={[styles.statValue, styles.statRp]}>+{formatRP(quarterlyRP)}</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>{t('company.availableCapital')}</Text>
                        <Text style={[styles.statValue, { color: '#FFFFFF' }]}>{formatMoney(companyCapital)}</Text>
                    </View>
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

export default LaboratoryScreen;

const styles = StyleSheet.create({
    shortcutRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 8 },
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        gap: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    backText: {
        color: theme.colors.textPrimary,
        fontSize: 20,
        fontWeight: '700',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    headerSubtitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    rpBadge: {
        backgroundColor: theme.colors.accentSoft,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.accent,
    },
    rpBadgeText: {
        color: theme.colors.rp,
        fontSize: 14,
        fontWeight: '800',
    },
    techTreeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.accentSoft,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.accent,
    },
    techTreeIcon: {
        fontSize: 20,
    },
    content: {
        padding: 20,
        // Clear of the floating nav bar. 40 left the last card sitting
        // against it, so the page looked cut off rather than finished.
        paddingBottom: NAV_BAR_CLEARANCE + 24,
        gap: 16,
    },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: 12,
    },
    facilityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    facilityIcon: {
        fontSize: 40,
    },
    facilityName: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    facilityDesc: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    tierBadge: {
        backgroundColor: theme.colors.accentSoft,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tierBadgeText: {
        color: theme.colors.textPrimary,
        fontSize: 12,
        fontWeight: '700',
    },
    capacityBar: {
        gap: 8,
        marginVertical: 8,
    },
    capacityBarBg: {
        height: 12,
        backgroundColor: theme.colors.border,
        borderRadius: 6,
        overflow: 'hidden',
    },
    capacityBarFill: {
        height: '100%',
        borderRadius: 6,
    },
    capacityText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    upgradeBtn: {
        backgroundColor: theme.colors.accentSoft,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.accent,
    },
    upgradeBtnDisabled: {
        backgroundColor: theme.colors.border,
        borderColor: theme.colors.border,
        opacity: 0.5,
    },
    upgradeBtnText: {
        color: theme.colors.textPrimary,
        fontSize: 16,
        fontWeight: '800',
    },
    upgradeBtnTextDisabled: {
        color: theme.colors.textMuted,
    },
    upgradeCost: {
        color: theme.colors.textPrimary,
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    upgradeCostDisabled: {
        color: theme.colors.textMuted,
    },
    maxTierBadge: {
        backgroundColor: 'rgba(5,168,246,0.1)',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    maxTierText: {
        color: theme.colors.textPrimary,
        fontSize: 14,
        fontWeight: '700',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        marginBottom: 8,
    },
    cardSubtitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    capacityHeader: {
        marginBottom: 16,
    },
    capacityOverlayText: {
        position: 'absolute',
        width: '100%',
        textAlign: 'center',
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
        top: -1, // Adjust visually to center in bar
        textShadowColor: 'rgba(28,36,44,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    controlsContainer: {
        gap: 8,
    },
    compactRow: {
        flexDirection: 'row',
        gap: 4,
        justifyContent: 'space-between',
    },
    compactBtn: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingVertical: 8,
        borderRadius: 6,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        minWidth: 40,
    },
    compactBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    confirmSection: {
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    costInfo: {
        flex: 1,
    },
    costLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    costValue: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    costSource: {
        fontSize: 10,
        color: theme.colors.textMuted,
    },
    immediateCost: {
        fontSize: 10,
        color: theme.colors.textPrimary,
        marginTop: 2,
    },
    textDanger: {
        color: theme.colors.danger,
    },
    confirmBtn: {
        backgroundColor: theme.categories.research,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
        marginLeft: 16,
    },
    confirmBtnDisabled: {
        backgroundColor: theme.colors.border,
        opacity: 0.5,
    },
    confirmBtnConfirmed: {
        backgroundColor: 'rgba(167, 139, 250, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.25)',
        opacity: 0.65,
    },
    confirmBtnDanger: {
        backgroundColor: theme.colors.destructive,
        opacity: 0.8,
    },
    confirmBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    confirmBtnTextDisabled: {
        color: theme.colors.textMuted,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    statLabel: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    statDanger: {
        color: theme.colors.danger,
    },
    statSuccess: {
        color: theme.colors.success,
    },
    /**
     * RP output. It used to wear `statSuccess` - the PROFIT GREEN - which
     * said this quarter's research was money earned. Green means one thing
     * and research is not it.
     */
    statRp: {
        color: theme.colors.rp,
    },
    errorText: {
        color: theme.colors.danger,
        fontSize: 16,
        textAlign: 'center',
        marginTop: 40,
    },
});
