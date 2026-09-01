// src/core/casino/roomPalette.ts
//
// ============================================================================
//  EVERY ROOM PLAYED ON THE SAME GREEN CLOTH WITH THE SAME BLUE CARDS
// ============================================================================
//
//  Asked for as "change the back of the cards for every room, VIP, Istanbul
//  and so on, and change the colours of the table".
//
//  What was there: three hardcoded constants per felt, written once and
//  identical in Athens and in the Noir room.
//
//      BlackjackFelt   #0B3B2A / #12563C / #2A1D14
//      PokerTable      #0A3327 / #10513A / #241811
//      card back       #2C3E50 / #34495E / #1A252F
//
//  So the rooms differed in the header, the chips and one accent line, and
//  then you sat down at the same table you had just left. The ladder is five
//  cities and a private room, and the whole point of climbing it is that
//  somewhere else looks like somewhere else.
//
//  ---------------------------------------------------------------------------
//  DERIVED, NOT TYPED
//  ---------------------------------------------------------------------------
//  Six rooms times three surfaces is eighteen colours to hand pick, keep in
//  step, and get wrong once. Each room already HAS a colour - the primary its
//  whole theme is built from - so the cloth is that colour taken down to the
//  darkness a cloth needs.
//
//  Which means a room added later gets a table for free, a room that changes
//  its accent changes its table with it, and nothing can drift out of step
//  because there is nothing to keep in step.
//
//  The constraints are the interesting part, and they are what the tests
//  check rather than the hex codes:
//
//    THE CLOTH MUST BE DARK. White numbers are painted on it in every game, so
//    it has to clear 4.5:1 against white whatever hue it is derived from.
//    Gold and coral go dark quickly; a naive conversion would have produced a
//    cloth nobody could read a number on.
//
//    THE RAIL MUST BE DARKER STILL, or the table has no edge.
//
//    AND NO TWO ROOMS MAY MATCH. Monte Carlo and the Noir room share a
//    primary, which is exactly the case a derivation gets wrong, so the
//    private room is handled as what it already says it is.
//
//  PURE. No stores, no React, no theme import.
// ============================================================================

/** The surfaces a room dresses. */
export interface RoomFelt {
    /** The cloth the game is played on. */
    cloth: string;
    /** The lighter sweep across the middle of it. */
    clothLight: string;
    /** The rail around the outside. */
    rail: string;
    /** The back of a card in this room. */
    back: string;
    /** And the pattern printed on that back. */
    backPattern: string;
    /** The edge of the card, which is darker than either. */
    backEdge: string;
}

const hex = (h: string): [number, number, number] => {
    const s = (h || '').replace('#', '');
    const v = s.length === 3 ? s.split('').map(c => c + c).join('') : s;
    const n = parseInt(v || '000000', 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const toHex = (r: number, g: number, b: number): string =>
    '#' + [r, g, b]
        .map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();

/** Hue and saturation of a colour, 0 to 1. Lightness is discarded on purpose. */
const hueOf = (colour: string): { h: number; s: number } => {
    const [r, g, b] = hex(colour).map(v => v / 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    if (d === 0) return { h: 0, s: 0 };
    let h = 0;
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
    const l = (max + min) / 2;
    const s = d / (1 - Math.abs(2 * l - 1) || 1);
    return { h: h / 360, s: Math.max(0, Math.min(1, s)) };
};

/** Back to a colour, from a hue and a fixed darkness. */
const fromHsl = (h: number, s: number, l: number): string => {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hp = (h * 360) / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    const m = l - c / 2;
    const [r, g, b] =
        hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x]
            : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
    return toHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
};

/**
 * How dark each surface is, as HSL lightness.
 *
 * Chosen against the contrast rule rather than by eye: at 0.14 every hue in
 * the game clears 4.5:1 against white, which is what the numbers painted on
 * the cloth need. Gold at 0.30 does not, which is why this is a constant and
 * not a guess per room.
 */
export const CLOTH_L = 0.14;
export const CLOTH_LIGHT_L = 0.21;
export const RAIL_L = 0.09;
export const BACK_L = 0.19;
export const BACK_PATTERN_L = 0.26;
export const BACK_EDGE_L = 0.11;

/** How much of the room's colour survives into the cloth. */
export const CLOTH_SATURATION = 0.45;
/** The card back carries a little more, because it is small and close. */
export const BACK_SATURATION = 0.55;

/**
 * The Noir room, which is not derived.
 *
 * It shares a primary with Monte Carlo - both gold - so a derivation gives
 * them the same table, and that is the one collision in the ladder. It also
 * already says in its own theme what it wants to be: "nearly black, and darker
 * than anywhere else in the game, the gold has to be the only thing lit". A
 * derived cloth would argue with that.
 */
export const NOIR_FELT: RoomFelt = {
    cloth: '#141117',
    clothLight: '#1D1922',
    rail: '#0B090D',
    back: '#1A1620',
    backPattern: '#251F2C',
    backEdge: '#0C0A10',
};

/**
 * What this room's table and cards look like.
 *
 * `noir` is the private room, which is stated rather than derived. Everything
 * else comes from the room's own accent, so the cities differ from each other
 * by construction.
 */
export const feltFor = (primary: string, noir = false): RoomFelt => {
    if (noir) return NOIR_FELT;

    const { h, s } = hueOf(primary);
    // A cloth keeps the room's hue and gives up most of its saturation: a
    // fully saturated dark surface reads as a warning, not as furniture.
    const cs = Math.max(0.18, s * CLOTH_SATURATION);
    const bs = Math.max(0.20, s * BACK_SATURATION);

    return {
        cloth: fromHsl(h, cs, CLOTH_L),
        clothLight: fromHsl(h, cs, CLOTH_LIGHT_L),
        rail: fromHsl(h, cs * 0.8, RAIL_L),
        back: fromHsl(h, bs, BACK_L),
        backPattern: fromHsl(h, bs, BACK_PATTERN_L),
        backEdge: fromHsl(h, bs * 0.8, BACK_EDGE_L),
    };
};

/** Contrast between two colours, for the tests and for anybody checking. */
export const contrast = (a: string, b: string): number => {
    const lum = (c: string) => {
        const [r, g, bl] = hex(c).map(v => {
            const x = v / 255;
            return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
    };
    const l1 = lum(a);
    const l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};
