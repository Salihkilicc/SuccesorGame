import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { theme } from '../../../theme';
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
            <SectionCard
                title={item.name}
                subtitle={`Costs $${(item.cost / 1000).toFixed(0)}k | +${item.morale} Morale`}
                rightText={!canAfford ? 'No Funds' : undefined}
                disabled={!canAfford}
                onPress={() => handleEvent(item)}
            />
        );
    };

    return (
        <GameModal
            visible={visible}
            onClose={onClose}
            title="👥 Employees & Morale"
            subtitle={`Morale: ${employeeMorale}%`}
        >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.md }}>



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
                    <Text style={styles.sectionTitle}>ACTIONS</Text>
                    <View style={{ gap: 8 }}>
                        <SectionCard
                            title="Distribute Bonus 💰"
                            subtitle={
                                lastQuarterProfit <= 0 ? "No Profit to Share" :
                                    bonusDistributedThisQuarter ? "Limit Reached (Once per Qtr)" :
                                        `(Est. Cost: $${(lastQuarterProfit * 0.05 / 1000000).toFixed(2)}M)`
                            }
                            disabled={lastQuarterProfit <= 0 || bonusDistributedThisQuarter}
                            rightText={lastQuarterProfit > 0 && !bonusDistributedThisQuarter ? "5%" : undefined}
                            onPress={handleBonus}
                        />
                        <SectionCard
                            title="Organize Event 🎉"
                            subtitle={eventsHostedThisQuarter >= 2 ? "Limit Reached (2/2)" : "Boost Morale"}
                            disabled={eventsHostedThisQuarter >= 2}
                            onPress={() => setEventsVisible(true)}
                        />
                    </View>
                </View>

            </ScrollView>

            {/* Events Modal */}
            <GameModal
                visible={eventsVisible}
                onClose={() => setEventsVisible(false)}
                title="Organize Team Event"
            >
                <FlatList
                    data={EVENTS}
                    keyExtractor={i => i.id}
                    renderItem={({ item }) => <EventItem item={item} />}
                    contentContainerStyle={{ gap: 8 }}
                />
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
});
