// src/storage/warmUp.ts
//
// ============================================================================
//  EVERY SAVE STARTS READING AT LAUNCH, NOT WHEN SOMETHING HAPPENS TO NEED IT
// ============================================================================
//
//  A zustand store begins reading its disk copy when the store is CREATED,
//  which in a Metro bundle means when its module is first imported. Half the
//  game's persisted stores are reached by a lazy `require` inside the quarter
//  tick - territory, sponsorship, the casino risk record, the shareholders -
//  so their very first read started in the same pass as their very first
//  write.
//
//  What that cost, measured on a device: launch the app, press Next Quarter
//  within about a second, and that quarter's changes to those stores are
//  silently discarded. The write is dropped by storage/persist.ts, which is
//  correct and protects the disk, and then hydration lands and overwrites the
//  memory that held them. Thirty dropped writes in one tick.
//
//  ---------------------------------------------------------------------------
//  THIS FILE IS A LIST OF IMPORTS AND THAT IS THE WHOLE MECHANISM
//  ---------------------------------------------------------------------------
//  Importing the module creates the store; creating the store starts the read.
//  There is nothing to call. `warmUpStorage` exists so the app has something
//  to await and so this file cannot be mistaken for dead code and tidied away
//  - which is exactly what would happen to a bare list of side-effect imports.
//
//  RULE: a new persisted store is added here in the commit that creates it.
//  The test alongside checks this list against PERSIST_KEYS.
// ============================================================================

import { whenSettled } from './persist';

// --- Core -------------------------------------------------------------------
import '../core/store/useGameStore';
import '../core/store/useStatsStore';
import '../core/store/useUserStore';
import '../core/store/usePlayerStore';
import '../core/store/useProductStore';
import '../core/store/useIdentityStore';
import '../core/store/useEventStore';
import '../core/store/useLaboratoryStore';
import '../core/store/useAchievementStore';
import '../core/store/useCalendarStore';
import '../core/store/useNotesStore';
import '../core/store/useSettingsStore';

// --- The phone --------------------------------------------------------------
import '../core/store/useMessageStore';
import '../core/store/useMailStore';
import '../core/store/useNegotiationStore';
import '../core/store/useNewsStore';

// --- Story ------------------------------------------------------------------
import '../core/store/useStoryStore';
import '../core/store/useTerritoryStore';
import '../core/store/useSponsorshipStore';
import '../core/store/useCasinoRiskStore';

// --- Money and the market ---------------------------------------------------
import '../core/store/useMarketStore';
import '../features/finance/stores/useCorporateFinanceStore';
import '../features/shareholders/stores/useShareholderStore';

// --- Family and the house ---------------------------------------------------
import '../core/store/useFamilyStore';
import '../core/store/useLuxoNetStore';

/**
 * Wait for every save to be read.
 *
 * Awaited once, at the top of the app, before anything can be pressed. After
 * that it costs a microtask: `whenSettled` resolves immediately when nothing
 * is outstanding.
 */
export const warmUpStorage = (): Promise<void> => whenSettled();
