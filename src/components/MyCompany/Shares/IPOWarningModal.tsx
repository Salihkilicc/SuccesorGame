import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    Alert,
} from 'react-native';
import { theme } from '../../../core/theme';
import { useStatsStore } from '../../../core/store/useStatsStore';

interface Props {
    visible: boolean;
    onClose: () => void;
}

const IPOWarningModal = ({ visible, onClose }: Props) => {
    const { companyValue, performIPO } = useStatsStore();

    const valuationIncrease = companyValue * 0.4;
    const cashInjection = valuationIncrease * 0.7;

    const handleConfirm = () => {
        performIPO();
        onClose();
        Alert.alert(
            'IPO Successful!',
            `Your company is now publicly traded. Valuation increased by $${(valuationIncrease / 1_000_000).toFixed(1)}M and you received $${(cashInjection / 1_000_000).toFixed(1)}M in capital.`
        );
    };

    return (
        <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay} pointerEvents="box-none">
                <View style={styles.content}>
                    <Text style={styles.title}>⚠️ IPO Warning</Text>

                    <View style={styles.warningBox}>
                        <Text style={styles.warningText}>
                            Going public is irreversible. Investors will demand profits.
                        </Text>
                        <Text style={styles.warningBullet}>• Stock price fluctuations</Text>
                        <Text style={styles.warningBullet}>• Investor pressure</Text>
                        <Text style={styles.warningBullet}>• Market volatility</Text>
                    </View>

                    <View style={styles.projectionBox}>
                        <Text style={styles.projectionTitle}>Projected Benefits:</Text>
                        <View style={styles.projectionRow}>
                            <Text style={styles.projectionLabel}>Valuation Increase</Text>
                            <Text style={styles.projectionValue}>
                                +${(valuationIncrease / 1_000_000).toFixed(1)}M (+40%)
                            </Text>
                        </View>
                        <View style={styles.projectionRow}>
                            <Text style={styles.projectionLabel}>Cash Injection</Text>
                            <Text style={styles.projectionValue}>
                                +${(cashInjection / 1_000_000).toFixed(1)}M
                            </Text>
                        </View>
                    </View>

                    <View style={styles.buttonRow}>
                        <Pressable
                            onPress={onClose}
                            style={({ pressed }) => [
                                styles.btn,
                                styles.btnCancel,
                                pressed && styles.btnPressed,
                            ]}>
                            <Text style={styles.btnText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            onPress={handleConfirm}
                            style={({ pressed }) => [
                                styles.btn,
                                styles.btnConfirm,
                                pressed && styles.btnPressed,
                            ]}>
                            <Text style={[styles.btnText, { color: '#000' }]}>Go Public</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        padding: theme.spacing.lg,
        zIndex: 9999,
        elevation: 10,
    },
    content: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        textAlign: 'center',
    },
    warningBox: {
        backgroundColor: theme.colors.danger + '20',
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.danger,
        gap: theme.spacing.xs,
    },
    warningText: {
        fontSize: 14,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.xs,
    },
    warningBullet: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginLeft: theme.spacing.sm,
    },
    projectionBox: {
        backgroundColor: theme.colors.cardSoft,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        gap: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    projectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.xs,
    },
    projectionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    projectionLabel: {
        fontSize: 13,
        color: theme.colors.textSecondary,
    },
    projectionValue: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.success,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.sm,
    },
    btn: {
        flex: 1,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        alignItems: 'center',
    },
    btnCancel: {
        backgroundColor: theme.colors.cardSoft,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    btnConfirm: {
        backgroundColor: theme.colors.success,
    },
    btnPressed: {
        transform: [{ scale: 0.98 }],
    },
    btnText: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
});

export default IPOWarningModal;
