// src/components/tutorial/TutorialOverlay.tsx
//
// ============================================================================
//  THE DIM, THE HOLE, AND THE WAY OUT
// ============================================================================
//
//  Four dark panels drawn AROUND the highlighted control rather than one panel
//  over everything with a transparent patch. That is not a styling choice - a
//  single overlay would swallow the touch even where it looks clear, so the
//  one control the player is being told to press would be the one control
//  they cannot press. Four panels leave a genuine hole.
//
//  ---------------------------------------------------------------------------
//  THE SKIP IS NOT OPTIONAL AND NOT CONDITIONAL
//  ---------------------------------------------------------------------------
//  It appears after a few seconds on every lock, every time. No flag turns it
//  off and no lock can be authored without it.
//
//  It is the third of three ways out, and the only one that covers a trap
//  nobody predicted - which is the only kind that will actually ship. The
//  other two are in core/tutorial/locks.ts: a lock does not engage unless it
//  can be cleared, and it releases itself if that stops being true.
//
//  A short delay rather than none, because a skip offered instantly is a skip
//  the player takes before reading anything.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';

import { theme } from '../../core/theme';
import { ESCAPE_AFTER_MS, DIM_DEFAULT, activeLock, isSatisfied, mustRelease, isComplete } from '../../core/tutorial/locks';
import { TUTORIAL_SEQUENCE } from '../../data/tutorial/sequence';
import { useStoryStore } from '../../core/store/useStoryStore';
import { useIdentityStore } from '../../core/store/useIdentityStore';
import { readWorld } from '../../core/story/world';
import { useTutorialTargets } from './targets';
import { CAST } from '../../data/story/cast';
import { useLocale } from '../../core/i18n';
import { line, lockKey } from '../../data/i18n/storyText';

/** Breathing room around the highlighted control. */
const HALO = 8;

/**
 * Where the card sits when it has to go above the highlight.
 *
 * Enough for a status bar, a notch and a modal's own header. It was 80, and
 * on the product sheet that put the first line of the instruction behind the
 * header - the card was there and could not be read.
 */
const CARD_TOP = 132;

const TutorialOverlay = () => {
    const locks = useStoryStore(s => s.locks);
    const completeLock = useStoryStore(s => s.completeLock);
    const skipLock = useStoryStore(s => s.skipLock);
    const disableTutorial = useStoryStore(s => s.disableTutorial);
    const seenBefore = useIdentityStore(s => s.tutorialCompleted);
    const markDone = useIdentityStore(s => s.markTutorialCompleted);
    const rects = useTutorialTargets(s => s.rects);

    const world = readWorld();
    const lock = activeLock(TUTORIAL_SEQUENCE, locks, world);

    const [escapeVisible, setEscapeVisible] = useState(false);

    // The timer restarts per lock, so each step gets its own grace period
    // rather than one timer that has already expired by the second step.
    useEffect(() => {
        setEscapeVisible(false);
        if (!lock) return;
        const id = setTimeout(() => setEscapeVisible(true), ESCAPE_AFTER_MS);
        return () => clearTimeout(id);
    }, [lock?.id]);

    // WAY OUT TWO. The world can move while a lock is up - a quarter closes,
    // the cash goes. A lock that engaged legitimately and then became
    // impossible lifts itself; nobody else is checking.
    useEffect(() => {
        if (lock && mustRelease(lock, world)) skipLock(lock.id);
    }, [lock?.id, world.capital, world.cash]);

    // ------------------------------------------------------------------
    //  CLEARING HAPPENS BY DOING THE THING
    // ------------------------------------------------------------------
    //  The screens raise a flag; the lock's own condition notices. Checked
    //  here rather than by the screens, so a screen never has to know a
    //  tutorial exists.
    //
    //  It has to look at the WHOLE sequence rather than only the lock on
    //  screen. `activeLock` skips anything already satisfied, so by the time
    //  a condition comes true the lock has stopped being the active one - and
    //  a check that only looked at the current lock would never see its own
    //  completion. Without recording it, `isComplete` never turns true and
    //  the tutorial is never marked as finished.
    // ------------------------------------------------------------------
    useEffect(() => {
        for (const l of TUTORIAL_SEQUENCE) {
            if (locks.completed.includes(l.id) || locks.skipped.includes(l.id)) continue;
            if (isSatisfied(l, world)) completeLock(l.id);
        }
    }, [world.flags, world.capital, world.cash]);

    useEffect(() => {
        if (!seenBefore && isComplete(TUTORIAL_SEQUENCE, locks)) markDone();
    }, [locks, seenBefore]);

    // ------------------------------------------------------------------
    //  WHY IS NOTHING ON SCREEN
    // ------------------------------------------------------------------
    //  The overlay is correctly silent in three completely different
    //  situations - the tutorial is finished, the lock is waiting for a
    //  screen the player is not on, or the lock was skipped - and they look
    //  identical, which is to say they look broken. That ambiguity cost an
    //  evening: the highlight was working and the question "is it even
    //  coming?" could not be answered by looking at the phone.
    //
    //  So in development it says which. Once per change of reason, not per
    //  render, or it drowns the Metro log the moment anybody scrolls.
    // ------------------------------------------------------------------
    const reason = !lock
        ? (locks.disabled ? 'tutorial disabled'
            : isComplete(TUTORIAL_SEQUENCE, locks) ? 'all steps done'
                : 'no step engageable right now (check canEngage)')
        : rects[lock.highlight]
            ? undefined
            : `waiting for "${lock.highlight}" - not on this screen`;

    useEffect(() => {
        if (__DEV__ && reason) {
            console.log(
                `[tutorial] silent: ${reason}`,
                `| done: [${locks.completed.join(', ')}]`,
                `| skipped: [${locks.skipped.join(', ')}]`,
            );
        }
    }, [reason]);

    if (!lock) return null;

    const rect = rects[lock.highlight];

    // ------------------------------------------------------------------
    //  THE LESSON LIVES ON THE SCREEN IT IS ABOUT
    // ------------------------------------------------------------------
    //  No measurement means the control this lock is about is not on screen,
    //  and the overlay shows NOTHING. The lock is not cleared and not
    //  skipped - it waits, and engages the moment the player walks into the
    //  screen that holds its control.
    //
    //  It used to dim the whole app instead. The comment here said the
    //  overlay "stays out of the way" and the code below it rendered a
    //  full-screen dim with the instruction card on top, so every screen in
    //  the game was greyed out and pointing at nothing until the player
    //  happened to find My Company. The intention was written down and never
    //  implemented, and reading the file was not enough to notice.
    //
    //  Nothing is lost by waiting: the father's message says where to go,
    //  and it is sitting in the inbox. The teaching is the reward for
    //  arriving rather than a toll gate on the way.
    // ------------------------------------------------------------------
    if (!rect) return null;

    const { width: W, height: H } = Dimensions.get('window');

    // Per lock. See the note on `dim` in core/tutorial/locks.ts: one value
    // was wrong for a sheet full of figures and wrong for a bare button, in
    // opposite directions.
    const shade = { backgroundColor: `rgba(28,36,44,${lock.dim ?? DIM_DEFAULT})` };

    // Unconditional now: the null case returned above, so there is always a
    // control to cut a hole around.
    const hole = {
        x: Math.max(0, rect.x - HALO),
        y: Math.max(0, rect.y - HALO),
        w: rect.width + HALO * 2,
        h: rect.height + HALO * 2,
    };

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* SHELVED: this was `hole ? (four panels) : (full-screen dim)`.
                The second branch is what greyed out every screen in the game
                while the player was anywhere but My Company, and it is now
                unreachable - the component returns null above rather than
                rendering it. Left as a note because the branch was not wrong
                to write, only wrong to reach:

                    ) : (
                        <View style={[styles.dim, StyleSheet.absoluteFillObject]} />
                    )}
               */}
            {/* ------------------------------------------------------------
                THE DIM IS PAINT, NOT A GATE

                These panels used to be touchable, which is what made a
                stale measurement fatal rather than untidy. The marketing
                row sits inside a scrolling sheet; a scroll does not fire
                onLayout, so the hole stayed where the row HAD been, and
                every other pixel on the screen refused the touch. The
                player could see the control and could not reach it, could
                not scroll to it, and could not clear the step.

                `pointerEvents="none"` on the whole group. The highlight is
                now guidance and never a cage: if the hole is ever in the
                wrong place the worst outcome is that it looks wrong, and
                the player carries on. The four-panel construction stays
                because it is still the right way to leave a genuine gap in
                the paint.
               ------------------------------------------------------------ */}
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                    <View style={[styles.dim, { top: 0, left: 0, right: 0, height: hole.y }]} />
                    <View style={[styles.dim, { top: hole.y + hole.h, left: 0, right: 0, bottom: 0 }]} />
                    <View style={[styles.dim, { top: hole.y, left: 0, width: hole.x, height: hole.h }]} />
                    <View style={[styles.dim, { top: hole.y, left: hole.x + hole.w, right: 0, height: hole.h }]} />

                    {/* The ring is drawn OUTSIDE the hole and ignores touches,
                        so it cannot become the thing that blocks the press. */}
                <View
                    style={[styles.ring, { top: hole.y, left: hole.x, width: hole.w, height: hole.h }]}
                />
            </View>

            <View
                // ------------------------------------------------------
                //  IT FLIPS SO IT DOES NOT COVER WHAT IT IS POINTING AT,
                //  AND THE TOP FIGURE WAS TOO SMALL
                // ------------------------------------------------------
                //  80 put the card under the status bar and the sheet's
                //  own header on a notched phone - the first line of what
                //  the father says was simply not readable. CARD_TOP
                //  clears both.
                // ------------------------------------------------------
                style={[styles.card, hole.y > H / 2 ? { top: CARD_TOP } : { bottom: 120 }]}
                pointerEvents="box-none">
                {/* ------------------------------------------------------
                    SOMEBODY IS SAYING THIS

                    The card used to be a bare sentence with no name on it,
                    which made the first hour of the game a dimmed screen
                    being instructed by nobody - manual copy in a place where
                    a character was already standing. The conversation that
                    arrives with the lock is the father's; the card is his
                    too, and now says so.
                   ------------------------------------------------------ */}
                <Text style={styles.speaker}>
                    {(CAST[lock.speaker ?? 'father']?.name ?? '').toUpperCase()}
                </Text>
                <Text style={styles.instruction}>
                    {line(lockKey(lock.id), lock.instruction)}
                </Text>

                {escapeVisible && (
                    <View style={styles.escapes}>
                        <Pressable
                            onPress={() => skipLock(lock.id)}
                            style={({ pressed }) => [styles.escape, pressed && styles.escapePressed]}>
                            <Text style={styles.escapeText}>Skip this step</Text>
                        </Pressable>

                        {/* Only offered to someone who has finished it before.
                            A first-time player gets the per-step skip and not
                            an invitation to switch the teaching off. */}
                        {seenBefore && (
                            <Pressable
                                onPress={disableTutorial}
                                style={({ pressed }) => [styles.escape, pressed && styles.escapePressed]}>
                                <Text style={styles.escapeText}>Skip the whole tutorial</Text>
                            </Pressable>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
};

export default TutorialOverlay;

const styles = StyleSheet.create({
    // The colour comes from the lock, not from here - see `shade` above and
    // the note on `dim` in core/tutorial/locks.ts.
    dim: { position: 'absolute' },
    ring: {
        position: 'absolute',
        borderRadius: theme.radius.md,
        borderWidth: 2,
        borderColor: theme.colors.primary,
    },
    card: {
        position: 'absolute',
        left: theme.spacing.lg,
        right: theme.spacing.lg,
        // Not surfaceRaised. An instruction from a person used to look like
        // every other card in the app - same grey, on a dimmed screen, with
        // nothing to say it was not part of the game. Violet, which is also
        // research's hue and for a related reason. See `guidance` in
        // core/theme.ts for the measurements.
        backgroundColor: theme.colors.guidance,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.borderStrong,
        gap: theme.spacing.md,
    },
    /**
     * His name.
     *
     * It was brandMuted, which is the register the mail screen uses for a
     * sender - and correct while the card was grey. On the tobacco ground it
     * measures 3.35:1: past the audit's floor and thin for ten-point
     * uppercase, because the label and the card are now the same hue.
     *
     * textSecondary is 4.67 there. It is not a third colour - white turned
     * down is documented in core/theme.ts as still being white - and the
     * family resemblance the brandMuted was buying is now carried by the
     * card's own ground, so nothing is lost by the label stepping back.
     */
    speaker: {
        color: theme.colors.textSecondary,
        fontSize: theme.typography.micro,
        fontWeight: '700',
        letterSpacing: 0.8,
        marginBottom: -4,
    },
    instruction: {
        color: theme.colors.textPrimary,
        fontSize: theme.typography.subtitle,
        lineHeight: 22,
    },
    escapes: { gap: theme.spacing.sm },
    escape: {
        paddingVertical: 11,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
    },
    escapePressed: { backgroundColor: theme.colors.surfaceHigh },
    escapeText: { color: theme.colors.textSecondary, fontSize: theme.typography.body, fontWeight: '600' },
});
