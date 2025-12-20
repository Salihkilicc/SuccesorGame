import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, FlatList } from 'react-native';
import { theme } from '../../../theme';
import { COMPANY_EVENTS, useCompanyManagement } from '../useCompanyManagement';
import { useStatsStore } from '../../../store';

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
            <Pressable
                onPress={() => changeSalaryTier(tier)}
                style={[
                    styles.tierBtn,
                    isActive && styles.tierBtnActive
                ]}>
                <Text style={[styles.tierBtnText, isActive && styles.tierBtnTextActive]}>{label}</Text>
            </Pressable>
        );
    };

    const EventItem = ({ item }: { item: typeof COMPANY_EVENTS[0] }) => {
        const total = item.cost * employeeCount;
        return (
            <Pressable
                onPress={() => {
                    organizeEvent(item.id);
                    setEventsVisible(false);
                }}
                style={({ pressed }) => [styles.eventRow, pressed && styles.eventRowPressed]}
            >
                <View style={{ flex: 1 }}>
                    <Text style={styles.eventTitle}>{item.name}</Text>
                    <Text style={styles.eventEffect}>Morale +{item.morale}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.eventCost}>${total.toLocaleString()}</Text>
                    <Text style={styles.eventPerHead}>${item.cost} / head</Text>
                </View>
            </Pressable>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.fullscreenOverlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={styles.fullscreenContent}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>👥 Employees & Morale</Text>
                            <Text style={styles.subtitle}>Workforce management and benefits.</Text>
                        </View>
                        <View style={styles.headerRight}>
                            <View style={[styles.badge,
                            employeeMorale > 80 ? styles.badgeSuccess :
                                employeeMorale < 40 ? styles.badgeDanger : {}
                            ]}>
                                <Text style={[styles.badgeText,
                                (employeeMorale > 80 || employeeMorale < 40) && { color: '#000' }
                                ]}>Morale: {employeeMorale}%</Text>
                            </View>
                            <Pressable onPress={onClose} style={styles.closeBtn}>
                                <Text style={styles.closeBtnText}>×</Text>
                            </Pressable>
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.md }}>
                        {/* Workforce Controls */}
                        <View>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>WORKFORCE SIZE</Text>
                                <Text style={styles.sectionMeta}>{employeeCount.toLocaleString()} Active</Text>
                            </View>

                            <View style={styles.controlsRow}>
                                <View style={{ flex: 1, gap: 4 }}>
                                    <Pressable style={styles.miniBtn} onPress={() => updateEmployees(-100)} disabled={employeeCount - 100 < minRequired}>
                                        <Text style={styles.miniBtnText}>-100</Text>
                                    </Pressable>
                                    <Pressable style={styles.miniBtn} onPress={() => updateEmployees(-1000)} disabled={employeeCount - 1000 < minRequired}>
                                        <Text style={styles.miniBtnText}>-1k</Text>
                                    </Pressable>
                                </View>

                                <View style={styles.centralDisplay}>
                                    <Text style={styles.centralValue}>{employeeCount.toLocaleString()}</Text>
                                    <Text style={styles.centralMini}>Employees</Text>
                                </View>

                                <View style={{ flex: 1, gap: 4, alignItems: 'flex-end' }}>
                                    <Pressable style={[styles.miniBtn, styles.miniBtnPlus]} onPress={() => updateEmployees(100)}>
                                        <Text style={[styles.miniBtnText, { color: theme.colors.success }]}>+100</Text>
                                    </Pressable>
                                    <Pressable style={[styles.miniBtn, styles.miniBtnPlus]} onPress={() => updateEmployees(1000)}>
                                        <Text style={[styles.miniBtnText, { color: theme.colors.success }]}>+1k</Text>
                                    </Pressable>
                                </View>
                            </View>
                            <Text style={styles.minWarning}>Minimum Required: {minRequired.toLocaleString()}</Text>
                        </View>

                        {/* Salary Tier */}
                        <View>
                            <Text style={styles.sectionTitle}>SALARY POLICY</Text>
                            <View style={styles.tierContainer}>
                                {renderTierBtn('low', 'Low (-2 Morale)')}
                                {renderTierBtn('average', 'Average')}
                                {renderTierBtn('above_average', 'High (+2 Morale)')}
                            </View>
                        </View>

                        {/* Actions */}
                        <View>
                            <Text style={styles.sectionTitle}>ACTIONS</Text>
                            <View style={styles.actionsGrid}>
                                <Pressable
                                    onPress={() => distributeBonus(5)}
                                    style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
                                >
                                    <Text style={styles.actionBtnEmoji}>💰</Text>
                                    <Text style={styles.actionBtnLabel}>Distribute Bonus</Text>
                                    <Text style={styles.actionBtnMeta}>5% Profit</Text>
                                </Pressable>

                                <Pressable
                                    onPress={() => setEventsVisible(true)}
                                    style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
                                >
                                    <Text style={styles.actionBtnEmoji}>🎉</Text>
                                    <Text style={styles.actionBtnLabel}>Organize Event</Text>
                                    <Text style={styles.actionBtnMeta}>Boost Morale</Text>
                                </Pressable>
                            </View>
                        </View>
                    </ScrollView>

                    <Pressable onPress={onClose} style={styles.doneBtn}>
                        <Text style={styles.doneBtnText}>Done</Text>
                    </Pressable>
                </View>

                {/* Events Modal */}
                <Modal visible={eventsVisible} transparent animationType="fade" onRequestClose={() => setEventsVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <Pressable style={StyleSheet.absoluteFill} onPress={() => setEventsVisible(false)} />
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Organize Team Event</Text>
                                <Pressable onPress={() => setEventsVisible(false)}>
                                    <Text style={styles.closeText}>Close</Text>
                                </Pressable>
                            </View>
                            <FlatList
                                data={COMPANY_EVENTS}
                                keyExtractor={i => i.id}
                                renderItem={({ item }) => <EventItem item={item} />}
                                contentContainerStyle={{ padding: 16 }}
                            />
                        </View>
                    </View>
                </Modal>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    fullscreenOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: theme.spacing.lg,
    },
    fullscreenContent: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
        maxHeight: '90%',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerRight: {
        alignItems: 'flex-end',
        gap: 8,
    },
    title: {
        fontSize: theme.typography.subtitle,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    subtitle: {
        fontSize: theme.typography.caption,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    closeBtn: {
        padding: 4,
    },
    closeBtnText: {
        fontSize: 24,
        color: theme.colors.textSecondary,
        lineHeight: 24,
    },
    doneBtn: {
        backgroundColor: theme.colors.cardSoft,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginTop: 8,
    },
    doneBtnText: {
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    badge: {
        backgroundColor: theme.colors.cardSoft,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    badgeSuccess: { backgroundColor: theme.colors.success },
    badgeDanger: { backgroundColor: theme.colors.danger },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        color: theme.colors.textMuted,
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    sectionMeta: {
        fontSize: 10,
        color: theme.colors.textSecondary,
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    miniBtn: {
        backgroundColor: '#2A1818',
        borderRadius: 6,
        paddingVertical: 6,
        paddingHorizontal: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#4A2020',
    },
    miniBtnPlus: {
        backgroundColor: '#182A1F',
        borderColor: '#204A2D',
    },
    miniBtnText: {
        color: theme.colors.danger,
        fontSize: 11,
        fontWeight: '700',
    },
    centralDisplay: {
        alignItems: 'center',
    },
    centralValue: {
        fontSize: 18,
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
    },
    tierContainer: {
        flexDirection: 'row',
        backgroundColor: theme.colors.cardSoft,
        padding: 2,
        borderRadius: 8,
    },
    tierBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 6,
        borderRadius: 6,
    },
    tierBtnActive: {
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    tierBtnText: {
        fontSize: 11,
        color: theme.colors.textSecondary,
    },
    tierBtnTextActive: {
        color: theme.colors.textPrimary,
        fontWeight: '700',
    },
    actionsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        backgroundColor: theme.colors.cardSoft,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    actionBtnPressed: {
        backgroundColor: theme.colors.card,
        transform: [{ scale: 0.98 }],
    },
    actionBtnEmoji: {
        fontSize: 24,
        marginBottom: 8,
    },
    actionBtnLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    actionBtnMeta: {
        fontSize: 10,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    closeText: {
        color: theme.colors.textSecondary,
    },
    eventRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    eventRowPressed: {
        opacity: 0.7,
    },
    eventTitle: {
        color: theme.colors.textPrimary,
        fontWeight: '600',
        fontSize: 14,
    },
    eventEffect: {
        color: theme.colors.success,
        fontSize: 12,
        marginTop: 2,
    },
    eventCost: {
        color: theme.colors.textPrimary,
        fontWeight: '700',
        fontSize: 14,
    },
    eventPerHead: {
        color: theme.colors.textMuted,
        fontSize: 10,
    }
});

export default EmployeesModule;
