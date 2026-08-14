import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Animated,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { theme } from '../../../core/theme';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import ConversationRunner from '../../../components/story/ConversationRunner';
import AnimatedBubble from '../../../components/story/AnimatedBubble';
import { useMessageThreadLogic } from '../logic/useMessageThreadLogic';

const formatMonth = (m: number) => `M${m}`;

const MessageThreadScreen = () => {
    const { state, actions } = useMessageThreadLogic();
    const { thread, conversation, slideAnim, scrollViewRef } = state;
    const { handleBack, handleFinished } = actions;

    if (!thread) return null;

    if (conversation) {
        return (
            <Animated.View style={[styles.root, { transform: [{ translateX: slideAnim }] }]}>
                <ScreenHeader title={thread.name} subtitle={thread.role} onBack={handleBack} />
                <ConversationRunner
                    conversation={conversation}
                    variant="message"
                    onFinished={handleFinished}
                />
            </Animated.View>
        );
    }

    return (
        <Animated.View style={[styles.root, { transform: [{ translateX: slideAnim }] }]}>
            <KeyboardAvoidingView
                style={styles.root}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScreenHeader title={thread.name} subtitle={thread.role} onBack={handleBack} />

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
                                <AnimatedBubble
                                    delay={Math.min(index * 30, 240)}
                                    style={[styles.bubbleWrap, isMine && styles.bubbleWrapMine]}
                                >
                                    <View style={[
                                        styles.bubble, 
                                        isMine ? styles.bubbleMine : styles.bubbleThem,
                                        isMine ? styles.tailRight : styles.tailLeft
                                    ]}>
                                        <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
                                            {m.text}
                                        </Text>
                                    </View>
                                </AnimatedBubble>
                            </View>
                        );
                    })}
                </ScrollView>

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
        </Animated.View>
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
