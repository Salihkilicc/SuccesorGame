import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { theme } from '../../../core/theme';

interface PaymentProcessingModalProps {
    visible: boolean;
    amount: number;
    onComplete: () => void;
}

const PaymentProcessingModal: React.FC<PaymentProcessingModalProps> = ({ visible, amount, onComplete }) => {
    const [step, setStep] = useState(0);
    const [statusText, setStatusText] = useState('Connecting to Swiss Bank Secure Server...');
    const [showSuccess, setShowSuccess] = useState(false);

    // Scale animation for checkmark
    const [scaleAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            setStep(0);
            setShowSuccess(false);
            scaleAnim.setValue(0);
            setStatusText('Connecting to Swiss Bank Secure Server...');

            // Sequence Timing
            const sequence = [
                { time: 1000, text: 'Verifying Biometric ID...' },
                { time: 2500, text: 'Authorizing Large Asset Transfer...' },
                { time: 4000, text: 'Transaction Approved.' }
            ];

            const timeouts: NodeJS.Timeout[] = [];

            // Schedule text updates
            sequence.forEach(({ time, text }) => {
                const toast = setTimeout(() => {
                    setStatusText(text);
                }, time);
                timeouts.push(toast);
            });

            // Success State
            const successTimeout = setTimeout(() => {
                setShowSuccess(true);
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 5,
                    useNativeDriver: true
                }).start();

                // Haptic feedback logic would go here if available

            }, 4000);
            timeouts.push(successTimeout);

            // Close/Complete
            const completeTimeout = setTimeout(() => {
                onComplete();
            }, 5500); // 1.5s after success shown
            timeouts.push(completeTimeout);

            return () => {
                timeouts.forEach(clearTimeout);
            };
        }
    }, [visible]);

    return (
        <Modal
            visible={visible}
            transparent={false} // Requested full black screen
            animationType="fade"
        >
            <View style={styles.container}>
                {!showSuccess ? (
                    <View style={styles.content}>
                        <ActivityIndicator size="large" color="#D4AF37" style={styles.spinner} />
                        <Text style={styles.statusText}>{statusText}</Text>
                        <Text style={styles.amountText}>-${amount.toLocaleString()}</Text>

                        <View style={styles.securityBadge}>
                            <Text style={styles.securityText}>🔒 ENCRYPTED CONNECTION</Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.content}>
                        <Animated.View style={[styles.checkmarkCircle, { transform: [{ scale: scaleAnim }] }]}>
                            <Text style={styles.checkmarkIcon}>✅</Text>
                        </Animated.View>
                        <Text style={styles.successText}>Payment Successful</Text>
                        <Text style={styles.subtitleText}>Assets transferred to your name.</Text>
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000', // Pure black
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        width: '80%',
    },
    spinner: {
        transform: [{ scale: 1.5 }],
        marginBottom: 40,
    },
    statusText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
        letterSpacing: 0.5,
    },
    amountText: {
        color: '#E74C3C', // Red for debit
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 60,
    },
    securityBadge: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#111',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#222',
    },
    securityText: {
        color: '#555',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 2,
    },

    // Success State
    checkmarkCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(39, 174, 96, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        borderWidth: 2,
        borderColor: '#27AE60',
    },
    checkmarkIcon: {
        fontSize: 60,
    },
    successText: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 10,
    },
    subtitleText: {
        color: '#888',
        fontSize: 16,
    },
});

export default PaymentProcessingModal;
