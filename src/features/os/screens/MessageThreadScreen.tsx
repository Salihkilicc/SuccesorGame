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
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { theme } from '../../../core/theme';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import { useMessageStore, type Thread } from '../../../core/store/useMessageStore';
import { useGameStore } from '../../../core/store/useGameStore';
import ConversationRunner from '../../../components/story/ConversationRunner';
import { conversationById } from '../../../data/story';
import { useStoryStore } from '../../../core/store/useStoryStore';

const formatMonth = (m: number) => `M${m}`;

const MessageThreadScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const threadId = route.params?.threadId;

    const threads = useMessageStore(s => s.threads);
    const thread = threads.find(t => t.id === threadId);

    // SHELVED with the composer below - see the note on it. Left here rather
    // than removed so that whatever replaces the box knows where to reach.
    // const sendFromPlayer = useMessageStore(s => s.sendFromPlayer);
    // Still live: a finished scene is dated with the month it was played.
    const currentMonth = useGameStore(s => s.currentMonth);
    // const [draft, setDraft] = useState('');
    const scrollViewRef = useRef<ScrollView>(null);

    // ------------------------------------------------------------------
    //  THE SCENE IS DECIDED ONCE, ON ARRIVAL
    // ------------------------------------------------------------------
    //  Finishing a conversation clears the thread's `conversationId`, and
    //  this screen is subscribed to the threads - so for one frame between
    //  the clear and `goBack()` it re-rendered as a PLAIN thread: a different
    //  scroll view, a composer, a keyboard-avoiding wrapper, all mounting and
    //  unmounting inside a single transition. That is the white flash at the
    //  end of every scene.
    //
    //  Read on mount and held. The player cannot be handed a different scene
    //  while they are inside one, so there is nothing to react to.
    // ------------------------------------------------------------------
    const [playing] = useState(() => {
        const t = useMessageStore.getState().threads.find(x => x.id === threadId);
        return t?.conversationId ? conversationById(t.conversationId) : undefined;
    });

    // Auto scroll to bottom
    useEffect(() => {
        if (!thread) return;
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [thread?.messages.length]);

    if (!thread) return null;

    // ------------------------------------------------------------------
    //  A THREAD WITH A CONVERSATION IS PLAYED, NOT TYPED INTO
    // ------------------------------------------------------------------
    //  Same runner the mail screen uses. The reply box below is for the
    //  plain threads that have no branching attached - a scene supplies its
    //  own answers, and a free-text box beside two written choices would
    //  suggest the game reads what you type.
    // ------------------------------------------------------------------
    const conversation = playing;

    if (conversation) {
        return (
            <View style={styles.root}>
                <ScreenHeader title={thread.name} subtitle={thread.role} onBack={() => navigation.goBack()} />
                <ConversationRunner
                    conversation={conversation}
                    variant="message"
                    onFinished={(history) => {
                        // ------------------------------------------------------
                        //  PLAYED IS NOT THE SAME AS DELIVERED
                        // ------------------------------------------------------
                        //  A thread holds one conversation id and nothing ever
                        //  cleared it, so re-opening the thread replayed the
                        //  scene from the top - and the runner applies effects
                        //  as answers are picked, so dials moved twice and a
                        //  schedule fired twice.
                        //
                        //  It also made the thread look permanently busy, which
                        //  is what stops the next scene being delivered - see
                        //  the note in core/story/deliver.ts.
                        // ------------------------------------------------------
                        //
                        //  AND PLAYED IS NOT THE SAME AS GONE EITHER
                        //
                        //  Clearing the id alone deleted the scene from the
                        //  screen it happened on. The transcript becomes
                        //  ordinary messages first, so the thread reads like
                        //  a thread - then the id goes and the next scene
                        //  from this person has somewhere to land.
                        //
                        //  The saved position goes with it: the store copy
                        //  exists so a half-played scene survives being left,
                        //  and once the lines are in the thread it would be a
                        //  second copy of the same conversation.
                        useMessageStore.getState()
                            .appendTranscript(thread.id, history, currentMonth);
                        useMessageStore.getState().clearConversation(thread.id);
                        useStoryStore.getState().clearScene(conversation.id);
                        navigation.goBack();
                    }}
                />
            </View>
        );
    }

    // ------------------------------------------------------------------
    //  SHELVED: THE PLAYER USED TO BE ABLE TO SEND THIS
    // ------------------------------------------------------------------
    //  It worked, which was the problem. You could tell your Head of
    //  Production that you were hiring fifty people, watch the bubble
    //  appear in your own colour, and nothing anywhere in the game would
    //  read it. Not the staffing number, not her dial, not the scene that
    //  fires when the line is short.
    //
    //  A box that accepts a sentence is a promise that the sentence was
    //  heard. This game answers with WRITTEN choices everywhere else
    //  precisely so that every answer is one the world can act on, and one
    //  free-text box undoes that claim for the whole phone.
    //
    //  Kept rather than deleted: if replies ever become real - a small set
    //  of parsed intents, a quick-reply strip - this is the door they come
    //  through.
    // ------------------------------------------------------------------
    // const send = () => {
    //     const text = draft.trim();
    //     if (!text) return;
    //     sendFromPlayer(thread.id, text, currentMonth);
    //     setDraft('');
    // };

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScreenHeader title={thread.name} subtitle={thread.role} onBack={() => navigation.goBack()} />

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

            {/* ------------------------------------------------------------
                THE COMPOSER IS SCENERY

                It stays because a messages app without one does not look
                like a messages app, and the phone is the fiction the whole
                interface rests on. It does not accept text because the game
                cannot read text - see the shelved `send` above.

                `editable={false}` AND `pointerEvents="none"`: the first
                refuses the keystrokes, the second refuses the tap, so there
                is no cursor blinking in a box that will never take a word.
                A caret is a promise too.
               ------------------------------------------------------------ */}
            <View
                style={[styles.composer, { paddingBottom: NAV_BAR_CLEARANCE }]}
                pointerEvents="none">
                <View style={styles.composerInputWrap}>
                    <TextInput
                        style={styles.composerInput}
                        editable={false}
                        placeholder="iMessage..."
                        placeholderTextColor={theme.colors.textMuted}
                        multiline
                    />
                    {/* Permanently in its empty state, which is what the
                        button would show anyway beside a box nobody can type
                        into. A View rather than a Pressable: a control that
                        depresses and does nothing is worse than one that
                        plainly is not a control. */}
                    <View style={[styles.sendCircle, styles.sendOff]}>
                        <MaterialCommunityIcons
                            name="arrow-up"
                            size={20}
                            color={theme.colors.textMuted}
                        />
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

export default MessageThreadScreen;

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },
    thread: { padding: theme.spacing.md, gap: 4 },
    timeLabel: {
        textAlign: 'center',
        color: theme.colors.textMuted,
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
    bubbleThem: { backgroundColor: theme.colors.surfaceRaised },
    bubbleMine: { backgroundColor: theme.colors.primary },
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
    bubbleText: { color: theme.colors.textPrimary, fontSize: 15, lineHeight: 20 },
    bubbleTextMine: { color: theme.colors.primaryText },

    composer: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    composerInputWrap: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: theme.colors.background,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    composerInput: {
        flex: 1,
        maxHeight: 100,
        color: theme.colors.textPrimary,
        fontSize: 15,
        paddingTop: 8,
        paddingBottom: 8,
    },
    sendCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
        marginBottom: 2,
    },
    sendOff: { backgroundColor: theme.colors.disabled },
    sendPressed: { opacity: 0.8 },
});
