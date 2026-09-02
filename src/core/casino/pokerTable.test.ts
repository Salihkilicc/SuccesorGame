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
    MAGNATES,
    CEO_NAMES,
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

    it('and the VIP room still has no strangers in it', () => {
        // THE ROOM'S WHOLE POINT, and it is the line that survived the room
        // being widened. A stranger in there would be a stranger in a room
        // you had to be somebody to enter.
        //
        // This used to assert every seat was a `ceo`, which was the same
        // sentence while rivals were the only people who could be somebody.
        // There are twenty one of those, so the room was exhausted inside
        // thirty sittings and showed the same faces for the rest of the run.
        // Magnates are the other kind of somebody. See MAGNATES.
        for (let seed = 1; seed < 40; seed++) {
            for (const o of seatTable(true, die(seed))) {
                expect([seed, o.name, o.kind]).not.toEqual([seed, o.name, 'stranger']);
            }
        }
    });

    it('and it is deep enough that a run does not exhaust it', () => {
        // MEASURED, and it is the reason any of this changed. The old room
        // showed 21 distinct faces over a hundred sittings, 95% of seats a
        // repeat. Walked with a real spread of seeds rather than one.
        const seen = new Set<string>();
        for (let seed = 1; seed <= 200; seed++) {
            for (const o of seatTable(true, die(seed))) seen.add(o.name);
        }
        expect(seen.size).toBeGreaterThan(45);
    });

    it('and a rival is still the face you are most likely to know', () => {
        // The weighting exists so the room does not become a parade of
        // strangers-with-titles. A rival should be common without being all
        // of it.
        let ceos = 0;
        let seats = 0;
        for (let seed = 1; seed <= 400; seed++) {
            for (const o of seatTable(true, die(seed))) {
                seats++;
                if (o.kind === 'ceo') ceos++;
            }
        }
        const share = ceos / seats;
        expect(share).toBeGreaterThan(0.25);
        expect(share).toBeLessThan(0.6);
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

// ============================================================================
//  THE PRIVATE ROOM'S OWN PEOPLE
// ============================================================================
//
//  Added because the room was starved by construction rather than by a short
//  list: it filled every seat from `rivalCeos()`, which returns one person per
//  listed rival company, and there are twenty one of those.
//
//  Adding names to CEO_NAMES could not have fixed it. That roster is keyed on
//  stock ids and only yields a person when a company with that id exists, so
//  its ceiling is the market's, not the casino's.
// ============================================================================

describe('the magnates', () => {
    it('there are enough of them to matter', () => {
        expect(MAGNATES.length).toBeGreaterThanOrEqual(35);
    });

    it('and no name or id appears twice', () => {
        expect(new Set(MAGNATES.map(m => m.name)).size).toBe(MAGNATES.length);
        expect(new Set(MAGNATES.map(m => m.id)).size).toBe(MAGNATES.length);
    });

    it('and none of them collides with a chief executive', () => {
        // Two people with one name at one table is a bug that looks like a
        // bug, and the seating draws from both pools.
        const ceoNames = new Set(Object.values(CEO_NAMES));
        for (const m of MAGNATES) {
            expect([m.name, ceoNames.has(m.name)]).toEqual([m.name, false]);
        }
    });

    it('and every one of them carries the line that shows under their name', () => {
        // A CEO shows their company there. A magnate showing nothing would
        // read as a stranger who had wandered into the private room.
        for (const m of MAGNATES) {
            expect([m.name, m.of.trim().length > 3]).toEqual([m.name, true]);
        }
    });

    it('and their names render in an avatar like everybody else"s', () => {
        for (const m of MAGNATES) {
            expect([m.name, m.name.includes(' ')]).toEqual([m.name, true]);
            expect([m.name, initialsOf(m.name).length]).toEqual([m.name, 2]);
        }
    });

    it('and none of their lines uses a dash, which is a house rule', () => {
        // Player visible text. Hyphenated words are fine; a dash is not.
        for (const m of MAGNATES) {
            expect([m.name, /—/.test(m.of) || /\s-\s/.test(m.of)]).toEqual([m.name, false]);
            expect([m.name, /—/.test(m.name) || /\s-\s/.test(m.name)]).toEqual([m.name, false]);
        }
    });

    it('and they never sit in a city room', () => {
        // The cities are public. The whole point of a magnate is that you had
        // to be somebody to be in the room with them.
        for (let seed = 1; seed <= 300; seed++) {
            for (const o of seatTable(false, die(seed))) {
                expect([seed, o.kind]).not.toEqual([seed, 'magnate']);
            }
        }
    });
});
