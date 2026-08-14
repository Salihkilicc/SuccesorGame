// src/features/os/logic/useMessageThreadLogic.ts
import { useState, useRef, useEffect, useCallback } from 'react';
import { ScrollView, Animated, Dimensions, Easing } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMessageStore, type Thread } from '../../../core/store/useMessageStore';
import { useGameStore } from '../../../core/store/useGameStore';
import { useStoryStore, type Said } from '../../../core/store/useStoryStore';
import { conversationById } from '../../../data/story';
import type { Conversation } from '../../../core/story/graph';

const SCREEN_WIDTH = Dimensions.get('window').width || 400;

export interface MessageThreadLogicState {
    thread: Thread | undefined;
    conversation: Conversation | undefined;
    isExiting: boolean;
    slideAnim: Animated.Value;
    scrollViewRef: React.RefObject<ScrollView | null>;
}

export interface MessageThreadLogicActions {
    handleBack: () => void;
    handleFinished: (history: Said[]) => void;
}

export const useMessageThreadLogic = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const threadId = route.params?.threadId;

    const threads = useMessageStore(s => s.threads);
    const thread = threads.find(t => t.id === threadId);
    const currentMonth = useGameStore(s => s.currentMonth);

    const scrollViewRef = useRef<ScrollView | null>(null);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const [isExiting, setIsExiting] = useState(false);

    // ------------------------------------------------------------------
    //  THE SCENE IS DECIDED ONCE, ON ARRIVAL
    // ------------------------------------------------------------------
    const [playing] = useState<Conversation | undefined>(() => {
        const t = useMessageStore.getState().threads.find(x => x.id === threadId);
        return t?.conversationId ? conversationById(t.conversationId) : undefined;
    });

    // Auto scroll to bottom when new messages arrive
    useEffect(() => {
        if (!thread) return;
        const timer = setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
        return () => clearTimeout(timer);
    }, [thread?.messages.length]);

    const handleBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const handleFinished = useCallback((history: Said[]) => {
        if (!thread || !playing) {
            navigation.goBack();
            return;
        }

        setIsExiting(true);

        // Smoothly slide the screen to the right (like a natural navigation back pop)
        Animated.timing(slideAnim, {
            toValue: SCREEN_WIDTH,
            duration: 240,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start(() => {
            // Apply store updates and pop screen cleanly after slide completes
            useMessageStore.getState().appendTranscript(thread.id, history, currentMonth);
            useMessageStore.getState().clearConversation(thread.id);
            useStoryStore.getState().clearScene(playing.id);
            navigation.goBack();
        });
    }, [thread, playing, currentMonth, navigation, slideAnim]);

    return {
        state: {
            thread,
            conversation: playing,
            isExiting,
            slideAnim,
            scrollViewRef,
        },
        actions: {
            handleBack,
            handleFinished,
        },
    };
};
