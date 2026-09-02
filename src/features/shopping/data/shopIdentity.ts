// src/features/shopping/data/shopIdentity.ts
//
// ============================================================================
//  EIGHTY FIVE PRODUCTS SHARED SIX SYMBOLS, AND THE SYMBOLS WERE EMOJI
// ============================================================================
//
//  Asked for as "make a symbol for every product that looks like it and fits
//  the game's theme, and the symbols the shops lead with are old, renovate
//  them, and the shop buttons too, each with its own theme".
//
//  ---------------------------------------------------------------------------
//  WHAT WAS THERE
//  ---------------------------------------------------------------------------
//  Every item drew `getCategoryTheme(item.category)`, so a 1962 racer, an
//  armoured truck and an electric hypercar were the same little car. Six
//  symbols for a catalogue whose whole job is to make eighty five things feel
//  like eighty five things.
//
//  And the shops led with EMOJI - a font the game does not control, rendered
//  by the operating system, in somebody else's colours. Two shops shared a
//  crown, two shared a trophy, two shared a diamond. Emoji is also the one
//  graphical element on the screen that ignores the palette completely, which
//  is why it reads as older than everything around it.
//
//  ---------------------------------------------------------------------------
//  AND THE COLOURS WERE FIVE VALUES ACROSS TWENTY SEVEN SHOPS
//  ---------------------------------------------------------------------------
//      #05A8F6   x7      #CFD0D2   x8      #535B5F   x4
//      #FF8A8A   x6      rgba(255,255,255,0.48)  x1
//
//  Two of those are greys. So a boutique watchmaker and a defence contractor
//  were the same colour, and "each shop has its own look" was true of the
//  name and nothing else.
//
//  ---------------------------------------------------------------------------
//  DERIVED FROM ONE NUMBER PER SHOP
//  ---------------------------------------------------------------------------
//  The same approach the casino's felts took, for the same reason: twenty
//  seven shops times three surfaces is eighty one colours to pick by hand,
//  keep in step, and get wrong once. Each shop states a HUE and everything
//  else is derived at a fixed lightness, so a tint is always readable on the
//  dark ground and a wash is always dark enough to put white text on.
//
//  Which means the tests can check what matters - no two shops alike, every
//  pairing legible - instead of checking hex codes.
//
//  ---------------------------------------------------------------------------
//  AND THE ICON NAMES ARE CHECKED AGAINST THE REAL FONT
//  ---------------------------------------------------------------------------
//  A MaterialCommunityIcons name that does not exist renders as a blank box
//  and throws nothing. Sixty four item types plus twenty seven shops is
//  ninety one chances to typo one, so the test reads the shipped glyph map and
//  fails on any name the font has never heard of. That check is the reason
//  this file can be a long list of strings without being a risk.
//
//  PURE. No React, no stores.
// ============================================================================

/** Where a symbol comes from when the catalogue has nothing more specific. */
export const CATEGORY_ICON: Record<string, string> = {
    VEHICLE: 'car-sports',
    REAL_ESTATE: 'home-city-outline',
    MARINE: 'ferry',
    AIRCRAFT: 'airplane',
    WATCH: 'watch-variant',
    JEWELRY: 'diamond-stone',
};

/**
 * One symbol per kind of thing in the catalogue.
 *
 * Keyed on the `type` the data already carries rather than on a new field, so
 * an item added tomorrow with a known type is drawn correctly without anybody
 * touching this file, and an item with an unknown type falls back to its
 * department rather than to nothing.
 */
export const TYPE_ICON: Record<string, string> = {
    // ---- VEHICLE -------------------------------------------------------
    hypercar: 'car-sports',
    supercar: 'car-sports',
    electric_hypercar: 'car-electric',
    luxury_coupe: 'car-side',
    luxury_sedan: 'car-estate',
    convertible: 'car-convertible',
    classic: 'car-back',
    classic_racer: 'flag-checkered',
    race_car: 'racing-helmet',
    jdm_legend: 'car-turbocharger',
    rally_legend: 'car-lifted-pickup',
    armored_suv: 'shield-car',
    armored_truck: 'truck-flatbed',
    truck: 'truck',

    // ---- MARINE --------------------------------------------------------
    gigayacht: 'ferry',
    megayacht: 'ferry',
    superyacht: 'ship-wheel',
    sailing_yacht: 'sail-boat',
    cruise_ship: 'ferry',
    ocean_liner: 'anchor',
    residential_ship: 'waves',
    attack_sub: 'submarine',
    ds_sub: 'submarine',
    submersible_yacht: 'submarine',

    // ---- AIRCRAFT ------------------------------------------------------
    jumbo_jet: 'airplane',
    private_jet: 'airplane-takeoff',
    stealth_fighter: 'shield-star-outline',
    fighter_jet: 'radar',
    military_heli: 'helicopter',
    heavy_heli: 'helicopter',
    luxury_heli: 'helicopter',

    // ---- REAL ESTATE ---------------------------------------------------
    private_island: 'island',
    private_island_complex: 'island',
    sovereign_island: 'palm-tree',
    island_group: 'beach',
    skyscraper: 'office-building',
    skyscraper_floor: 'city-variant-outline',
    residential_tower: 'domain',
    green_skyscraper: 'greenhouse',
    office_tower: 'office-building-outline',
    tech_campus: 'chart-timeline-variant',
    palace: 'castle',
    castle: 'castle',
    mansion: 'home-modern',
    villa: 'home-variant-outline',
    penthouse: 'city',
    bunker_complex: 'terrain',
    converted_silo: 'safe',

    // ---- WATCH ---------------------------------------------------------
    grand_complication: 'cog-outline',
    tourbillon: 'watch-variant',
    sports_watch: 'watch',
    concept_watch: 'creation',
    bespoke: 'hammer-wrench',
    jewelry_watch: 'shimmer',
    automotive_watch: 'car-turbocharger',
    jewelry_piece: 'diamond',
    vintage_icon: 'trophy',
    vintage_comp: 'medal',
    vintage_complex: 'crown-outline',

    // ---- JEWELRY -------------------------------------------------------
    loose_diamond: 'diamond-stone',
    necklace: 'shimmer',
    engagement_ring: 'ring',
    tiara: 'crown',
    apparel: 'hanger',
};

/** The symbol for one thing in the shop. */
export const iconForItem = (item: { type?: string; category?: string }): string =>
    (item?.type ? TYPE_ICON[item.type] : undefined)
    ?? CATEGORY_ICON[item?.category ?? '']
    ?? 'shopping-outline';

// ============================================================================
//  THE SHOPS
// ============================================================================
//
//  A symbol and a hue each, all twenty seven distinct in both. The hue is the
//  only number stated; the three colours a shop needs come out of it.
// ============================================================================

export type ShopIdentity = {
    icon: string;
    /** 0 to 359. The one number a shop owns. */
    hue: number;
};

export const SHOP_IDENTITY: Record<string, ShopIdentity> = {
    // ---- VEHICLE -------------------------------------------------------
    shop_velocity_motors: { icon: 'speedometer', hue: 4 },
    shop_monarch_auto: { icon: 'car-estate', hue: 28 },
    shop_apex_imports: { icon: 'flag-checkered', hue: 50 },
    shop_iron_horse: { icon: 'shield-car', hue: 216 },
    shop_future_wheels: { icon: 'flash', hue: 166 },
    shop_classic_legends: { icon: 'car-back', hue: 338 },

    // ---- REAL ESTATE ---------------------------------------------------
    shop_eden_islands: { icon: 'island', hue: 132 },
    shop_skyline_architects: { icon: 'office-building', hue: 228 },
    shop_dynasty8_elite: { icon: 'home-modern', hue: 288 },
    shop_vault_properties: { icon: 'safe', hue: 96 },
    shop_heritage_estates: { icon: 'castle', hue: 16 },
    shop_urban_corp: { icon: 'city', hue: 264 },

    // ---- MARINE --------------------------------------------------------
    shop_poseidon_yards: { icon: 'sail-boat', hue: 204 },
    shop_deep_blue_systems: { icon: 'submarine', hue: 252 },
    shop_horizon_cruisers: { icon: 'anchor', hue: 180 },

    // ---- AIRCRAFT ------------------------------------------------------
    shop_elitas_travel: { icon: 'airplane-takeoff', hue: 240 },
    shop_mach1_defense: { icon: 'radar', hue: 112 },
    shop_cloud9_copters: { icon: 'helicopter', hue: 192 },

    // ---- WATCH ---------------------------------------------------------
    shop_chronos_swiss: { icon: 'watch-variant', hue: 40 },
    shop_avant_garde: { icon: 'creation', hue: 300 },
    shop_legacy_time: { icon: 'trophy', hue: 62 },
    shop_geneva_atelier: { icon: 'hammer-wrench', hue: 150 },

    // ---- JEWELRY -------------------------------------------------------
    shop_gem_vault: { icon: 'diamond-stone', hue: 324 },
    shop_aurum_co: { icon: 'gold', hue: 76 },
    shop_imperial_crown: { icon: 'crown', hue: 312 },
    shop_vow_eternity: { icon: 'ring', hue: 350 },
    shop_ice_district: { icon: 'snowflake', hue: 276 },
};

// ============================================================================
//  AND THE THREE COLOURS A SHOP NEEDS
// ============================================================================
//
//  TINT   the symbol and the shop's name, on the dark app background. Bright
//         enough to read, so a high lightness.
//  WASH   the pad the symbol sits on. Dark enough that the tint reads on it.
//  EDGE   the hairline round the card. Between the two.
//
//  Fixed lightnesses rather than per shop values, for the reason the casino's
//  felts give: a number picked by eye per room is a number that drifts, and
//  the constraint that actually decides it is contrast.
// ============================================================================

export const TINT_L = 0.70;
export const WASH_L = 0.14;
export const EDGE_L = 0.30;
export const SHOP_SATURATION = 0.62;
/** The wash keeps less of the colour, or a card reads as a warning. */
export const WASH_SATURATION = 0.34;

const hsl = (h: number, s: number, l: number): string => {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hp = ((h % 360) + 360) % 360 / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    const m = l - c / 2;
    const [r, g, b] =
        hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x]
            : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
    return '#' + [r, g, b]
        .map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
};

export type ShopTheme = {
    /** The symbol and the name. */
    tint: string;
    /** What the symbol sits on. */
    wash: string;
    /** The hairline. */
    edge: string;
    icon: string;
};

const FALLBACK: ShopIdentity = { icon: 'shopping-outline', hue: 204 };

/**
 * What a shop looks like.
 *
 * A shop this file has never heard of gets the house blue and a shopping bag,
 * which is a shop that looks unfinished rather than a screen that crashes.
 */
export const shopTheme = (shopId: string): ShopTheme => {
    const id = SHOP_IDENTITY[shopId] ?? FALLBACK;
    return {
        tint: hsl(id.hue, SHOP_SATURATION, TINT_L),
        wash: hsl(id.hue, WASH_SATURATION, WASH_L),
        edge: hsl(id.hue, SHOP_SATURATION, EDGE_L),
        icon: id.icon,
    };
};

/** Contrast between two hex colours, for the tests and for anybody checking. */
export const contrast = (a: string, b: string): number => {
    const lum = (c: string) => {
        const n = parseInt((c || '').replace('#', ''), 16) || 0;
        const [r, g, bl] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => {
            const x = v / 255;
            return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
    };
    const l1 = lum(a);
    const l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};
