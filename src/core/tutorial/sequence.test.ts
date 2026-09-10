// src/core/tutorial/sequence.test.ts
//
// ============================================================================
//  WHICH STEP IS ON SCREEN, AT WHICH MOMENT OF THE FIRST YEAR
// ============================================================================
//
//  Written after an evening spent asking whether the tutorial was broken. It
//  was not. The Products screen showed nothing because the step had already
//  been satisfied in that save - a production target set in an earlier
//  session - and a finished tutorial and a broken one look exactly the same
//  from the sofa.
//
//  The individual locks were already tested for shape. What was missing was
//  the thing anybody actually wants to know: given a world, what does the
//  player see. That is one function call, and not having it written down cost
//  more time than writing it would have.
// ============================================================================

import { activeLock, emptyLockState, type LockState } from './locks';
import { RESEARCHER_HIRE_PRICE, TUTORIAL_SEQUENCE } from '../../data/tutorial/sequence';
import { RESEARCHER_ECONOMICS } from '../../features/laboratory/data/laboratoryData';
import { INITIAL_DIALS } from '../story/state';
import type { World } from '../story/conditions';

/** The world a new game starts in. Figures from the stores, not invented. */
const opening = (over: Partial<World> = {}): World => ({
    dials: { ...INITIAL_DIALS },
    flags: {},
    quarter: 1,
    capital: 2_000_000,
    cash: 2_000_000,
    morale: 75,
    marketShare: 0.4,
    staffing: 100,
    researchers: 0,
    subsidiaries: [],
    casinoStreak: 0,
    quartersWithoutSponsor: 0,
    ...over,
} as World);

const showing = (world: World, state: LockState = emptyLockState()) =>
    activeLock(TUTORIAL_SEQUENCE, state, world)?.id;

describe('research, which the player asks for', () => {
    it('is invisible until they open the page', () => {
        // First in the array and gated on a trigger flag, so it costs the
        // opening lesson nothing while it waits.
        expect(showing(opening())).toBe('q1-open-product');
    });

    it('and takes priority the moment they do, even mid-tutorial', () => {
        // The point of putting it first. A player who taps into research
        // during the first quarter gets the lesson they just asked for,
        // rather than the one the calendar had queued.
        expect(showing(opening({ flags: { rndOpened: true } }))).toBe('rnd-lab');
    });

    it('then points at hiring, once the laboratory is open', () => {
        expect(showing(opening({
            flags: { rndOpened: true, rndLabOpened: true },
        }))).toBe('rnd-hire');
    });

    it('does not come back once the player has read it', () => {
        // The last step is ACKNOWLEDGE: cleared by a tap, recorded in the
        // lock state rather than in the world. So the thing that ends the
        // lesson is not a purchase - see the note in data/tutorial/
        // sequence.ts about why insisting on one was the wrong shape.
        const read: LockState = {
            ...emptyLockState(), completed: ['rnd-lab', 'rnd-hire'],
        };
        const id = showing(opening({ flags: { rndOpened: true } }), read);
        expect(id).not.toBe('rnd-lab');
        expect(id).not.toBe('rnd-hire');
    });

    it('now demands the hire, and cannot demand it of somebody who cannot pay', () => {
        // ------------------------------------------------------------------
        //  THIS TEST USED TO ASSERT THE OPPOSITE, AND IT WAS RIGHT TO
        // ------------------------------------------------------------------
        //  It read: "and it never demands a purchase to get out of it", and
        //  pinned `acknowledge: true` with no `satisfied`. The reasoning was
        //  that a player who correctly decides research is the wrong call
        //  this quarter must not be left in front of an instruction they have
        //  already understood and rejected. That reasoning is sound and the
        //  trap it describes is real.
        //
        //  Asked for again anyway, and the counter-argument is also sound: a
        //  player who taps past the card never sees a research point and
        //  never learns what the number on that screen is.
        //
        //  What settles it is that the trap has a second door. `canEngage` is
        //  way (1) of the three in locks.ts - a lock that cannot be cleared
        //  is never shown - so the demand is only ever made of somebody who
        //  can meet it. The old objection was "this step can be impossible";
        //  a step that hides when it would be impossible cannot be.
        //
        //  So the shape of the test inverts and the SUBJECT does not: both
        //  versions are about not stranding anybody.
        // ------------------------------------------------------------------
        const hire = TUTORIAL_SEQUENCE.find(l => l.id === 'rnd-hire')!;
        expect(hire.acknowledge).toBeUndefined();
        expect(hire.satisfied).toEqual([{ kind: 'flag', flag: 'rndHired' }]);

        // And the gate is the price the HIRE BUTTON charges, out of the
        // pocket it charges. Both halves were got wrong at first and both
        // produce the same trap:
        //
        //   the quarterly WAGE would let the lock engage at twenty thousand
        //   and then have the purchase refused;
        //
        //   `cashAtLeast` reads the player's PERSONAL money, and
        //   LaboratoryScreen spends `companyCapital` here.
        const gate = (hire.canEngage ?? []).find(c => c.kind === 'capitalAtLeast');
        expect(gate).toEqual({
            kind: 'capitalAtLeast',
            amount: RESEARCHER_HIRE_PRICE,
        });
        expect((hire.canEngage ?? []).some(c => c.kind === 'cashAtLeast')).toBe(false);
    });

    it('and a company that cannot afford one is never asked', () => {
        // The measurement that makes the demand safe. A pound short and the
        // lock does not exist; the player carries on with the first year.
        const short = RESEARCHER_HIRE_PRICE - 1;
        expect(showing(opening({
            capital: short,
            flags: { rndOpened: true, rndLabOpened: true },
        }))).not.toBe('rnd-hire');
        expect(showing(opening({
            capital: RESEARCHER_HIRE_PRICE,
            flags: { rndOpened: true, rndLabOpened: true },
        }))).toBe('rnd-hire');
    });

    it('and the price it names is the price the laboratory charges', () => {
        // THE WELD. sequence.ts may not import the laboratory - the audit's
        // layering guard refuses it, and refusing quietly, by going blind on
        // the whole folder. So the number is written out there and pinned
        // here, where importing both is allowed.
        expect(RESEARCHER_HIRE_PRICE).toBe(RESEARCHER_ECONOMICS.SALARY_PER_QUARTER);
    });

    it('and what a point IS waits until there is one to look at', () => {
        // The lesson was one line carrying the price AND the payoff, read
        // once, in front of a counter that still said zero. Split: the price
        // lands on the button, this lands on the number, and only after
        // somebody is employed.
        const points = TUTORIAL_SEQUENCE.find(l => l.id === 'rnd-points')!;
        expect(points.acknowledge).toBe(true);
        expect(points.canEngage).toEqual([{ kind: 'flag', flag: 'rndHired' }]);
        expect(points.highlight).toBe('rndPoints');

        expect(showing(opening({
            flags: { rndOpened: true, rndLabOpened: true, rndHired: true },
        }))).toBe('rnd-points');
    });

    it('and once it is over the first year picks up where it left off', () => {
        // Interrupted, not cancelled. The marketing lesson was mid-flight
        // when the player wandered into research.
        const read: LockState = {
            ...emptyLockState(), completed: ['rnd-lab', 'rnd-hire'],
        };
        expect(showing(opening({ flags: { rndOpened: true } }), read))
            .toBe('q1-open-product');
    });

    it('still teaches it long after the father is dead', () => {
        // Every other lock is gated on him. This one is the reason the
        // gate is per-lock rather than global.
        expect(showing(opening({
            quarter: 17,
            flags: { fatherDead: true, rndOpened: true },
        }))).toBe('rnd-lab');
    });

    it('and a company with no money still gets the explanation', () => {
        // It used to be gated on capital, because clearing it meant buying
        // something. Reading costs nothing, so the poorest company in the
        // game is still allowed to be told what a laboratory is for - and is
        // arguably the one that most needs to know.
        expect(showing(opening({
            capital: 100_000,
            flags: { rndOpened: true, rndLabOpened: true },
        }))).toBe('rnd-hire');
    });
});

describe('a new game', () => {
    it('opens on the step that gets the player into the product', () => {
        // It used to open on a production target, and that read as nonsense
        // on the screen it pointed at: "nothing is real until something is
        // being built", said to a player looking at a phone that has been in
        // production since before they arrived. The budget is the hole they
        // can actually see.
        const lock = activeLock(TUTORIAL_SEQUENCE, emptyLockState(), opening());
        expect(lock?.id).toBe('q1-open-product');
        expect(lock?.highlight).toBe('products');
    });

    it('then explains the production row, which is the top of that sheet', () => {
        // ------------------------------------------------------------------
        //  THIS USED TO GO STRAIGHT TO THE BUDGET, AND THAT SKIPPED A NUMBER
        // ------------------------------------------------------------------
        //  The product sheet has two controls on it. The tutorial could reach
        //  one, so the first thing the game taught about a product was how to
        //  advertise it, with the figure that decides whether the quarter is
        //  profitable sitting unmentioned directly above.
        //
        //  Asked for as "aciklamayi rp icin yaptigin gibi urunleri de
        //  anlatmani istiyorum", and built to the same shape - see
        //  `q1-production` in data/tutorial/sequence.ts.
        //
        //  In the screen's own reading order: build it, then tell people
        //  about it.
        // ------------------------------------------------------------------
        const after = opening({ flags: { tutorialProductOpened: true } });
        const lock = activeLock(TUTORIAL_SEQUENCE, emptyLockState(), after);
        expect(lock?.id).toBe('q1-production');
        expect(lock?.highlight).toBe('production');
        // Read and tapped away rather than done: there is a right answer and
        // it depends on a number that moves every quarter.
        expect(lock?.acknowledge).toBe(true);
    });

    it('and points at the budget row once that card has been read', () => {
        const after = opening({ flags: { tutorialProductOpened: true } });
        const read: LockState = { ...emptyLockState(), completed: ['q1-production'] };
        const lock = activeLock(TUTORIAL_SEQUENCE, read, after);
        expect(lock?.id).toBe('q1-marketing');
        expect(lock?.highlight).toBe('marketing');
    });

    it('and not for a company that cannot afford to clear it', () => {
        // The first of the three ways out: a step that costs money does not
        // engage when there is none.
        expect(showing(opening({ capital: 100_000 }))).toBeUndefined();
    });
});

describe('after the player buys some attention', () => {
    const afterwards = opening({ flags: { tutorialProductOpened: true, tutorialMarketingSet: true } });

    // The production card is an `acknowledge` step, so it is cleared by a tap
    // and recorded in LockState rather than in the world. A scenario that is
    // past the product sheet has to say so here; without it every assertion
    // below finds that card still waiting, correctly.
    const sheetRead: LockState = { ...emptyLockState(), completed: ['q1-production'] };

    it('it points at research, which nothing used to do', () => {
        // ------------------------------------------------------------------
        //  THIS USED TO ASSERT SILENCE, AND THE SILENCE WAS THE BUG
        // ------------------------------------------------------------------
        //  It read "the tutorial goes quiet, and that is correct" - nothing to
        //  show until morale settles. That was true and it left a hole: the
        //  whole research chain is gated on `rndOpened`, which only the
        //  Research screen raises, so the lesson waited for a player who had
        //  already found it on their own. Nothing in the first year ever said
        //  the word.
        //
        //  Reported as the laboratory lesson never appearing. The other half
        //  was the returning-player check disabling every lock; this is the
        //  half that was missing even with the locks on.
        // ------------------------------------------------------------------
        expect(showing(afterwards, sheetRead)).toBe('q1-research');
    });

    it('and it stops once they have opened it', () => {
        expect(showing(opening({
            flags: {
                tutorialProductOpened: true,
                tutorialMarketingSet: true,
                rndOpened: true,
            },
        }), sheetRead)).toBe('rnd-lab');
    });

    it('and morale is not next until morale has actually settled', () => {
        // Morale starts at 75 and approaches 70 asymptotically. The bonus
        // step needs 72 or below, which arrives in the second or third
        // quarter - see MORALE_EVENT_THRESHOLD and the note above it.
        expect(showing(opening({
            flags: { tutorialProductOpened: true, tutorialMarketingSet: true },
            morale: 72,
        }), sheetRead)).toBe('morale-bonus');
    });

    it('and there is no third step, because its lesson moved to the first', () => {
        // q3-marketing is shelved. It waited on the same flag the opening
        // lock now raises, so it was inert as well as redundant - see the
        // note in data/tutorial/sequence.ts.
        expect(TUTORIAL_SEQUENCE.map(l => l.id)).toEqual([
            // Research first in the ARRAY, invisible until triggered - see
            // the note at the top of data/tutorial/sequence.ts.
            // Three research steps now: open it, hire, and then what a
            // point is - which can only be taught once one exists. See the
            // note on `rnd-points` in data/tutorial/sequence.ts.
            'rnd-lab', 'rnd-hire', 'rnd-points',
            // The sheet, top to bottom: get in, understand the number at the
            // top, then set the one below it.
            'q1-open-product', 'q1-production', 'q1-marketing', 'morale-bonus',
            // Last, and behind morale on purpose: morale is on a clock and
            // research is on none, so the timed lesson goes first.
            'q1-research',
        ]);
        // And with the bonus paid the year has one thing left to say, which
        // is where research is. It goes quiet only once that is done too -
        // see the note on `q1-research` about why it waits behind morale.
        expect(showing(opening({
            flags: {
                tutorialProductOpened: true,
                tutorialMarketingSet: true,
                tutorialBonusPaid: true,
            },
            quarter: 3, morale: 75,
        }), sheetRead)).toBe('q1-research');

        expect(showing(opening({
            flags: {
                tutorialProductOpened: true,
                tutorialMarketingSet: true,
                tutorialBonusPaid: true,
                rndOpened: true,
                rndLabOpened: true,
                rndHired: true,
            },
            quarter: 3, morale: 75,
        }), { ...emptyLockState(), completed: ['rnd-points', 'q1-production'] })).toBeUndefined();
    });
});

describe('the year ends', () => {
    it('nothing the FATHER teaches is taught once he is dead', () => {
        // ------------------------------------------------------------------
        //  THE CLAIM USED TO BE "EVERY LOCK", AND IT WAS ALREADY UNTRUE
        // ------------------------------------------------------------------
        //  It read "every lock carries `noFlag fatherDead`" and passed only
        //  because the exceptions needed a second flag the test never set.
        //  The research chain has never been gated on him, on purpose: it is
        //  triggered by the player rather than by the calendar and can fire
        //  in year four. `q1-production` is the same, for the same reason.
        //
        //  So the guarantee is narrower than the old sentence and is the one
        //  that actually matters: a lesson in HIS voice does not come back
        //  after he is gone. A tutorial where a dead man gives instructions
        //  is the bug this was written against.
        // ------------------------------------------------------------------
        const dead = { fatherDead: true } as const;
        expect(showing(opening({ flags: dead }))).toBeUndefined();

        const gone = showing(opening({
            flags: { ...dead, tutorialProductOpened: true, tutorialMarketingSet: true },
            quarter: 3,
        }));
        // Whatever is left, it is not his.
        const speaker = TUTORIAL_SEQUENCE.find(l => l.id === gone)?.speaker ?? 'father';
        expect([gone, speaker]).not.toEqual([gone, 'father']);

        // And once the sheet's card has been read there is nothing at all.
        expect(showing(opening({
            flags: { ...dead, tutorialProductOpened: true, tutorialMarketingSet: true },
            quarter: 3,
        }), { ...emptyLockState(), completed: ['q1-production'] })).toBeUndefined();
    });

    it('and every step still in the father\'s voice is gated on him being alive', () => {
        // The rule the test above checks one instance of, checked for all of
        // them. If somebody writes a new father lock and forgets the gate,
        // this is what catches it rather than a playthrough in year three.
        const ungated = TUTORIAL_SEQUENCE
            .filter(l => (l.speaker ?? 'father') === 'father')
            .filter(l => !(l.canEngage ?? [])
                .some(c => c.kind === 'noFlag' && c.flag === 'fatherDead'))
            .map(l => l.id);
        expect(ungated).toEqual([]);
    });

    it('a skipped step does not come back', () => {
        const skipped: LockState = { ...emptyLockState(), skipped: ['q1-open-product', 'q1-marketing'] };
        expect(showing(opening(), skipped)).toBeUndefined();
    });

    it('and switching the tutorial off switches all of it off', () => {
        const off: LockState = { ...emptyLockState(), disabled: true };
        expect(showing(opening(), off)).toBeUndefined();
    });
});
