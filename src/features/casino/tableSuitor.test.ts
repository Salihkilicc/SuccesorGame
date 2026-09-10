// src/features/casino/tableSuitor.test.ts
//
// ============================================================================
//  THE PEOPLE AT THE TABLE AND THE PEOPLE ON THE CARD WERE TWO WORLDS
// ============================================================================
//
//  Asked for as "kumarhanedeki herkes". Sixty one hand written people sit at
//  the poker table with faces, companies and a history of taking the player's
//  chips, and the dating door opened onto a stranger invented on the spot out
//  of 66,040 name combinations. The two never touched.
//
//  Three things have to hold, and they are three different kinds of check:
//
//    WHO WRITES      arithmetic, over ten thousand tables, against a rate.
//    WHO THEY ARE    a written character has to be the SAME person every time,
//                    which is a determinism check and nothing else.
//    WHAT THEN       the message is an opening, not a result: the existing
//                    courtship still gets to refuse them.
// ============================================================================

import fs from 'fs';
import path from 'path';

import {
    SUITOR_CHANCE, eligibleSeats, suitorFrom, tierForSeat,
} from './logic/tableInterest';
import { lineFor, SUITOR_LINES } from './logic/tableSuitor';
import {
    CEO_FEMALE, CEO_NAMES, MAGNATES, seatGender, magnateOpponents, rivalCeos,
    type Opponent,
} from '../../core/casino/pokerTable';
import { partnerFromKnownPerson } from '../love/logic/partnerGenerator';
import { upkeepFor } from '../love/logic/partnerUpkeep';
import { backgroundKeysFor } from '../love/data/backgrounds';
import { en, } from '../../core/i18n/en';
import { tr } from '../../core/i18n/tr';

const ROOT = path.join(__dirname, '..', '..', '..');
const live = (...p: string[]) =>
    fs.readFileSync(path.join(ROOT, ...p), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

/** A deterministic die, so a rate is a measurement rather than a hope. */
const dice = (seed: number) => {
    let s = seed;
    return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
};

const stranger = (n: number): Opponent =>
    ({ id: `str_${n}`, name: `Someone ${n}`, kind: 'stranger' });
const director = (n: number): Opponent =>
    ({ id: `npc-${n}`, name: `Director ${n}`, kind: 'board' });

describe('the roster knows which way its own people were drawn', () => {
    it('all sixty one of them, and it is the app that knows', () => {
        // ------------------------------------------------------------------
        //  IT WAS ONLY EVER IN THE PYTHON
        // ------------------------------------------------------------------
        //  tools/portrait_prompts.py sexed the roster from a hand written
        //  set so it could draw the right face, and the app knew nothing. The
        //  moment anything here needed a gender the choice was to guess or to
        //  copy that set, and a copy is the fault this project keeps undoing.
        // ------------------------------------------------------------------
        expect(MAGNATES).toHaveLength(40);
        expect(Object.keys(CEO_FEMALE)).toHaveLength(21);
        for (const m of MAGNATES) expect(typeof m.female).toBe('boolean');
        // The two CEO tables are keyed the same way and cannot drift apart.
        expect(Object.keys(CEO_FEMALE).sort()).toEqual(Object.keys(CEO_NAMES).sort());
    });

    it('and one door answers for both rosters', () => {
        expect(seatGender('mg_valmorel')).toBe('female');
        expect(seatGender('mg_ashworth')).toBe('male');
        expect(seatGender('tech_pear')).toBe('male');
        expect(seatGender('tech_micro')).toBe('female');
        // A stranger has no recorded sex anywhere, and undefined is the honest
        // answer rather than a coin. See partnerGenerator for what a coin cost.
        expect(seatGender('str_1')).toBeUndefined();
    });

    it('and it is not all one sex', () => {
        const women = MAGNATES.filter(m => m.female).length
            + Object.values(CEO_FEMALE).filter(Boolean).length;
        expect(women).toBeGreaterThan(20);
        expect(women).toBeLessThan(41);
    });

    it('and the portrait tool reads it back rather than keeping a second list', () => {
        const tool = fs.readFileSync(path.join(ROOT, 'tools', 'portrait_prompts.py'), 'utf8');
        expect(tool).toMatch(/def read_seat_genders/);
        expect(tool).toMatch(/table = read_seat_genders\(\)/);
        // And it reads the APP file, not a copy of it.
        expect(tool).toMatch(/POKER_TABLE = os\.path\.join/);
    });
});

describe('who at the table could ever write', () => {
    it('the named ones, and nobody else', () => {
        const table: Opponent[] = [
            ...magnateOpponents().slice(0, 2),
            stranger(1), stranger(2), director(1),
        ];
        const got = eligibleSeats(table).map(o => o.kind);
        expect(got).toEqual(['magnate', 'magnate']);
    });

    it('and a table of strangers produces nobody at all', () => {
        const table = [stranger(1), stranger(2), stranger(3), stranger(4)];
        expect(eligibleSeats(table)).toEqual([]);
        expect(suitorFrom(table, 'male', dice(1))).toBeNull();
        expect(suitorFrom([], 'male', dice(1))).toBeNull();
    });

    it('and your own directors are never on the list', () => {
        // They have a whole screen already, and courting one is a governance
        // question rather than a romantic one.
        const table = [director(1), director(2), director(3)];
        expect(eligibleSeats(table)).toEqual([]);
    });

    it('and a magnate outranks a rival chief executive, which is the point of them', () => {
        // MAGNATES is old money: four generations of shipping, "never worked
        // a day". A rival runs a listed company. psychometrics.ts already
        // carries that distinction in the two tiers' own numbers.
        expect(tierForSeat('magnate')).toBe('HIGH_SOCIETY');
        expect(tierForSeat('ceo')).toBe('CORPORATE_ELITE');
    });
});

describe('and how often somebody actually does', () => {
    it('measured over ten thousand tables rather than asserted', () => {
        // ------------------------------------------------------------------
        //  THE NUMBER THAT DECIDES WHETHER THIS IS A FEATURE OR A FAUCET
        // ------------------------------------------------------------------
        //  One in twelve PER PERSON. A noir table is four named people and
        //  the gender filter takes out roughly half of them, so a night out
        //  should produce a message something like one time in six or seven.
        //
        //  Too high and the sixty one written characters become a list to
        //  work through. Too low and nobody ever sees the feature.
        // ------------------------------------------------------------------
        const table = magnateOpponents().slice(0, 4);
        const roll = dice(7);
        let wrote = 0;
        const runs = 10_000;
        for (let i = 0; i < runs; i++) if (suitorFrom(table, 'male', roll)) wrote++;
        const rate = wrote / runs;
        expect(rate).toBeGreaterThan(0.05);
        expect(rate).toBeLessThan(0.25);
        // And it is the constant doing it, not an accident of this table.
        expect(SUITOR_CHANCE).toBeLessThan(0.2);
    });

    it('and it is mostly the other sex, sometimes not', () => {
        // The same rule the dating pool uses, and it is a FILTER here rather
        // than a coin: these people have a fixed sex, so a coin would decide
        // a man should write and then find no man at the table to be it.
        const table = [...magnateOpponents()].slice(0, 20);
        const roll = dice(3);
        let same = 0;
        let total = 0;
        for (let i = 0; i < 20_000; i++) {
            const s = suitorFrom(table, 'male', roll);
            if (!s) continue;
            total++;
            if (s.gender === 'male') same++;
        }
        expect(total).toBeGreaterThan(200);
        expect(same / total).toBeGreaterThan(0.05);
        expect(same / total).toBeLessThan(0.45);
    });

    it('and a player whose own sex is unknown is offered anybody', () => {
        // An old save from before the identity store carried one. Guessing
        // wrong on every candidate is worse than not guessing.
        const table = magnateOpponents().slice(0, 6);
        const seen = new Set<string>();
        const roll = dice(11);
        for (let i = 0; i < 5_000; i++) {
            const s = suitorFrom(table, undefined, roll);
            if (s) seen.add(s.gender);
        }
        expect(seen.size).toBe(2);
    });
});

describe('and the person who turns up is the person you played against', () => {
    const anyMagnate = MAGNATES[3];

    const build = () => partnerFromKnownPerson({
        id: anyMagnate.id,
        name: anyMagnate.name,
        gender: anyMagnate.female ? 'female' : 'male',
        tier: 'HIGH_SOCIETY',
        known: anyMagnate.of,
    });

    it('with their own name and their own line, not a generated one', () => {
        const p = build();
        expect(p.name).toBe(anyMagnate.name);
        expect(p.id).toBe(anyMagnate.id);
        expect(p.stats.occupation).toBe(anyMagnate.of);
    });

    it('and they are the same person every single time', () => {
        // ------------------------------------------------------------------
        //  THE WHOLE REASON THIS IS NOT `generatePartner`
        // ------------------------------------------------------------------
        //  A High Maintenance Sylvie Valmorel on Tuesday and a Loyal
        //  Confidante Sylvie on Wednesday would make the fact that these are
        //  written characters worth nothing. So there is no Math.random in
        //  that function at all: every field comes out of a hash of the id.
        // ------------------------------------------------------------------
        const first = JSON.stringify(build());
        for (let i = 0; i < 25; i++) expect(JSON.stringify(build())).toBe(first);
    });

    it('and two different magnates are two different people', () => {
        const each = MAGNATES.map(m => partnerFromKnownPerson({
            id: m.id, name: m.name, gender: m.female ? 'female' : 'male',
            tier: 'HIGH_SOCIETY', known: m.of,
        }));
        // Not a single hash driving everything: personalities spread out.
        expect(new Set(each.map(p => p.personality?.id)).size).toBeGreaterThan(5);
        expect(new Set(each.map(p => p.stats.age)).size).toBeGreaterThan(10);
    });

    it('and they cost what their own room costs, not what the player can afford', () => {
        // Their room, not the player's. The upkeep ladder is derived from the
        // tier gate, so a magnate is a magnate whether the player is worth
        // three million or three trillion.
        const p = build();
        expect(p.finances?.monthlyCost).toBe(upkeepFor('HIGH_SOCIETY', p.personality));
        expect(p.finances?.monthlyCost).toBeGreaterThan(100_000);
    });

    it('and they arrive with a past and a full set of psychometrics', () => {
        const p = build();
        expect(backgroundKeysFor('HIGH_SOCIETY')).toContain(p.stats.background);
        for (const k of ['familyWealth', 'networkPower', 'intelligence', 'jealousy'] as const) {
            expect(typeof p.stats[k]).toBe('number');
        }
        expect(p.stats.socialClass).toBe('OldMoney');
    });

    it('and they are old enough to run what they run', () => {
        // generatePartner runs 18 to 45. A twenty two year old head of an oil
        // dynasty is a contradiction the card prints beside their own face.
        for (const m of MAGNATES) {
            const p = partnerFromKnownPerson({
                id: m.id, name: m.name, gender: m.female ? 'female' : 'male',
                tier: 'HIGH_SOCIETY', known: m.of,
            });
            expect(p.stats.age).toBeGreaterThanOrEqual(35);
            expect(p.stats.age).toBeLessThanOrEqual(55);
        }
    });

    it('and the love they arrive with is interest rather than a relationship', () => {
        const p = build();
        expect(p.love).toBeGreaterThanOrEqual(25);
        expect(p.love).toBeLessThanOrEqual(40);
        expect(p.isMarried).toBe(false);
    });
});

describe('and what the player reads is in their language', () => {
    it('all forty magnate lines, which were on the poker seat in English', () => {
        // `Magnate.of` has been printed under the name on every seat since the
        // table was built. untranslated.js cannot see it: it reads .tsx and
        // looks at Text children and naming props, and this arrives through a
        // variable out of a .ts data file.
        const registry = fs.readFileSync(
            path.join(ROOT, 'src', 'data', 'i18n', 'profileLoveShopText.ts'), 'utf8');
        for (const m of MAGNATES) expect(registry).toContain(`'${m.of}':`);
    });

    it('and the seat asks the registry rather than printing the field', () => {
        const seat = live('src', 'features', 'casino', 'components', 'PokerSeat.tsx');
        expect(seat).toMatch(/translateOccupation\(company \|\| ''\)/);
        expect(seat).not.toMatch(/\{company \|\| KIND_LABEL/);
    });

    it('and every opening line exists in both languages', () => {
        for (let i = 0; i < SUITOR_LINES; i++) {
            expect(typeof en[`casino.suitor${i}`]).toBe('string');
            expect(typeof tr[`casino.suitor${i}`]).toBe('string');
            expect((tr[`casino.suitor${i}`] || '').length).toBeGreaterThan(20);
        }
    });

    it('and none of them uses a dash', () => {
        const bad: string[] = [];
        for (let i = 0; i < SUITOR_LINES; i++) {
            for (const [lang, dict] of [['en', en], ['tr', tr]] as const) {
                if (/[–—]|\s-\s/.test(dict[`casino.suitor${i}`] || '')) bad.push(`${lang}:${i}`);
            }
        }
        expect(bad).toEqual([]);
    });

    it('and one person always opens with the same line', () => {
        for (const m of MAGNATES.slice(0, 8)) {
            const first = lineFor(m.id);
            expect(first).toBeGreaterThanOrEqual(0);
            expect(first).toBeLessThan(SUITOR_LINES);
            for (let i = 0; i < 5; i++) expect(lineFor(m.id)).toBe(first);
        }
        // And not everybody opens with the same one.
        expect(new Set(MAGNATES.map(m => lineFor(m.id))).size).toBeGreaterThan(1);
    });
});

describe('and the message is an opening rather than a result', () => {
    it('the courtship still runs, and can still refuse them', () => {
        // The half that goes missing: a pending suitor that skips the check
        // and simply becomes a partner. Money opens the room and reputation
        // decides the answer, for these people exactly as for anybody else.
        const src = live('src', 'features', 'love', 'logic', 'runCourtship.ts');
        const block = src.slice(src.indexOf('const waiting ='), src.indexOf('const tier = earnedTier'));
        expect(block.length).toBeGreaterThan(100);
        expect(block).toMatch(/courtshipFor\(known/);
        expect(block).toMatch(/return refuse\(known/);
        // And it is spent whether they said yes or no.
        expect(block).toMatch(/clearSuitor\(\)/);
    });

    it('and a refusal is written once rather than twice', () => {
        // There are two ways to be turned down now. A second copy of the
        // refusal is how one of them would quietly stop shutting the room.
        const src = live('src', 'features', 'love', 'logic', 'runCourtship.ts');
        expect((src.match(/noteRefusal\(/g) || [])).toHaveLength(1);
        expect((src.match(/sendFromCharacter\(/g) || [])).toHaveLength(1);
    });

    it('and nobody writes while the player already has somebody', () => {
        const src = live('src', 'features', 'casino', 'logic', 'tableSuitor.ts');
        expect(src).toMatch(/if \(family\.partner\) return false/);
    });

    it('and the interest survives closing the app', () => {
        // It is a thing that happened last night. Persisted with the cooldown
        // it sits beside; a `partialize` is a list and a field left off it is
        // silently dropped.
        const store = live('src', 'core', 'store', 'useFamilyStore.ts');
        const block = store.slice(store.indexOf('partialize:'));
        expect(block).toMatch(/pendingSuitor: state\.pendingSuitor/);
    });

    it('and the table sends it when the player stands up, not when the screen dies', () => {
        // A message that arrives because the app changed screens is a message
        // the player cannot connect to anything they did.
        const hook = live('src', 'features', 'casino', 'logic', 'useSixHandedPoker.ts');
        const leave = hook.slice(hook.indexOf('const leave = useCallback'), hook.indexOf('useEffect(() => () =>'));
        expect(leave).toMatch(/offerTableSuitor\(opponents\)/);
        // And the chips move first, whatever the message does.
        expect(leave.indexOf("setField('money'")).toBeLessThan(leave.indexOf('offerTableSuitor'));
        expect(leave).toMatch(/catch/);
    });
});

describe('and the twenty one rivals work the same way', () => {
    it('every rival at a table resolves to a gender and a tier', () => {
        for (const o of rivalCeos()) {
            expect(seatGender(o.id)).toBeDefined();
            expect(tierForSeat(o.kind)).toBe('CORPORATE_ELITE');
        }
    });
});
