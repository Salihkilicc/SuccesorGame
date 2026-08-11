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

const formatMonth = (m: number) => `M${m}`;

const MessageThreadScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const threadId = route.params?.threadId;

    const threads = useMessageStore(s => s.threads);
    const thread = threads.find(t => t.id === threadId);

    const sendFromPlayer = useMessageStore(s => s.sendFromPlayer);
    const currentMonth = useGameStore(s => s.currentMonth);
    
    const [draft, setDraft] = useState('');
    const scrollViewRef = useRef<ScrollView>(null);

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
    const conversation = thread.conversationId
        ? conversationById(thread.conversationId)
        : undefined;

    if (conversation) {
        return (
            <View style={styles.root}>
                <ScreenHeader title={thread.name} subtitle={thread.role} onBack={() => navigation.goBack()} />
                <ConversationRunner
                    conversation={conversation}
                    variant="message"
                    onFinished={() => navigation.goBack()}
                />
            </View>
        );
    }

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

            <View style={[styles.composer, { paddingBottom: NAV_BAR_CLEARANCE }]}>
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
