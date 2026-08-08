import React, { useEffect, useState } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, Modal, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { theme } from '../../../core/theme';

interface PaymentProcessingModalProps {
    visible: boolean;
    amount: number;
    onComplete: () => void;
}

const PaymentProcessingModal: React.FC<PaymentProcessingModalProps> = ({ visible, amount, onComplete }) => {
    useLocale();
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
                { time: 1000, text: t('ui.verifyingBiometricId') },
                { time: 2500, text: t('ui.authorizingLargeAssetTransfer') },
                { time: 4000, text: t('ui.transactionApproved') }
            ];

            const timeouts: ReturnType<typeof setTimeout>[] = [];

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
                        <ActivityIndicator size="large" color="#C734CA" style={styles.spinner} />
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
                        <Text style={styles.successText}>{t('ui.paymentSuccessful')}</Text>
                        <Text style={styles.subtitleText}>{t('ui.assetsTransferredToYourName')}</Text>
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020626', // Pure black
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
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
        letterSpacing: 0.5,
    },
    amountText: {
        color: '#C734CA', // Red for debit
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 60,
    },
    securityBadge: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#0B0635',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    securityText: {
        color: '#C8C0EF',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 2,
    },

    // Success State
    checkmarkCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(200,192,239,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    checkmarkIcon: {
        fontSize: 60,
    },
    successText: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 10,
    },
    subtitleText: {
        color: '#FFFFFF',
        fontSize: 16,
    },
});

export default PaymentProcessingModal;
