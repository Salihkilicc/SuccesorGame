// src/data/events/brotherDividend.test.ts
//
// ============================================================================
//  THE DIAL HAS TO BE AUDIBLE, AND HE HAS TO STAY UNSAFE
// ============================================================================
//
//  Two claims, and both are the kind that quietly stop being true.
//
//  THE BANDS ARE EXCLUSIVE. Three events on one subject only works if exactly
//  one can fire in any quarter. Get the gates wrong by one band and the player
//  gets the cold version and the warm version of the same demand in the same
//  week, which reads as a bug about the character rather than a bug in a
//  condition.
//
//  HE IS NEVER SAFE. The obvious drift is to make high trust comfortable,
//  because that is what a relationship meter usually means. Then the dial is a
//  difficulty slider and he is a puzzle solved once. The close version has to
//  carry the worst news in the arc.
// ============================================================================

import {
    brotherDividendCold, brotherDividendColdEvent,
    brotherDividendWarm, brotherDividendWarmEvent,
    brotherDividendClose, brotherDividendCloseEvent,
} from './brotherDividend';
import { EVENTS } from './index';
import { CONVERSATIONS } from '../story';
import { validate } from '../../core/story/graph';
import { CAST } from '../story/cast';
import { testAll, type World } from '../../core/story/conditions';
import { INITIAL_DIALS } from '../../core/story/state';
import { loyaltyOf, trustForLoyalty } from '../../core/market/loyalty';

const known = new Set(CONVERSATIONS.map(c => c.id));
const VARIANTS = [
    { event: brotherDividendColdEvent, scene: brotherDividendCold, name: 'cold' },
    { event: brotherDividendWarmEvent, scene: brotherDividendWarm, name: 'warm' },
    { event: brotherDividendCloseEvent, scene: brotherDividendClose, name: 'close' },
];

const world = (brotherTrust: number): World => ({
    dials: { ...INITIAL_DIALS, brotherTrust },
    flags: { fatherDead: true },
    quarter: 12,
    capital: 20_000_000,
    cash: 200_000,
    morale: 71,
    marketShare: 4,
});

describe('all three are in the game', () => {
    it('registered, valid, and in the pool', () => {
        for (const v of VARIANTS) {
            expect(known.has(v.scene.id)).toBe(true);
            expect(validate(v.scene, CAST, known)).toEqual([]);
            expect(EVENTS.map(e => e.id)).toContain(v.event.id);
        }
    });
});

describe('exactly one temperature is possible at a time', () => {
    // Sampled across the whole dial rather than at the boundaries only: an
    // off-by-one band shows up in the middle of a range, not at 0 and 100.
    it('never two, never none', () => {
        for (let trust = 0; trust <= 100; trust += 1) {
            const w = world(trust);
            const live = VARIANTS.filter(v => testAll(v.event.when, w));
            expect({ trust, count: live.length }).toEqual({ trust, count: 1 });
        }
    });

    it('and the temperature is the one the number says', () => {
        const nameAt = (trust: number) =>
            VARIANTS.find(v => testAll(v.event.when, world(trust)))!.name;
        expect(nameAt(10)).toBe('cold');
        expect(nameAt(49)).toBe('cold');
        expect(nameAt(50)).toBe('warm');
        expect(nameAt(74)).toBe('warm');
        expect(nameAt(75)).toBe('close');
        expect(nameAt(100)).toBe('close');
    });

    it('and the player starts cold, which is where he starts as a person', () => {
        expect(INITIAL_DIALS.brotherTrust).toBeLessThan(50);
        expect(testAll(brotherDividendColdEvent.when, world(INITIAL_DIALS.brotherTrust)))
            .toBe(true);
    });
});

describe('the temperature is audible', () => {
    it('cold goes through a lawyer, warm comes to your face', () => {
        expect(brotherDividendCold.nodes[0].text).toContain('Farrow');
        expect(brotherDividendWarm.nodes[0].text).toContain('over a table');
    });

    it('and the needle only exists where it can reach', () => {
        // "Dad trusted you with all of it" is the cruellest line he has, and
        // it only works from someone close enough to be hurt by the answer.
        // In the cold version he is not hurt, he is filing.
        const warm = brotherDividendWarm.nodes.map(n => n.text).join(' ');
        expect(warm).toContain('Dad trusted you with all of it');
        expect(brotherDividendCold.nodes.map(n => n.text).join(' '))
            .not.toContain('Dad trusted you');
    });

    it('cold ends in the minutes, warm ends in a conversation', () => {
        expect(brotherDividendCold.nodes.map(n => n.text).join(' ')).toContain('minutes');
        expect(brotherDividendWarm.nodes.map(n => n.text).join(' ')).toContain('my brother');
    });
});

describe('warmth does not make him safe', () => {
    const closeText = brotherDividendClose.nodes.map(n => n.text).join(' ');

    it('the close version carries the worst news in the arc', () => {
        // He has been having dinner with the fund that is financing somebody
        // else's run at the company - and he volunteers it.
        expect(closeText).toContain('dinner with Halberd');
        expect(closeText).toContain('lending');
    });

    it('and he is telling you, which is the whole problem', () => {
        // He is not lying and has not betrayed anyone. He is sincere in the
        // moment and unreliable across time, and does not experience those as
        // being in tension. The player cannot be angry without punishing
        // honesty, which is the trap the character is built out of.
        expect(closeText).toContain('I am telling you');
        expect(closeText).toContain('I am allowed to have dinner');
    });

    it('asking him to stop gets an honest refusal rather than a promise', () => {
        const node = brotherDividendClose.nodes.find(n => n.id === 'doNotAgain')!;
        expect(node.text).toContain('we both know I will pick up the phone');
    });

    it('and objecting costs the player the channel', () => {
        // Refusing him is entirely reasonable and it is not free. He does not
        // get angry - he stops volunteering, which is worse.
        const node = brotherDividendClose.nodes.find(n => n.id === 'doNotAgain')!;
        const refuse = node.choices!.find(c => c.text === 'That is not a promise.')!;
        const d = refuse.effects!.find(e => e.kind === 'dial') as any;
        expect(d.dial).toBe('brotherTrust');
        expect(d.delta).toBeLessThan(0);
    });

    it('every temperature moves the dial in both directions', () => {
        // If any variant could only lower it, the arc would be one-way and
        // the player would learn to stop reading him.
        for (const v of VARIANTS) {
            const deltas = v.scene.nodes
                .flatMap(n => n.choices ?? [])
                .flatMap(c => c.effects ?? [])
                .filter(e => e.kind === 'dial' && (e as any).dial === 'brotherTrust')
                .map(e => (e as any).delta as number);
            expect(deltas.some(d => d > 0)).toBe(true);
        }
    });
});

describe('the dial is his board vote', () => {
    it('warming him up moves the cap table, because he is a Snake', () => {
        // Not flavour. brotherTrust IS loyalty, and a Snake stores the
        // inverse - so a scene that warms him is a scene that changes how he
        // votes. See core/story/brother.ts.
        const cold = trustForLoyalty('Snake', 20);
        const warm = trustForLoyalty('Snake', 80);
        expect(cold).toBeGreaterThan(warm);
        expect(loyaltyOf({ trait: 'Snake', trust: warm } as any)).toBe(80);
    });
});
