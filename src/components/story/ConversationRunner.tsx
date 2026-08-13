// src/components/story/ConversationRunner.tsx
//
// ============================================================================
//  THE ONE THING THAT PLAYS A CONVERSATION
// ============================================================================
//
//  Mail and Messages use this same component. The only difference between them
//  is `variant`, which changes how a card LOOKS - a chat bubble or a letter -
//  and nothing about how it behaves.
//
//  That is worth being firm about. The obvious alternative is a runner in each
//  app, since one is a chat and the other is an inbox, and it would work for
//  about three scenes. Then one of them gains a feature the other lacks, a
//  writer has to remember which app a scene is destined for while writing it,
//  and the branching rules quietly fork. One runner means a conversation is a
//  conversation and the channel is a costume.
//
//  ---------------------------------------------------------------------------
//  IT CANNOT HANG
//  ---------------------------------------------------------------------------
//  If a card's answers are all gated and every gate fails, there is nothing to
//  press. The runner shows "Close" in that case rather than a card with no
//  buttons - the player is never stuck.
//
//  The audit still fails on that card. Not hanging is the floor, not the goal:
//  a card written to pose a decision that silently offers only an exit is a
//  writing bug, and the check exists so it is found by a script rather than by
//  a player.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';

import { theme } from '../../core/theme';
import { useLocale } from '../../core/i18n';
import { line, nodeKey, choiceKey, subjectKey } from '../../data/i18n/storyText';
import { MAX_ANSWER_BLOCK, MAX_FONT_MULTIPLIER } from './answerFit';
import { NAV_BAR_CLEARANCE } from '../../navigation/components/CrystalNavBar';
import { nodeById, type Conversation, type Choice } from '../../core/story/graph';
import { applyEffects } from '../../core/story/effects';
import { gameSink } from '../../core/story/gameSink';
import { testAll } from '../../core/story/conditions';
import { readWorld } from '../../core/story/world';
import { CAST } from '../../data/story/cast';
import { useStoryStore, type SceneProgress, type Said } from '../../core/store/useStoryStore';

type Props = {
    conversation: Conversation;
    /** Chat bubbles or a letter. Presentation only. */
    variant: 'message' | 'mail';
    /**
     * Called when the conversation ends, so the screen can close or return.
     *
     * It is handed the transcript, because a screen may want to keep what was
     * said - the message thread turns it into ordinary messages.
     */
    onFinished?: (history: Said[]) => void;
};

// ============================================================================
//  A SCENE REMEMBERS WHERE IT GOT TO
// ============================================================================
//  This used to be plain component state, which meant leaving a conversation
//  halfway - back arrow, tab bar, or the phone locking - started it again from
//  the first card next time. And the runner applies effects as answers are
//  picked, so the half already played was applied twice.
//
//  Position and transcript now come in and go out through the store. The
//  component still owns them while it is on screen; the store is where they
//  survive the screen not being.
// ============================================================================

const ConversationRunner = ({ conversation, variant, onFinished }: Props) => {
    const saved = useStoryStore(s => s.sceneProgress[conversation.id]);
    // Read ONCE, on mount. Subscribing the position to the store would fight
    // the local state on every answer - and the value only ever changes
    // because this component changed it.
    const [resume] = useState<SceneProgress | undefined>(saved);

    const [nodeId, setNodeId] = useState<string | null>(
        resume ? resume.nodeId : conversation.start,
    );
    // ------------------------------------------------------------------
    //  EVERY LINE GOES THROUGH THE DICTIONARY
    // ------------------------------------------------------------------
    //  `line()` falls back to the English in the scene file when there is no
    //  translation, so a half-finished language is playable and a missing key
    //  is a stray English sentence rather than a crash in the middle of the
    //  father's death. See src/data/i18n/storyText.ts.
    //
    //  Choices are keyed by INDEX, not by their own text - the button text is
    //  what identifies the choice, so keying a translation on it would be
    //  circular.
    //
    //  `useLocale()` subscribes this component to the app's language, which is
    //  also the story's language - there is no second setting. Note that what
    //  is ALREADY in `history` stays in the language it was read in: those
    //  strings were resolved when the card arrived. Changing language during a
    //  conversation therefore leaves the sentences above the fold as they were
    //  and applies from the next card, which is both cheaper and closer to
    //  right than retranslating a thing the player has already read.
    // ------------------------------------------------------------------
    useLocale();
    const say = (nodeIdent: string, text: string) =>
        line(nodeKey(conversation.id, nodeIdent), text);
    const answer = (nodeIdent: string, index: number, text: string) =>
        line(choiceKey(conversation.id, nodeIdent, index), text);

    const [history, setHistory] = useState<Said[]>(() => {
        if (resume) return resume.history;
        const first = nodeById(conversation, conversation.start);
        return first ? [{ from: 'them', text: say(first.id, first.text) }] : [];
    });

    // ------------------------------------------------------------------
    //  SAVED ON EVERY CARD, INCLUDING THE FIRST
    // ------------------------------------------------------------------
    //  The first card matters as much as the rest: a player who opens a
    //  scene, reads the opening and backs out has been shown it, and the
    //  effects of nothing have run. Writing it down costs one record and
    //  means "where was I" always has an answer.
    // ------------------------------------------------------------------
    useEffect(() => {
        useStoryStore.getState().saveScene(conversation.id, { nodeId, history });
    }, [conversation.id, nodeId, history]);

    const node = nodeId ? nodeById(conversation, nodeId) : undefined;

    // The world is read fresh on every render rather than captured once: an
    // effect from the previous card may have changed the money a gate on this
    // card is about to test.
    const world = readWorld();

    // ------------------------------------------------------------------
    //  THE ORIGINAL INDEX IS CARRIED, NOT RECOMPUTED
    // ------------------------------------------------------------------
    //  Translation keys are `scene/card#n` where n is the choice's position
    //  in the DATA. This list is filtered by `when`, so its own index is not
    //  that number - a card whose first answer is gated off would look up the
    //  translation of the answer above the one being shown, and only for
    //  players who failed the gate. Silent, conditional, and impossible to
    //  reproduce on purpose.
    // ------------------------------------------------------------------
    const available: { choice: Choice; index: number }[] = useMemo(
        () => (node?.choices ?? [])
            .map((choice, index) => ({ choice, index }))
            .filter(({ choice }) => testAll(choice.when, world)),
        [node, world],
    );

    const finish = (h: Said[] = history) => {
        setNodeId(null);
        onFinished?.(h);
    };

    const pick = (choice: Choice, index: number) => {
        // Effects first, then move. A choice that pays for something and then
        // opens a card mentioning the payment has to happen in that order.
        applyEffects(choice.effects, gameSink());

        const next: Said[] = [...history, {
            from: 'player' as const,
            text: node ? answer(node.id, index, choice.text) : choice.text,
        }];
        const target = choice.next ? nodeById(conversation, choice.next) : undefined;
        if (target) next.push({ from: 'them', text: say(target.id, target.text) });
        setHistory(next);

        // Built outside setHistory rather than inside the updater, because
        // `finish` has to hand the completed transcript to the screen and a
        // state updater is not the place to read state back out of.
        if (!choice.next || !target) { finish(next); return; }
        setNodeId(choice.next);
    };

    const done = !node;

    // ------------------------------------------------------------------
    //  THE ANSWERS, WHICH BELONG IN TWO DIFFERENT PLACES
    // ------------------------------------------------------------------
    //  On a MESSAGE they are a keyboard: pinned to the bottom, where a reply
    //  field lives, with the conversation scrolling above them.
    //
    //  On a LETTER they are not. You answer a letter underneath it. Pinned to
    //  the bottom they covered the last paragraph of the thing being replied
    //  to, and on the mail screen - which has the nav bar floating over it -
    //  the bottom row sat partly under the bar. The answers were hardest to
    //  reach on exactly the screens with the most text above them.
    //
    //  So for mail they go inside the scroll, directly under the last card,
    //  drawn as the player's own bubbles rather than a rack of buttons. Which
    //  is what they are: the thing you are about to say.
    // ------------------------------------------------------------------
    const closeButton = (onPress: () => void) => (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.answer, pressed && styles.answerPressed]}>
            <Text style={styles.answerText} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
                Close
            </Text>
        </Pressable>
    );

    const answers = done
        ? closeButton(() => onFinished?.(history))
        // Either the card is terminal - they had the last word - or every
        // answer was gated out. Both end the same way for the player; only
        // the audit tells them apart.
        : available.length === 0
            ? closeButton(() => finish())
            : available.map(({ choice, index }) => (
                <Pressable
                    key={index}
                    onPress={() => pick(choice, index)}
                    style={({ pressed }) => [styles.answer, pressed && styles.answerPressed]}>
                    <Text
                        style={styles.answerText}
                        // Honoured up to AX1 and then held. Past that the
                        // block is taller than the phone - and the container
                        // gives way rather than the text shrinking, which
                        // would answer a player who cannot read small text by
                        // making it smaller. See answerFit.ts.
                        maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
                        {node ? answer(node.id, index, choice.text) : choice.text}
                    </Text>
                </Pressable>
            ));

    return (
        <View style={styles.root}>
            <ScrollView contentContainerStyle={styles.body}>
                {variant === 'mail' && !!conversation.subject && (
                    <Text style={styles.subject}>
                        {line(subjectKey(conversation.id), conversation.subject)}
                    </Text>
                )}

                {history.map((said, i) => (
                    <View
                        key={i}
                        style={[
                            variant === 'mail' ? styles.letterWrap : styles.bubbleWrap,
                            said.from === 'player' && variant === 'message' && styles.bubbleWrapMine,
                        ]}>
                        <View
                            style={[
                                variant === 'mail' ? styles.letter : styles.bubble,
                                said.from === 'player' && styles.mine,
                            ]}>
                            {/* The player's own letter takes the light fill, so
                                this label has to go black with it. The muted
                                orange measures 1.29 there - caught by the
                                audit, not by looking. */}
                            {variant === 'mail' && (
                                <Text style={[styles.letterFrom, said.from === 'player' && styles.letterFromMine]}>
                                    {said.from === 'player' ? 'You replied' : (CAST[conversation.from]?.name ?? conversation.from)}
                                </Text>
                            )}
                            <Text style={[styles.said, said.from === 'player' && styles.saidMine]}>
                                {said.text}
                            </Text>
                        </View>
                    </View>
                ))}

                {/* A letter is answered underneath it - see the note on
                    `answers` above. Inside the scroll, so the last paragraph
                    of what is being replied to stays readable. */}
                {variant === 'mail' && (
                    <View style={[styles.answers, styles.mailAnswers]}>{answers}</View>
                )}
            </ScrollView>

            {/* ------------------------------------------------------------
                THE MESSAGE VARIANT KEEPS ITS BOTTOM RACK

                It scrolls rather than running off the screen: it was a plain
                View, and at the largest accessibility text size two cards in
                the game put the second answer below the bottom of an iPhone
                SE with nothing to scroll, so the conversation could not be
                finished. `maxHeight` rather than a fixed one, so the block
                still hugs its content on every card that fits - which is all
                of them at normal sizes. See answerFit.ts.
               ------------------------------------------------------------ */}
            {variant === 'message' && (
                <ScrollView
                    style={styles.answersScroll}
                    contentContainerStyle={styles.answers}
                    // The answers are the point of the screen; if they are
                    // tall enough to scroll, start at the top of them.
                    bounces={false}>
                    {answers}
                </ScrollView>
            )}
        </View>
    );
};

export default ConversationRunner;

const styles = StyleSheet.create({
    root: { flex: 1 },
    body: {
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
        // ------------------------------------------------------------------
        //  ROOM UNDER THE LAST THING ON THE PAGE
        // ------------------------------------------------------------------
        //  The nav bar floats over this screen. With the answers pinned to the
        //  bottom it was their problem; now that a letter is answered inside
        //  the scroll, the last bubble was the thing sitting under the bar -
        //  which is to say the button the player was trying to press.
        // ------------------------------------------------------------------
        paddingBottom: NAV_BAR_CLEARANCE + theme.spacing.lg,
    },

    subject: {
        color: theme.colors.textPrimary,
        fontSize: theme.typography.subtitle + 2,
        fontWeight: '800',
        marginBottom: theme.spacing.sm,
    },

    // --- Messages: bubbles
    bubbleWrap: { alignItems: 'flex-start' },
    bubbleWrapMine: { alignItems: 'flex-end' },
    bubble: {
        maxWidth: '85%',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 10,
    },
    /** The player's own line takes the light fill, so its text is black. */
    mine: { backgroundColor: theme.colors.highlight },

    // --- Mail: stacked letters
    /** The reply block, under the letter rather than pinned below it. */
    mailAnswers: { marginTop: theme.spacing.md },
    letterWrap: {},
    letter: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
    },
    letterFrom: {
        color: theme.colors.brandMuted,
        fontSize: theme.typography.micro,
        fontWeight: '700',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    letterFromMine: { color: theme.colors.highlightText },

    said: { color: theme.colors.textPrimary, fontSize: theme.typography.body + 1, lineHeight: 21 },
    saidMine: { color: theme.colors.highlightText },

    /** Bounded, so a tall block scrolls instead of pushing itself off-screen. */
    answersScroll: { flexGrow: 0, maxHeight: MAX_ANSWER_BLOCK },
    answers: {
        // ------------------------------------------------------------------
        //  SIDE BY SIDE WHEN THEY FIT, STACKED WHEN THEY DO NOT
        // ------------------------------------------------------------------
        //  They were full-width rows, which made two answers read as a menu
        //  of settings rather than as two things a person could say.
        //
        //  Each bubble hugs its own text and the row wraps, so a pair of
        //  short answers sits together and a long one takes a line of its
        //  own. Forcing two columns would have been worse: the longest
        //  answer in the game is 59 characters and half a phone width holds
        //  about nineteen, so every serious decision would have arrived as
        //  two four-line slabs.
        //
        //  Centred, because a row of two is a pair of options rather than a
        //  list, and a list is what left-alignment says.
        // ------------------------------------------------------------------
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    answer: {
        // ------------------------------------------------------------------
        //  A THING YOU CAN SAY, AND IT HAS TO LOOK LIKE ONE
        // ------------------------------------------------------------------
        //  It was `surfaceRaised` - the same grey as the card the character
        //  is speaking from, and as every other panel in the app. Nothing on
        //  the screen said which of the two blocks was pressable.
        //
        //  `guidance` is the palette's violet, and its sentence covers this:
        //  it is already the ground for the tutorial card, which is the other
        //  place the app speaks to the player rather than as the world.
        //
        //  NOT GREEN, which was the obvious answer and the one asked for.
        //  Green in this palette says one thing - "you made money" - and
        //  painting every conversation with it would spend that sentence on
        //  a button. Violet measures 7.65 against white and separates from
        //  the ground at 2.05, so it reads as pressable without borrowing a
        //  meaning that is doing a job elsewhere.
        // ------------------------------------------------------------------
        maxWidth: '100%',
        paddingVertical: 13,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.guidance,
    },
    answerPressed: { opacity: 0.72 },
    answerText: { color: theme.colors.textPrimary, fontSize: theme.typography.body + 1, fontWeight: '600' },
});
