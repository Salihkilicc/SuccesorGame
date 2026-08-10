// src/features/os/screens/MessagesScreen.tsx
//
// ============================================================================
//  THE INBOX, AND ONE THREAD AT A TIME
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { theme } from '../../../core/theme';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import { useMessageStore, type Thread, type Message } from '../../../core/store/useMessageStore';
import { useGameStore } from '../../../core/store/useGameStore';

const formatMonth = (m: number) => `M${m}`;

const ThreadRow = ({ thread, onPress }: { thread: Thread; onPress: () => void }) => {
    const last = thread.messages[thread.messages.length - 1];
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                    {thread.initials}
                </Text>
                {thread.unread > 0 && (
                    <View style={styles.unreadIndicatorRow}>
                        <Text style={styles.unreadIndicatorRowText}>!</Text>
                    </View>
                )}
            </View>

            <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                    <Text style={styles.rowName} numberOfLines={1}>{thread.name}</Text>
                    {last && <Text style={styles.rowTime}>{formatMonth(last.atMonth)}</Text>}
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
    const scrollViewRef = useRef<ScrollView>(null);

    // Auto scroll to bottom
    useEffect(() => {
        // Small delay to ensure layout is complete
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [thread.messages.length]);

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
            <ScreenHeader title={thread.name} subtitle={thread.role} onBack={onBack} />

            <ScrollView 
                ref={scrollViewRef}
                contentContainerStyle={[styles.thread, { paddingBottom: NAV_BAR_CLEARANCE }]}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                {thread.messages.map((m, index) => {
                    const isMine = m.from === 'player';
                    const showTime = index === 0 || thread.messages[index - 1].atMonth !== m.atMonth;
                    return (
                        <View key={m.id}>
                            {showTime && (
                                <Text style={styles.timeLabel}>{formatMonth(m.atMonth)}</Text>
                            )}
                            <View style={[styles.bubbleWrap, isMine && styles.bubbleWrapMine]}>
                                <View style={[
                                    styles.bubble, 
                                    isMine ? styles.bubbleMine : styles.bubbleThem,
                                    // Tail logic
                                    isMine ? styles.tailRight : styles.tailLeft
                                ]}>
                                    <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
                                        {m.text}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>

            <View style={[styles.composer, { paddingBottom: Math.max(theme.spacing.md, NAV_BAR_CLEARANCE / 2) }]}>
                <View style={styles.composerInputWrap}>
                    <TextInput
                        style={styles.composerInput}
                        value={draft}
                        onChangeText={setDraft}
                        placeholder="iMessage..."
                        placeholderTextColor={theme.colors.textMuted}
                        selectionColor={theme.colors.primary}
                        multiline
                    />
                    <Pressable
                        onPress={send}
                        disabled={!draft.trim()}
                        style={({ pressed }) => [
                            styles.sendCircle,
                            !draft.trim() && styles.sendOff,
                            pressed && !!draft.trim() && styles.sendPressed,
                        ]}>
                        <MaterialCommunityIcons 
                            name="arrow-up" 
                            size={20} 
                            color={!draft.trim() ? theme.colors.textMuted : theme.colors.primaryText} 
                        />
                    </Pressable>
                </View>
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

            <ScrollView contentContainerStyle={[styles.list, { paddingBottom: NAV_BAR_CLEARANCE }]}>
                {threads.length === 0 ? (
                    <Text style={styles.empty}>No messages yet.</Text>
                ) : (
                    threads.map(t => (
                        <ThreadRow
                            key={t.id}
                            thread={t}
                            onPress={() => {
                                markRead(t.id);
                                setOpenId(t.id);
                            }}
                        />
                    ))
                )}
            </ScrollView>
        </View>
    );
};

export default MessagesScreen;

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000000' }, // Darker background for iMessage feel
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
        borderRadius: theme.radius.lg,
        backgroundColor: '#1C1C1E', // iOS Dark Mode surface
    },
    rowPressed: { backgroundColor: '#2C2C2E' },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3A3A3C',
    },
    avatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 18 },
    unreadIndicatorRow: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#FF9500', // Orange badge
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#1C1C1E',
    },
    unreadIndicatorRowText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
    },

    rowBody: { flex: 1, gap: 2, justifyContent: 'center' },
    rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowName: { color: '#FFFFFF', fontWeight: '700', fontSize: 16, flex: 1 },
    rowTime: { color: '#8E8E93', fontSize: 12 },
    rowRole: {
        color: '#8E8E93',
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    rowPreview: { color: '#8E8E93', fontSize: 14, lineHeight: 18, marginTop: 2 },
    rowPreviewUnread: { color: '#FFFFFF', fontWeight: '500' },

    thread: { padding: theme.spacing.md, gap: 4 },
    timeLabel: {
        textAlign: 'center',
        color: '#8E8E93',
        fontSize: 11,
        fontWeight: '600',
        marginVertical: 12,
    },
    bubbleWrap: { alignItems: 'flex-start', marginVertical: 2 },
    bubbleWrapMine: { alignItems: 'flex-end' },
    bubble: {
        maxWidth: '75%',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    bubbleThem: {
        backgroundColor: '#262628',
    },
    bubbleMine: {
        backgroundColor: '#0A84FF', // iOS blue
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
    bubbleText: { color: '#FFFFFF', fontSize: 15, lineHeight: 20 },
    bubbleTextMine: { color: '#FFFFFF' },

    composer: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#38383A',
        backgroundColor: '#1C1C1E',
    },
    composerInputWrap: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#000000',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#38383A',
    },
    composerInput: {
        flex: 1,
        maxHeight: 100,
        color: '#FFFFFF',
        fontSize: 15,
        paddingTop: 8,
        paddingBottom: 8,
    },
    sendCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#0A84FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
        marginBottom: 2,
    },
    sendOff: { backgroundColor: '#3A3A3C' },
    sendPressed: { opacity: 0.8 },
});
