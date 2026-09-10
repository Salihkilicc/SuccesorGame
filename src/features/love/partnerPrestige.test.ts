// src/features/love/partnerPrestige.test.ts
//
// ============================================================================
//  RICH PEOPLE, AND WHETHER THE GAME CAN TELL
// ============================================================================
//
//  Asked for: "prestije odakli cok zengin kizlar yap, backgroundu iyi, ama
//  prestije gore yapmalisin, erkekler de tabii."
//
//  Three claims, and each one is a different kind of test:
//
//    THE LADDER      arithmetic, so it can be measured. The base upkeep is
//                    derived from the tier gate and the real CEO pay rule,
//                    and every gated room lands on the same share of income.
//
//    THE BACKGROUND  data, so it can be counted. Five per room, both
//                    languages, stable per person, no dashes.
//
//    THE CARD        wiring, so it can only be read out of the file. That is
//                    the weakest of the three and it is said so where it is.
//
//  ---------------------------------------------------------------------------
//  AND ONE PIN AGAINST A MISTAKE THAT WAS MADE WHILE WRITING THIS
//  ---------------------------------------------------------------------------
//  The first version of the fix added `job.<id>` for all forty seven jobs,
//  `trait.<id>` for the ten personalities and `class.<name>` for the eight
//  classes to en.ts and tr.ts - a complete second translation of three tables
//  that data/i18n/profileLoveShopText.ts had already translated, keyed
//  differently, sitting beside it.
//
//  It was backed out. `noSecondTable` below is what stops it coming back.
// ============================================================================

import fs from 'fs';
import path from 'path';

import { TIER_STANDING, TIER_UNLOCK } from './logic/courtship';
import {
    baseUpkeepFor, monthlyPayAtValue, readable, upkeepFor, upkeepStrain,
    MAX_STRAIN_PER_QUARTER, UPKEEP_SHARE_OF_PAY, VALUE_TO_REVENUE,
} from './logic/partnerUpkeep';
import { BACKGROUNDS_PER_TIER, backgroundKeyFor, backgroundKeysFor } from './data/backgrounds';
import { PERSONALITY_TRAITS } from './data/personalitiesData';
import { generatePartner } from './logic/partnerGenerator';
import { en } from '../../core/i18n/en';
import { tr } from '../../core/i18n/tr';
import type { SocialTier } from '../../data/relationshipTypes';

const ROOT = path.join(__dirname, '..', '..', '..');
const read = (...p: string[]) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');
/** A file with its comments taken out, so a claim cannot be met by a note. */
const live = (...p: string[]) =>
    read(...p)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

/** The four rooms money opens. The other three are open to everybody. */
const GATED = TIER_STANDING.filter(t => TIER_UNLOCK[t] > 0);

describe('what somebody costs follows the room they are standing in', () => {
    it('every gated room costs the same share of what its own gate earns', () => {
        // ------------------------------------------------------------------
        //  THIS IS THE WHOLE FIX, AS ONE NUMBER
        // ------------------------------------------------------------------
        //  Before: 0.9% to 3.8% at ARTISTIC and 0.01% to 0.04% at
        //  GLOBAL_ELITE, because the seven figures were typed rather than
        //  derived. The ladder of people went flat against the ladder of
        //  money and stayed flat for the rest of the dynasty.
        // ------------------------------------------------------------------
        for (const tier of GATED) {
            const pay = monthlyPayAtValue(TIER_UNLOCK[tier]);
            const share = baseUpkeepFor(tier) / pay;
            // Two significant figures rounds the base, so it cannot be exact.
            expect(share).toBeGreaterThan(UPKEEP_SHARE_OF_PAY * 0.9);
            expect(share).toBeLessThan(UPKEEP_SHARE_OF_PAY * 1.1);
        }
    });

    it('and the top room really does cost millions a month', () => {
        // The ask, in the words it was asked in. Measured: 13,000,000 base,
        // 7,800,000 for a Strategic Pragmatist and 33,000,000 for a High
        // Maintenance.
        expect(baseUpkeepFor('GLOBAL_ELITE')).toBeGreaterThan(1_000_000);
        const costs = PERSONALITY_TRAITS.map(p => upkeepFor('GLOBAL_ELITE', p));
        expect(Math.min(...costs)).toBeGreaterThan(1_000_000);
        expect(Math.max(...costs)).toBeGreaterThan(Math.min(...costs) * 3);
    });

    it('and each room up the ladder is dearer than the one below it', () => {
        // The gated four in standing order. UNDERGROUND is deliberately NOT
        // in this list: it is bottom of TIER_STANDING and the dearest of the
        // three ungated rooms, because standing is about who will be seen
        // with you and this is about what their week costs.
        const rungs = GATED.map(t => baseUpkeepFor(t));
        for (let i = 1; i < rungs.length; i++) {
            expect(rungs[i]).toBeGreaterThan(rungs[i - 1]);
        }
    });

    it('and the three rooms that are open to everybody do not move with the money', () => {
        // They have a gate of zero, so there is nothing to derive from, and
        // that is the rule working rather than a hole in it. A master
        // sommelier lives the same way whichever player is looking at them.
        expect(baseUpkeepFor('STUDENT_LIFE')).toBe(200);
        expect(baseUpkeepFor('BLUE_COLLAR')).toBe(500);
        expect(baseUpkeepFor('UNDERGROUND')).toBe(2_000);
    });

    it('and the pay it is derived from is the pay the game actually uses', () => {
        // Not a restatement of `payCeiling`, the function itself. The day
        // anybody changes MAX_PAY_SHARE_OF_REVENUE this ladder moves with it,
        // which is the point of deriving it at all.
        const src = live('src', 'features', 'love', 'logic', 'partnerUpkeep.ts');
        expect(src).toMatch(/import \{ payCeiling \} from '\.\.\/\.\.\/\.\.\/core\/market\/ceoPay'/);
        expect(src).toMatch(/import \{ TIER_UNLOCK \} from '\.\/courtship'/);
        // And the measured ratio is inside the range the valuation produces.
        expect(VALUE_TO_REVENUE).toBeGreaterThan(0.7);
        expect(VALUE_TO_REVENUE).toBeLessThan(2.3);
    });

    it('and the number on the card reads like a price rather than like a sum', () => {
        // Two significant figures. The derivation lands on 13,020,833 and a
        // number like that in front of a person looks computed.
        expect(readable(13_020_833)).toBe(13_000_000);
        expect(readable(2_604)).toBe(2_600);
        expect(readable(99)).toBe(99);
        expect(readable(0)).toBe(0);
        expect(String(readable(13_020_833))).toMatch(/^13000000$/);
    });

    it('and a generated partner is charged what their room says', () => {
        for (const tier of TIER_STANDING) {
            for (let i = 0; i < 40; i++) {
                const p = generatePartner(tier);
                expect(p.finances?.monthlyCost).toBe(upkeepFor(tier, p.personality));
            }
        }
    });
});

describe('and now that it is a real number it can be unaffordable', () => {
    it('missing none of the bill costs nothing', () => {
        expect(upkeepStrain(1_000_000, 0)).toBe(0);
    });

    it('missing all of it costs the full quarter', () => {
        expect(upkeepStrain(1_000_000, 1_000_000)).toBe(-MAX_STRAIN_PER_QUARTER);
    });

    it('and covering most of it is treated as covering most of it', () => {
        expect(upkeepStrain(1_000_000, 500_000)).toBe(-Math.round(MAX_STRAIN_PER_QUARTER / 2));
        // Never worse than the cap, whatever the caller passes.
        expect(upkeepStrain(100, 10_000_000)).toBe(-MAX_STRAIN_PER_QUARTER);
        expect(upkeepStrain(0, 5_000)).toBe(0);
    });

    it('and the quarter charges the money AND asks for the strain', () => {
        // ------------------------------------------------------------------
        //  A WIRING CHECK, AND IT IS THE WEAK ONE
        // ------------------------------------------------------------------
        //  The tick is nine hundred lines inside a store with a dozen
        //  requires; standing a whole quarter up to watch one subtraction is
        //  a bigger fixture than the thing it checks. Read out of the file
        //  instead, and say so.
        //
        //  What it CAN pin is the half that goes missing: a shortfall
        //  computed and never handed to anybody.
        // ------------------------------------------------------------------
        const tick = live('src', 'core', 'store', 'useGameStore.ts');
        const block = tick.slice(
            tick.indexOf('const partnerUpkeepCost'),
            tick.indexOf("mark('capacity')"),
        );
        expect(block.length).toBeGreaterThan(100);
        // Still charged in full. This is not a discount for being poor.
        expect(block).toMatch(/setField\('money', had - partnerUpkeepCost\)/);
        expect(block).toMatch(/upkeepStrain/);
        expect(block).toMatch(/updateLove\(strain\)/);
    });
});

describe('everybody arrives with a past', () => {
    it('five per room, and the same five in both languages', () => {
        for (const tier of TIER_STANDING) {
            const keys = backgroundKeysFor(tier);
            expect(keys).toHaveLength(BACKGROUNDS_PER_TIER);
            for (const k of keys) {
                expect(typeof en[k]).toBe('string');
                expect(typeof tr[k]).toBe('string');
                expect((en[k] || '').length).toBeGreaterThan(30);
                expect((tr[k] || '').length).toBeGreaterThan(30);
            }
        }
    });

    it('and the same person has the same past every time', () => {
        // Drawn from the id, not from Math.random. A history that re-rolls on
        // every render is not a history.
        for (const tier of TIER_STANDING) {
            const first = backgroundKeyFor(tier, 'abc123');
            for (let i = 0; i < 20; i++) {
                expect(backgroundKeyFor(tier, 'abc123')).toBe(first);
            }
        }
    });

    it('and every generated partner has one, from their own room', () => {
        for (const tier of TIER_STANDING) {
            const seen = new Set<string>();
            for (let i = 0; i < 120; i++) {
                const key = generatePartner(tier).stats.background;
                expect(backgroundKeysFor(tier)).toContain(key);
                seen.add(key!);
            }
            // And the draw is not stuck on one of them.
            expect(seen.size).toBe(BACKGROUNDS_PER_TIER);
        }
    });

    it('and none of them uses a dash', () => {
        // ------------------------------------------------------------------
        //  "BEN TIRE KULLANILMASINI YASAKLIYORUM OYUNDA"
        // ------------------------------------------------------------------
        //  Thirty five new sentences is the largest single piece of writing
        //  added to this game in one go, which makes it the likeliest place
        //  for one to get in. An em dash, an en dash, or a hyphen with a
        //  space on either side. A hyphenated WORD is fine.
        // ------------------------------------------------------------------
        const offenders: string[] = [];
        for (const tier of TIER_STANDING) {
            for (const k of backgroundKeysFor(tier)) {
                for (const [lang, dict] of [['en', en], ['tr', tr]] as const) {
                    const line = dict[k] || '';
                    if (/[–—]|\s-\s/.test(line)) offenders.push(`${lang}:${k}`);
                }
            }
        }
        expect(offenders).toEqual([]);
    });

    it('and a partner from before backgrounds existed simply has none', () => {
        // Optional on purpose. Every save predates it and there is nothing to
        // migrate; the block does not render rather than rendering blank.
        const { backgroundLine } = require('./logic/partnerText');
        expect(backgroundLine(null)).toBe('');
        expect(backgroundLine({ stats: {} } as any)).toBe('');
        expect(backgroundLine({ stats: { background: 'bg.NOWHERE.9' } } as any)).toBe('');
    });
});

describe('and the card the player reads is in the language they chose', () => {
    const registry = read('src', 'data', 'i18n', 'profileLoveShopText.ts');

    it('the ten personalities are in the registry, which they never were', () => {
        // TRAITS_TR had the fifteen character traits, the seven partner STYLE
        // words and the six child traits, and none of the ten labels the
        // encounter card actually prints. It fell through translateTrait's
        // own fallback, which returns the key it was given.
        for (const p of PERSONALITY_TRAITS) {
            expect(registry).toContain(`'${p.label}':`);
        }
    });

    it('and the encounter card asks the registry rather than the data file', () => {
        const card = live('src', 'features', 'love', 'components', 'EncounterModal.tsx');
        expect(card).toMatch(/from '\.\.\/logic\/partnerText'/);
        // The three raw reads that were the whole of the prestige.
        expect(card).not.toMatch(/personality\?\.label \|\|/);
        expect(card).not.toMatch(/replace\(\/\(\[a-z\]\)\(\[A-Z\]\)\//);
        expect(card).toMatch(/jobTitle\(/);
        expect(card).toMatch(/traitLabel\(/);
        expect(card).toMatch(/classLabel\(/);
    });

    it('and the badge beside the bill follows the room, not the word luxury', () => {
        const { lifestyleLabel } = require('./logic/partnerText');
        const seen = new Set(TIER_STANDING.map(t => lifestyleLabel(t)));
        // Seven rooms, seven words. It used to be one word for all of them.
        expect(seen.size).toBe(TIER_STANDING.length);
        for (const tier of TIER_STANDING) {
            expect(typeof en[`life.${tier}`]).toBe('string');
            expect(typeof tr[`life.${tier}`]).toBe('string');
        }
        const card = live('src', 'features', 'love', 'components', 'EncounterModal.tsx');
        expect(card).not.toMatch(/\{t\('love\.luxury'\)\}/);
    });

    it("and what their family has is on the card, which it never was", () => {
        // `familyWealth` and `financialAidChance` are derived from the room
        // and the personality and were read by NOTHING the player could see.
        // The signature failure of this codebase: correct data that nothing
        // reads.
        const card = live('src', 'features', 'love', 'components', 'EncounterModal.tsx');
        expect(card).toMatch(/wealthLabel\(candidate\.stats\?\.familyWealth\)/);
        expect(card).toMatch(/aidLine\(candidate/);
        expect(card).toMatch(/styles\.backgroundCard/);

        // And on the one screen a partner exists on afterwards.
        const screen = live('src', 'features', 'profile', 'screens', 'FamilyMemberScreen.tsx');
        expect(screen).toMatch(/backgroundLine\(partner\)/);
        expect(screen).toMatch(/partnerBackground/);
    });

    it('and the wealth bands say something different at each end', () => {
        const { wealthLabel } = require('./logic/partnerText');
        // GLOBAL_ELITE sits at 97 and STUDENT_LIFE at 20, both before jitter.
        expect(wealthLabel(97)).not.toBe(wealthLabel(20));
        expect(wealthLabel(97)).toBe(en['wealth.4']);
        expect(wealthLabel(0)).toBe(en['wealth.0']);
        // Nothing throws on rubbish.
        expect(wealthLabel(undefined)).toBe(en['wealth.0']);
        expect(wealthLabel(1000)).toBe(en['wealth.4']);
    });

    it('and there is exactly ONE table of job titles', () => {
        // ------------------------------------------------------------------
        //  THE MISTAKE THIS PINS WAS MADE WHILE WRITING THIS FILE
        // ------------------------------------------------------------------
        //  A `job.<id>` block for all forty seven jobs went into en.ts and
        //  tr.ts before anybody checked whether the game already translated
        //  them. It did: all fifty one titles and all eight classes were
        //  already in profileLoveShopText.ts, and three of the four partner
        //  surfaces had been using it for a long time.
        //
        //  Two tables for one fact is the fault this project has spent weeks
        //  removing. It cost nothing to back out on the day and it would have
        //  cost a great deal on the day the two disagreed.
        // ------------------------------------------------------------------
        for (const dict of [en, tr]) {
            expect(Object.keys(dict).filter(k => k.startsWith('job.'))).toEqual([]);
            expect(Object.keys(dict).filter(k => k.startsWith('trait.'))).toEqual([]);
            expect(Object.keys(dict).filter(k => k.startsWith('class.'))).toEqual([]);
        }
        // And the door delegates rather than translating.
        const door = live('src', 'features', 'love', 'logic', 'partnerText.ts');
        expect(door).toMatch(/translateOccupation/);
        expect(door).toMatch(/translateSocialClass/);
        expect(door).toMatch(/translateTrait/);
    });

    it('and an Heir and an Heiress are still one job in Turkish', () => {
        // Turkish has no gendered third person, so "erkekler de tabii" costs
        // nothing on this screen: one word covers both. English needs two and
        // the registry carries both.
        const { jobTitle } = require('./logic/partnerText');
        const job = { id: 'dynasty_heiress', title: 'Old-Money Dynasty Heiress', titleFor: { male: 'Old-Money Dynasty Heir' } };
        expect(jobTitle(job, 'male')).toBe('Old-Money Dynasty Heir');
        expect(jobTitle(job, 'female')).toBe('Old-Money Dynasty Heiress');
        expect(jobTitle(null)).toBe('');
    });
});

describe('and every room is offered to both genders', () => {
    it('a run of candidates at the top of the ladder is not one gender', () => {
        // Asked for explicitly. The generator already answers this - see
        // partnerGenderFor and SAME_GENDER_CHANCE - and the new writing must
        // not have quietly re-gendered anything, because the background is
        // now the longest thing on the card.
        const genders = new Set<string>();
        for (let i = 0; i < 200; i++) genders.add(generatePartner('GLOBAL_ELITE').gender!);
        expect(genders.has('male')).toBe(true);
        expect(genders.has('female')).toBe(true);
    });

    it('and no background line assumes one', () => {
        // The Turkish is free of it by grammar. The English is written in the
        // plural on purpose, so no line may carry a gendered pronoun.
        const offenders: string[] = [];
        for (const tier of TIER_STANDING) {
            for (const k of backgroundKeysFor(tier)) {
                const line = en[k] || '';
                // `he`/`she`/`her`/`his` as whole words. "The" and "there"
                // must not match, which is what the boundaries are for.
                if (/\b(he|she|her|hers|his|him)\b/i.test(line)) offenders.push(`en:${k}`);
            }
        }
        // ONE exception, and it is deliberate: a father is a man. It is the
        // PARTNER who must not be gendered, not everybody they mention.
        //
        // This expected TWO on the first run and the second was wrong: the
        // old money line reads "The grandchild is tired of carrying it",
        // which is the plural trick working. Corrected to what the writing
        // actually does rather than to what I remembered writing.
        expect(offenders).toEqual(['en:bg.BLUE_COLLAR.1']);
    });
});
