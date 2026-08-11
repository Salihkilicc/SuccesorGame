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
import { nodeById, type Conversation, type Choice } from '../../core/story/graph';
import { applyEffects } from '../../core/story/effects';
import { gameSink } from '../../core/story/gameSink';
import { testAll } from '../../core/story/conditions';
import { readWorld } from '../../core/story/world';

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
    const [history, setHistory] = useState<Said[]>(() => {
        const first = nodeById(conversation, conversation.start);
        return first ? [{ from: 'them', text: first.text }] : [];
    });

    const node = nodeId ? nodeById(conversation, nodeId) : undefined;

    // The world is read fresh on every render rather than captured once: an
    // effect from the previous card may have changed the money a gate on this
    // card is about to test.
    const world = readWorld();

    const available: Choice[] = useMemo(
        () => (node?.choices ?? []).filter(ch => testAll(ch.when, world)),
        [node, world],
    );

    const finish = () => {
        setNodeId(null);
        onFinished?.();
    };

    const pick = (choice: Choice) => {
        // Effects first, then move. A choice that pays for something and then
        // opens a card mentioning the payment has to happen in that order.
        applyEffects(choice.effects, gameSink());

        setHistory(h => {
            const next = [...h, { from: 'player' as const, text: choice.text }];
            const target = choice.next ? nodeById(conversation, choice.next) : undefined;
            if (target) next.push({ from: 'them', text: target.text });
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
                    <Text style={styles.subject}>{conversation.subject}</Text>
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
                            {variant === 'mail' && (
                                <Text style={styles.letterFrom}>
                                    {said.from === 'player' ? 'You replied' : conversation.from.name}
                                </Text>
                            )}
                            <Text style={[styles.said, said.from === 'player' && styles.saidMine]}>
                                {said.text}
                            </Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.answers}>
                {done ? (
                    <Pressable
                        onPress={() => onFinished?.()}
                        style={({ pressed }) => [styles.answer, pressed && styles.answerPressed]}>
                        <Text style={styles.answerText}>Close</Text>
                    </Pressable>
                ) : available.length === 0 ? (
                    // Either the card is terminal - they had the last word - or
                    // every answer was gated out. Both end the same way for the
                    // player; only the audit tells them apart.
                    <Pressable
                        onPress={finish}
                        style={({ pressed }) => [styles.answer, pressed && styles.answerPressed]}>
                        <Text style={styles.answerText}>Close</Text>
                    </Pressable>
                ) : (
                    available.map((ch, i) => (
                        <Pressable
                            key={i}
                            onPress={() => pick(ch)}
                            style={({ pressed }) => [styles.answer, pressed && styles.answerPressed]}>
                            <Text style={styles.answerText}>{ch.text}</Text>
                        </Pressable>
                    ))
                )}
            </View>
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

    said: { color: theme.colors.textPrimary, fontSize: theme.typography.body + 1, lineHeight: 21 },
    saidMine: { color: theme.colors.highlightText },

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
