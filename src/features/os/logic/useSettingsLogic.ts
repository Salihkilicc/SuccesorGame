// src/features/os/logic/useSettingsLogic.ts
import { useState, useCallback } from 'react';
import { Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSettingsStore } from '../../../core/store/useSettingsStore';
import { useLocale, useLocaleStore, LOCALES, t } from '../../../core/i18n';
import { startNewGameAsking, confirmNewGame } from '../../../core/newGamePrompt';
import { applyAdminMode } from '../../../core/adminMode';

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
        /** Development only. See core/adminMode.ts. */
        handleAdminUnlock: () => void;
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

    // ------------------------------------------------------------------
    //  THE WARNING THE PLAYER WAS ACTUALLY SEEING
    // ------------------------------------------------------------------
    //  SHELVED: an `Alert.alert('New Game', 'All progress will be erased...')`
    //  with a destructive button, raised BEFORE `startNewGameAsking`.
    //
    //  The skip question was themed and the report came back saying it still
    //  looked like a warning. It did: this fired first, as a white iOS sheet,
    //  and the themed panel only appeared after it was answered. Two dialogs
    //  in one flow and the ugly one went first.
    //
    //  Both steps are the same mounted component now. See
    //  core/newGamePrompt.confirmNewGame and components/story/NewGameQuestion.
    //
    //      Alert.alert(
    //          'New Game',
    //          'All progress will be erased and a fresh run will be set up. Are you sure?',
    //          [
    //              { text: t('os.cancel'), style: 'cancel' },
    //              { text: t('os.reset'), style: 'destructive', onPress: ... },
    //          ],
    //      );
    // ------------------------------------------------------------------
    const handleNewGame = useCallback(async () => {
        try {
            if (!(await confirmNewGame())) return;
            await startNewGameAsking();
            navigation.goBack();
        } catch (e) {
            console.error('[Settings] Yeni oyun baslatilamadi', e);
            // Alert is still right for a genuinely unexpected failure - see
            // the note at the top of ConfirmPanel.
            Alert.alert('Error', 'Could not start a new game. Check the console.');
        }
    }, [navigation]);

    // ------------------------------------------------------------------
    //  ONE PRESS, AND IT SAYS WHAT IT DID
    // ------------------------------------------------------------------
    //  The report is not decoration. A god mode button that claims five
    //  things and quietly does three is the worst kind of tool, because the
    //  two it missed look like bugs in the GAME afterwards. Reading the
    //  counts back is how you find out on the spot.
    // ------------------------------------------------------------------
    const handleAdminUnlock = useCallback(() => {
        const r = applyAdminMode();
        Alert.alert(
            t('os.adminDone'),
            t('os.adminDoneBody', {
                money: `$${r.money.toLocaleString()}`,
                rp: r.researchPoints.toLocaleString(),
                rep: String(r.casinoReputation),
                products: String(r.productsUnlocked),
                assets: String(r.assetsOwned),
            }),
        );
    }, []);

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
            handleAdminUnlock,
            handleBack,
        },
    };
};
