// src/features/casino/components/GameResultPopup.tsx
//
// ============================================================================
//  THE NUMBER, AND NOTHING ELSE
// ============================================================================
//
//  What was here: a full screen overlay, a card with a border and a glow, a
//  trophy emoji, the word VICTORY or DEFEAT in twenty two point, and a line of
//  prose explaining that the winnings had been deposited to your cash balance.
//  For a hand of blackjack. Every hand.
//
//  Asked for as "oyuncuyu oyundan ayirmasin ve de sadece belli etsin para
//  miktarini" - do not take the player out of the game, just show the money.
//  Which is right, and the reason is that a casino is a RHYTHM. Spin, see,
//  spin. Anything that has to be dismissed between two spins is not a
//  celebration, it is a door, and after the fourth one the player is closing
//  doors rather than playing.
//
//  So: the amount, signed, rising and fading on its own in about a second and
//  a half. No words, no card, no emoji, no overlay.
//
//  ---------------------------------------------------------------------------
//  AND IT DOES NOT TAKE TAPS AT ALL
//  ---------------------------------------------------------------------------
//  `pointerEvents="none"` on the whole thing, which is the strongest reading
//  of "basmasak da gorunup kaybolsa": it is not that dismissing is optional,
//  it is that there is nothing to dismiss. The SPIN button underneath stays
//  live the entire time, so a player who wants to go again can go again while
//  the last number is still fading.
//
//  The old version had a `Pressable` over the whole screen to catch the
//  dismiss tap, so a fast player's next spin was eaten by the popup they were
//  trying to get past.
//
//  ---------------------------------------------------------------------------
//  GREEN AND RED, AND THIS IS THE ONE PLACE THEY BELONG
//  ---------------------------------------------------------------------------
//  The house rule reserves them for profit and loss, and this is literally
//  that. It also says they are TEXT tokens rather than fills or borders, which
//  the old card broke twice over - a coloured border and a coloured glow. Here
//  they colour a number and nothing else.
// ============================================================================

import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Easing } from 'react-native';
import { theme } from '../../../core/theme';
import { formatMoney } from '../../../core/utils';

export type GameResult = {
    type: 'win' | 'loss' | 'push';
    /**
     * What moved, always POSITIVE. The sign comes from `type`.
     *
     * On a loss this is the STAKE. Slots was passing the winnings, which are
     * zero on a loss, so it read "-$0" - hidden until now by the word DEFEAT
     * being the loudest thing on the card.
     */
    amount: number;
};

type Props = {
    result: GameResult | null;
    /** Kept so the four screens can clear their own state when it is over. */
    onHide?: () => void;
};

/** How long the number is on screen, in and out included. */
const LIFETIME_MS = 1400;

/** How far it drifts upward while it goes. */
const RISE = 34;

const GameResultPopup = ({ result, onHide }: Props) => {
    const progress = useRef(new Animated.Value(0)).current;
    // The result is captured on the way in so the number does not change
    // under the animation if a fast player spins again mid-fade.
    const shown = useRef<GameResult | null>(null);

    if (result) shown.current = result;

    useEffect(() => {
        if (!result) return;

        progress.setValue(0);
        const anim = Animated.timing(progress, {
            toValue: 1,
            duration: LIFETIME_MS,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
        });
        anim.start(({ finished }) => {
            if (finished) onHide?.();
        });

        return () => anim.stop();
        // `result` by identity: every spin sets a new object, so a run of
        // identical wins still restarts the animation.
    }, [result]);

    const current = result ?? shown.current;
    if (!current) return null;

    const isWin = current.type === 'win';
    const isPush = current.type === 'push';

    const colour = isWin
        ? theme.colors.success
        : isPush
            ? theme.colors.textMuted
            : theme.colors.danger;

    // A push returned the stake, so it is neither. Showing the figure with no
    // sign says that more clearly than the word PUSH did.
    const sign = isWin ? '+' : isPush ? '' : '-';

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.wrap,
                {
                    opacity: progress.interpolate({
                        inputRange: [0, 0.12, 0.65, 1],
                        outputRange: [0, 1, 1, 0],
                    }),
                    transform: [{
                        translateY: progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -RISE],
                        }),
                    }],
                },
            ]}
        >
            <Animated.Text style={[styles.amount, { color: colour }]}>
                {sign}{formatMoney(Math.abs(current.amount || 0))}
            </Animated.Text>
        </Animated.View>
    );
};

export default GameResultPopup;

const styles = StyleSheet.create({
    wrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        // Above the controls and below the table, so it never sits on top of
        // the thing the player is watching.
        bottom: '32%',
        alignItems: 'center',
        zIndex: 20,
    },
    amount: {
        fontSize: 30,
        fontWeight: '900',
        letterSpacing: 0.5,
        // No background. The rule for the signal colours in this codebase is
        // that they are text and never a fill.
        textShadowColor: 'rgba(0,0,0,0.55)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
    },
});
