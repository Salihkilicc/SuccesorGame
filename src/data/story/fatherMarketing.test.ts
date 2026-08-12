// src/data/story/fatherMarketing.test.ts
//
// ============================================================================
//  PINNING THE THING THAT IS EASIEST TO EDIT AWAY
// ============================================================================
//
//  This is the scene where the father is out of date for the first time, and
//  every one of those moments is a line that a later pass will read as a
//  mistake and quietly "fix". A tidier writer smooths "four hundred thousand,
//  never raised" into something correct, and the whole point of the year goes
//  with it.
//
//  So the datedness is asserted here, with the engine facts it contradicts
//  next to it. If someone corrects him, these fail and say what was lost.
// ============================================================================

import { fatherMarketing } from './fatherMarketing';
import { CONVERSATIONS } from './index';
import { validate } from '../../core/story/graph';
import { CAST } from './cast';
import { TUTORIAL_SEQUENCE } from '../tutorial/sequence';
import { activeLock, emptyLockState, validateLocks } from '../../core/tutorial/locks';
import { PRODUCT_MARKETS } from '../../core/market/productMarkets';
import { BRAND_POINTS_PER_SHARE } from '../../core/market/brand';
import { INITIAL_DIALS } from '../../core/story/state';
import type { World } from '../../core/story/conditions';

const text = fatherMarketing.nodes.map(n => n.text).join(' ');
const lower = text.toLowerCase();

const world = (over: Partial<World> = {}): World => ({
    dials: { ...INITIAL_DIALS },
    flags: {},
    quarter: 3,
    capital: 5_000_000,
    cash: 100_000,
    morale: 75,
    marketShare: 4,
    // A fully crewed plant and an empty lab: the state every one of these
    // tests was implicitly assuming before the COO and the CTO could read
    // either number. Neither arc is what this file is about.
    staffing: 100,
    researchers: 0,
    // Owns nothing. These tests are not about the portfolio.
    subsidiaries: [],
    ...over,
});

describe('it is a real scene in the game', () => {
    it('is registered and valid', () => {
        const known = new Set(CONVERSATIONS.map(c => c.id));
        expect(known.has(fatherMarketing.id)).toBe(true);
        expect(validate(fatherMarketing, CAST, known)).toEqual([]);
    });

    it('the Q3 lock carries it, and every lock now declares a gate', () => {
        const lock = TUTORIAL_SEQUENCE.find(l => l.id === 'q3-marketing')!;
        expect(lock.conversation).toBe(fatherMarketing.id);
        expect(validateLocks(TUTORIAL_SEQUENCE)).toEqual([]);
    });

    it('does not engage before quarter three, or without the money to act on it', () => {
        const done = { ...emptyLockState(), completed: ['q1-production', 'morale-bonus'] };
        expect(activeLock(TUTORIAL_SEQUENCE, done, world({ quarter: 2 }))).toBeUndefined();
        expect(activeLock(TUTORIAL_SEQUENCE, done, world({ capital: 0 }))).toBeUndefined();
        expect(activeLock(TUTORIAL_SEQUENCE, done, world())?.id).toBe('q3-marketing');
    });
});

describe('he is watching the wrong company', () => {
    it('names Microhard as the threat', () => {
        expect(text).toContain('Microhard');
    });

    it('while Pear is the one with more of the market', () => {
        // The fact that makes him wrong, read from the market data rather
        // than repeated here - if the shares are ever rebalanced so that
        // Microhard really is ahead, this fails and the scene needs rewriting.
        const consumer = PRODUCT_MARKETS.find(m => m.category === 'Consumer')!;
        const pear = consumer.competitors.find(c => c.stockId === 'tech_pear')!;
        const micro = consumer.competitors.find(c => c.stockId === 'tech_micro')!;
        expect(pear.share).toBeGreaterThan(micro.share);
    });

    it('and Microhard is nonetheless large, so he is not being a fool', () => {
        // If the company he named were trivial the scene would read as
        // senility rather than as a man who stopped updating.
        const consumer = PRODUCT_MARKETS.find(m => m.category === 'Consumer')!;
        const micro = consumer.competitors.find(c => c.stockId === 'tech_micro')!;
        expect(micro.share).toBeGreaterThan(20);
        expect(micro.strength).toBeGreaterThan(80);
    });

    it('the player can put the real number to him, and he reinterprets it', () => {
        // The same move he made with the dates in the invoice scene. Twice is
        // a pattern; the player is meant to notice the pattern, not be told.
        const node = fatherMarketing.nodes.find(n => n.id === 'thirtyOne')!;
        expect(node.text).toContain('photograph');
    });
});

describe('the budget advice is an absolute, and the engine measures relatively', () => {
    it('he quotes a fixed number he never raised', () => {
        expect(lower).toContain('four hundred thousand');
        expect(lower).toContain('never once raised it');
    });

    it('and says out loud that his company did not grow', () => {
        // The fact that undoes his own advice, handed over by him, presented
        // as the moral. Nothing in the scene connects the two.
        expect(text).toContain('same size in 2014 as in 2005');
    });
});

describe('he never mentions delivery, and that is the seam', () => {
    it('brand is anchored to realised share, not to spend', () => {
        // The engine fact he is behind on. Marketing lifts brand off the line
        // for a quarter; share pulls it back.
        expect(BRAND_POINTS_PER_SHARE).toBeGreaterThan(0);
    });

    it('asked what happens if the orders cannot be built, he shrugs', () => {
        const node = fatherMarketing.nodes.find(n => n.id === 'cannotBuild')!;
        expect(node.text).toContain('best problem in business');
        expect(node.text).toContain('Demand first');
    });

    it('and when pressed he concedes the fact but keeps the conclusion', () => {
        // Not stupidity. The ordering of the two costs really did reverse,
        // and nobody sends you a letter when that happens.
        const node = fatherMarketing.nodes.find(n => n.id === 'elsewhere')!;
        expect(node.text).toContain('truer than it is');
    });
});

describe('but he is not wrong, and that has to survive', () => {
    it('every path still reaches the instruction', () => {
        // A player who argues with him about Pear, about the budget, about
        // delivery - all of them still get told what to do. If scepticism
        // cost the lesson, the year would resolve into "the old man was
        // wrong" and the question the whole first act depends on closes.
        const seen = new Set<string>();
        const step = (id: string) => {
            if (seen.has(id)) return;
            seen.add(id);
            const node = fatherMarketing.nodes.find(n => n.id === id)!;
            (node.choices ?? []).forEach(c => c.next && step(c.next));
        };
        step(fatherMarketing.start);
        // Every terminal path ends at the close, and the close is where the
        // budget instruction has already been given.
        for (const node of fatherMarketing.nodes) {
            if (!node.choices || node.choices.length === 0) {
                expect(node.id).toBe('close');
            }
        }
        expect(seen.has('spend')).toBe(true);
    });

    it('and the advice he gives does work - marketing is a real factor', () => {
        // He is behind, not mistaken. A product with no budget is a product
        // nobody has heard of, and the lock's instruction says so.
        const lock = TUTORIAL_SEQUENCE.find(l => l.id === 'q3-marketing')!;
        expect(lock.instruction.toLowerCase()).toContain('nobody has heard of');
    });
});
