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
import { ESCAPE_AFTER_MS, activeLock, isSatisfied, mustRelease, isComplete } from '../../core/tutorial/locks';
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
            <>
                {/* Four panels, not one with a gap: a single overlay eats
                    the touch even where it looks transparent. */}
                    <View style={[styles.dim, { top: 0, left: 0, right: 0, height: hole.y }]} />
                    <View style={[styles.dim, { top: hole.y + hole.h, left: 0, right: 0, bottom: 0 }]} />
                    <View style={[styles.dim, { top: hole.y, left: 0, width: hole.x, height: hole.h }]} />
                    <View style={[styles.dim, { top: hole.y, left: hole.x + hole.w, right: 0, height: hole.h }]} />

                    {/* The ring is drawn OUTSIDE the hole and ignores touches,
                        so it cannot become the thing that blocks the press. */}
                <View
                    pointerEvents="none"
                    style={[styles.ring, { top: hole.y, left: hole.x, width: hole.w, height: hole.h }]}
                />
            </>

            <View
                style={[styles.card, hole.y > H / 2 ? { top: 80 } : { bottom: 120 }]}
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
    dim: { position: 'absolute', backgroundColor: 'rgba(28,36,44,0.82)' },
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
        backgroundColor: theme.colors.surfaceRaised,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.borderStrong,
        gap: theme.spacing.md,
    },
    /** His name, in the same muted register the mail screen uses for a sender. */
    speaker: {
        color: theme.colors.brandMuted,
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
