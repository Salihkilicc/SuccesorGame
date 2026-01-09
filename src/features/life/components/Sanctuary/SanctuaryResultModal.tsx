import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '../../../../core/theme';
import GameModal from '../../../../components/common/GameModal';
import GameButton from '../../../../components/common/GameButton';

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
        <GameModal
            visible={visible}
            onClose={onClose}
            title={resultData.title.toUpperCase()}
        >
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

            <GameButton
                title="Return to Life"
                onPress={onClose}
                variant="primary"
                style={{ marginTop: 10 }}
            />
        </GameModal>
    );
};

export default SanctuaryResultModal;

const styles = StyleSheet.create({
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
});
