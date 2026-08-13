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

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';

import { theme } from '../../core/theme';
import { useLocale } from '../../core/i18n';
import { line, nodeKey, choiceKey, subjectKey } from '../../data/i18n/storyText';
import { MAX_ANSWER_BLOCK, MAX_FONT_MULTIPLIER } from './answerFit';
import { nodeById, type Conversation, type Choice } from '../../core/story/graph';
import { applyEffects } from '../../core/story/effects';
import { gameSink } from '../../core/story/gameSink';
import { testAll } from '../../core/story/conditions';
import { readWorld } from '../../core/story/world';
import { CAST } from '../../data/story/cast';

type Props = {
    conversation: Conversation;
    /** Chat bubbles or a letter. Presentation only. */
    variant: 'message' | 'mail';
    /** Called when the conversation ends, so the screen can close or return. */
    onFinished?: () => void;
};

/** One thing that was said, kept so the card history reads as a conversation. */
type Said = { from: 'them' | 'player'; text: string };

const ConversationRunner = ({ conversation, variant, onFinished }: Props) => {
    const [nodeId, setNodeId] = useState<string | null>(conversation.start);
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
        const first = nodeById(conversation, conversation.start);
        return first ? [{ from: 'them', text: say(first.id, first.text) }] : [];
    });

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

    const finish = () => {
        setNodeId(null);
        onFinished?.();
    };

    const pick = (choice: Choice, index: number) => {
        // Effects first, then move. A choice that pays for something and then
        // opens a card mentioning the payment has to happen in that order.
        applyEffects(choice.effects, gameSink());

        setHistory(h => {
            const next = [...h, {
                from: 'player' as const,
                text: node ? answer(node.id, index, choice.text) : choice.text,
            }];
            const target = choice.next ? nodeById(conversation, choice.next) : undefined;
            if (target) next.push({ from: 'them', text: say(target.id, target.text) });
            return next;
        });

        if (!choice.next) { finish(); return; }
        // A link that survived the audit always resolves; this guard is for
        // data loaded from an older save of a scene that has since changed.
        setNodeId(nodeById(conversation, choice.next) ? choice.next : null);
        if (!nodeById(conversation, choice.next)) onFinished?.();
    };

    const done = !node;

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
            </ScrollView>

            {/* ------------------------------------------------------------
                THE ANSWERS SCROLL RATHER THAN RUNNING OFF THE SCREEN

                It was a plain View, and at the largest accessibility text
                size two cards in the game put the second answer below the
                bottom of an iPhone SE - with nothing to scroll, so the
                conversation simply could not be finished. That does not read
                as a layout bug to the player.

                `maxHeight` rather than a fixed one, so the block still hugs
                its content on every card that fits, which is all of them at
                normal sizes. See answerFit.ts for the measurements.
               ------------------------------------------------------------ */}
            <ScrollView
                style={styles.answersScroll}
                contentContainerStyle={styles.answers}
                // The answers are the point of the screen; if they are tall
                // enough to scroll, start at the top of them.
                bounces={false}>
                {done ? (
                    <Pressable
                        onPress={() => onFinished?.()}
                        style={({ pressed }) => [styles.answer, pressed && styles.answerPressed]}>
                        <Text style={styles.answerText} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>Close</Text>
                    </Pressable>
                ) : available.length === 0 ? (
                    // Either the card is terminal - they had the last word - or
                    // every answer was gated out. Both end the same way for the
                    // player; only the audit tells them apart.
                    <Pressable
                        onPress={finish}
                        style={({ pressed }) => [styles.answer, pressed && styles.answerPressed]}>
                        <Text style={styles.answerText} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>Close</Text>
                    </Pressable>
                ) : (
                    available.map(({ choice, index }) => (
                        <Pressable
                            key={index}
                            onPress={() => pick(choice, index)}
                            style={({ pressed }) => [styles.answer, pressed && styles.answerPressed]}>
                            <Text
                                style={styles.answerText}
                                // Honoured up to AX1 and then held. Past that
                                // the block is taller than the phone - and
                                // the container gives way rather than the
                                // text shrinking, which would answer a player
                                // who cannot read small text by making it
                                // smaller. See answerFit.ts.
                                maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
                                {node ? answer(node.id, index, choice.text) : choice.text}
                            </Text>
                        </Pressable>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

export default ConversationRunner;

const styles = StyleSheet.create({
    root: { flex: 1 },
    body: { padding: theme.spacing.md, gap: theme.spacing.sm },

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
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    answer: {
        paddingVertical: 13,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceRaised,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.borderStrong,
    },
    answerPressed: { backgroundColor: theme.colors.surfaceHigh },
    answerText: { color: theme.colors.textPrimary, fontSize: theme.typography.body + 1, fontWeight: '600' },
});
