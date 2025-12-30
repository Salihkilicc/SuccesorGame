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
        organizeEvent
    } = useCompanyManagement();

    const [eventsVisible, setEventsVisible] = useState(false);
    const minRequired = factoryCount * 300;

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

    const EventItem = ({ item }: { item: typeof COMPANY_EVENTS[0] }) => {
        const total = item.cost * employeeCount;
        return (
            <SectionCard
                title={item.name}
                subtitle={`Morale +${item.morale} | $${item.cost}/head`}
                rightText={`$${total.toLocaleString()}`}
                onPress={() => {
                    organizeEvent(item.id);
                    setEventsVisible(false);
                }}
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

                {/* Workforce Controls */}
                <View>
                    <Text style={styles.sectionTitle}>WORKFORCE SIZE ({employeeCount.toLocaleString()} Active)</Text>

                    <View style={styles.controlsRow}>
                        <View style={{ flex: 1, gap: 4 }}>
                            <GameButton
                                title="-100"
                                variant="danger"
                                onPress={() => updateEmployees(-100)}
                                disabled={employeeCount - 100 < minRequired}
                                style={styles.miniBtn}
                                textStyle={{ fontSize: 12 }}
                            />
                            <GameButton
                                title="-1k"
                                variant="danger"
                                onPress={() => updateEmployees(-1000)}
                                disabled={employeeCount - 1000 < minRequired}
                                style={styles.miniBtn}
                                textStyle={{ fontSize: 12 }}
                            />
                        </View>

                        <View style={styles.centralDisplay}>
                            <Text style={styles.centralValue}>{employeeCount.toLocaleString()}</Text>
                            <Text style={styles.centralMini}>Employees</Text>
                        </View>

                        <View style={{ flex: 1, gap: 4 }}>
                            <GameButton
                                title="+100"
                                variant="secondary"
                                onPress={() => updateEmployees(100)}
                                style={styles.miniBtn}
                                textStyle={{ fontSize: 12, color: theme.colors.success }}
                            />
                            <GameButton
                                title="+1k"
                                variant="secondary"
                                onPress={() => updateEmployees(1000)}
                                style={styles.miniBtn}
                                textStyle={{ fontSize: 12, color: theme.colors.success }}
                            />
                        </View>
                    </View>
                    <Text style={styles.minWarning}>Minimum Required: {minRequired.toLocaleString()}</Text>
                </View>

                {/* Salary Tier */}
                <View>
                    <Text style={styles.sectionTitle}>SALARY POLICY</Text>
                    <View style={styles.tierContainer}>
                        {renderTierBtn('low', 'Low (-2)')}
                        {renderTierBtn('average', 'Avg')}
                        {renderTierBtn('above_average', 'High (+2)')}
                    </View>
                </View>

                {/* Actions */}
                <View>
                    <Text style={styles.sectionTitle}>ACTIONS</Text>
                    <View style={{ gap: 8 }}>
                        <SectionCard
                            title="Distribute Bonus 💰"
                            subtitle="Costs 5% of Profit"
                            onPress={() => distributeBonus(5)}
                        />
                        <SectionCard
                            title="Organize Event 🎉"
                            subtitle="Boost Morale"
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
                    data={COMPANY_EVENTS}
                    keyExtractor={i => i.id}
                    renderItem={({ item }) => <EventItem item={item} />}
                    contentContainerStyle={{ gap: 8 }}
                />
            </GameModal>
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
