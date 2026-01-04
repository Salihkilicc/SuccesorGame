import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../../theme';
import { useLaboratoryStore } from '../../../store/useLaboratoryStore';
import { useStatsStore } from '../../../store';
import {
    getFacilityByTier,
    getNextTier,
    calculateQuarterlyCost,
    calculateQuarterlyRP,
    RESEARCHER_ECONOMICS,
} from '../../../features/laboratory/data/laboratoryData';

const formatMoney = (value: number = 0): string => {
    if (value === undefined || value === null) return '$0';
    if (value >= 1_000_000_000) {
        return `$${(value / 1_000_000_000).toFixed(1)}B`;
    }
    if (value >= 1_000_000) {
        return `$${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
        return `$${(value / 1_000).toFixed(1)}K`;
    }
    return `$${value.toLocaleString()}`;
};

const formatRP = (value: number): string => {
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M RP`;
    }
    if (value >= 1_000) {
        return `${(value / 1_000).toFixed(1)}K RP`;
    }
    return `${value.toLocaleString()} RP`;
};

const LaboratoryScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const { currentTier, researcherCount, totalRP, upgradeFacility, hireResearchers, fireResearchers } =
        useLaboratoryStore();
    const { companyCapital, setField } = useStatsStore();

    // Local state for draft changes
    const [tempCount, setTempCount] = useState(researcherCount);

    // Sync tempCount when actual researcherCount changes (e.g. after confirm or external change)
    useEffect(() => {
        setTempCount(researcherCount);
    }, [researcherCount]);

    const facility = getFacilityByTier(currentTier);
    const nextTier = getNextTier(currentTier);

    // Derived calculations
    const quarterlyCost = calculateQuarterlyCost(tempCount);
    const quarterlyRP = calculateQuarterlyRP(tempCount);
    const costDiff = calculateQuarterlyCost(tempCount - researcherCount); // Immediate hiring cost if any

    // NOTE: hireResearchers assumes immediate payment of first quarter salary? 
    // Based on user prompt "Expenses will be deducted from Capital", checking if we need to show immediate cost.
    // The store logic deducts (count * Salary). 
    // If tempCount > researcherCount, we need to pay (tempCount - researcherCount) * Salary * 1 (now).
    const immediateCost = Math.max(0, tempCount - researcherCount) * RESEARCHER_ECONOMICS.SALARY_PER_QUARTER;

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
                Alert.alert('Hiring Complete', `Successfully hired ${toHire} researchers.`);
            } else {
                Alert.alert('Error', result.message);
                // Reset temp count on failure
                setTempCount(researcherCount);
            }
        } else {
            // Firing
            const toFire = researcherCount - tempCount;
            fireResearchers(toFire);
            Alert.alert('Headcount Reduced', `Reduced research staff by ${toFire}.`);
        }
    };

    if (!facility) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Invalid facility tier</Text>
            </View>
        );
    }

    const canUpgrade = nextTier && companyCapital >= (nextTier.upgradeCost?.cash || 0) && totalRP >= (nextTier.upgradeCost?.rp || 0);
    const hasChanges = tempCount !== researcherCount;

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>←</Text>
                </Pressable>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>R&D Laboratory</Text>
                    <Text style={styles.headerSubtitle}>Target Output: +{formatRP(quarterlyRP)}/q</Text>
                </View>
                <View style={styles.rpBadge}>
                    <Text style={styles.rpBadgeText}>{formatRP(totalRP)}</Text>
                </View>
                <Pressable
                    style={styles.techTreeBtn}
                    onPress={() => (navigation as any).navigate('TechTree')}
                >
                    <Text style={styles.techTreeIcon}>🔬</Text>
                </Pressable>
            </View>

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
                            <Text style={styles.tierBadgeText}>Tier {currentTier}</Text>
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
                                        backgroundColor: hasChanges ? (canAfford ? theme.colors.accent : theme.colors.danger) : theme.colors.accent
                                    }
                                ]}
                            />
                        </View>
                        <Text style={styles.capacityText}>
                            {tempCount.toLocaleString()} / {facility.capacity.toLocaleString()}
                        </Text>
                    </View>

                    {nextTier && (
                        <Pressable
                            style={[styles.upgradeBtn, !canUpgrade && styles.upgradeBtnDisabled]}
                            onPress={handleUpgrade}
                            disabled={!canUpgrade}
                        >
                            <Text style={[styles.upgradeBtnText, !canUpgrade && styles.upgradeBtnTextDisabled]}>
                                Upgrade to {nextTier.name}
                            </Text>
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
                    <Text style={styles.cardTitle}>Staffing Controls</Text>

                    {/* Capacity Progress Bar */}
                    <View style={styles.capacityHeader}>
                        <View style={styles.capacityBarBg}>
                            {/* Current Fill */}
                            <View
                                style={[
                                    styles.capacityBarFill,
                                    { width: `${(researcherCount / facility.capacity) * 100}%`, backgroundColor: theme.colors.textSecondary, opacity: 0.3 }
                                ]}
                            />
                            {/* Target Fill */}
                            <View
                                style={[
                                    styles.capacityBarFill,
                                    {
                                        position: 'absolute',
                                        width: `${(tempCount / facility.capacity) * 100}%`,
                                        backgroundColor: hasChanges ? (canAfford ? theme.colors.accent : theme.colors.danger) : theme.colors.accent
                                    }
                                ]}
                            />
                        </View>
                        <Text style={styles.capacityOverlayText}>
                            {tempCount.toLocaleString()} / {facility.capacity.toLocaleString()} Researchers
                        </Text>
                    </View>

                    {/* Compact Controls */}
                    <View style={styles.controlsContainer}>
                        {/* Row 1: Percentages */}
                        <View style={styles.compactRow}>
                            {[-0.10, -0.05, 0.05, 0.10].map((pct) => (
                                <Pressable key={pct} style={styles.compactBtn} onPress={() => handlePercentage(pct)}>
                                    <Text style={styles.compactBtnText}>{pct > 0 ? '+' : ''}{pct * 100}%</Text>
                                </Pressable>
                            ))}
                        </View>

                        {/* Row 2: Numbers */}
                        <View style={styles.compactRow}>
                            {[-100, -10, -1, 1, 10, 100].map((num) => (
                                <Pressable key={num} style={styles.compactBtn} onPress={() => handleAdjust(num)}>
                                    <Text style={styles.compactBtnText}>{num > 0 ? '+' : ''}{num}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* Summary & Confirm */}
                    <View style={styles.confirmSection}>
                        <View style={styles.costInfo}>
                            <Text style={styles.costLabel}>Est. Quarterly Expenses</Text>
                            <Text style={styles.costValue}>{formatMoney(quarterlyCost)}</Text>
                            <Text style={styles.costSource}>Deducted from Capital</Text>
                            {immediateCost > 0 && (
                                <Text style={[styles.immediateCost, !canAfford && styles.textDanger]}>
                                    Initial Cost: {formatMoney(immediateCost)}
                                </Text>
                            )}
                        </View>

                        <Pressable
                            style={[
                                styles.confirmBtn,
                                !hasChanges && styles.confirmBtnDisabled,
                                (!canAfford && tempCount > researcherCount) && styles.confirmBtnDanger
                            ]}
                            onPress={handleConfirm}
                            disabled={!hasChanges}
                        >
                            <Text style={styles.confirmBtnText}>
                                {hasChanges ? 'CONFIRM' : 'NO CHANGE'}
                            </Text>
                        </Pressable>
                    </View>
                </View>

                {/* STATS CARD */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Quarterly Economics</Text>
                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Total Salary Cost:</Text>
                        <Text style={[styles.statValue, styles.statDanger]}>{formatMoney(quarterlyCost)}</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Total RP Output:</Text>
                        <Text style={[styles.statValue, styles.statSuccess]}>+{formatRP(quarterlyRP)}</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Available Capital:</Text>
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
        color: theme.colors.accent,
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
        paddingBottom: 40, // Ensure bottom padding for scrolling
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
        color: theme.colors.accent,
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
        color: theme.colors.accent,
        fontSize: 16,
        fontWeight: '800',
    },
    upgradeBtnTextDisabled: {
        color: theme.colors.textMuted,
    },
    upgradeCost: {
        color: theme.colors.accent,
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    upgradeCostDisabled: {
        color: theme.colors.textMuted,
    },
    maxTierBadge: {
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    maxTierText: {
        color: '#FFD700',
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
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        top: -1, // Adjust visually to center in bar
        textShadowColor: 'rgba(0,0,0,0.5)',
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
        color: theme.colors.accent,
        marginTop: 2,
    },
    textDanger: {
        color: theme.colors.danger,
    },
    confirmBtn: {
        backgroundColor: theme.colors.success,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
        marginLeft: 16,
    },
    confirmBtnDisabled: {
        backgroundColor: theme.colors.border,
    },
    confirmBtnDanger: {
        backgroundColor: theme.colors.danger,
        opacity: 0.8,
    },
    confirmBtnText: {
        color: '#fff',
        fontWeight: '700',
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
    errorText: {
        color: theme.colors.danger,
        fontSize: 16,
        textAlign: 'center',
        marginTop: 40,
    },
});
