// src/core/portraits/portraits.test.ts
//
// ============================================================================
//  THE FOLDER AND THE REGISTRY CANNOT DRIFT APART
// ============================================================================
//
//  299 png files sat in assets/portraits and no line of the app read them.
//  That is this codebase's signature failure - correct data that nothing
//  reads - and a hand written list of requires is exactly how it happens
//  again: a portrait is added, the list is not, and the character silently
//  keeps their initials. Nothing throws. Nobody notices.
//
//  So the registry is generated, and this checks BOTH directions:
//
//    - every file on disk is in the registry (a new face is wired up),
//    - every registry line points at a file that exists (a deleted face does
//      not become a red screen).
//
//  Both matter. The first one is the failure that hides; the second is the
//  one that crashes.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { PORTRAITS, PORTRAIT_COUNT } from './registry';
import {
    FACELESS, PORTRAIT_IDS, hasPortrait, portraitFor, portraitForPerson,
} from './index';
import { CEO_NAMES, MAGNATES, STRANGERS, seatTable } from '../casino/pokerTable';

const ROOT = path.resolve(__dirname, '..', '..', '..');
const DIR = path.join(ROOT, 'assets', 'portraits');
const REGISTRY = path.join(__dirname, 'registry.ts');

/** What is actually on disk, by the same rule the generator uses. */
const onDisk = (): string[] =>
    fs.readdirSync(DIR)
        .filter(f => f.endsWith('.png') && !f.startsWith('_'))
        .map(f => f.slice(0, -4))
        .sort();

describe('the registry and the folder agree', () => {
    it('every portrait on disk is in the registry', () => {
        const missing = onDisk().filter(id => !(id in PORTRAITS));
        // Named, not counted: "3 missing" sends you looking, the names tell
        // you it was the batch you ran twenty minutes ago.
        expect(missing).toEqual([]);
    });

    it('every registry entry exists on disk', () => {
        const have = new Set(onDisk());
        const dangling = Object.keys(PORTRAITS).filter(id => !have.has(id));
        expect(dangling).toEqual([]);
    });

    it('and there are as many as the folder holds', () => {
        expect(PORTRAIT_COUNT).toBe(onDisk().length);
        expect(PORTRAIT_COUNT).toBeGreaterThan(250);
    });

    it('the generator output is current, line for line', () => {
        // Stronger than the two set checks above: it also catches a registry
        // that was edited by hand into the right KEYS but the wrong PATHS,
        // which the set checks would pass and the app would fail on.
        const src = fs.readFileSync(REGISTRY, 'utf8');
        for (const id of onDisk()) {
            expect(src).toContain(
                `    '${id}': require('../../../assets/portraits/${id}.png'),\n`,
            );
        }
    });

    it('and it is marked as generated so nobody edits it', () => {
        const src = fs.readFileSync(REGISTRY, 'utf8');
        expect(src).toContain('GENERATED FILE - DO NOT EDIT');
        expect(src).toContain('tools/gen_portrait_registry.py');
    });

    it('the contact sheet is not a character', () => {
        // assets/portraits/_contact_sheet.png is a review artefact. The
        // underscore rule keeps it out; this is what fails if that rule is
        // ever relaxed.
        expect(PORTRAITS).not.toHaveProperty('_contact_sheet');
        expect(PORTRAIT_IDS.some(id => id.startsWith('_'))).toBe(false);
    });
});

describe('a portrait resolves, or it does not, and neither throws', () => {
    it('a known character has a face', () => {
        const someone = PORTRAIT_IDS[0];
        expect(portraitFor(someone)).not.toBeNull();
        expect(hasPortrait(someone)).toBe(true);
    });

    it('the four who must stay faceless never get one', () => {
        // Not an oversight and not "not generated yet". An anonymous tip, a
        // vulture fund, a regulator and a federal agent are frightening
        // because they are a name without a person.
        for (const id of FACELESS) {
            expect(portraitFor(id)).toBeNull();
            expect(hasPortrait(id)).toBe(false);
        }
        expect([...FACELESS].sort()).toEqual(['fbi', 'regulator', 'unknown', 'vulture']);
    });

    it('and no file is ever generated for them', () => {
        // The check above passes whether or not a file exists, because
        // portraitFor filters the list BEFORE it looks anything up. Probed by
        // dropping a regulator.png into the folder: all twelve tests stayed
        // green. So the folder itself is checked here.
        //
        // This is not tidiness. A file appearing under one of these names
        // means somebody generated a face for a character whose whole effect
        // is that you cannot see one, and the guard above would hide that
        // decision instead of surfacing it.
        const wrong = onDisk().filter(id => FACELESS.has(id));
        expect(wrong).toEqual([]);
        for (const id of FACELESS) expect(PORTRAITS).not.toHaveProperty(id);
    });

    it('and nonsense returns null rather than throwing', () => {
        const junk: unknown[] = [
            undefined, null, '', '   ', 'nobody_at_all', '../../etc/passwd',
            '::g2', 'NPC-', 42, {},
        ];
        for (const v of junk) {
            expect(() => portraitFor(v as string)).not.toThrow();
        }
        expect(portraitFor(undefined)).toBeNull();
        expect(portraitFor('nobody_at_all')).toBeNull();
    });

    it('hyphens, underscores and capitals are the same person', () => {
        // The rosters do not agree on spelling: a file is zofia_kowalczyk, a
        // director id is npc-elena-vance, a name is 'Victor K.'. All three
        // spellings of one person have to land on one face.
        const id = PORTRAIT_IDS.find(x => x.includes('_'))!;
        expect(portraitFor(id.replace(/_/g, '-'))).toBe(portraitFor(id));
        expect(portraitFor(id.replace(/_/g, ' ').toUpperCase())).toBe(portraitFor(id));
        expect(portraitFor(` ${id} `)).toBe(portraitFor(id));
    });

    it('but a successor does not inherit the ancestor face', () => {
        // ------------------------------------------------------------------
        //  THIS TEST USED TO ASSERT THE OPPOSITE, AND IT WAS WRONG
        // ------------------------------------------------------------------
        //  The lookup stripped '::g2' so that a second generation director
        //  kept their predecessor's portrait. But succession keeps the SEAT
        //  and the SURNAME and issues a NEW FIRST NAME - Marcus Vance takes
        //  Elena Vance's chair - so that put one photograph under two
        //  different names in the same save.
        //
        //  Worse, the same strip removed the 'npc-' prefix, and the four
        //  directors are filed under their whole id. Measured: all four came
        //  back faceless while npc-elena-vance.png sat on disk.
        //
        //  A successor misses here on purpose. The anonymous pool gives them
        //  a face of their own.
        // ------------------------------------------------------------------
        expect(portraitFor('npc-elena-vance')).not.toBeNull();
        expect(portraitFor('npc-elena-vance::g2')).toBeNull();
        expect(portraitFor('npc-elena-vance::g3')).toBeNull();
    });

    it('and the same id gives the same source every time', () => {
        for (const id of PORTRAIT_IDS.slice(0, 40)) {
            expect(portraitFor(id)).toBe(portraitFor(id));
        }
    });
});

describe('the people who actually sit at the table have faces', () => {
    // ------------------------------------------------------------------
    //  THIS IS THE TEST THAT MATTERS
    // ------------------------------------------------------------------
    //  Everything above proves the folder and the registry agree with each
    //  other. Two files can agree perfectly and still be read by nobody -
    //  which is exactly the state this whole thing started in: 299 correct
    //  portraits and not one line of the app looking at them.
    //
    //  So this walks the REAL rosters that seatTable draws from and asks the
    //  same question the poker screen asks. It is also what caught the naming
    //  mismatch: the files were named from NAMES (zofia_kowalczyk.png) while
    //  the table carries ids (mg_kowalczyk), so a lookup by id alone found
    //  none of the forty magnates.
    // ------------------------------------------------------------------

    const missing = (people: { id: string; name: string }[]) =>
        people.filter(p => portraitForPerson(p.id, p.name) === null).map(p => p.name);

    it('every magnate', () => {
        expect(missing(MAGNATES.map(m => ({ id: m.id, name: m.name })))).toEqual([]);
    });

    it('every rival chief executive', () => {
        const ceos = Object.entries(CEO_NAMES).map(([id, name]) => ({ id, name }));
        expect(ceos.length).toBeGreaterThan(15);
        expect(missing(ceos)).toEqual([]);
    });

    it('and every stranger in the room', () => {
        const strangers = STRANGERS.map(n => ({ id: n, name: n }));
        expect(strangers.length).toBeGreaterThan(100);
        expect(missing(strangers)).toEqual([]);
    });

    it('and the four directors, who are on screen every quarter', () => {
        // ------------------------------------------------------------------
        //  THE GAP THE FIRST VERSION OF THIS FILE DID NOT LOOK FOR
        // ------------------------------------------------------------------
        //  The coverage checks above walked the poker rosters and passed, so
        //  the wiring looked proved. The board was never walked - and all four
        //  directors resolved to nothing, with their portraits on disk, for
        //  exactly the reason the whole exercise exists.
        //
        //  Read out of the store rather than typed here, so a fifth director
        //  added there has to have a face too.
        // ------------------------------------------------------------------
        const src = fs.readFileSync(
            path.join(ROOT, 'src', 'features', 'shareholders', 'stores', 'useShareholderStore.ts'),
            'utf8',
        );
        const ids = [...src.matchAll(/id:\s*'(npc-[\w-]+)'/g)].map(m => m[1]);
        expect(ids.length).toBeGreaterThanOrEqual(4);
        expect(ids.filter(id => portraitFor(id) === null)).toEqual([]);
    });

    it('and a seated table resolves every face, over a thousand tables', () => {
        // The end to end question, asked the way the screen asks it. A roster
        // can be complete and the SEATING still hand out an id shape that does
        // not resolve - a generation suffix, a prefix - and that is invisible
        // until somebody sits down.
        //
        // WRITTEN WRONG THE FIRST TIME, and the compiler caught it, not the
        // assertion: seatTable takes (vip, roll) and the die was passed as
        // `vip`. A function is truthy, so every table was a VIP table seated
        // off Math.random - the test passed, twice, while measuring something
        // other than what it claimed and never the same thing twice.
        //
        // Both rooms are walked now, because the VIP table seats a rival chief
        // executive FIRST by weight: the two rooms do not draw from the same
        // people in the same proportion, and a gap could live in one of them.
        let seats = 0;
        const blank: string[] = [];
        for (const vip of [false, true]) {
            for (let s = 0; s < 500; s++) {
                let n = s + 1;
                const die = () => ((n = (n * 1103515245 + 12345) % 2147483648) / 2147483648);
                for (const seat of seatTable(vip, die)) {
                    seats++;
                    if (portraitForPerson(seat.id, seat.name) === null) blank.push(seat.name);
                }
            }
        }
        expect(seats).toBeGreaterThan(3000);
        expect([...new Set(blank)]).toEqual([]);
    });
});

describe('nothing else in the app requires a portrait directly', () => {
    // The registry is meant to be the ONLY door to that folder. A second
    // require somewhere is how the count silently stops being the truth.
    const walk = (dir: string, out: string[] = []): string[] => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const p = path.join(dir, e.name);
            if (e.isDirectory()) walk(p, out);
            else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
        }
        return out;
    };

    it('only registry.ts reaches into assets/portraits', () => {
        const offenders = walk(path.join(ROOT, 'src'))
            .filter(p => path.basename(p) !== 'registry.ts')
            .filter(p => !p.endsWith('portraits.test.ts'))
            .filter(p => /require\([^)]*assets\/portraits/.test(fs.readFileSync(p, 'utf8')))
            .map(p => path.relative(ROOT, p));
        expect(offenders).toEqual([]);
    });
});
