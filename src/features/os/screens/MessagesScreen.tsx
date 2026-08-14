// src/features/os/screens/MessagesScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Animated,
    Easing,
    LayoutAnimation,
    UIManager,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { theme } from '../../../core/theme';
import ScreenHeader from '../../../components/common/ScreenHeader';
import SwipeToDelete from '../../../components/common/SwipeToDelete';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import { useMessageStore, type Thread } from '../../../core/store/useMessageStore';

const formatMonth = (m: number) => `M${m}`;

// Android needs this switched on explicitly; iOS has it always. Harmless to
// call on a platform that ignores it.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * A row that arrives rather than appearing.
 *
 * A new message moves its thread to the top of the list, and the list simply
 * redrew - so a message arriving while the player was looking at the screen
 * was indistinguishable from one that had been there all along. Nothing was
 * wrong and nothing said anything had happened.
 *
 * A short fade and lift on mount, and LayoutAnimation on the list, so the
 * reorder reads as movement instead of a jump cut.
 */
const useArrival = () => {
    const t = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(t, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [t]);
    return {
        opacity: t,
        transform: [{
            translateY: t.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }),
        }],
    };
};

const ThreadRow = ({ thread, onPress }: { thread: Thread; onPress: () => void }) => {
    const last = thread.messages[thread.messages.length - 1];
    const unread = thread.unread > 0;
    const arrival = useArrival();

    return (
        <Animated.View style={arrival}>
            <Pressable
                onPress={onPress}
                style={({ pressed }) => [
                    styles.row,
                    unread && styles.rowUnread,
                    pressed && styles.rowPressed,
                ]}>
                {/* ------------------------------------------------------
                    UNREAD IS A PROPERTY OF THE ROW, NOT A BADGE ON IT

                    It was a small "!" on the avatar and nothing else, so a
                    thread with something waiting in it looked like a thread
                    with nothing waiting in it unless you were looking at
                    the corner of a circle.

                    A rule down the leading edge, in the same tobacco the
                    badge uses. It reads at a glance and from the top of the
                    screen, which is the only place anybody reads a list
                    from.
                   ------------------------------------------------------ */}
                {unread && <View style={styles.unreadEdge} />}

                <View style={[styles.avatar, unread && styles.avatarUnread]}>
                    <Text style={styles.avatarText}>{thread.initials}</Text>
                    {unread && (
                        <View style={styles.unreadIndicatorRow}>
                            <Text style={styles.unreadIndicatorRowText}>
                                {thread.unread > 9 ? '9+' : thread.unread}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.rowBody}>
                    <View style={styles.rowTop}>
                        <Text
                            style={[styles.rowName, unread && styles.rowNameUnread]}
                            numberOfLines={1}>
                            {thread.name}
                        </Text>
                        {last && <Text style={styles.rowTime}>{formatMonth(last.atMonth)}</Text>}
                    </View>
                    <Text style={styles.rowRole}>{thread.role}</Text>
                    <Text
                        style={[styles.rowPreview, unread && styles.rowPreviewUnread]}
                        numberOfLines={2}>
                        {last ? (last.from === 'player' ? `You: ${last.text}` : last.text) : ''}
                    </Text>
                </View>
            </Pressable>
        </Animated.View>
    );
};

const MessagesScreen = () => {
    const navigation = useNavigation<any>();
    const threads = useMessageStore(s => s.threads);
    const markRead = useMessageStore(s => s.markRead);
    const removeThread = useMessageStore(s => s.removeThread);

    // The reorder when a thread jumps to the top, animated rather than cut.
    const count = threads.reduce((n, t) => n + t.messages.length, 0);
    useEffect(() => {
        LayoutAnimation.configureNext(
            LayoutAnimation.create(240, LayoutAnimation.Types.easeInEaseOut,
                LayoutAnimation.Properties.opacity),
        );
    }, [count, threads.length]);

    return (
        <View style={styles.root}>
            <ScreenHeader title="Messages" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={[styles.list, { paddingBottom: NAV_BAR_CLEARANCE }]}>
                {threads.length === 0 ? (
                    <Text style={styles.empty}>No messages yet.</Text>
                ) : (
                    threads.map(t => (
                        // `removeThread` has existed since the father's death
                        // and was reachable only by dying. This is the gesture
                        // that was missing, not the function.
                        <SwipeToDelete
                            key={t.id}
                            label={`your conversation with ${t.name}`}
                            // ------------------------------------------------
                            //  A THREAD WITH A SCENE ON IT IS NOT CLUTTER
                            // ------------------------------------------------
                            //  The gesture is for tidying finished threads, and
                            //  a finished one looks exactly like one holding a
                            //  conversation nobody has played. The scene is
                            //  already marked seen, so deleting the thread is
                            //  the only way in this game to lose a piece of the
                            //  story permanently and silently.
                            //
                            //  It is still allowed. It is their phone. It just
                            //  does not happen without the sentence.
                            // ------------------------------------------------
                            warning={t.conversationId
                                ? 'There is a conversation here you have not played. It will not come back.'
                                : undefined}
                            onDelete={() => removeThread(t.id)}>
                            <ThreadRow
                                thread={t}
                                onPress={() => {
                                    markRead(t.id);
                                    navigation.navigate('MessageThread', { threadId: t.id });
                                }}
                            />
                        </SwipeToDelete>
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
        overflow: 'hidden',
    },
    /** One rung up, so an unread thread sits proud of the read ones. */
    rowUnread: { backgroundColor: theme.colors.surfaceRaised },
    unreadEdge: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        backgroundColor: theme.colors.unread,
    },
    rowPressed: { opacity: 0.7 },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surfaceHigh,
    },
    /** A ring rather than a different fill: the avatar is a face, not a state. */
    avatarUnread: {
        borderWidth: 1.5,
        borderColor: theme.colors.unread,
    },
    avatarText: { color: theme.colors.textPrimary, fontWeight: '800', fontSize: 18 },
    // ------------------------------------------------------------------
    //  THE UNREAD BADGE IS TOBACCO, NOT RED
    // ------------------------------------------------------------------
    //  Red on a badge is the convention every phone uses, and it is the
    //  wrong convention here: this game keeps red for one sentence, "this is
    //  costing you", and a message you have not opened is not costing you
    //  anything. It was the last red in the app doing a job that was not
    //  that.
    //
    //  LIGHT tobacco with dark text. The dark tobacco was the obvious pick
    //  and does not survive measurement - 1.61 from the surface it sits on,
    //  so the badge would be a slightly warmer patch of the same darkness.
    //  A badge nobody notices is not a badge. See `unread` in core/theme.ts.
    // ------------------------------------------------------------------
    unreadIndicatorRow: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: theme.colors.unread,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: theme.colors.surface,
    },
    unreadIndicatorRowText: {
        color: theme.colors.onLight,
        fontSize: 10,
        fontWeight: '900',
    },

    rowBody: { flex: 1, gap: 2, justifyContent: 'center' },
    rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowName: { color: theme.colors.textSecondary, fontWeight: '600', fontSize: 16, flex: 1 },
    /** Read rows step back rather than unread rows shouting. */
    rowNameUnread: { color: theme.colors.textPrimary, fontWeight: '800' },
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
