// src/core/newGame.ts
//
// ============================================================================
//  NEW GAME — the single entry point
// ============================================================================
//
//  Wipes all persistent game state and sets up a clean start.
//
//  WHY THIS FILE EXISTS: the project writes 20+ separate zustand stores to
//  AsyncStorage. The old `useGameStore.resetGame` deleted only 7 of them, and
//  two of the key names were wrong ('succesor_laboratory_v1' and
//  'succesor_user_v1' — the real names are 'succesor_laboratory' and
//  'succesor_user_v3'). The result: starting a new game leaked old data.
//
//  RULE: when you add a new persisted store, add its key to PERSIST_KEYS.
//  Otherwise that store opens a new game with old data, and it is hard to spot.
//
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Store'lar ---
import { useGameStore, initialGameState } from './store/useGameStore';
import { useStatsStore } from './store/useStatsStore';
import { useProductStore } from './store/useProductStore';
import { useUserStore } from './store/useUserStore';
import { usePlayerStore } from './store/usePlayerStore';
import { useEventStore } from './store/useEventStore';
import { useLaboratoryStore } from './store/useLaboratoryStore';
import { useEducationStore } from './store/useEducationStore';
import { useMarketStore } from './store/useMarketStore';
import { useAchievementStore } from './store/useAchievementStore';

/**
 * EVERY game key in AsyncStorage.
 *
 * `succesor_settings_v1` is deliberately EXCLUDED: user preferences such as
 * language and notifications must not be reset by a new game.
 */
export const PERSIST_KEYS: string[] = [
    // Core
    'succesor_game_v2',
    'succesor_stats_v1',
    'succesor_products_v3',
    'succesor_user_v3',
    'succesor_player_hub_v4',
    'succesor_events_v1',
    'succesor_laboratory',
    'succesor_achievements_v1',
    'succesor_calendar_v2',
    'succesor_notes_v1',

    // Finans / piyasa
    'succesor_market_v6',
    'succesor_equity_v1', // eski surum — kalintisi temizlensin
    'succesor_equity_v2',
    'subsidiary-storage',
    'shareholder-store',

    // Education
    'succesor_education_v3',
    'succesor_education_system_v2',

    // Shelved modules (flag is off, but don't leave the data behind)
    'succesor_assets_v2',
    'relationship-storage',
    'travel-storage',

    // Keys left over from older versions — leaving them confuses migrations
    'succesor_game_v1',
    'succesor_user_v1',
    'succesor_user_v2',
    'succesor_products_v1',
    'succesor_products_v2',
    'succesor_laboratory_v1',
    'succesor_player_hub_v3',
    'succesor_education_v1',
    'succesor_education_v2',
];

/**
 * Returns the in-memory stores to their initial state.
 *
 * Wiping the disk is not enough on its own: the zustand stores still hold the
 * old data in memory and keep holding it until the app restarts.
 */
const resetInMemoryStores = () => {
    // reset() metodu olanlar
    useStatsStore.getState().reset();
    useProductStore.getState().reset();
    useUserStore.getState().reset();
    usePlayerStore.getState().reset();
    useEventStore.getState().reset();
    useLaboratoryStore.getState().reset();
    useEducationStore.getState().reset();
    useMarketStore.getState().reset();
    useAchievementStore.getState().resetAchievements();

    // Dynamic require: these stores live in feature folders and some of them
    // import back into core — a static import would create a cycle.
    try {
        const { useEquityStore } = require('../features/finance/stores/useEquityStore');
        useEquityStore.getState().reset?.();
    } catch (e) {
        console.warn('[newGame] useEquityStore sifirlanamadi', e);
    }

    try {
        const { useCorporateFinanceStore } = require('../features/finance/stores/useCorporateFinanceStore');
        useCorporateFinanceStore.getState().reset?.();
    } catch (e) {
        console.warn('[newGame] useCorporateFinanceStore sifirlanamadi', e);
    }

    try {
        const { useEducationSystem } = require('../features/life/components/Education/store/useEducationSystem');
        useEducationSystem.getState().reset?.();
    } catch (e) {
        console.warn('[newGame] useEducationSystem sifirlanamadi', e);
    }

    try {
        const { useAssetStore } = require('../features/shopping/store/useAssetStore');
        useAssetStore.getState().reset?.();
    } catch (e) {
        console.warn('[newGame] useAssetStore sifirlanamadi', e);
    }

    // The board: it has no reset(); initializeGame() rebuilds the starting
    // members from INITIAL_BOARD_MEMBERS.
    try {
        const { useShareholderStore } = require('../features/shareholders/stores/useShareholderStore');
        useShareholderStore.getState().initializeGame();
    } catch (e) {
        console.warn('[newGame] Kurul yeniden kurulamadi', e);
    }

    // Leave GameStore for last: _hasHydrated must stay true or the UI freezes.
    useGameStore.setState({ ...initialGameState, _hasHydrated: true });

    // ------------------------------------------------------------------
    //  CRITICAL: turn the hydration flags back on.
    // ------------------------------------------------------------------
    //  App.tsx returns `null` until statsStore and gameStore have hydrated
    //  (i.e. a white screen). But because `initialStatsState._hasHydrated`
    //  is `false`, `useStatsStore.reset()` clears the flag and persist never
    //  runs hydration again — we already deleted the disk.
    //
    //  Net effect: without setting the flag by hand, a new game sits on a
    //  white screen. (This is exactly what happened on the first attempt.)
    // ------------------------------------------------------------------
    useStatsStore.setState({ _hasHydrated: true });

    // ------------------------------------------------------------------
    //  STORES WHOSE MEMORY WAS NEVER RESET
    // ------------------------------------------------------------------
    //  These three had no `reset()` method and ONLY had their hydration flag
    //  set here. Their disk keys were deleted, but the IN-MEMORY data stayed
    //  — and zustand persist wrote that stale data straight back to disk on
    //  the next write. So notes, calendar and relationships carried over into
    //  the new game intact.
    //
    //  `_hasHydrated: true` is applied AFTER the initial state: it sits as
    //  `false` inside initialState, so reversing the order leaves the app on
    //  a white screen (see the statsStore note below).
    // ------------------------------------------------------------------
    try {
        const { initialNotesState, useNotesStore } = require('./store/useNotesStore');
        useNotesStore.setState({ ...initialNotesState, _hasHydrated: true });

        const { initialCalendarState, useCalendarStore } = require('./store/useCalendarStore');
        useCalendarStore.setState({ ...initialCalendarState, _hasHydrated: true });

        const { initialRelationshipState, useRelationshipStore } = require('./store/useRelationshipStore');
        useRelationshipStore.setState({ ...initialRelationshipState, _hasHydrated: true });

        // Settings are DELIBERATELY not reset: language and notification
        // preferences belong to the player, not to the game.
        const { useSettingsStore } = require('./store/useSettingsStore');
        useSettingsStore.setState({ _hasHydrated: true });
    } catch (e) {
        console.warn('[newGame] Bellek sifirlanamadi', e);
    }
};

/**
 * Starts a new game: wipes the disk, resets memory, rebuilds the board.
 *
 * The caller should send the player back to Home once this resolves.
 */
export const startNewGame = async (): Promise<void> => {
    console.log('[newGame] Yeni oyun baslatiliyor...');

    // 1) Reset memory. Do this first — the persist middleware then writes the
    //    clean state to disk on its next write.
    resetInMemoryStores();

    // 2) Diski temizle.
    //    Tek tek siliniyor: bir anahtardaki hata digerlerini engellemesin.
    //    (multiRemove kullanilmiyor — @react-native-async-storage v3
    //    tiplerinde mevcut degil.)
    let removed = 0;
    for (const key of PERSIST_KEYS) {
        try {
            await AsyncStorage.removeItem(key);
            removed += 1;
        } catch (e) {
            console.warn(`[newGame] ${key} silinemedi`, e);
        }
    }
    console.log(`[newGame] ${removed}/${PERSIST_KEYS.length} anahtar temizlendi.`);

    // 3) Denetle.
    verifyNewGame();

    console.log('[newGame] Hazir.');
};

// ============================================================================
//  NEW-GAME AUDIT
// ============================================================================
//  This entire file exists because of the "forgot to reset something" bug,
//  and that bug is SILENT: the game opens, it runs, only the numbers are
//  wrong. The player says "the headcount came over from my last game" and
//  finding which store did it by hand takes hours.
//
//  This function compares the critical fields against their expected initial
//  values after a reset and prints any that drifted BY NAME. It does not fix
//  the problem — it tells you where it is, which was the hard part.
// ============================================================================
export const verifyNewGame = (): string[] => {
    const problems: string[] = [];
    const check = (store: string, field: string, actual: unknown, expected: unknown) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            problems.push(`${store}.${field}: beklenen ${JSON.stringify(expected)}, gelen ${JSON.stringify(actual)}`);
        }
    };

    try {
        const st = useStatsStore.getState() as any;
        // Personel — oyuncunun ilk fark ettigi sey bu.
        check('stats', 'employeeCount', st.employeeCount, 20);
        check('stats', 'targetHeadcount', st.targetHeadcount, 20);
        check('stats', 'incomingHires', st.incomingHires, 0);
        check('stats', 'employeeMorale', st.employeeMorale, 75);
        check('stats', 'facilityTier', st.facilityTier, 1);
        check('stats', 'companyDebtTotal', st.companyDebtTotal, 0);
        check('stats', 'lossStreak', st.lossStreak ?? 0, 0);
        check('stats', 'brandByCategory', st.brandByCategory ?? {}, {});

        const g = useGameStore.getState() as any;
        check('game', 'currentMonth', g.currentMonth, 1);
        check('game', 'age', g.age, 25);
        check('game', 'lastQuarterReport', g.lastQuarterReport, null);

        const lab = useLaboratoryStore.getState() as any;
        check('laboratory', 'researcherCount', lab.researcherCount, 0);
        check('laboratory', 'totalRP', lab.totalRP, 0);

        const sh = require('../features/shareholders/stores/useShareholderStore').useShareholderStore.getState();
        check('shareholder', 'ceoRemoved', sh.ceoRemoved, false);
        check('shareholder', 'memberCount', sh.members.length, 4);
        check('shareholder', 'boardDemands', sh.boardDemands.length, 0);
        check('shareholder', 'promises', sh.promises.length, 0);

        const sub = require('../features/finance/stores/useCorporateFinanceStore').useCorporateFinanceStore.getState();
        check('subsidiary', 'owned', (sub.subsidiaries ?? []).length, 0);
    } catch (e) {
        problems.push(`denetim calistirilamadi: ${String(e)}`);
    }

    if (problems.length) {
        console.warn(
            '[newGame] ONCEKI OYUNDAN VERI TASINDI:\n  ' + problems.join('\n  ') +
            '\n  -> ilgili store\'un reset()\'i eksik ya da alani initialState\'te yok.' +
            '\n  (zustand setState MERGE yapar: initialState\'te olmayan alan HAYATTA KALIR.)',
        );
    } else {
        console.log('[newGame] Denetim temiz: tum kritik alanlar baslangic degerinde.');
    }
    return problems;
};
