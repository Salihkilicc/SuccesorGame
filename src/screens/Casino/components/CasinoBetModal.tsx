import React, { useState } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    View,
    Pressable,
} from 'react-native';
import { theme } from '../../../theme';

type Props = {
    visible: boolean;
    gameTitle: string;
    minBet?: number;
    maxBet?: number;
    onClose: () => void;
    onPlay: (amount: number) => void;
};

const MIN_BET = 10_000;
const MAX_BET = 100_000;
const STEP = 5_000;

const CasinoBetModal = ({
    visible,
    gameTitle,
    minBet = MIN_BET,
    maxBet = MAX_BET,
    onClose,
    onPlay,
}: Props) => {
    const [betAmount, setBetAmount] = useState(minBet);

    const adjustBet = (delta: number) => {
        const newBet = Math.max(minBet, Math.min(maxBet, betAmount + delta));
        setBetAmount(newBet);
    };

    // Reset bet when modal opens
    React.useEffect(() => {
        if (visible) {
            setBetAmount(minBet);
        }
    }, [visible, minBet]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Text style={styles.gameTitle}>{gameTitle}</Text>

                    <View style={styles.infoRow}>
                        <Text style={styles.limitText}>Min: ${minBet.toLocaleString()}</Text>
                        <Text style={styles.limitText}>Max: ${maxBet.toLocaleString()}</Text>
                    </View>

                    <View style={styles.betDisplay}>
                        <Text style={styles.betLabel}>Current Bet</Text>
                        <Text style={styles.betValue}>${betAmount.toLocaleString()}</Text>
                    </View>

                    {/* Bet Adjustment Buttons */}
                    <View style={styles.controlsContainer}>
                        <View style={styles.buttonRow}>
                            <Pressable
                                onPress={() => adjustBet(-STEP * 2)}
                                style={({ pressed }) => [styles.adjustButton, pressed && styles.btnPressed]}>
                                <Text style={styles.adjustButtonText}>-$10K</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => adjustBet(-STEP)}
                                style={({ pressed }) => [styles.adjustButton, pressed && styles.btnPressed]}>
                                <Text style={styles.adjustButtonText}>-$5K</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => adjustBet(STEP)}
                                style={({ pressed }) => [styles.adjustButton, pressed && styles.btnPressed]}>
                                <Text style={styles.adjustButtonText}>+$5K</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => adjustBet(STEP * 2)}
                                style={({ pressed }) => [styles.adjustButton, pressed && styles.btnPressed]}>
                                <Text style={styles.adjustButtonText}>+$10K</Text>
                            </Pressable>
                        </View>
                        <View style={styles.buttonRow}>
                            <Pressable
                                onPress={() => setBetAmount(minBet)}
                                style={({ pressed }) => [styles.presetButton, pressed && styles.btnPressed]}>
                                <Text style={styles.presetButtonText}>Min</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setBetAmount(50_000)}
                                style={({ pressed }) => [styles.presetButton, pressed && styles.btnPressed]}>
                                <Text style={styles.presetButtonText}>$50K</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setBetAmount(maxBet)}
                                style={({ pressed }) => [styles.presetButton, pressed && styles.btnPressed]}>
                                <Text style={styles.presetButtonText}>Max</Text>
                            </Pressable>
                        </View>
                    </View>

                    <Pressable
                        onPress={() => onPlay(betAmount)}
                        style={({ pressed }) => [styles.playBtn, pressed && styles.btnPressed]}>
                        <Text style={styles.playBtnText}>PLAY</Text>
                    </Pressable>

                    <Pressable onPress={onClose} style={styles.closeHitBox}>
                        <Text style={styles.closeText}>Cancel</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

export default CasinoBetModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        padding: theme.spacing.lg,
    },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        gap: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    gameTitle: {
        color: theme.colors.textPrimary,
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 8,
    },
    limitText: {
        color: theme.colors.textMuted,
        fontSize: 12,
        fontWeight: '600',
    },
    betDisplay: {
        alignItems: 'center',
        gap: 4,
    },
    betLabel: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    betValue: {
        color: theme.colors.accent,
        fontSize: 42,
        fontWeight: '900',
        fontVariant: ['tabular-nums'],
    },
    controlsContainer: {
        width: '100%',
        gap: 12,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center',
    },
    adjustButton: {
        backgroundColor: theme.colors.cardSoft,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        minWidth: 70,
        alignItems: 'center',
    },
    adjustButtonText: {
        color: theme.colors.textPrimary,
        fontSize: 14,
        fontWeight: '700',
    },
    presetButton: {
        backgroundColor: theme.colors.accentSoft,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.accent,
        flex: 1,
        alignItems: 'center',
    },
    presetButtonText: {
        color: theme.colors.accent,
        fontSize: 14,
        fontWeight: '700',
    },
    playBtn: {
        backgroundColor: theme.colors.accent,
        width: '100%',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    btnPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    playBtnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1,
    },
    closeHitBox: {
        padding: 12,
    },
    closeText: {
        color: theme.colors.textMuted,
        fontSize: 14,
    }
});
