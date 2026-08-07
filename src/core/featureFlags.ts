// src/core/featureFlags.ts
//
// ============================================================================
//  FEATURE FLAGS — THE "CEO CORE" FOCUS CUT
// ============================================================================
//
//  The genre-defining core of this game is the CEO simulation. This file
//  disables the life-simulation modules outside that core WITHOUT DELETING
//  ANY CODE.
//
//  To switch one back on: change `false` -> `true` on its line. Nothing else
//  is needed; the navigator, the menu grids and the monthly tick hooks all
//  read from this file.
//
//  RULE: when adding a new module, add a flag here first. Wiring a screen
//  straight into the navigator (unconditionally) is where the sprawl starts.
//
// ============================================================================

export const FEATURES = {
    // ------------------------------------------------------------------
    //  CEO CORE — always on. This is what the game is actually about.
    // ------------------------------------------------------------------
    /** Company management: production, factories, hiring, finance, acquisitions */
    company: true,
    /** Product portfolio, pricing, supply */
    products: true,
    /** R&D and the tech tree */
    research: true,
    /** Stock market and investing */
    market: true,
    /** Shareholders, capital structure, dilution, negotiation */
    shareholders: true,
    /** Quarterly financial report — the game's teaching surface */
    financialReport: true,

    /** Calendar, notes, settings, profile — the OS shell */
    os: true,

    // ------------------------------------------------------------------
    //  SHELVED — the code is still here, only access is closed.
    //  These come back one at a time, with a reason, once the engine is deeper.
    // ------------------------------------------------------------------
    /**
     * MBA / executive education. Shelved on the player's call: it sat on the
     * home screen without connecting to anything the CEO does, and it was
     * advancing a degree every quarter behind the scenes.
     * When it returns it should feed decision quality and credibility.
     */
    education: false,
    /** Lifestyle hub (features/life) — the Life tab and the app grid */
    life: false,
    /** Relationships / partner system (features/love).
     *  NOTE: when it returns it will be reshaped as "stakeholder management"
     *  (board, investor relations, key hires). */
    love: false,
    /** Kumarhane: slots, rulet, poker, blackjack */
    casino: false,
    /** Underworld tab (black market + hookup + network hub) */
    underworld: false,
    /** Kara borsa ve polis takibi mini-oyunu */
    blackMarket: false,
    /** Night out / hookup zinciri */
    nightOut: false,
    /** Luxury spending and stores */
    shopping: false,
    /** Personal possessions portfolio */
    belongings: false,
    /** DNA / character stats screen */
    dna: false,
    /** Gym and martial arts */
    gym: false,
    /** Spa, grooming, cosmetic work */
    sanctuary: false,
    /** Seyahat ve tatil rezervasyonu */
    travel: false,
    /** Weather app */
    weather: false,

    // ------------------------------------------------------------------
    //  DEVELOPER TOOLS
    // ------------------------------------------------------------------
    /** God Mode panel. Must be false in a release build. */
    godMode: __DEV__,
} as const;

export type FeatureKey = keyof typeof FEATURES;

/** Asks whether a single module is enabled. */
export const isEnabled = (key: FeatureKey): boolean => FEATURES[key] === true;

/**
 * Filters menu/grid arrays by flag.
 *
 *   const items = filterByFeature(SECTION_LEISURE);
 *
 * Items with no `feature` field always stay.
 */
export const filterByFeature = <T extends { feature?: FeatureKey }>(items: T[]): T[] =>
    items.filter(item => item.feature === undefined || isEnabled(item.feature));

/** The list of shelved modules — for diagnostics and logging. */
export const shelvedFeatures = (): FeatureKey[] =>
    (Object.keys(FEATURES) as FeatureKey[]).filter(k => !isEnabled(k));
