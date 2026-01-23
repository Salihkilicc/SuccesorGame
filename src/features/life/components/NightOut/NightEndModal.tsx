import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    Dimensions,
} from 'react-native';
import { theme } from '../../../../core/theme';

type NightEndModalProps = {
    visible: boolean;
    onDecision: (choice: 'classy' | 'wild') => void;
};

const { width } = Dimensions.get('window');

const NightEndModal = ({ visible, onDecision }: NightEndModalProps) => {
    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={() => { }}>
            <View style={styles.backdrop}>
                <View style={styles.container}>
                    <Text style={styles.title}>How does the night end?</Text>

                    <View style={styles.optionsContainer}>
                        {/* Option A: Keep It Classy */}
                        <Pressable
                            style={[styles.optionCard, styles.classyCard]}
                            onPress={() => onDecision('classy')}
                        >
                            <View style={styles.badgeContainer}>
                                <Text style={styles.classyBadge}>SAFE & ELEGANT</Text>
                            </View>
                            <Text style={styles.emoji}>🥂</Text>
                            <Text style={styles.optionTitle}>Keep It Classy</Text>
                            <Text style={styles.optionDescription}>
                                "Luxury hotel suite. Safe & Relaxing."
                            </Text>
                            <View style={styles.statsRow}>
                                <Text style={styles.statGain}>Stress -10</Text>
                                <Text style={[styles.statGain, { color: '#C0A062' }]}>Cost: $2,000</Text>
                            </View>
                        </Pressable>

                        {/* Option B: Go Wild */}
                        <Pressable
                            style={[styles.optionCard, styles.wildCard]}
                            onPress={() => onDecision('wild')}
                        >
                            <View style={styles.badgeContainer}>
                                <Text style={styles.wildBadge}>HIGH RISK</Text>
                            </View>
                            <Text style={styles.emoji}>🔥</Text>
                            <Text style={styles.optionTitle}>Go Wild</Text>
                            <Text style={styles.optionDescription}>
                                "Total chaos. High risk, high reward."
                            </Text>
                            <View style={styles.statsRow}>
                                <Text style={styles.statGain}>Stress -25</Text>
                                <Text style={[styles.statGain, { color: '#FF4444' }]}>⚠️ Multiple Risks</Text>
                            </View>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default NightEndModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#121212',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        alignItems: 'center',
        borderTopWidth: 1,
        borderColor: '#333'
    },
    title: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 24,
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    optionsContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        justifyContent: 'space-between'
    },
    optionCard: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        minHeight: 280,
    },
    classyCard: {
        backgroundColor: '#0a1a2a',
        borderColor: '#C0A062', // Gold-ish
    },
    wildCard: {
        backgroundColor: '#1a0505',
        borderColor: '#FF0055', // Neon Red
        shadowColor: '#FF0055',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 5
    },
    badgeContainer: {
        marginBottom: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: 'rgba(0,0,0,0.3)'
    },
    classyBadge: {
        color: '#C0A062',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1
    },
    wildBadge: {
        color: '#FF0055',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1
    },
    emoji: {
        fontSize: 40,
        marginBottom: 12
    },
    optionTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center'
    },
    optionDescription: {
        color: '#AAA',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 18,
        flex: 1
    },
    statsRow: {
        flexDirection: 'column', // Stacked acts better in narrow columns
        gap: 4,
        marginBottom: 8,
        alignItems: 'center'
    },
    statGain: {
        color: theme.colors.success,
        fontSize: 12,
        fontWeight: '700'
    },
    riskWarning: {
        color: '#FF0055',
        fontSize: 11,
        fontWeight: '700',
        marginTop: 4
    }
});
