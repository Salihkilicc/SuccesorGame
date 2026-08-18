// src/components/story/ConversationRunner.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';

import { theme } from '../../core/theme';
import { MAX_ANSWER_BLOCK, MAX_FONT_MULTIPLIER } from './answerFit';
import { NAV_BAR_CLEARANCE } from '../../navigation/components/CrystalNavBar';
import type { Conversation } from '../../core/story/graph';
import { CAST } from '../../data/story/cast';
import type { Said } from '../../core/store/useStoryStore';
import { useConversationRunnerLogic } from './logic/useConversationRunnerLogic';
import { getChoiceBadges } from './effectBadges';
import AnimatedBubble from './AnimatedBubble';
import TypingIndicator from './TypingIndicator';

type Props = {
    conversation: Conversation;
    /** Chat bubbles or a letter. Presentation only. */
    variant: 'message' | 'mail';
    /**
     * Called when the conversation ends, so the screen can close or return.
     */
    onFinished?: (history: Said[]) => void;
};

const ConversationRunner = ({ conversation, variant, onFinished }: Props) => {
    const { state, actions } = useConversationRunnerLogic({ conversation, variant, onFinished });
    const { history, isTyping, available, node, done, scroller, subject } = state;
    const { pick, finish, answer } = actions;

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
        : available.length === 0
            ? closeButton(() => finish())
            : isTyping
                ? null
                : available.map(({ choice, index }) => {
                    const badges = getChoiceBadges(choice.effects);
                    return (
                        <Pressable
                            key={index}
                            onPress={() => pick(choice, index)}
                            style={({ pressed }) => [styles.answer, pressed && styles.answerPressed]}>
                            <Text
                                style={styles.answerText}
                                maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
                                {node ? answer(node.id, index, choice.text) : choice.text}
                            </Text>
                            {badges.length > 0 && (
                                <View style={styles.badgeRow}>
                                    {badges.map(b => (
                                        <View key={b.id} style={[styles.badge, (styles as any)[`badge_${b.tone}`]]}>
                                            {b.icon ? <Text style={styles.badgeIcon}>{b.icon}</Text> : null}
                                            <Text style={[styles.badgeText, (styles as any)[`badgeText_${b.tone}`]]}>
                                                {b.label}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </Pressable>
                    );
                });

    return (
        <View style={styles.root}>
            <ScrollView
                ref={scroller}
                contentContainerStyle={styles.body}
                onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}>
                {variant === 'mail' && !!subject && (
                    <Text style={styles.subject}>{subject}</Text>
                )}

                {history.map((said, i) => (
                    <AnimatedBubble
                        key={`${i}-${said.from}`}
                        delay={0}
                        style={[
                            variant === 'mail' ? styles.letterWrap : styles.bubbleWrap,
                            said.from === 'player' && variant === 'message' && styles.bubbleWrapMine,
                        ]}>
                        <View
                            style={[
                                variant === 'mail' ? styles.letter : styles.bubble,
                                said.from === 'player' && (variant === 'message' ? styles.mine : styles.letterMine),
                                variant === 'message' && (said.from === 'player' ? styles.tailRight : styles.tailLeft),
                            ]}>
                            {variant === 'mail' && (
                                <Text style={[styles.letterFrom, said.from === 'player' && styles.letterFromMine]}>
                                    {said.from === 'player' ? 'You replied' : (CAST[conversation.from]?.name ?? conversation.from)}
                                </Text>
                            )}
                            <Text style={[styles.said, said.from === 'player' && (variant === 'message' ? styles.saidMine : styles.saidLetterMine)]}>
                                {said.text}
                            </Text>
                            {said.from === 'player' && !!said.effects && said.effects.length > 0 && (
                                <View style={styles.historyBadgeRow}>
                                    {getChoiceBadges(said.effects).map(b => (
                                        <View key={b.id} style={[styles.badge, (styles as any)[`badge_${b.tone}`]]}>
                                            {b.icon ? <Text style={styles.badgeIcon}>{b.icon}</Text> : null}
                                            <Text style={[styles.badgeText, (styles as any)[`badgeText_${b.tone}`]]}>
                                                {b.label}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </AnimatedBubble>
                ))}

                {isTyping && (
                    <TypingIndicator variant={variant} />
                )}

                {/* Answers / Choices block */}
                {!!answers && (
                    <View style={[styles.answers, styles.mailAnswers]}>
                        {answers}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

export default ConversationRunner;

const styles = StyleSheet.create({
    root: { flex: 1 },
    body: {
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
        paddingBottom: NAV_BAR_CLEARANCE + theme.spacing.lg,
    },

    subject: {
        color: theme.colors.textPrimary,
        fontSize: theme.typography.subtitle + 2,
        fontWeight: '800',
        marginBottom: theme.spacing.sm,
    },

    // --- Messages: bubbles
    bubbleWrap: { alignItems: 'flex-start', marginVertical: 2 },
    bubbleWrapMine: { alignItems: 'flex-end' },
    bubble: {
        maxWidth: '82%',
        backgroundColor: '#2C3236',
        paddingHorizontal: 16,
        paddingVertical: 11,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    tailLeft: {
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        borderBottomRightRadius: 18,
        borderBottomLeftRadius: 4,
    },
    tailRight: {
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        borderBottomLeftRadius: 18,
        borderBottomRightRadius: 4,
    },
    /** The player's own line takes the crisp highlight fill */
    mine: {
        backgroundColor: theme.colors.primary,
    },

    // --- Mail: stacked letters
    mailAnswers: { marginTop: theme.spacing.md },
    letterWrap: { marginVertical: 4 },
    letter: {
        backgroundColor: '#2C3236',
        borderRadius: 16,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    letterMine: {
        backgroundColor: '#353D42',
        borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    letterFrom: {
        color: theme.colors.brandMuted,
        fontSize: theme.typography.micro,
        fontWeight: '700',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    letterFromMine: { color: theme.colors.primary },

    said: {
        color: theme.colors.textPrimary,
        fontSize: 15,
        lineHeight: 22,
    },
    saidMine: {
        color: theme.colors.primaryText,
        fontWeight: '500',
    },
    saidLetterMine: {
        color: theme.colors.textPrimary,
    },

    /** Bounded, so a tall block scrolls instead of pushing itself off-screen. */
    answersScroll: { flexGrow: 0, maxHeight: MAX_ANSWER_BLOCK },
    answers: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
        borderRadius: 18,
        backgroundColor: 'rgba(44, 50, 54, 0.75)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    answer: {
        maxWidth: '100%',
        paddingVertical: 13,
        paddingHorizontal: theme.spacing.md,
        borderRadius: 14,
        backgroundColor: theme.colors.guidance,
        shadowColor: theme.colors.guidance,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 3,
    },
    answerPressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
    answerText: {
        color: theme.colors.textPrimary,
        fontSize: theme.typography.body + 1,
        fontWeight: '600',
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 6,
    },
    historyBadgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 8,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
    },
    badgeIcon: {
        fontSize: 11,
        marginRight: 4,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    badge_positive: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderColor: 'rgba(16, 185, 129, 0.4)',
    },
    badgeText_positive: {
        color: '#34D399',
    },
    badge_negative: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderColor: 'rgba(239, 68, 68, 0.4)',
    },
    badgeText_negative: {
        color: '#F87171',
    },
    badge_neutral: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    badgeText_neutral: {
        color: theme.colors.textPrimary,
    },
    badge_accent: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        borderColor: 'rgba(245, 158, 11, 0.4)',
    },
    badgeText_accent: {
        color: '#FBBF24',
    },
});
