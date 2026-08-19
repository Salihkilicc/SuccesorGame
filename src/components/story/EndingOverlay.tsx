// src/components/story/EndingOverlay.tsx
//
// ============================================================================
//  TWO SCREENS, IN THIS ORDER, AND THE ORDER IS THE DESIGN
// ============================================================================
//
//  data/story/endings.ts holds a rule in a comment on the `body` field: an
//  ending is "not an epilogue and not a scorecard". The player wants their
//  numbers anyway, and both are right, because they are not the same screen.
//
//    FIRST the ending. Title and three paragraphs. Not one digit on it.
//    THEN the record, one tap away, for anybody who wants it.
//
//  Together on one page the prose dies. The eye goes to the figures first,
//  every time, and the last thing the game says becomes a caption over a
//  results table. Split, each does its own job and neither is compromised.
//
//  You can go BACK from the record to the ending. It costs one line and it
//  means the last thing on screen can be the writing again rather than a
//  number, which is how anybody who cares about the story will want to leave.
//
//  ---------------------------------------------------------------------------
//  THE TITLE IS NO LONGER RED
//  ---------------------------------------------------------------------------
//  It was `theme.colors.danger`, which the theme file says in as many words is
//  now strictly the LOSS half of the profit/loss signal. An ending is not a
//  loss: `soldToPear` is the player becoming rich in their first year, and
//  rendering that in the colour the game uses for a negative number is exactly
//  the drift the signal rule exists to stop.
//
//  White, large and heavy. Emphasis by weight and placement, which is what the
//  theme says to do when the meaning is not profit or loss.
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';

import { theme } from '../../core/theme';
import { t } from '../../core/i18n';
import type { Ending } from '../../data/story/endings';
import { ENDINGS } from '../../data/story/endings';
import { endingsProgress } from '../../core/story/record';
import { readRecord } from '../../core/story/readRecord';
import { useIdentityStore } from '../../core/store/useIdentityStore';

type Props = {
    ending: Ending;
    /** Wipes the save and sends the player back to a new first quarter. */
    onNewGame: () => void;
};

const EndingOverlay = ({ ending, onNewGame }: Props) => {
    const [showRecord, setShowRecord] = useState(false);
    const fade = useRef(new Animated.Value(0)).current;

    const markEndingSeen = useIdentityStore(s => s.markEndingSeen);
    const endingsSeen = useIdentityStore(s => s.endingsSeen);

    // ------------------------------------------------------------------
    //  READ ONCE, AT THE MOMENT THE GAME ENDS
    // ------------------------------------------------------------------
    //  `useState` with an initialiser rather than a `useMemo`: the figures
    //  are a snapshot of the run as it finished, and if anything downstream
    //  writes to a store while this overlay is up - a persist rehydrate, a
    //  reset queued by the New Game button - the record must not change
    //  under the player mid-read.
    // ------------------------------------------------------------------
    const [rows] = useState(() => readRecord());

    useEffect(() => {
        // Recorded here rather than in `endGame`, because what this
        // collection means is "the player has READ this one". See the note
        // on markEndingSeen.
        markEndingSeen(ending.id);
    }, [ending.id, markEndingSeen]);

    useEffect(() => {
        Animated.timing(fade, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
        }).start();
    }, [fade]);

    return (
        <Animated.View style={[styles.overlay, { opacity: fade }]}>
            {!showRecord ? (
                <View style={styles.page}>
                    <Text style={styles.title}>{ending.title}</Text>
                    <Text style={styles.body}>{ending.body}</Text>

                    <TouchableOpacity style={styles.primaryButton} onPress={() => setShowRecord(true)}>
                        <Text style={styles.primaryButtonText}>SEE THE RECORD</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.page}>
                    <Text style={styles.recordHeading}>THE RECORD</Text>

                    {/* Scrolls because eight rows plus two buttons is tight on
                        a small phone, and the row that gets cut off would be
                        the family one, which is the row worth reading. */}
                    <ScrollView
                        style={styles.rows}
                        contentContainerStyle={styles.rowsContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {rows.map(row => (
                            <View key={row.label} style={styles.row}>
                                <Text style={styles.rowLabel}>{row.label}</Text>
                                <Text style={styles.rowValue}>{row.value}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    {/* The only line on either screen that reaches outside the
                        run, and the reason to press the button below it. */}
                    <Text style={styles.progress}>
                        {endingsProgress(endingsSeen, Object.keys(ENDINGS))}
                    </Text>

                    <TouchableOpacity style={styles.primaryButton} onPress={onNewGame}>
                        <Text style={styles.primaryButtonText}>{t('gameover.newGame')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.backButton} onPress={() => setShowRecord(false)}>
                        <Text style={styles.backButtonText}>Read it again</Text>
                    </TouchableOpacity>
                </View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(28,36,44,0.94)',
        zIndex: 999,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    page: {
        width: '100%',
        alignItems: 'center',
    },
    title: {
        fontSize: 34,
        fontWeight: '900',
        // White, not the loss red. See the note at the top of the file.
        color: theme.colors.textPrimary,
        textAlign: 'center',
        letterSpacing: 2,
        marginBottom: 20,
    },
    body: {
        fontSize: 15,
        lineHeight: 23,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 36,
    },
    recordHeading: {
        fontSize: 13,
        fontWeight: '800',
        color: theme.colors.textMuted,
        letterSpacing: 3,
        marginBottom: 18,
    },
    rows: {
        alignSelf: 'stretch',
        maxHeight: 300,
        marginBottom: 18,
    },
    rowsContent: {
        paddingBottom: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingVertical: 9,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
    },
    rowLabel: {
        fontSize: 14,
        color: theme.colors.textMuted,
        flexShrink: 1,
        paddingRight: 12,
    },
    rowValue: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.textPrimary,
        textAlign: 'right',
    },
    progress: {
        fontSize: 12,
        color: theme.colors.textMuted,
        letterSpacing: 1,
        marginBottom: 22,
    },
    primaryButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 8,
        elevation: 5,
    },
    primaryButtonText: {
        // Black on the bright blue, which is what the theme says that fill
        // takes. Never white.
        color: theme.colors.primaryText,
        fontWeight: '800',
        fontSize: 15,
        letterSpacing: 1,
    },
    backButton: {
        paddingVertical: 14,
        paddingHorizontal: 20,
    },
    backButtonText: {
        color: theme.colors.textMuted,
        fontSize: 13,
    },
});

export default EndingOverlay;
