// src/features/os/screens/MessagesScreen.tsx
//
// ============================================================================
//  THE INBOX, AND ONE THREAD AT A TIME
// ============================================================================
//
//  Two views in one file because they are two states of the same screen, not
//  two places: opening a thread should not push a route, since going "back"
//  from a conversation means back to the list, and the header already knows
//  how to do that. Splitting them would have meant a second route whose only
//  job is to be popped.
//
//  The list is the app; a thread is the list with one of its rows open.
// ============================================================================

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { theme } from '../../../core/theme';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import { useMessageStore, type Thread } from '../../../core/store/useMessageStore';
import { useGameStore } from '../../../core/store/useGameStore';

const ThreadRow = ({ thread, onPress }: { thread: Thread; onPress: () => void }) => {
    const last = thread.messages[thread.messages.length - 1];
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
            <View style={[styles.avatar, thread.unread > 0 && styles.avatarUnread]}>
                <Text style={[styles.avatarText, thread.unread > 0 && styles.avatarTextUnread]}>
                    {thread.initials}
                </Text>
            </View>

            <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                    <Text style={styles.rowName} numberOfLines={1}>{thread.name}</Text>
                    {thread.unread > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{thread.unread}</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.rowRole}>{thread.role}</Text>
                <Text
                    style={[styles.rowPreview, thread.unread > 0 && styles.rowPreviewUnread]}
                    numberOfLines={2}>
                    {last ? (last.from === 'player' ? `You: ${last.text}` : last.text) : ''}
                </Text>
            </View>
        </Pressable>
    );
};

const Conversation = ({ thread, onBack }: { thread: Thread; onBack: () => void }) => {
    const sendFromPlayer = useMessageStore(s => s.sendFromPlayer);
    const currentMonth = useGameStore(s => s.currentMonth);
    const [draft, setDraft] = useState('');

    const send = () => {
        const text = draft.trim();
        if (!text) return;
        sendFromPlayer(thread.id, text, currentMonth);
        setDraft('');
    };

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {/* Back returns to the LIST, not out of the app. A conversation is
                a state of this screen, so its exit is a state change. */}
            <ScreenHeader title={thread.name} subtitle={thread.role} onBack={onBack} />

            <ScrollView contentContainerStyle={styles.thread}>
                {thread.messages.map(m => (
                    <View
                        key={m.id}
                        style={[styles.bubbleWrap, m.from === 'player' && styles.bubbleWrapMine]}>
                        <View style={[styles.bubble, m.from === 'player' && styles.bubbleMine]}>
                            <Text style={[styles.bubbleText, m.from === 'player' && styles.bubbleTextMine]}>
                                {m.text}
                            </Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.composer}>
                <TextInput
                    style={styles.composerInput}
                    value={draft}
                    onChangeText={setDraft}
                    placeholder="Write a reply"
                    placeholderTextColor={theme.colors.textMuted}
                    selectionColor={theme.colors.primary}
                    multiline
                />
                <Pressable
                    onPress={send}
                    disabled={!draft.trim()}
                    style={({ pressed }) => [
                        styles.send,
                        !draft.trim() && styles.sendOff,
                        pressed && !!draft.trim() && styles.sendPressed,
                    ]}>
                    <Text style={styles.sendText}>Send</Text>
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
};

const MessagesScreen = () => {
    const navigation = useNavigation<any>();
    const threads = useMessageStore(s => s.threads);
    const markRead = useMessageStore(s => s.markRead);
    const [openId, setOpenId] = useState<string | null>(null);

    const open = threads.find(t => t.id === openId) || null;

    if (open) {
        return <Conversation thread={open} onBack={() => setOpenId(null)} />;
    }

    return (
        <View style={styles.root}>
            <ScreenHeader title="Messages" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.list}>
                {threads.length === 0 ? (
                    <Text style={styles.empty}>No messages yet.</Text>
                ) : (
                    threads.map(t => (
                        <ThreadRow
                            key={t.id}
                            thread={t}
                            onPress={() => {
                                // Read on OPEN, not on render. Marking from the
                                // list would clear the badge for anyone who
                                // merely scrolled past it.
                                markRead(t.id);
                                setOpenId(t.id);
                            }}
                        />
                    ))
                )}
                <View style={{ height: NAV_BAR_CLEARANCE }} />
            </ScrollView>
        </View>
    );
};

export default MessagesScreen;

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },
    list: { padding: theme.spacing.md, gap: theme.spacing.sm },
    empty: {
        color: theme.colors.textMuted,
        fontSize: theme.typography.body,
        textAlign: 'center',
        paddingVertical: 40,
    },

    row: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surface,
    },
    rowPressed: { backgroundColor: theme.colors.surfaceRaised },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surfaceHigh,
    },
    /** Unread gets the light fill, so its letters go black. Theme rule 1. */
    avatarUnread: { backgroundColor: theme.colors.highlight },
    avatarText: { color: theme.colors.textPrimary, fontWeight: '800', fontSize: 15 },
    avatarTextUnread: { color: theme.colors.highlightText },

    rowBody: { flex: 1, gap: 2 },
    rowTop: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    rowName: { color: theme.colors.textPrimary, fontWeight: '800', fontSize: theme.typography.body + 2, flex: 1 },
    rowRole: {
        color: theme.colors.brandMuted,
        fontSize: theme.typography.micro,
        fontWeight: '700',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    rowPreview: { color: theme.colors.textMuted, fontSize: theme.typography.caption + 1, lineHeight: 17, marginTop: 2 },
    rowPreviewUnread: { color: theme.colors.textSecondary },
    badge: {
        minWidth: 20,
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 10,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
    },
    badgeText: { color: theme.colors.primaryText, fontSize: theme.typography.micro, fontWeight: '800' },

    thread: { padding: theme.spacing.md, gap: theme.spacing.sm },
    bubbleWrap: { alignItems: 'flex-start' },
    bubbleWrapMine: { alignItems: 'flex-end' },
    bubble: {
        maxWidth: '82%',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 10,
    },
    /** Your own messages are the light fill, so they take black text. */
    bubbleMine: { backgroundColor: theme.colors.highlight },
    bubbleText: { color: theme.colors.textPrimary, fontSize: theme.typography.body + 1, lineHeight: 20 },
    bubbleTextMine: { color: theme.colors.highlightText },

    composer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.md + 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    composerInput: {
        flex: 1,
        maxHeight: 110,
        backgroundColor: theme.colors.surfaceRaised,
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 10,
        color: theme.colors.textPrimary,
        fontSize: theme.typography.body + 1,
    },
    send: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: 12,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.primary,
    },
    sendPressed: { backgroundColor: theme.colors.highlight },
    sendOff: { backgroundColor: theme.colors.disabled },
    sendText: { color: theme.colors.primaryText, fontWeight: '800', fontSize: theme.typography.body + 1 },
});
