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

    if (!visible || !type || type !== 'enjoyment') return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}>
            <View style={styles.backdrop}>
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
});
