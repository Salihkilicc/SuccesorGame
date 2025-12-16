import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { theme } from '../../../theme';

type SanctuaryResultModalProps = {
    visible: boolean;
    onClose: () => void;
    resultData: {
        title: string;
        message: string;
        stats: { label: string; value: string; isPositive: boolean }[];
    } | null;
};

const SanctuaryResultModal = ({ visible, onClose, resultData }: SanctuaryResultModalProps) => {
    const [enjoyment] = useState(new Animated.Value(0));
    const [randomEnjoyment, setRandomEnjoyment] = useState(85);

    useEffect(() => {
        if (visible) {
            // Calculate random enjoyment between 70-100
            const newVal = Math.floor(Math.random() * (100 - 70 + 1) + 70);
            setRandomEnjoyment(newVal);

            // Animate bar
            enjoyment.setValue(0);
            Animated.timing(enjoyment, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: false,
            }).start();
        }
    }, [visible, enjoyment]);

    if (!resultData) return null;

    const barWidth = enjoyment.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', `${randomEnjoyment}%`],
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>

                    <Text style={styles.headerTitle}>{resultData.title.toUpperCase()}</Text>
                    <Text style={styles.message}>{resultData.message}</Text>

                    {/* ENJOYMENT BAR */}
                    <View style={styles.barSection}>
                        <View style={styles.barHeader}>
                            <Text style={styles.barLabel}>Your Enjoyment</Text>
                            <Text style={styles.barValue}>{randomEnjoyment}%</Text>
                        </View>
                        <View style={styles.barTrack}>
                            <Animated.View style={[styles.barFill, { width: barWidth }]} />
                        </View>
                    </View>

                    {/* STAT CHANGES */}
                    <View style={styles.statsContainer}>
                        {resultData.stats.map((stat, index) => (
                            <View key={index} style={styles.statTag}>
                                <Text style={[styles.statText, stat.isPositive ? styles.positive : styles.negative]}>
                                    {stat.label} {stat.value}
                                </Text>
                            </View>
                        ))}
                    </View>

                    <Pressable
                        style={({ pressed }) => [styles.continueButton, pressed && styles.continueButtonPressed]}
                        onPress={onClose}>
                        <Text style={styles.continueButtonText}>Return to Life</Text>
                    </Pressable>

                </View>
            </View>
        </Modal>
    );
};

export default SanctuaryResultModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    container: {
        width: '100%',
        backgroundColor: '#1A1D24',
        borderRadius: theme.radius.lg,
        padding: theme.spacing.xl,
        borderWidth: 1,
        borderColor: '#C5A065',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#E2E8F0',
        marginBottom: theme.spacing.md,
        textAlign: 'center',
        letterSpacing: 1,
    },
    message: {
        fontSize: 15,
        color: '#A0AEC0',
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
        lineHeight: 22,
    },
    barSection: {
        width: '100%',
        marginBottom: theme.spacing.xl,
    },
    barHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    barLabel: {
        color: '#CBD5E0',
        fontSize: 13,
        fontWeight: '600',
    },
    barValue: {
        color: '#C5A065',
        fontWeight: '700',
    },
    barTrack: {
        height: 12,
        backgroundColor: '#2D3748',
        borderRadius: 6,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: '#48BB78', // Green for enjoyment
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 30,
    },
    statTag: {
        backgroundColor: '#2D3748',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#4A5568',
    },
    statText: {
        fontSize: 13,
        fontWeight: '600',
    },
    positive: { color: '#48BB78' },
    negative: { color: '#F56565' },
    continueButton: {
        width: '100%',
        backgroundColor: '#C5A065',
        paddingVertical: 14,
        borderRadius: theme.radius.md,
        alignItems: 'center',
    },
    continueButtonPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    continueButtonText: {
        color: '#1A202C',
        fontWeight: '700',
        fontSize: 16,
    },
});
