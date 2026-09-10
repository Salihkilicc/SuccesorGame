// src/features/os/logic/useSettingsLogic.ts
import { useState, useCallback } from 'react';
import { Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSettingsStore } from '../../../core/store/useSettingsStore';
import { useLocale, useLocaleStore, LOCALES, t } from '../../../core/i18n';
import { startNewGameAsking, confirmNewGame, changeCharacter } from '../../../core/newGamePrompt';
import { applyAdminMode } from '../../../core/adminMode';
import { NO_TAPS, tap, shouldHint, tapsRemaining, type TapState } from '../../../core/adminGesture';

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
        /** Whether the admin section should be drawn. See core/adminGesture.ts. */
        isAdminUnlocked: boolean;
        /** How many taps are left, once the player is close enough to be told. */
        adminTapsLeft: number | null;
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
        /** Erase the run and choose a new name, gender and company. */
        handleChangeCharacter: () => void;
        /** One tap on the version line. Seven of them open the admin section. */
        tapVersion: () => void;
        /** Development only. See core/adminMode.ts. */
        handleAdminUnlock: () => void;
        handleBack: () => void;
    };
}

export const useSettingsLogic = (): SettingsLogicReturn => {
    const navigation = useNavigation();
    const locale = useLocale();
    const [isLanguageExpanded, setIsLanguageExpanded] = useState<boolean>(false);

    // ------------------------------------------------------------------
    //  THE HIDDEN DOOR
    // ------------------------------------------------------------------
    //  Reported as "I took a build and there was no admin panel". There was
    //  not: the section is drawn behind `FEATURES.godMode`, which is
    //  `__DEV__`. The rule for opening it now lives in core/adminGesture.ts
    //  as a pure function, so it is testable without pressing anything.
    //
    //  Component state rather than a store, deliberately. A half finished
    //  gesture is not worth persisting, and it SHOULD die when the player
    //  leaves the screen: three taps today and four tomorrow is not a
    //  gesture, it is the panel opening by itself.
    // ------------------------------------------------------------------
    const [taps, setTaps] = useState<TapState>(NO_TAPS);
    const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);

    const tapVersion = useCallback(() => {
        setTaps(prev => {
            const r = tap(prev, Date.now());
            if (r.unlocked) setIsAdminUnlocked(true);
            return r.state;
        });
    }, []);

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
    // ------------------------------------------------------------------
    //  ERASE THE RUN, THEN ASK WHO YOU ARE
    // ------------------------------------------------------------------
    //  Asked for as a button under New Game: change your character, and the
    //  company name with it, so it is like starting from scratch, with a
    //  warning first because the game restarts.
    //
    //  The whole sequence is in `changeCharacter`, and the order in it is
    //  load bearing - see the note there for why forgetting the identity
    //  first would deadlock on its own dialog.
    //
    //  No `navigation.goBack()` afterwards, unlike New Game. There is
    //  nothing to go back to: the navigator has already been replaced by the
    //  onboarding form, and popping a screen off a stack that is no longer
    //  mounted is how a back press ends up on a white screen.
    // ------------------------------------------------------------------
    const handleChangeCharacter = useCallback(async () => {
        try {
            await changeCharacter();
        } catch (e) {
            console.error('[Settings] Karakter degistirilemedi', e);
            Alert.alert('Error', 'Could not change the character. Check the console.');
        }
    }, []);

    const handleAdminUnlock = useCallback(() => {
        const r = applyAdminMode();
        Alert.alert(
            t('os.adminDone'),
            t('os.adminDoneBody', {
                money: `$${r.money.toLocaleString()}`,
                rp: r.researchPoints.toLocaleString(),
                rep: String(r.casinoReputation),
                // `products` is gone from the copy in both languages: the
                // button no longer opens the tech tree, and a line reading
                // "Products open 0" would report a step that is not being
                // taken as one that failed. See core/adminMode.ts.
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
            isAdminUnlocked,
            adminTapsLeft: shouldHint(taps) ? tapsRemaining(taps) : null,
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
            handleChangeCharacter,
            tapVersion,
            handleAdminUnlock,
            handleBack,
        },
    };
};
