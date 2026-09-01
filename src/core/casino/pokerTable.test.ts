// src/core/casino/pokerTable.test.ts
//
// ============================================================================
//  "DELIBERATELY FROM EVERYWHERE" WAS A COMMENT, NOT A PROPERTY
// ============================================================================
//
//  Asked for as "increase these, put in names from around the world too, from
//  people who are not real, vary them ethnically".
//
//  The pool was eighteen names under a comment claiming they were "deliberately
//  from everywhere". Counted: ten of the eighteen were European, and there was
//  nobody at all from Japan, Korea, Vietnam, Thailand, Indonesia, the
//  Philippines, Iran, Central Asia, East or Southern Africa, the Caribbean,
//  Latin America outside Iberia, or the Pacific.
//
//  That is the failure mode this file is really about, and it is not a poker
//  bug. A comment asserting a property that nothing checks is worse than no
//  comment: it stops the next person looking. The list had been "from
//  everywhere" for as long as it had existed, and it never was.
//
//  So the pool is grouped by region and the grouping is EXPORTED, which turns
//  the claim into something a test can fail on. Measured after:
//
//      regions            15
//      strangers          96   (was 18)
//      largest region    8.3%  of the pool
//      total with CEOs   117
//      repeated face at one table   0.00% over 20,000 tables
//
//  ---------------------------------------------------------------------------
//  AND NOBODY IN IT IS REAL
//  ---------------------------------------------------------------------------
//  Ordinary given names with ordinary surnames from the same place. Three were
//  changed on a second pass because the surname is strongly attached to a real
//  person even though the pairing was invented. A stranger in a casino should
//  not make the player think of somebody in particular: the rare rival chief
//  executive is meant to be the memorable face, and a famous stranger would
//  drown them out.
// ============================================================================

import {
    CITY_CEO_CHANCE, STRANGERS, STRANGER_REGIONS, TABLE_SEATS,
    avatarHue, initialsOf, seatTable,
} from './pokerTable';

/** A fixed die, so a seating is the same every run. */
const die = (seed = 1) => {
    let n = seed;
    return () => {
        n = (n * 1103515245 + 12345) % 2147483648;
        return n / 2147483648;
    };
};

describe('the room is genuinely from everywhere', () => {
    it('there are many regions, not a handful', () => {
        expect(Object.keys(STRANGER_REGIONS).length).toBeGreaterThanOrEqual(12);
    });

    it('and no region is allowed to be the pool', () => {
        // THE DEFECT, as a number. Europe was well over half.
        const sizes = Object.values(STRANGER_REGIONS).map(v => v.length);
        const largest = Math.max(...sizes) / STRANGERS.length;
        expect(largest).toBeLessThan(0.15);
    });

    it('and none of them is a token single entry', () => {
        // One name from a place is not representation, it is a footnote, and
        // it means that face appears every time that region comes up.
        for (const [region, names] of Object.entries(STRANGER_REGIONS)) {
            expect([region, names.length >= 5]).toEqual([region, true]);
        }
    });

    it('and Europe no longer outweighs the rest of the world', () => {
        const european = ['nordic', 'britishIsles', 'westernEurope', 'easternEurope'];
        const inEurope = european.reduce(
            (n, k) => n + (STRANGER_REGIONS[k]?.length ?? 0), 0);
        expect(inEurope / STRANGERS.length).toBeLessThan(0.35);
    });

    it('and the flat list is BUILT from the regions, not typed twice', () => {
        // Two copies of the same list is the failure this codebase produces
        // most often, and it would show up here as a name that exists in one
        // and not the other.
        const fromRegions = Object.values(STRANGER_REGIONS).flat();
        expect([...STRANGERS].sort()).toEqual([...fromRegions].sort());
    });
});

describe('and the pool is big enough to feel like a public room', () => {
    it('there are far more of them than there used to be', () => {
        expect(STRANGERS.length).toBeGreaterThan(80);
    });

    it('and no name appears twice in it', () => {
        expect(new Set(STRANGERS).size).toBe(STRANGERS.length);
    });

    it('and every one of them is a full name that will render', () => {
        for (const name of STRANGERS) {
            expect([name, name.trim().length > 3]).toEqual([name, true]);
            expect([name, name.includes(' ')]).toEqual([name, true]);
            // Initials are drawn on the avatar; a name that cannot produce
            // them leaves an empty circle.
            expect([name, initialsOf(name).length]).toEqual([name, 2]);
        }
    });

    it('and each of them gets a stable colour of their own', () => {
        // The same person is the same colour every time you sit down, which
        // is most of what makes them feel like somebody you have met.
        for (const name of STRANGERS.slice(0, 20)) {
            expect(avatarHue(name)).toBe(avatarHue(name));
        }
    });
});

describe('and a table never seats the same person twice', () => {
    it('over twenty thousand tables', () => {
        // With eighteen names and four seats this was a real risk. It is the
        // property that actually matters to the player: two identical faces
        // at one table is the moment the illusion dies.
        const roll = die(9);
        for (let i = 0; i < 20_000; i++) {
            const table = seatTable(false, roll);
            expect(new Set(table.map(o => o.name)).size).toBe(table.length);
        }
    });

    it('and it fills every seat but the player"s', () => {
        expect(seatTable(false, die(3))).toHaveLength(TABLE_SEATS - 1);
    });

    it('and the VIP room is still all rivals', () => {
        // The room's whole point. A stranger in there would be a stranger in
        // a room you had to be somebody to enter.
        const vip = seatTable(true, die(5));
        for (const o of vip) expect(o.kind).toBe('ceo');
    });

    it('and a city table still turns up a rival about half the time', () => {
        // Rare enough that noticing the name is the moment, common enough
        // that it happens. Widening the stranger pool must not have quietly
        // buried them.
        const roll = die(11);
        let withCeo = 0;
        const N = 20_000;
        for (let i = 0; i < N; i++) {
            if (seatTable(false, roll).some(o => o.kind === 'ceo')) withCeo++;
        }
        const share = withCeo / N;
        // Four seats, each a 1/6 chance of a rival: 1 - (5/6)^4 = 0.518.
        const expected = 1 - Math.pow(1 - CITY_CEO_CHANCE, TABLE_SEATS - 1);
        expect(Math.abs(share - expected)).toBeLessThan(0.03);
    });
});
