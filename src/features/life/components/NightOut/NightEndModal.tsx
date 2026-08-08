import React from 'react';
import { t, useLocale } from '../../../../core/i18n';
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
    useLocale();
    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={() => { }}>
            <View style={styles.backdrop}>
                <View style={styles.container}>
                    <Text style={styles.title}>{t('life.howDoesTheNightEnd')}</Text>

                    <View style={styles.optionsContainer}>
                        {/* Option A: Keep It Classy */}
                        <Pressable
                            style={[styles.optionCard, styles.classyCard]}
                            onPress={() => onDecision('classy')}
                        >
                            <View style={styles.badgeContainer}>
                                <Text style={styles.classyBadge}>{t('life.safeElegant')}</Text>
                            </View>
                            <Text style={styles.emoji}>🥂</Text>
                            <Text style={styles.optionTitle}>{t('life.keepItClassy')}</Text>
                            <Text style={styles.optionDescription}>
                                "Luxury hotel suite. Safe & Relaxing."
                            </Text>
                            <View style={styles.statsRow}>
                                <Text style={styles.statGain}>{t('life.stress10')}</Text>
                                <Text style={[styles.statGain, { color: theme.colors.textPrimary }]}>{t('life.cost2000')}</Text>
                            </View>
                        </Pressable>

                        {/* Option B: Go Wild */}
                        <Pressable
                            style={[styles.optionCard, styles.wildCard]}
                            onPress={() => onDecision('wild')}
                        >
                            <View style={styles.badgeContainer}>
                                <Text style={styles.wildBadge}>{t('life.highRisk')}</Text>
                            </View>
                            <Text style={styles.emoji}>🔥</Text>
                            <Text style={styles.optionTitle}>{t('life.goWild')}</Text>
                            <Text style={styles.optionDescription}>
                                "Total chaos. High risk, high reward."
                            </Text>
                            <View style={styles.statsRow}>
                                <Text style={styles.statGain}>{t('life.stress25')}</Text>
                                <Text style={[styles.statGain, { color: theme.colors.textPrimary }]}>⚠️ Multiple Risks</Text>
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
        backgroundColor: '#434B50',
    },
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: '#1C242C',
        padding: 24,
        paddingBottom: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        color: '#FFFFFF',
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
        borderWidth: 1,
        minHeight: 280,
    },
    classyCard: {
        backgroundColor: '#434B50',
        borderColor: 'rgba(255,255,255,0.08)', // Gold-ish
    },
    wildCard: {
        backgroundColor: '#434B50',
        borderColor: 'rgba(255,255,255,0.08)', // Neon Red
        shadowColor: '#1C242C',
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
        backgroundColor: 'rgba(28,36,44,0.3)'
    },
    classyBadge: {
        color: theme.colors.warning,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1
    },
    wildBadge: {
        color: theme.colors.warning,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1
    },
    emoji: {
        fontSize: 40,
        marginBottom: 12
    },
    optionTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center'
    },
    optionDescription: {
        color: '#FFFFFF',
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
        color: theme.colors.warning,
        fontSize: 11,
        fontWeight: '700',
        marginTop: 4
    }
});
