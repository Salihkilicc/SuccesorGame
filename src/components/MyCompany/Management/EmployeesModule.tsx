import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { theme } from '../../../core/theme';
import { COMPANY_EVENTS, useCompanyManagement } from '../useCompanyManagement';
import GameModal from '../../common/GameModal';
import SectionCard from '../../common/SectionCard';
import GameButton from '../../common/GameButton';

interface EmployeesModalProps {
    visible: boolean;
    onClose: () => void;
}

const EmployeesModule = ({ visible, onClose }: EmployeesModalProps) => {
    const {
        employeeCount,
        factoryCount,
        employeeMorale,
        salaryTier,
        updateEmployees,
        changeSalaryTier,
        distributeBonus,
        organizeEvent,
        eventsHostedThisQuarter,

        companyCapital,
        lastQuarterProfit,
        bonusDistributedThisQuarter,
    } = useCompanyManagement();

    const [eventsVisible, setEventsVisible] = useState(false);
    const [successModal, setSuccessModal] = useState<{ visible: boolean; event?: typeof EVENTS[0] }>({ visible: false });

    const EVENTS = [
        { id: 'pizza', name: 'Pizza Party', cost: 50_000, morale: 5, desc: 'Herkes ekstra peynirli pizzaya bayıldı!' },
        { id: 'retreat', name: 'Team Building Retreat', cost: 250_000, morale: 12, desc: 'Doğada yapılan aktiviteler takımı kaynaştırdı.' },
        { id: 'gala', name: 'Grand Gala', cost: 1_000_000, morale: 25, desc: 'Şehirdeki en lüks otelde unutulmaz bir gece.' },
    ];

    const renderTierBtn = (tier: 'low' | 'average' | 'above_average', label: string) => {
        const isActive = salaryTier === tier;
        return (
            <GameButton
                key={tier}
                title={label}
                variant={isActive ? 'primary' : 'secondary'}
                onPress={() => changeSalaryTier(tier)}
                style={{ flex: 1 }}
                textStyle={{ fontSize: 11 }}
            />
        );
    };

    const handleEvent = (item: typeof EVENTS[0]) => {
        // Funds Check
        if (companyCapital < item.cost) {
            return;
        }

        organizeEvent(item.cost, item.morale);
        setEventsVisible(false);
        setTimeout(() => {
            setSuccessModal({ visible: true, event: item });
        }, 300);
    };

    const handleBonus = () => {
        const bonusCost = lastQuarterProfit * 0.05;
        if (bonusDistributedThisQuarter || lastQuarterProfit <= 0 || companyCapital < bonusCost) return;

        distributeBonus(5); // 5% param kept for hook compatibility, though ignored by store

        setSuccessModal({
            visible: true,
            event: {
                id: 'bonus',
                name: 'Bonuses Distributed! 💸',
                desc: 'Your employees appreciate your generosity! Motivation has skyrocketed.',
                cost: bonusCost,
                morale: 15
            }
        });
    };

    const EventItem = ({ item }: { item: typeof EVENTS[0] }) => {
        const canAfford = companyCapital >= item.cost;
        return (
            <View
                style={[
                    styles.eventCard,
                    !canAfford && styles.eventCardDisabled
                ]}
            >
                <View style={styles.eventCardContent}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.eventName}>{item.name}</Text>
                        <View style={styles.eventStats}>
                            <View style={styles.statBadge}>
                                <Text style={styles.statLabel}>COST</Text>
                                <Text style={styles.statValue}>
                                    ${item.cost >= 1_000_000
                                        ? `${(item.cost / 1_000_000).toFixed(1)}M`
                                        : `${(item.cost / 1_000).toFixed(0)}K`}
                                </Text>
                            </View>
                            <View style={[styles.statBadge, styles.moraleBadge]}>
                                <Text style={styles.statLabel}>BOOST</Text>
                                <Text style={[styles.statValue, styles.moraleBoostValue]}>+{item.morale}%</Text>
                            </View>
                        </View>
                    </View>

                    <GameButton
                        title={canAfford ? "SELECT" : "NO FUNDS"}
                        variant={canAfford ? "primary" : "secondary"}
                        disabled={!canAfford}
                        onPress={() => handleEvent(item)}
                        style={styles.eventButton}
                        textStyle={{ fontSize: 12, fontWeight: '800' }}
                    />
                </View>
            </View>
        );
    };

    return (
        <GameModal
            visible={visible}
            onClose={onClose}
            title="👥 Employees & Morale"
        >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 20 }}>

                {/* Premium Morale Dashboard */}
                <View style={styles.moraleDashboard}>
                    <View style={styles.dashboardHeader}>
                        <View>
                            <Text style={styles.dashboardLabel}>EMPLOYEE MORALE</Text>
                            <Text style={styles.dashboardValue}>{employeeMorale}%</Text>
                        </View>
                        <View style={styles.employeeCountBadge}>
                            <Text style={styles.employeeCountLabel}>WORKFORCE</Text>
                            <Text style={styles.employeeCountValue}>{employeeCount}</Text>
                        </View>
                    </View>

                    {/* Large Premium Progress Bar */}
                    <View style={styles.largeMoraleTrack}>
                        <View
                            style={[
                                styles.largeMoraleFill,
                                {
                                    width: `${employeeMorale}%`,
                                    backgroundColor:
                                        employeeMorale < 30 ? '#FF453A' :
                                            employeeMorale < 50 ? '#FF9F0A' :
                                                employeeMorale < 70 ? '#32D74B' :
                                                    '#30D158'
                                }
                            ]}
                        />
                    </View>

                    <Text style={styles.dashboardDesc}>
                        {employeeMorale >= 70 ? '🎉 Excellent morale! Your team is highly motivated.' :
                            employeeMorale >= 50 ? '✅ Good morale. Keep up the positive environment.' :
                                employeeMorale >= 30 ? '⚠️ Morale needs attention. Consider boosting activities.' :
                                    '🚨 Critical! Low morale affects productivity.'}
                    </Text>
                </View>

                {/* Salary Tier */}
                <View>
                    <Text style={styles.sectionTitle}>SALARY POLICY</Text>
                    <View style={styles.tierContainer}>
                        {renderTierBtn('low', 'Low')}
                        {renderTierBtn('average', 'Avg')}
                        {renderTierBtn('above_average', 'High')}
                    </View>
                </View>

                {/* Actions */}
                <View>
                    <Text style={styles.sectionTitle}>MORALE ACTIONS</Text>
                    <View style={{ gap: 10 }}>
                        <View style={styles.premiumActionCard}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.actionCardTitle}>💰 Distribute Bonus</Text>
                                <Text style={styles.actionCardSubtitle}>
                                    {lastQuarterProfit <= 0 ? "No Profit to Share" :
                                        bonusDistributedThisQuarter ? "Limit Reached (Once per Qtr)" :
                                            `Est. Cost: $${(lastQuarterProfit * 0.05 / 1000000).toFixed(2)}M`}
                                </Text>
                            </View>
                            <GameButton
                                title={lastQuarterProfit > 0 && !bonusDistributedThisQuarter ? "5%" : "LOCKED"}
                                variant={lastQuarterProfit > 0 && !bonusDistributedThisQuarter ? "primary" : "secondary"}
                                disabled={lastQuarterProfit <= 0 || bonusDistributedThisQuarter}
                                onPress={handleBonus}
                                style={{ minWidth: 80 }}
                                textStyle={{ fontSize: 12, fontWeight: '800' }}
                            />
                        </View>

                        <View style={styles.premiumActionCard}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.actionCardTitle}>🎉 Organize Event</Text>
                                <Text style={styles.actionCardSubtitle}>
                                    {eventsHostedThisQuarter >= 2 ? "Limit Reached (2/2)" : "Boost team morale"}
                                </Text>
                            </View>
                            <GameButton
                                title={eventsHostedThisQuarter >= 2 ? "LOCKED" : "SELECT"}
                                variant={eventsHostedThisQuarter >= 2 ? "secondary" : "primary"}
                                disabled={eventsHostedThisQuarter >= 2}
                                onPress={() => setEventsVisible(true)}
                                style={{ minWidth: 80 }}
                                textStyle={{ fontSize: 12, fontWeight: '800' }}
                            />
                        </View>
                    </View>
                </View>

            </ScrollView>

            {/* Events Modal - Premium Dark Fintech Style */}
            <GameModal
                visible={eventsVisible}
                onClose={() => setEventsVisible(false)}
                title="🚀 Boost Employee Morale"
            >
                <View style={{ gap: 20 }}>
                    {/* Current Morale Display */}
                    <View style={styles.moraleSection}>
                        <View style={styles.moraleHeader}>
                            <Text style={styles.moraleLabel}>CURRENT MORALE</Text>
                            <Text style={styles.moraleValue}>{employeeMorale}%</Text>
                        </View>

                        {/* Premium Progress Bar */}
                        <View style={styles.progressTrack}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${employeeMorale}%`,
                                        backgroundColor:
                                            employeeMorale < 30 ? '#FF453A' :
                                                employeeMorale < 50 ? '#FF9F0A' :
                                                    employeeMorale < 70 ? '#32D74B' :
                                                        '#30D158'
                                    }
                                ]}
                            />
                        </View>

                        <Text style={styles.moraleDesc}>
                            Boosting morale improves productivity and reduces turnover
                        </Text>
                    </View>

                    {/* Event Cards */}
                    <View style={{ gap: 12 }}>
                        <Text style={styles.eventsTitle}>SELECT AN EVENT</Text>
                        <FlatList
                            data={EVENTS}
                            keyExtractor={i => i.id}
                            renderItem={({ item }) => <EventItem item={item} />}
                            contentContainerStyle={{ gap: 10 }}
                            scrollEnabled={false}
                        />
                    </View>
                </View>
            </GameModal>

            {/* Success Overlay Modal */}
            {successModal.visible && successModal.event && (
                <GameModal
                    visible={true}
                    onClose={() => setSuccessModal({ visible: false })}
                    title={successModal.event.name}
                >
                    <View style={{ alignItems: 'center', padding: 20, gap: 16 }}>
                        <Text style={{ fontSize: 40 }}>🎉</Text>
                        <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', fontSize: 16 }}>
                            {successModal.event.desc}
                        </Text>
                        <Text style={{ color: theme.colors.danger, fontSize: 18, fontWeight: '700' }}>
                            Total Cost: -${successModal.event.cost.toLocaleString()}
                        </Text>
                        <GameButton
                            title="Great!"
                            onPress={() => setSuccessModal({ visible: false })}
                            style={{ width: '100%', marginTop: 20 }}
                        />
                    </View>
                </GameModal>
            )}
        </GameModal>
    );
};

export default EmployeesModule;

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        color: theme.colors.textMuted,
        letterSpacing: 0.5,
        marginBottom: 8,
        marginLeft: 4,
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
    },
    miniBtn: {
        paddingVertical: 8,
        paddingHorizontal: 0,
        minHeight: 36,
    },
    centralDisplay: {
        alignItems: 'center',
        width: 100,
    },
    centralValue: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        fontVariant: ['tabular-nums'],
    },
    centralMini: {
        fontSize: 10,
        color: theme.colors.textSecondary,
    },
    minWarning: {
        fontSize: 10,
        color: theme.colors.textMuted,
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 8,
    },
    tierContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    // Premium Main Modal Dashboard
    moraleDashboard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: '#333',
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 12,
    },
    dashboardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    dashboardLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#8E8E93',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    dashboardValue: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#30D158',
        letterSpacing: -1,
    },
    employeeCountBadge: {
        backgroundColor: '#2C2C2E',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#0A84FF',
        alignItems: 'center',
    },
    employeeCountLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#8E8E93',
        letterSpacing: 0.8,
        marginBottom: 4,
    },
    employeeCountValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    largeMoraleTrack: {
        height: 16,
        backgroundColor: '#2C2C2E',
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333',
    },
    largeMoraleFill: {
        height: '100%',
        borderRadius: 8,
        shadowColor: '#30D158',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
    },
    dashboardDesc: {
        fontSize: 13,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 19,
        fontWeight: '500',
    },
    premiumActionCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#333',
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 6,
    },
    actionCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    actionCardSubtitle: {
        fontSize: 12,
        color: '#8E8E93',
        lineHeight: 16,
    },
    // Premium Morale Boost Modal Styles
    moraleSection: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#333',
        gap: 12,
    },
    moraleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    moraleLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#8E8E93',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    moraleValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#30D158',
    },
    progressTrack: {
        height: 12,
        backgroundColor: '#2C2C2E',
        borderRadius: 6,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333',
    },
    progressFill: {
        height: '100%',
        borderRadius: 6,
        shadowColor: '#30D158',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
    },
    moraleDesc: {
        fontSize: 13,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 18,
    },
    eventsTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#8E8E93',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginLeft: 4,
    },
    eventCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#0A84FF',
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 8,
    },
    eventCardDisabled: {
        borderColor: '#333',
        opacity: 0.5,
    },
    eventCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    eventName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    eventStats: {
        flexDirection: 'row',
        gap: 12,
    },
    statBadge: {
        backgroundColor: '#2C2C2E',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    moraleBadge: {
        borderColor: '#30D158',
        backgroundColor: 'rgba(48, 209, 88, 0.1)',
    },
    statLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#8E8E93',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    statValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    moraleBoostValue: {
        color: '#30D158',
    },
    eventButton: {
        minWidth: 90,
        paddingVertical: 10,
    },
});
