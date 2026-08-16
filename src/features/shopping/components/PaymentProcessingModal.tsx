// src/features/shopping/components/PaymentProcessingModal.tsx
//
// ============================================================================
//  LUXONET SECURE WIRE TRANSFER PROCESSING MODAL
// ============================================================================

import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../../core/theme';

interface PaymentProcessingModalProps {
    visible: boolean;
    amount: number;
    onComplete: () => void;
}

export const PaymentProcessingModal: React.FC<PaymentProcessingModalProps> = ({
    visible,
    amount,
    onComplete,
}) => {
    const [statusText, setStatusText] = useState('Connecting to Swiss Private Vault Wire...');
    const [showSuccess, setShowSuccess] = useState(false);
    const [scaleAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            setShowSuccess(false);
            scaleAnim.setValue(0);
            setStatusText('Connecting to Swiss Private Vault Wire...');

            const sequence = [
                { time: 1000, text: 'Verifying Sovereign Biometric Signature...' },
                { time: 2200, text: 'Authorizing Asset Title Transfer & Notarization...' },
                { time: 3400, text: 'Acquisition Approved & Registered.' },
            ];

            const timeouts: ReturnType<typeof setTimeout>[] = [];

            sequence.forEach(({ time, text }) => {
                const toast = setTimeout(() => {
                    setStatusText(text);
                }, time);
                timeouts.push(toast);
            });

            const successTimeout = setTimeout(() => {
                setShowSuccess(true);
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 6,
                    useNativeDriver: true,
                }).start();
            }, 3600);
            timeouts.push(successTimeout);

            const completeTimeout = setTimeout(() => {
                onComplete();
            }, 4800);
            timeouts.push(completeTimeout);

            return () => {
                timeouts.forEach(clearTimeout);
            };
        }
    }, [visible]);

    const formatCurrency = (val: number) => {
        if (val >= 1000000000) return `$${(val / 1000000000).toFixed(2)}B`;
        if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
        if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
        return `$${val.toLocaleString()}`;
    };

    return (
        <Modal visible={visible} transparent={false} animationType="fade">
            <View style={styles.container}>
                {!showSuccess ? (
                    <View style={styles.content}>
                        <ActivityIndicator size="large" color="#05A8F6" style={styles.spinner} />
                        <Text style={styles.statusText}>{statusText}</Text>
                        <Text style={styles.amountText}>-{formatCurrency(amount)}</Text>

                        <View style={styles.securityBadge}>
                            <MaterialCommunityIcons name="shield-lock" size={14} color="#7DD3FC" />
                            <Text style={styles.securityText}>ENCRYPTED SWISS BANKING WIRE</Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.content}>
                        <Animated.View
                            style={[
                                styles.checkmarkCircle,
                                { transform: [{ scale: scaleAnim }] },
                            ]}
                        >
                            <MaterialCommunityIcons name="check" size={36} color="#FFFFFF" />
                        </Animated.View>
                        <Text style={styles.successText}>Acquisition Authorized</Text>
                        <Text style={styles.subtitleText}>
                            Asset deeds have been registered to your portfolio.
                        </Text>
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121417',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    spinner: {
        marginBottom: 24,
        transform: [{ scale: 1.2 }],
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
    },
    amountText: {
        color: '#FF8A8A',
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: 0.5,
        marginBottom: 28,
    },
    securityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#183D5C',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    securityText: {
        color: '#7DD3FC',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    checkmarkCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#05A8F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: '#05A8F6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    successText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitleText: {
        color: theme.colors.textMuted,
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
        maxWidth: 280,
    },
});

export default PaymentProcessingModal;
