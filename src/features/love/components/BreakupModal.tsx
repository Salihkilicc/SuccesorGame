import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../core/theme';

interface BreakupModalProps {
    visible: boolean;
    onClose: () => void;
    partnerName: string;
    settlementCost?: number;
}

const BreakupModal = ({ visible, onClose, partnerName, settlementCost = 0 }: BreakupModalProps) => {
    // Defensive check: Ensure we handle 0 explicitly in boolean context logic
    const hasSettlement = typeof settlementCost === 'number' && settlementCost > 0;
    const safePartnerName = partnerName || 'Your Partner';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>💔</Text>
                    </View>

                    <Text style={styles.title}>CAUGHT!</Text>

                    <View>
                        <Text style={styles.message}>
                            You were caught cheating on <Text style={styles.highlight}>{safePartnerName}</Text>!
                        </Text>
                    </View>

                    <Text style={styles.subMessage}>
                        The relationship is over immediately.
                    </Text>

                    {hasSettlement ? (
                        <View style={styles.costContainer}>
                            <Text style={styles.costLabel}>Divorce Settlement</Text>
                            <Text style={styles.costValue}>-${settlementCost.toLocaleString()}</Text>
                            <Text style={styles.costSub}>50% of your current wealth</Text>
                        </View>
                    ) : null}

                    <Pressable
                        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                        onPress={onClose}
                    >
                        <Text style={styles.buttonText}>MOVE ON</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

export default BreakupModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#1a0505', // Very dark red/black
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.danger,
        shadowColor: theme.colors.danger,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 10,
    },
    iconContainer: {
        marginBottom: 20,
        transform: [{ scale: 1.5 }],
    },
    icon: {
        fontSize: 48,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: theme.colors.danger,
        marginBottom: 16,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    message: {
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 26,
    },
    highlight: {
        fontWeight: '700',
        color: theme.colors.danger,
    },
    subMessage: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 32,
    },
    costContainer: {
        width: '100%',
        backgroundColor: 'rgba(220, 38, 38, 0.15)', // Red tint
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(220, 38, 38, 0.3)',
    },
    costLabel: {
        color: theme.colors.danger,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    costValue: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 2,
    },
    costSub: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
    },
    button: {
        width: '100%',
        backgroundColor: theme.colors.danger,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },
});
