import React, { useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    Dimensions,
    Image,
} from 'react-native';
import { theme } from '../../../../core/theme';
import { NightOutOutcome } from './useNightOutSystem';

type NightOutOutcomeModalProps = {
    visible: boolean;
    type: NightOutOutcome | null;
    onClose: () => void;
    onHookupAccept: () => void;
};

const { width } = Dimensions.get('window');

const NightOutOutcomeModal = ({
    visible,
    type,
    onClose,
    onHookupAccept,
}: NightOutOutcomeModalProps) => {
    const [funLevel, setFunLevel] = useState(0);

    useEffect(() => {
        if (visible && type === 'enjoyment') {
            // Animate bar to random value 50-100
            const target = Math.floor(Math.random() * 51) + 50;
            setFunLevel(target);
        }
    }, [visible, type]);

    if (!visible || !type) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}>
            <View style={styles.backdrop}>
                {type === 'enjoyment' ? (
                    /* SCENARIO A: ENJOYMENT */
                    <View style={styles.card}>
                        <Text style={styles.emojiIcon}>🎉</Text>
                        <Text style={styles.title}>UNFORGETTABLE NIGHT</Text>
                        <Text style={styles.description}>
                            The music was perfect, the drinks were flowing, and you felt truly alive.
                        </Text>

                        <View style={styles.barContainer}>
                            <Text style={styles.barLabel}>Fun Level</Text>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${funLevel}%` }]} />
                            </View>
                            <Text style={styles.barValue}>{funLevel}%</Text>
                        </View>

                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>Awesome</Text>
                        </Pressable>
                    </View>
                ) : (
                    /* SCENARIO B: PREMIUM HOOKUP */
                    <View style={styles.premiumCard}>
                        <View style={styles.premiumHeader}>
                            <Text style={styles.premiumBadge}>VIP ENCOUNTER</Text>
                        </View>

                        <View style={styles.profileContainer}>
                            <View style={styles.avatar}>
                                <Text style={{ fontSize: 32 }}>💎</Text>
                            </View>
                            <Text style={styles.name}>Alexandra V.</Text>
                            <Text style={styles.role}>Supermodel</Text>
                        </View>

                        <Text style={styles.scenarioText}>
                            You catch her eye in the VIP section. She sends a bottle of Dom Pérignon to your table with a note: "Meet me outside?"
                        </Text>

                        <View style={styles.actions}>
                            <Pressable onPress={onClose} style={styles.rejectButton}>
                                <Text style={styles.rejectText}>Go Home Alone</Text>
                            </Pressable>
                            <Pressable onPress={onHookupAccept} style={styles.acceptButton}>
                                <Text style={styles.acceptText}>HOOK UP</Text>
                            </Pressable>
                        </View>
                    </View>
                )}
            </View>
        </Modal>
    );
};

export default NightOutOutcomeModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    card: {
        width: Math.min(350, width - 32),
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        padding: 24,
        alignItems: 'center',
        gap: 16,
    },
    premiumCard: {
        width: Math.min(360, width - 32),
        backgroundColor: '#000',
        borderRadius: theme.radius.lg,
        padding: 24,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10
    },
    emojiIcon: {
        fontSize: 48,
        marginBottom: 8
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        textAlign: 'center',
        textTransform: 'uppercase'
    },
    description: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20
    },
    barContainer: {
        width: '100%',
        gap: 6
    },
    barLabel: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        fontWeight: '700'
    },
    progressBarBg: {
        height: 10,
        backgroundColor: '#333',
        borderRadius: 5,
        overflow: 'hidden'
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: theme.colors.success
    },
    barValue: {
        alignSelf: 'flex-end',
        color: theme.colors.success,
        fontWeight: '900',
        fontSize: 12
    },
    closeButton: {
        marginTop: 8,
        backgroundColor: theme.colors.cardSoft,
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    closeButtonText: {
        color: theme.colors.textPrimary,
        fontWeight: '600'
    },
    // Premium Styles
    premiumHeader: {
        marginBottom: 20
    },
    premiumBadge: {
        color: theme.colors.primary,
        fontWeight: '900',
        letterSpacing: 2,
        fontSize: 12
    },
    profileContainer: {
        alignItems: 'center',
        gap: 4,
        marginBottom: 16
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#222',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#444'
    },
    name: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: '700'
    },
    role: {
        color: '#AAA',
        fontSize: 14,
        fontStyle: 'italic'
    },
    scenarioText: {
        color: '#DDD',
        textAlign: 'center',
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 24
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%'
    },
    rejectButton: {
        flex: 1,
        padding: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 8
    },
    rejectText: {
        color: '#888',
        fontWeight: '600',
        fontSize: 13
    },
    acceptButton: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        padding: 14,
        alignItems: 'center',
        borderRadius: 8
    },
    acceptText: {
        color: '#000',
        fontWeight: '800',
        fontSize: 14
    }
});
