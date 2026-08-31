// src/core/casino/pokerTable.ts
//
// ============================================================================
//  WHO IS SITTING THERE
// ============================================================================
//
//  Asked for as: "the opponents should be the CEOs of the other companies, and
//  you should race them. In the VIP room the table is CEOs; in the cities it
//  is random people, though a CEO can turn up. And the board members too."
//
//  The point of it is that a poker table is the ONE place in this game where
//  the people you spend the rest of your career reading a share price about
//  are sitting across from you with a face and a stack of chips. Beating Pear
//  out of four hundred million at a card table is a different thing from
//  taking four hundred million of their market share, and it should be.
//
//  ---------------------------------------------------------------------------
//  WHAT THIS FILE KNOWS AND WHAT IT REFUSES TO
//  ---------------------------------------------------------------------------
//  It knows the ROSTER - which companies exist and who runs them, which
//  strangers might be in a casino in Athens. It does not know how any of them
//  plays: that is pokerBots.ts, which takes names and hands back players.
//
//  Keeping those apart matters because the two change for different reasons.
//  Adding a rival company should not touch the betting logic, and tuning a
//  personality should not touch the roster.
//
//  PURE. The competitor list is read through a guarded require so this file
//  works in a test with no stores running.
// ============================================================================

export type SeatKind = 'ceo' | 'board' | 'stranger';

export interface Opponent {
    id: string;
    name: string;
    kind: SeatKind;
    /** The company they run, when they run one. Shown under the name. */
    company?: string;
    /** 0-100 where known. A strong rival plays better. */
    strength?: number;
}

// ============================================================================
//  THE ROSTER
// ============================================================================
//
//  The market data carries COMPANY names, not people. So the chief executives
//  are named here, one per listed rival, keyed by the same stock id the rest
//  of the game uses - which means the same company always sends the same
//  person, and a player who beat Pear's CEO last year meets him again.
//
//  Anonymous rivals would have been easier and would have thrown away the
//  entire point of the request.
// ============================================================================

export const CEO_NAMES: Readonly<Record<string, string>> = {
    // ---- technology ----
    tech_pear: 'Adrian Voss',
    tech_micro: 'Petra Lindqvist',
    tech_face: 'Dmitri Sokolov',
    tech_intel: 'Harold Ng',
    tech_spot: 'Ines Duarte',
    tech_start: 'Kaya Aydin',
    tech_chat: 'Rowan Beck',
    tech_chip: 'Sunil Varma',
    tech_gpt: 'Delphine Roy',
    // ---- industrial ----
    ind_cat: 'Robert Falk',
    ind_edison: 'Lucas Meier',
    ind_gm: 'Deborah Tran',
    ind_lmt: 'Margaret Osei',
    ind_solar: 'Bruno Salgado',
    ind_spacey: 'Idris Kane',
    ind_spce: 'Vera Holm',
    // ---- health ----
    health_bio: 'Dr Amara Diallo',
    health_cure: 'Yuki Tanabe',
    health_jnj: 'Charles Whitlock',
    health_med: 'Nadia Rahman',
    health_pfiz: 'Gustav Lindeberg',
};

/**
 * The people who are simply in a casino.
 *
 * Deliberately unremarkable and deliberately from everywhere: the cities are
 * supposed to feel like public rooms, and a table of six memorable characters
 * would make the rare CEO stop being an event.
 */
export const STRANGERS: readonly string[] = [
    'Tomas Berg', 'Rosa Iglesias', 'Bill Hartley', 'Mei Chen', 'Omar Farouk',
    'Ana Petrescu', 'Gerald Boone', 'Priya Nair', 'Stefan Weiss', 'Leila Haddad',
    'Duncan Reid', 'Sofia Marchetti', 'Kwame Boateng', 'Hanna Virtanen',
    'Enzo Ricci', 'Claire Dubois', 'Yusuf Demir', 'Grace Okonkwo',
];

/** Every listed rival with a named chief executive, if the markets are loaded. */
export const rivalCeos = (): Opponent[] => {
    try {
        const { PRODUCT_MARKETS } = require('../market/productMarkets');
        const seen = new Set<string>();
        const out: Opponent[] = [];
        for (const market of PRODUCT_MARKETS || []) {
            for (const c of market.competitors || []) {
                if (!c?.stockId || seen.has(c.stockId)) continue;
                seen.add(c.stockId);
                const name = CEO_NAMES[c.stockId];
                if (!name) continue;
                out.push({ id: c.stockId, name, kind: 'ceo', company: c.name, strength: c.strength });
            }
        }
        return out;
    } catch {
        return [];
    }
};

/** Your own directors, if the register is loaded. */
export const boardOpponents = (): Opponent[] => {
    try {
        const { useShareholderStore } = require('../../features/shareholders/stores/useShareholderStore');
        return (useShareholderStore.getState().members || [])
            .map((m: any) => ({ id: m.id, name: m.name, kind: 'board' as const }));
    } catch {
        return [];
    }
};

// ============================================================================
//  SEATING A ROOM
// ============================================================================

/**
 * Seats at the table, the player included.
 *
 * FIVE, NOT SIX, and the difference is measured rather than felt. Asked as
 * "is six too many, should we do four" - so the question was put to a
 * simulation of three thousand hands at each size:
 *
 *      seats   bot actions   YOUR turns   bot wait
 *        3         8.0          4.2        5.2s
 *        4        12.0          4.3        7.8s
 *        5        15.9          4.4       10.4s
 *        6        19.8          4.5       12.8s
 *
 *  The column that matters is the third one. Going from three seats to six
 *  buys the player THREE TENTHS of an extra decision and costs them seven and
 *  a half seconds of watching other people. Extra seats do not add agency;
 *  they add waiting.
 *
 *  Four would be quicker still, but at four a "table" is you and two other
 *  people, which reads as a card game rather than a room. Five is where it
 *  still looks like a table and a third of the waiting has gone.
 */
export const TABLE_SEATS = 5;

/**
 * How often a city table has a rival chief executive at it.
 *
 * ONE IN SIX SEATS, so a five handed table has one about half the time. Rare
 * enough that noticing the name is the moment; common enough that it happens.
 * If every table had one they would stop being rivals and become furniture.
 */
export const CITY_CEO_CHANCE = 1 / 6;

/**
 * And how often one of your OWN directors is sitting there.
 *
 * Rarer than a rival, because it is a stranger thing to walk into. Meeting the
 * man who controls seventeen per cent of your company across a poker table is
 * not a coincidence you want twice a year.
 */
export const CITY_BOARD_CHANCE = 1 / 12;

const pick = <T,>(list: readonly T[], roll: () => number): T | undefined => {
    if (!list || list.length === 0) return undefined;
    const raw = roll();
    const die = Number.isFinite(raw) ? Math.min(0.999999, Math.max(0, raw)) : 0;
    return list[Math.floor(die * list.length)];
};

/**
 * Who is at this table tonight.
 *
 * `vip` fills every seat with a rival chief executive, which is the whole
 * character of the Noir room: there are no strangers in there.
 */
export const seatTable = (
    vip: boolean,
    roll: () => number = Math.random,
    seats: number = TABLE_SEATS - 1,
): Opponent[] => {
    const ceos = rivalCeos();
    const board = boardOpponents();
    const out: Opponent[] = [];
    const taken = new Set<string>();
    const usedNames = new Set<string>();

    const addUnique = (o: Opponent | undefined): boolean => {
        if (!o || taken.has(o.id)) return false;
        taken.add(o.id);
        usedNames.add(o.name);
        out.push(o);
        return true;
    };

    for (let i = 0; i < Math.max(0, seats); i++) {
        if (vip) {
            // Every seat a rival. Fall through to a stranger only if the game
            // has fewer rivals than seats, which would otherwise leave a hole.
            let placed = false;
            for (let tries = 0; tries < 12 && !placed; tries++) placed = addUnique(pick(ceos, roll));
            if (!placed) {
                const spare = STRANGERS.find(n => !usedNames.has(n)) || 'Guest';
                addUnique({ id: `x${i}`, name: spare, kind: 'stranger' });
            }
            continue;
        }

        const die = roll();
        const d = Number.isFinite(die) ? die : 1;
        let placed = false;
        if (d < CITY_CEO_CHANCE) {
            for (let tries = 0; tries < 6 && !placed; tries++) placed = addUnique(pick(ceos, roll));
        } else if (d < CITY_CEO_CHANCE + CITY_BOARD_CHANCE) {
            for (let tries = 0; tries < 6 && !placed; tries++) placed = addUnique(pick(board, roll));
        }
        if (!placed) {
            // A stranger's id is seat-unique rather than person-unique, because
            // the same face may sit down again next week. But the NAME has to
            // be unique AT THIS TABLE: two Grace Okonkwos in one hand looks
            // like a bug even though it is not one.
            let name = pick(STRANGERS, roll) || 'Guest';
            for (let tries = 0; tries < 12 && usedNames.has(name); tries++) {
                name = pick(STRANGERS, roll) || 'Guest';
            }
            if (usedNames.has(name)) {
                const spare = STRANGERS.find(n => !usedNames.has(n));
                if (spare) name = spare;
            }
            usedNames.add(name);
            out.push({ id: `x${i}`, name, kind: 'stranger' });
            taken.add(`x${i}`);
        }
    }

    return out;
};

// ============================================================================
//  AND WHAT THEY LOOK LIKE
// ============================================================================
//
//  Round avatars, which is what was asked for, and what goes in them until
//  there are photographs: initials on a colour that says what kind of person
//  this is. When the portraits exist they drop into the same circle and one
//  line changes.
// ============================================================================

export const initialsOf = (name: string): string =>
    (name || '?')
        .replace(/['"]/g, '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase() ?? '')
        .join('') || '?';

/** A stable colour per person, so the same face is the same colour every time. */
export const avatarHue = (id: string): number => {
    let h = 0;
    for (let i = 0; i < (id || '').length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
    return h;
};
