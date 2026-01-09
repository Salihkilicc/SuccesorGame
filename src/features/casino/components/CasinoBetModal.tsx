import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../../core/theme';
import GameModal from '../../../components/common/GameModal';
import GameButton from '../../../components/common/GameButton';

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
        <GameModal
            visible={visible}
            onClose={onClose}
            title={gameTitle}
            subtitle="Place your bet"
        >
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
                    <GameButton title="-$10K" onPress={() => adjustBet(-STEP * 2)} variant="secondary" style={styles.adjustButton} textStyle={styles.adjustBtnText} />
                    <GameButton title="-$5K" onPress={() => adjustBet(-STEP)} variant="secondary" style={styles.adjustButton} textStyle={styles.adjustBtnText} />
                    <GameButton title="+$5K" onPress={() => adjustBet(STEP)} variant="secondary" style={styles.adjustButton} textStyle={styles.adjustBtnText} />
                    <GameButton title="+$10K" onPress={() => adjustBet(STEP * 2)} variant="secondary" style={styles.adjustButton} textStyle={styles.adjustBtnText} />
                </View>
                <View style={styles.buttonRow}>
                    <GameButton title="Min" onPress={() => setBetAmount(minBet)} variant="ghost" style={styles.presetButton} />
                    <GameButton title="$50K" onPress={() => setBetAmount(50_000)} variant="ghost" style={styles.presetButton} />
                    <GameButton title="Max" onPress={() => setBetAmount(maxBet)} variant="ghost" style={styles.presetButton} />
                </View>
            </View>

            <GameButton
                title="PLAY"
                onPress={() => onPlay(betAmount)}
                variant="primary"
                style={{ marginTop: 24 }}
            />

            <GameButton
                title="Cancel"
                onPress={onClose}
                variant="ghost"
                style={{ marginTop: 8 }}
            />
        </GameModal>
    );
};

export default CasinoBetModal;

const styles = StyleSheet.create({
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 16,
    },
    limitText: {
        color: theme.colors.textMuted,
        fontSize: 12,
        fontWeight: '600',
    },
    betDisplay: {
        alignItems: 'center',
        marginBottom: 24,
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
        minWidth: 70,
        paddingVertical: 10,
        paddingHorizontal: 4,
    },
    adjustBtnText: {
        fontSize: 12,
    },
    presetButton: {
        flex: 1,
    },
});
