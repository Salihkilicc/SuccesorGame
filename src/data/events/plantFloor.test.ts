// src/data/events/plantFloor.test.ts
//
// ============================================================================
//  SHE HAS TO BE RIGHT, AND SHE HAS TO BE RIGHT AT EVERY SCALE
// ============================================================================
//
//  Three things are being protected, and they fail in three different ways.
//
//  HER NUMBERS ARE THE ENGINE'S NUMBERS. The walkout fires just under morale
//  50, which is not a threshold chosen for the scene - it is where
//  `attritionRate` doubles. If somebody rebalances that cliff and this gate
//  stays where it is, she starts saying "we lose twice as many people" in a
//  quarter where that is false. The tests below read the engine rather than a
//  copy of it, so the two cannot drift apart quietly - and that is not
//  hypothetical: the first version of this gate was written as a flat 50 and
//  these tests found that `attritionRate` compares STRICTLY, so 50.0 itself
//  was admitted and her line was false in exactly one quarter.
//
//  SHE CANNOT COUNT. Scene text is static and this game is played from a
//  22-person shed to a 41,700-person campus. Any absolute headcount she quotes
//  is a lie in almost every campaign, so the rule is that she speaks in ratios,
//  and the rule is enforced rather than remembered.
//
//  THE QUARTERLY NOTE ONLY CLAIMS WHAT IT KNOWS. No effect in the game can
//  hire anybody, so "I will raise the target today" is a sentence the player
//  said and not an event that happened. The two versions of the note differ on
//  whether she was ANSWERED - which the conversation genuinely knows - and on
//  nothing else. The test asserts the bodies are identical.
// ============================================================================

import {
    cooLineShort, cooLineShortEvent,
    cooWalkout, cooWalkoutEvent,
    cooOpsNote, cooOpsNoteCc,
    WALKOUT_MORALE,
} from './plantFloor';
import { EVENTS } from './index';
import { CONVERSATIONS } from '../story';
import { validate } from '../../core/story/graph';
import { CAST } from '../story/cast';
import { testAll, type World } from '../../core/story/conditions';
import { INITIAL_DIALS } from '../../core/story/state';
import { attritionRate, MORALE_ANCHOR } from '../../core/market/workforce';
import { getTier } from '../../core/market/capacity';

const known = new Set(CONVERSATIONS.map(c => c.id));
const SCENES = [cooLineShort, cooWalkout, cooOpsNote, cooOpsNoteCc];

const world = (over: Partial<World> = {}): World => ({
    dials: { ...INITIAL_DIALS },
    flags: { fatherDead: true },
    quarter: 20,
    capital: 60_000_000,
    cash: 400_000,
    morale: 71,
    marketShare: 4,
    staffing: 100,
    researchers: 0,
    // Owns nothing. These tests are not about the portfolio.
    subsidiaries: [],
    // Never at a table, and the name has never been on anything.
    casinoStreak: 0,
    quartersWithoutSponsor: 0,
    ...over,
});

describe('all of it is in the game', () => {
    it('registered, valid, and the two messages are in the pool', () => {
        for (const c of SCENES) {
            expect(known.has(c.id)).toBe(true);
            expect(validate(c, CAST, known)).toEqual([]);
        }
        const ids = EVENTS.map(e => e.id);
        for (const e of [cooLineShortEvent, cooWalkoutEvent]) expect(ids).toContain(e.id);
    });

    it('and the notes are NOT in the pool - nothing rolls for a memo', () => {
        // They arrive because the message that came first scheduled them.
        // An event that could produce the quarterly note on its own would let
        // a player receive the record of a conversation they never had.
        const ids = EVENTS.map(e => e.conversation.id);
        expect(ids).not.toContain(cooOpsNote.id);
        expect(ids).not.toContain(cooOpsNoteCc.id);
    });
});

describe('the channel split is the character', () => {
    it('the emergency is a message and the record is mail', () => {
        // The cast file's whole reason for giving her 'both': "they file the
        // report and then they text you what the report could not say".
        expect(cooLineShort.channel).toBe('message');
        expect(cooWalkout.channel).toBe('message');
        expect(cooOpsNote.channel).toBe('mail');
        expect(cooOpsNoteCc.channel).toBe('mail');
    });

    it('and only the mail has a subject line', () => {
        expect(cooLineShort.subject).toBeUndefined();
        expect(cooOpsNote.subject).toBeTruthy();
        expect(cooOpsNoteCc.subject).toBe(cooOpsNote.subject);
    });
});

describe('she never quotes a number she could not know', () => {
    it('no digit appears anywhere she speaks', () => {
        // The plant is 22 people at tier 1 and 41,700 at tier 20, so any
        // absolute count is wrong in nearly every campaign. Enforced as a
        // character rule rather than trusted to whoever writes her next.
        for (const c of SCENES) {
            for (const n of c.nodes) {
                expect({ node: `${c.id}/${n.id}`, digits: /\d/.test(n.text) })
                    .toEqual({ node: `${c.id}/${n.id}`, digits: false });
            }
        }
    });

    it('and the crew requirement really does vary by two orders of magnitude', () => {
        // The reason the rule above exists, read off the facility table rather
        // than asserted, so a rebalance that flattened it would show up here.
        expect(getTier(1).crew).toBeLessThan(30);
        expect(getTier(20).crew).toBeGreaterThan(30_000);
    });
});

describe('the line being short is the mistake nothing else in the game mentions', () => {
    it('she speaks below the threshold and not above it', () => {
        expect(testAll(cooLineShortEvent.when, world({ staffing: 67 }))).toBe(true);
        expect(testAll(cooLineShortEvent.when, world({ staffing: 85 }))).toBe(true);
        expect(testAll(cooLineShortEvent.when, world({ staffing: 86 }))).toBe(false);
        expect(testAll(cooLineShortEvent.when, world({ staffing: 100 }))).toBe(false);
    });

    it('and the threshold catches what a tier upgrade actually does', () => {
        // Not a number picked by feel. Every tier needs about 1.5x the crew of
        // the one below, so finishing a build lands you at roughly two thirds
        // staffed - which has to be inside the gate or she never speaks in the
        // one situation she exists for.
        for (let level = 1; level < 20; level++) {
            const after = (getTier(level).crew / getTier(level + 1).crew) * 100;
            expect({ level, caught: testAll(cooLineShortEvent.when, world({ staffing: after })) })
                .toEqual({ level, caught: true });
        }
    });

    it('she names the control the player has to move, because nothing moves it for them', () => {
        // useStatsStore.setTargetHeadcount is the only writer of that field
        // and nothing calls it when the facility tier changes. If this line
        // ever stops being in the scene, the loss goes back to being invisible.
        const text = cooLineShort.nodes.map(n => n.text).join(' ');
        expect(text).toContain('headcount target on the staff screen');
        expect(text).toContain('nothing does it automatically');
    });

    it('and she talks the player out of the cheap fix rather than forbidding it', () => {
        const overtime = cooLineShort.nodes.find(n => n.id === 'overtime')!;
        expect(overtime.text).toContain('It is cheaper this quarter');
        expect(overtime.text).toContain('morale is the interest');
        // Running it anyway is an available answer. It is a real strategy and
        // she says so; a scene that only permits the correct choice is not a
        // decision.
        expect(overtime.choices!.some(c => c.text.startsWith('Run it'))).toBe(true);
    });
});

describe('the walkout sits exactly on the engine\'s own cliff', () => {
    it('and the cliff is real: attrition doubles below fifty', () => {
        // Read from workforce.ts rather than restated. This is the assertion
        // that stops the scene and the simulation drifting apart.
        expect(attritionRate(49.9, 1.0)).toBeCloseTo(attritionRate(50, 1.0) * 2, 6);
    });

    it('and the gate is the largest tenth below it, not the cliff itself', () => {
        // THE OFF-BY-ONE THIS TEST FOUND. `attritionRate` tests strictly
        // (`morale < 50`) and `moraleAtMost` is inclusive, so a gate written as
        // 50 fires at 50.0 too - the one value where the doubling has NOT
        // switched on and her line about losing twice as many people is false.
        // Morale is rounded to a tenth, so 49.9 is the true boundary.
        expect(WALKOUT_MORALE).toBe(49.9);
        expect(attritionRate(WALKOUT_MORALE, 1.0))
            .toBeGreaterThan(attritionRate(WALKOUT_MORALE + 0.1, 1.0));
    });

    it('so her line about losing twice as many people is true whenever she says it', () => {
        const text = cooWalkout.nodes.map(n => n.text).join(' ');
        expect(text).toContain('twice the rate');
        // Every morale value the gate admits must be one where the engine has
        // actually doubled the rate. Swept rather than sampled, because the
        // bug this replaces was a single admitted value.
        const doubled = attritionRate(10, 1.0);
        for (let m = 0; m <= 60; m = Math.round((m + 0.1) * 10) / 10) {
            if (!testAll(cooWalkoutEvent.when, world({ morale: m }))) continue;
            expect({ morale: m, rate: attritionRate(m, 1.0) })
                .toEqual({ morale: m, rate: doubled });
        }
        expect(testAll(cooWalkoutEvent.when, world({ morale: 50 }))).toBe(false);
    });

    it('and it cannot happen to somebody paying the market rate', () => {
        // MORALE_ANCHOR is where market pay parks the floor. If the gate ever
        // rose above it this would fire for everybody, which is precisely the
        // mistake the father's morale scene made with 70.
        expect(WALKOUT_MORALE).toBeLessThan(MORALE_ANCHOR);
        expect(testAll(cooWalkoutEvent.when, world({ morale: MORALE_ANCHOR }))).toBe(false);
    });

    it('their demand is market pay and nothing above it', () => {
        // There is no negotiation in the scene because there is nothing to
        // negotiate: they have asked for the number the game already calls
        // normal. Any counter-offer branch would be a lie about the fiction.
        expect(cooWalkout.nodes[0].text).toContain('not asking for more than the people down the road');
        expect(cooWalkout.nodes.find(n => n.id === 'want')!.text).toContain('Not above it');
    });

    it('and refusing them is answered with a real cost, not a moral', () => {
        const replaced = cooWalkout.nodes.find(n => n.id === 'replaced')!;
        // Every clause is engine behaviour: hiring is a quarter delayed, new
        // staff ramp at half efficiency, and low morale lowers the hiring cap.
        expect(replaced.text).toContain('They can.');
        expect(replaced.text).toContain('worth their wage');
        expect(replaced.text).toContain('whoever nobody else wanted');
    });
});

describe('the two versions of the quarterly note', () => {
    const body = 'Line ran below rated crew for part of the quarter. Output tracked staffing, as it always does. Scrap was in band. Overtime as authorised.';

    it('are the same letter', () => {
        expect(cooOpsNote.nodes[0].text).toContain(body);
        expect(cooOpsNoteCc.nodes[0].text).toContain(body);
    });

    it('and differ only on whether she was answered', () => {
        // NOT on whether the plant recovered. The scene cannot know that - the
        // fix happens on a screen a quarter later and no effect can verify it -
        // so it does not claim it. It claims the one thing that happened inside
        // the conversation.
        expect(cooOpsNoteCc.nodes[0].text).toContain('did not receive a decision');
        expect(cooOpsNote.nodes[0].text).not.toContain('did not receive a decision');
        expect(cooOpsNoteCc.nodes[0].text).toContain('cc: Board of Directors');
        expect(cooOpsNote.nodes[0].text).not.toContain('cc:');
    });

    it('neither of them asserts that anything was fixed', () => {
        const all = [...cooOpsNote.nodes, ...cooOpsNoteCc.nodes].map(n => n.text).join(' ');
        for (const claim of ['now fully staffed', 'back to crew', 'resolved', 'you fixed']) {
            expect(all).not.toContain(claim);
        }
    });

    it('and she is protecting herself rather than attacking him', () => {
        const why = cooOpsNoteCc.nodes.find(n => n.id === 'why')!;
        expect(why.text).toContain('I am not making a point');
        // The way back is in her own letter: answer her and it stops.
        expect(why.text).toContain('Answer me next time');
    });
});

describe('the cc version is only ever earned by not answering', () => {
    const scheduled = (from: typeof cooLineShort) =>
        from.nodes.flatMap(n => n.choices ?? []).map(ch => ({
            ch,
            schedules: (ch.effects ?? [])
                .filter(e => e.kind === 'schedule')
                .map(e => (e as any).conversation as string),
            flags: (ch.effects ?? [])
                .filter(e => e.kind === 'flag')
                .map(e => (e as any).flag as string),
        }));

    it('every choice that schedules it also records that he was overruled', () => {
        for (const c of [cooLineShort, cooWalkout]) {
            for (const { schedules, flags } of scheduled(c)) {
                if (schedules.includes(cooOpsNoteCc.id)) {
                    expect(flags).toContain('cooOverruled');
                }
            }
        }
    });

    it('and no choice that engages with her ever schedules it', () => {
        for (const c of [cooLineShort, cooWalkout]) {
            for (const { schedules, flags } of scheduled(c)) {
                if (schedules.includes(cooOpsNote.id)) {
                    expect(flags).not.toContain('cooOverruled');
                }
            }
        }
    });

    it('and the shrug has a way back, so it cannot be reached by tapping through', () => {
        // Same rule as the Pear ending and the friend's refusal: a lasting
        // consequence arrived at by drifting is one the player will not own.
        const shrug = cooLineShort.nodes.find(n => n.id === 'evenOut')!;
        expect(shrug.choices!.some(ch => ch.next === 'need')).toBe(true);
        const sentHome = cooWalkout.nodes.find(n => n.id === 'sendHome')!;
        expect(sentHome.choices!.some(ch => ch.next === 'want')).toBe(true);
    });

    it('and every scheduled note expires, so it never arrives about a dead quarter', () => {
        for (const c of [cooLineShort, cooWalkout]) {
            for (const { schedules, ch } of scheduled(c)) {
                if (!schedules.length) continue;
                for (const e of ch.effects ?? []) {
                    if (e.kind === 'schedule') expect(e.expiresAfter).toBeGreaterThan(0);
                }
            }
        }
    });
});

describe('she has no dial, and that is the design', () => {
    it('nothing in either message moves a relationship except the public one', () => {
        // Her standing with the player IS employee morale, which the engine
        // owns. A cooTrust dial would let a CEO who underpays the floor stay
        // on good terms with his COO by picking the warm answer.
        const dials = [cooLineShort, cooWalkout, cooOpsNote, cooOpsNoteCc]
            .flatMap(c => c.nodes)
            .flatMap(n => n.choices ?? [])
            .flatMap(ch => ch.effects ?? [])
            .filter(e => e.kind === 'dial')
            .map(e => (e as any).dial as string);
        // publicReputation is allowed: a stoppage that reaches the press is a
        // fact about the world, not about how Dana feels.
        expect(new Set(dials)).toEqual(new Set(['publicReputation']));
    });
});
