// src/features/os/screens/MessagesScreen.tsx
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { theme } from '../../../core/theme';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import { useMessageStore, type Thread } from '../../../core/store/useMessageStore';

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

const MessagesScreen = () => {
    const navigation = useNavigation<any>();
    const threads = useMessageStore(s => s.threads);
    const markRead = useMessageStore(s => s.markRead);

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
                                navigation.navigate('MessageThread', { threadId: t.id });
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
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.surface,
    },
    rowPressed: { backgroundColor: theme.colors.surfaceRaised },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surfaceHigh,
    },
    avatarText: { color: theme.colors.textPrimary, fontWeight: '800', fontSize: 18 },
    unreadIndicatorRow: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: theme.colors.brand,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: theme.colors.surface,
    },
    unreadIndicatorRowText: {
        color: theme.colors.textPrimary,
        fontSize: 10,
        fontWeight: '900',
    },

    rowBody: { flex: 1, gap: 2, justifyContent: 'center' },
    rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowName: { color: theme.colors.textPrimary, fontWeight: '700', fontSize: 16, flex: 1 },
    rowTime: { color: theme.colors.textMuted, fontSize: 12 },
    rowRole: {
        color: theme.colors.textMuted,
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    rowPreview: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 18, marginTop: 2 },
    rowPreviewUnread: { color: theme.colors.textPrimary, fontWeight: '500' },
});
