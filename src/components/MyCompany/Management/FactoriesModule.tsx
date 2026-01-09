import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { theme } from '../../../core/theme';
import { FACTORY_CAPACITY, FACTORY_COST, useCompanyManagement } from '../useCompanyManagement';

const ControlButton = ({ label, onPress, disabled, tone = 'default' }: any) => (
    <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
            styles.controlBtn,
            tone === 'danger' && styles.controlBtnNegetive,
            tone === 'success' && styles.controlBtnPositive,
            disabled && styles.controlBtnDisabled,
            pressed && styles.controlBtnPressed,
        ]}>
        <Text style={[
            styles.controlBtnText,
            tone === 'danger' && { color: theme.colors.danger },
            tone === 'success' && { color: theme.colors.success },
            disabled && { color: theme.colors.textMuted }
        ]}>{label}</Text>
    </Pressable>
);

interface FactoriesModalProps {
    visible: boolean;
    onClose: () => void;
}

const FactoriesModule = ({ visible, onClose }: FactoriesModalProps) => {
    const { factoryCount, updateFactories } = useCompanyManagement();

    const monthlyCost = factoryCount * FACTORY_COST;
    const capacity = factoryCount * FACTORY_CAPACITY;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>🏭 Factories & Production</Text>
                            <Text style={styles.subtitle}>Manage your manufacturing infrastructure.</Text>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>×</Text>
                        </Pressable>
                    </View>

                    <View style={styles.statRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Total Factories</Text>
                            <Text style={styles.statValue}>{factoryCount}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Capacity</Text>
                            <Text style={styles.statValue}>{capacity.toLocaleString()} / mo</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Fixed Expenses</Text>
                            <Text style={[styles.statValue, { color: theme.colors.danger }]}>
                                -${(monthlyCost / 1000).toFixed(0)}k
                            </Text>
                        </View>
                    </View>

                    <View style={styles.controlsRow}>
                        <ControlButton label="-10" onPress={() => updateFactories(-10)} disabled={factoryCount < 10} tone="danger" />
                        <ControlButton label="-1" onPress={() => updateFactories(-1)} disabled={factoryCount < 1} tone="danger" />

                        <View style={styles.controlLabelContainer}>
                            <Text style={styles.controlLabel}>FACTORIES</Text>
                        </View>

                        <ControlButton label="+1" onPress={() => updateFactories(1)} tone="success" />
                        <ControlButton label="+10" onPress={() => updateFactories(10)} tone="success" />
                    </View>

                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                            Each factory adds <Text style={{ fontWeight: '700' }}>+1,000 capacity</Text>, <Text style={{ fontWeight: '700' }}>300 staff</Text>, and <Text style={{ fontWeight: '700' }}>$50k expenses</Text>.
                        </Text>
                    </View>

                    <Pressable onPress={onClose} style={styles.doneBtn}>
                        <Text style={styles.doneBtnText}>Done</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: theme.spacing.lg,
    },
    modalContent: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        gap: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: theme.typography.subtitle,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    subtitle: {
        fontSize: theme.typography.caption,
        color: theme.colors.textSecondary,
        marginTop: 4,
    },
    closeBtn: {
        padding: 4,
    },
    closeBtnText: {
        fontSize: 24,
        color: theme.colors.textSecondary,
        lineHeight: 24,
    },
    statRow: {
        flexDirection: 'row',
        backgroundColor: theme.colors.cardSoft,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        fontSize: 10,
        textTransform: 'uppercase',
        color: theme.colors.textMuted,
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 15,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    controlBtn: {
        flex: 1,
        height: 48,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    controlBtnNegetive: {
        backgroundColor: '#2A1818',
        borderColor: '#4A2020',
    },
    controlBtnPositive: {
        backgroundColor: '#182A1F',
        borderColor: '#204A2D',
    },
    controlBtnDisabled: {
        opacity: 0.3,
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.border,
    },
    controlBtnPressed: {
        transform: [{ scale: 0.96 }],
        opacity: 0.8,
    },
    controlBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    controlLabelContainer: {
        width: 80,
        alignItems: 'center',
    },
    controlLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.textSecondary,
        letterSpacing: 1,
    },
    infoBox: {
        padding: theme.spacing.md,
        backgroundColor: theme.colors.cardSoft,
        borderRadius: 8,
    },
    infoText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
    },
    doneBtn: {
        backgroundColor: theme.colors.cardSoft,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    doneBtnText: {
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
});

export default FactoriesModule;
