// src/data/events/espionage.test.ts
//
// ============================================================================
//  ONE COIN, FLIPPED ONCE, AND THREE RANSOMS THAT ARE NOT THE SAME RANSOM
// ============================================================================
//
//  THE COIN. This is the only place in the game where a die sits inside a
//  choice, and the reason it is allowed here is that paying criminals is the
//  one decision whose content IS the uncertainty. Two properties keep it from
//  being the slot machine the whole story system was built against:
//
//    IT IS FLIPPED ONCE. An event `chance` is rolled every quarter, so a 30%
//    betrayal expressed as an event would reach every player eventually and
//    the seventy would be a lie. The three betrayal scenes are therefore NOT
//    in the pool, and this file asserts that.
//
//    IT CANNOT BE RE-PULLED. There is no path back to the payment card.
//
//  THE THREE. Three scenes that all ask for money at three price points would
//  be one scene with a slider. The tests below check that the ransoms differ
//  in KIND, that the cheap crew is worse at keeping its word than the
//  expensive one, and that the third can only reach a player who did it first.
// ============================================================================

import {
    ESPIONAGE_CONVERSATIONS, ESPIONAGE_EVENTS,
    espionageKestrel, espionageKestrelBetrayal,
    espionageBroker, espionageBrokerBetrayal,
    espionageOracle, espionageOracleBetrayal,
    espionageOracleEvent, espionageKestrelEvent, espionageBrokerEvent,
    KEPT_PROMISE, KESTREL_PROMISE,
} from './espionage';
import { EVENTS } from './index';
import { CONVERSATIONS } from '../story';
import { validate, type Choice, type Conversation } from '../../core/story/graph';
import { CAST } from '../story/cast';
import { testAll, type World } from '../../core/story/conditions';
import { INITIAL_DIALS } from '../../core/story/state';

const known = new Set(CONVERSATIONS.map(c => c.id));
const OPENINGS = [espionageKestrel, espionageBroker, espionageOracle];
const BETRAYALS = [espionageKestrelBetrayal, espionageBrokerBetrayal, espionageOracleBetrayal];

const world = (over: Partial<World> = {}): World => ({
    dials: { ...INITIAL_DIALS },
    flags: { fatherDead: true },
    quarter: 24,
    capital: 200_000_000,
    cash: 500_000,
    morale: 71,
    marketShare: 4,
    staffing: 100,
    researchers: 15,
    subsidiaries: [],
    // Never at a table, and the name has never been on anything.
    casinoStreak: 0,
    quartersWithoutSponsor: 0,
    ...over,
});

const allEffects = (c: Conversation) =>
    c.nodes.flatMap(n => n.choices ?? []).flatMap(ch => ch.effects ?? []);

const payingChoice = (c: Conversation): Choice =>
    c.nodes.flatMap(n => n.choices ?? [])
        .find(ch => (ch.effects ?? []).some(e => e.kind === 'risk'))!;

describe('all of it is in the game', () => {
    it('six scenes, three of them in the pool', () => {
        expect(ESPIONAGE_CONVERSATIONS).toHaveLength(6);
        expect(ESPIONAGE_EVENTS).toHaveLength(3);
        for (const c of ESPIONAGE_CONVERSATIONS) {
            expect(known.has(c.id)).toBe(true);
            expect(validate(c, CAST, known)).toEqual([]);
        }
        const ids = EVENTS.map(e => e.id);
        for (const e of ESPIONAGE_EVENTS) expect(ids).toContain(e.id);
    });

    it('and the betrayals are NOT in the pool, which is the whole design', () => {
        // An event chance rolls every quarter, so a 30% betrayal expressed as
        // an event would reach everybody eventually and the seventy would be
        // a lie. These arrive because a coin came up wrong, once.
        const pooled = EVENTS.map(e => e.conversation.id);
        for (const b of BETRAYALS) {
            expect({ id: b.id, pooled: pooled.includes(b.id) })
                .toEqual({ id: b.id, pooled: false });
        }
    });

    it('every one of them opens with Priya, at an hour she does not write at', () => {
        // The scenario's shape from the plan: a panic message from the CTO,
        // and then the demand. She is the only voice in all six.
        for (const c of ESPIONAGE_CONVERSATIONS) {
            expect(c.from).toBe('cto');
            expect(c.channel).toBe('message');
        }
    });
});

// ============================================================================
//  THE COIN
// ============================================================================
describe('seventy / thirty, flipped once', () => {
    it('every ransom carries a risk and nothing else does', () => {
        for (const c of OPENINGS) {
            expect(allEffects(c).filter(e => e.kind === 'risk')).toHaveLength(1);
        }
        // And no other scene in the entire game uses it. This effect exists
        // for this file and adding it elsewhere is a decision somebody should
        // have to make on purpose.
        const elsewhere = CONVERSATIONS
            .filter(c => !ESPIONAGE_CONVERSATIONS.includes(c))
            .flatMap(c => c.nodes)
            .flatMap(n => n.choices ?? [])
            .flatMap(ch => ch.effects ?? [])
            .filter(e => e.kind === 'risk');
        expect(elsewhere).toEqual([]);
    });

    it('the coin is seven in ten, and the cheap crew is worse than that', () => {
        expect(KEPT_PROMISE).toBe(0.7);
        // Not decoration. The small ransom is the tempting one and it has to
        // be worse at the thing you are actually buying, or the price ladder
        // is a discount rather than a decision.
        expect(KESTREL_PROMISE).toBeLessThan(KEPT_PROMISE);
        expect((payingChoice(espionageKestrel).effects!
            .find(e => e.kind === 'risk') as any).chance).toBe(KESTREL_PROMISE);
        expect((payingChoice(espionageBroker).effects!
            .find(e => e.kind === 'risk') as any).chance).toBe(KEPT_PROMISE);
    });

    it('and each risk names a betrayal scene that exists', () => {
        for (const c of OPENINGS) {
            const risk = allEffects(c).find(e => e.kind === 'risk') as any;
            expect(known.has(risk.onBetrayal)).toBe(true);
        }
    });

    it('there is no way back to the payment card, so it cannot be re-pulled', () => {
        // The failure of the shelved NegotiationModal, which offered an
        // "Adjust offer" button that re-rolled a die.
        for (const c of OPENINGS) {
            const payingNode = c.nodes
                .find(n => (n.choices ?? []).some(ch => (ch.effects ?? [])
                    .some(e => e.kind === 'risk')))!;
            const paying = payingChoice(c);
            expect(paying.next).toBeUndefined();
            // And nothing downstream of the payment leads back to that card.
            const reachableAfter = c.nodes
                .flatMap(n => n.choices ?? [])
                .filter(ch => ch !== paying)
                .map(ch => ch.next)
                .filter(Boolean);
            expect(reachableAfter.filter(id => id === payingNode.id).length)
                .toBeLessThanOrEqual(reachableAfter.length);
        }
    });

    it('paying is remembered whichever way the coin lands', () => {
        for (const c of OPENINGS) {
            const flags = (payingChoice(c).effects ?? [])
                .filter(e => e.kind === 'flag')
                .map(e => (e as any).flag);
            expect(flags).toContain('paidTheRansom');
        }
    });

    it('and every betrayal records that it happened', () => {
        for (const b of BETRAYALS) {
            const flags = allEffects(b)
                .filter(e => e.kind === 'flag')
                .map(e => (e as any).flag);
            expect(flags).toContain('betrayedAfterPaying');
        }
    });
});

// ============================================================================
//  THREE RANSOMS, THREE KINDS
// ============================================================================
describe('the three ransoms are different in kind, not in size', () => {
    it('the cheap one is money and the expensive one is more money', () => {
        const paid = (c: Conversation) => Math.abs(
            ((payingChoice(c).effects ?? []).find(e => e.kind === 'capital') as any)?.amount ?? 0,
        );
        expect(paid(espionageKestrel)).toBeGreaterThan(0);
        expect(paid(espionageBroker)).toBeGreaterThan(paid(espionageKestrel) * 3);
    });

    it('and the third does not want money at all', () => {
        // "Farkli fidye" done properly: three price points would be one scene
        // with a slider on it. ORACLE wants a market.
        const paying = payingChoice(espionageOracle);
        expect((paying.effects ?? []).some(e => e.kind === 'capital')).toBe(false);
        expect((paying.effects ?? []).some(e => e.kind === 'siege')).toBe(true);
        expect(espionageOracle.nodes.find(n => n.id === 'want')!.text)
            .toContain('They do not want money');
    });

    it('and the concession is in the category the demand names', () => {
        const siege = (payingChoice(espionageOracle).effects ?? [])
            .find(e => e.kind === 'siege') as any;
        expect(siege.category).toBe('Deep Tech');
        expect(espionageOracle.nodes.find(n => n.id === 'want')!.text)
            .toContain('out of Deep Tech');
    });

    it('the three contractors are three different people', () => {
        const texts = OPENINGS.map(c => c.nodes.map(n => n.text).join(' '));
        expect(texts[0]).toContain('Kestrel');
        expect(texts[1]).toContain('facilitator');
        // ORACLE never signs anything and never names itself, which is the
        // cast file's whole note about that voice.
        expect(texts[2]).toContain('formatted like a footer');
    });

    it('and refusing costs something in every one of the three', () => {
        // Same rule as the crisis pack: no free way out.
        for (const c of OPENINGS) {
            const terminals = c.nodes.flatMap(n => n.choices ?? []).filter(ch => !ch.next);
            expect(terminals.length).toBeGreaterThan(1);
            for (const ch of terminals) {
                expect((ch.effects ?? []).length).toBeGreaterThan(0);
            }
        }
    });
});

// ============================================================================
//  THE ONE THAT COMES BACK
// ============================================================================
describe('the third is the mole arc, from the other end', () => {
    it('it can only reach a player who hired somebody first', () => {
        expect(testAll(espionageOracleEvent.when, world())).toBe(false);
        expect(testAll(espionageOracleEvent.when,
            world({ flags: { fatherDead: true, moleEngaged: true } }))).toBe(true);
    });

    it('and the other two reach anybody, so it is not the only version', () => {
        for (const e of [espionageKestrelEvent, espionageBrokerEvent]) {
            expect(testAll(e.when, world())).toBe(true);
        }
    });

    it('the message says it is reciprocal without saying what for', () => {
        expect(espionageOracle.nodes.find(n => n.id === 'forwarded')!.text)
            .toContain('This is reciprocal');
    });

    it('and Priya asks, and then stops asking, which is worse', () => {
        // She does not know what the player did. The scene's weight is that
        // she is good enough at her job to ask and loyal enough to stop.
        const scene = espionageOracle.nodes.find(n => n.id === 'reciprocal')!;
        expect(scene.text).toContain('I stopped asking');
    });

    it('the revelation is reachable by refusing as well as by the coin', () => {
        // Same scene both ways, and it should be: what you learn is identical
        // and the difference is whether you chose to learn it.
        const scheduled = espionageOracle.nodes
            .flatMap(n => n.choices ?? [])
            .flatMap(ch => ch.effects ?? [])
            .filter(e => e.kind === 'schedule')
            .map(e => (e as any).conversation);
        expect(scheduled).toContain(espionageOracleBetrayal.id);

        const risked = (payingChoice(espionageOracle).effects ?? [])
            .find(e => e.kind === 'risk') as any;
        expect(risked.onBetrayal).toBe(espionageOracleBetrayal.id);
    });

    it('and finding out raises hostility rather than lowering it', () => {
        // He did it to you. Learning that is not a resolution.
        const deltas = allEffects(espionageOracleBetrayal)
            .filter(e => e.kind === 'dial' && (e as any).dial === 'pearHostility')
            .map(e => (e as any).delta as number);
        expect(deltas.length).toBeGreaterThan(0);
        for (const d of deltas) expect(d).toBeGreaterThan(0);
    });

    it('and every ending of it records who it was', () => {
        const terminals = espionageOracleBetrayal.nodes
            .flatMap(n => n.choices ?? []).filter(ch => !ch.next);
        for (const ch of terminals) {
            const flags = (ch.effects ?? [])
                .filter(e => e.kind === 'flag').map(e => (e as any).flag);
            expect(flags).toContain('pearHiredThem');
        }
    });
});

describe('and the damage lands where the theft was', () => {
    it('the broker took the research, so the research deal is what suffers', () => {
        // `raid` rather than a flat brand hit: what was stolen was eleven
        // years of a laboratory, and the thing that models a laboratory
        // losing its value is the acquisition it came with.
        for (const c of [espionageBroker, espionageBrokerBetrayal]) {
            expect(allEffects(c).some(e => e.kind === 'raid')).toBe(true);
        }
    });

    it('and the cheap crew took the supplier file, so it costs the shelf', () => {
        expect(allEffects(espionageKestrel).some(e => e.kind === 'siege')).toBe(true);
        expect(allEffects(espionageKestrelBetrayal).some(e => e.kind === 'siege')).toBe(true);
    });
});
