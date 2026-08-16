// src/features/os/logic/useSettingsLogic.ts
import { useState, useCallback } from 'react';
import { Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSettingsStore } from '../../../core/store/useSettingsStore';
import { useLocale, useLocaleStore, LOCALES, t } from '../../../core/i18n';
import { startNewGameAsking } from '../../../core/newGamePrompt';

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface SettingsLogicReturn {
    state: {
        locale: string;
        locales: typeof LOCALES;
        isLanguageExpanded: boolean;
        isMusicEnabled: boolean;
        isSoundEnabled: boolean;
        isNotificationsEnabled: boolean;
        isHapticsEnabled: boolean;
    };
    actions: {
        setLocale: (code: string) => void;
        toggleLanguageExpanded: () => void;
        toggleMusic: () => void;
        toggleSound: () => void;
        toggleNotifications: () => void;
        toggleHaptics: () => void;
        handleUnavailable: (docName?: string) => void;
        handleNewGame: () => void;
        handleBack: () => void;
    };
}

export const useSettingsLogic = (): SettingsLogicReturn => {
    const navigation = useNavigation();
    const locale = useLocale();
    const [isLanguageExpanded, setIsLanguageExpanded] = useState<boolean>(false);

    const {
        isMusicEnabled,
        isSoundEnabled,
        isNotificationsEnabled,
        isHapticsEnabled,
        toggleMusic,
        toggleSound,
        toggleNotifications,
        toggleHaptics,
    } = useSettingsStore();

    const setLocale = useCallback((code: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        useLocaleStore.getState().setLocale(code as any);
    }, []);

    const toggleLanguageExpanded = useCallback(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsLanguageExpanded((prev) => !prev);
    }, []);

    const handleUnavailable = useCallback((docName?: string) => {
        Alert.alert('Successor OS', docName ? `${docName} is currently unavailable.` : 'This document is currently unavailable.');
    }, []);

    const handleNewGame = useCallback(() => {
        Alert.alert(
            'New Game',
            'All progress will be erased and a fresh run will be set up. Are you sure?',
            [
                { text: t('os.cancel'), style: 'cancel' },
                {
                    text: t('os.reset'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await startNewGameAsking();
                            navigation.goBack();
                        } catch (e) {
                            console.error('[Settings] Yeni oyun baslatilamadi', e);
                            Alert.alert('Error', 'Could not start a new game. Check the console.');
                        }
                    },
                },
            ],
        );
    }, [navigation]);

    const handleBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    return {
        state: {
            locale,
            locales: LOCALES,
            isLanguageExpanded,
            isMusicEnabled,
            isSoundEnabled,
            isNotificationsEnabled,
            isHapticsEnabled,
        },
        actions: {
            setLocale,
            toggleLanguageExpanded,
            toggleMusic,
            toggleSound,
            toggleNotifications,
            toggleHaptics,
            handleUnavailable,
            handleNewGame,
            handleBack,
        },
    };
};
