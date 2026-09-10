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
import { t, useLocale } from '../../core/i18n';
import type { Ending } from '../../data/story/endings';
import { ENDINGS } from '../../data/story/endings';
import { endingsProgress } from '../../core/story/record';
import { readRecord } from '../../core/story/readRecord';
import { useIdentityStore } from '../../core/store/useIdentityStore';
import { useFamilyStore } from '../../core/store/useFamilyStore';
import { successorFor, heirInWaiting } from '../../core/story/mortality';
import { runSuccession, type SuccessionReason } from '../../core/story/runSuccession';
import { translateEnding, translateRecordRow } from '../../data/i18n/endingTranslations';

type Props = {
    ending: Ending;
    /** Wipes the save and sends the player back to a new first quarter. */
    onNewGame: () => void;
};

/**
 * The endings you can walk out of, and WHY the chair changed hands.
 *
 * ---------------------------------------------------------------------------
 *  THE GAME ALREADY HAD A GRAMMAR AND ONE ENDING WAS ON THE WRONG SIDE OF IT
 * ---------------------------------------------------------------------------
 *  Ten endings. They split cleanly: LOSE THE COMPANY and the run is over -
 *  sold, bankrupt, removed by the board, convicted. DIE and the dynasty
 *  carries on, which is the whole game.
 *
 *  `barredForManipulation` was filed with the first group and belongs in the
 *  second. Its own text says so: you keep the shares, you keep the house,
 *  what you are not allowed to do is sit in the chair. That is losing the
 *  JOB, not the company - and the game's answer to the job changing hands is
 *  succession. The text even ended "Somebody else will run it now. You will
 *  be able to watch", while `endGame` closed the run.
 *
 *  It also fixes the three verdicts, which were not a ladder: a fine cost
 *  money, being barred ended the run and being convicted ended the run. Two
 *  rungs at the same height. Now they are a fine, a generation, and prison.
 *
 * ---------------------------------------------------------------------------
 *  AND THE REASON IS CARRIED, NOT ASSUMED
 * ---------------------------------------------------------------------------
 *  `runSuccession` was written for a death, and a death does one thing a bar
 *  does not: it settles an estate. Duty is assessed on the collection and
 *  pieces are SOLD to pay it. Nobody has died here, so nothing is owed and
 *  nothing is sold. See core/story/runSuccession.ts.
 */
const CONTINUABLE: Record<string, SuccessionReason> = {
    diedInOffice: 'death',
    diedWithHeirTooYoung: 'death',
    barredForManipulation: 'barred',
};

/**
 * Who is standing there, if anybody.
 *
 * MODULE LEVEL, not inline in the component, and not only for tidiness: the
 * reachability audit reads an early `return` inside a callback in a component
 * body as an early return from the COMPONENT, and then reports every hook
 * below it as a conditional hook. It is a false positive and it is a fair one
 * to have to work around, because a reader scanning the file has the same
 * problem the parser does.
 *
 * It asks `successorFor` rather than taking the name from runMortality, so
 * that "who takes over" has one answer in one file. Guarded, because this is
 * the last screen of the game and a thrown error here is no screen at all.
 */
const heirWaiting = (endingId: string): { id: string; name: string } | null => {
    if (!CONTINUABLE[endingId]) return null;
    try {
        const family = useFamilyStore.getState();
        const candidates = (family.children ?? []).map((c: any) => ({ id: c.id, age: c.age ?? 0 }));
        // The one who can take it TODAY, or the one the chair waits for. Both
        // are somebody to carry on as; without the second, an heir under
        // sixteen left the button hidden and the run over.
        const found = successorFor(candidates, family.designatedSuccessorId ?? null)
            ?? heirInWaiting(candidates)?.heir
            ?? null;
        if (!found) return null;
        const child = (family.children ?? []).find((c: any) => c.id === found.id);
        // First name only. "CARRY ON AS ELENA HALE" on a button is a form.
        return child ? { id: child.id, name: child.name.split(' ')[0] } : null;
    } catch {
        return null;
    }
};

const EndingOverlay = ({ ending: rawEnding, onNewGame }: Props) => {
    useLocale();
    const ending = translateEnding(rawEnding);

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

    // Read once alongside the record, and for the same reason: both are a
    // snapshot of the family as it was at the moment the run ended, and
    // `runSuccession` is about to replace it.
    const [heir] = useState(() => heirWaiting(ending.id));

    const [handingOver, setHandingOver] = useState(false);
    const carryOn = () => {
        // Guarded against a double tap: the second one would divide an
        // estate that has already been divided, from a family that has
        // already been replaced.
        if (handingOver) return;
        setHandingOver(true);
        // The reason travels with the call. A bar is not a death and must not
        // settle an estate; see the table above.
        runSuccession(CONTINUABLE[ending.id] ?? 'death');
    };

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

    const knownEndings = new Set(Object.keys(ENDINGS));
    const foundEndingsCount = new Set(endingsSeen.filter(id => knownEndings.has(id))).size;
    const progressLabel = t('ending.progress', {
        found: String(foundEndingsCount),
        total: String(Object.keys(ENDINGS).length),
    });

    return (
        <Animated.View style={[styles.overlay, { opacity: fade }]}>
            {!showRecord ? (
                <View style={styles.page}>
                    <Text style={styles.title}>{ending.title}</Text>
                    <Text style={styles.body}>{ending.body}</Text>

                    <TouchableOpacity style={styles.primaryButton} onPress={() => setShowRecord(true)}>
                        <Text style={styles.primaryButtonText}>{t('ending.seeRecord')}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.page}>
                    <Text style={styles.recordHeading}>{t('ending.theRecord')}</Text>

                    {/* Scrolls because eight rows plus two buttons is tight on
                        a small phone, and the row that gets cut off would be
                        the family one, which is the row worth reading. */}
                    <ScrollView
                        style={styles.rows}
                        contentContainerStyle={styles.rowsContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {rows.map(rawRow => {
                            const row = translateRecordRow(rawRow);
                            return (
                                <View key={rawRow.label} style={styles.row}>
                                    <Text style={styles.rowLabel}>{row.label}</Text>
                                    <Text style={styles.rowValue}>{row.value}</Text>
                                </View>
                            );
                        })}
                    </ScrollView>

                    {/* The only line on either screen that reaches outside the
                        run, and the reason to press the button below it. */}
                    <Text style={styles.progress}>
                        {progressLabel}
                    </Text>

                    {/* ----------------------------------------------------
                        THE ONE THING THAT IS NOT A NEW GAME

                        Offered rather than automatic. A player who has just
                        watched a life end may want it to have ended, and
                        taking that away to keep a dynasty running would
                        make the death a loading screen.

                        It is the PRIMARY button when it exists, because
                        somebody who has been naming a successor for twenty
                        years came here to press it.
                       ---------------------------------------------------- */}
                    {heir ? (
                        <TouchableOpacity style={styles.primaryButton} onPress={carryOn}>
                            <Text style={styles.primaryButtonText}>
                                {t('ending.carryOnAs', { name: heir.name.toUpperCase() })}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.primaryButton} onPress={onNewGame}>
                            <Text style={styles.primaryButtonText}>{t('gameover.newGame')}</Text>
                        </TouchableOpacity>
                    )}

                    {heir ? (
                        <TouchableOpacity style={styles.backButton} onPress={onNewGame}>
                            <Text style={styles.backButtonText}>{t('gameover.newGame')}</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.backButton} onPress={() => setShowRecord(false)}>
                            <Text style={styles.backButtonText}>{t('ending.readAgain')}</Text>
                        </TouchableOpacity>
                    )}
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
