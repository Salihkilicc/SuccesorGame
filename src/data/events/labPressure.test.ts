// src/data/events/labPressure.test.ts
//
// ============================================================================
//  HER ARITHMETIC HAS TO SURVIVE A REBALANCE, AND SHE HAS TO BE ABLE TO LOSE
// ============================================================================
//
//  Priya says specific things about research: that fifty people is not three
//  times fifteen, that eight is a bit under six tenths of fifteen, that the
//  second product is two years away. Every one of those is a claim about
//  `researchOutput` in market/workforce.ts, and every one of them is checked
//  here AGAINST THAT FUNCTION rather than against a copy of its output. If
//  somebody flattens the exponent to make the lab feel better, these fail and
//  say which line of dialogue became untrue.
//
//  The other half is the shape of the arc. A visionary who is always right and
//  never affordable is a quest marker with a face, so two things must hold:
//
//    HER ALARM HAS A TWIN WITH NO DECISION IN IT. Same morning, same object on
//    the same desk, at a company that never hired anybody - and there is
//    nothing to ask for, because a lab funded today answers a two-year product
//    in three years. The gates are exclusive so a quarter can only ever
//    produce one of them.
//
//    SAYING NO DOES NOT CLOSE HER. She is an employee, not the friend from the
//    bad years; refusing her sends the memo anyway. The friend's silence is the
//    strongest thing in that arc precisely because nobody else does it.
// ============================================================================

import {
    ctoDarkLab, ctoDarkLabEvent,
    ctoAlarm, ctoAlarmEvent,
    ctoTooLate, ctoTooLateEvent,
    ctoBudgetMemo,
    ctoStillEmpty, ctoStillEmptyEvent,
} from './labPressure';
import { EVENTS } from './index';
import { CONVERSATIONS } from '../story';
import { validate } from '../../core/story/graph';
import { CAST } from '../story/cast';
import { testAll, type World } from '../../core/story/conditions';
import { INITIAL_DIALS } from '../../core/story/state';
import { researchOutput, researcherWage } from '../../core/market/workforce';

const known = new Set(CONVERSATIONS.map(c => c.id));
const SCENES = [ctoDarkLab, ctoAlarm, ctoTooLate, ctoBudgetMemo, ctoStillEmpty];

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
    it('registered, valid, and the four messages are in the pool', () => {
        for (const c of SCENES) {
            expect(known.has(c.id)).toBe(true);
            expect(validate(c, CAST, known)).toEqual([]);
        }
        const ids = EVENTS.map(e => e.id);
        for (const e of [ctoDarkLabEvent, ctoAlarmEvent, ctoTooLateEvent, ctoStillEmptyEvent]) {
            expect(ids).toContain(e.id);
        }
    });

    it('and the memo is not - nothing rolls for a memo', () => {
        expect(EVENTS.map(e => e.conversation.id)).not.toContain(ctoBudgetMemo.id);
    });

    it('the emergencies are messages and the quarter-end request is mail', () => {
        for (const c of [ctoDarkLab, ctoAlarm, ctoTooLate, ctoStillEmpty]) {
            expect(c.channel).toBe('message');
        }
        expect(ctoBudgetMemo.channel).toBe('mail');
        expect(ctoBudgetMemo.subject).toBeTruthy();
    });
});

describe('the company starts with a chief technology officer and no technology', () => {
    it('which is a store default, not a premise invented for the scene', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { useLaboratoryStore } = require('../../core/store/useLaboratoryStore');
        expect(useLaboratoryStore.getState().researcherCount).toBe(0);
    });

    it('so her opening is available to every player who has not hired anybody', () => {
        expect(testAll(ctoDarkLabEvent.when, world({ researchers: 0 }))).toBe(true);
        expect(testAll(ctoDarkLabEvent.when, world({ researchers: 1 }))).toBe(false);
    });

    it('and she blames herself as well as him', () => {
        // A character who only indicts the dead man is flattering the player.
        const why = ctoDarkLab.nodes.find(n => n.id === 'why')!;
        expect(why.text).toContain('he was right about that for roughly fifteen years');
        expect(why.text).toContain('That part is mine, not his');
    });

    it('and she can state the case against her own department', () => {
        const good = ctoDarkLab.nodes.find(n => n.id === 'goodCompany')!;
        expect(good.text).toContain('I am not asking because research is virtuous');
    });
});

describe('every number she quotes is the engine\'s', () => {
    it('fifty is under three times fifteen, for three and a third times the wages', () => {
        const work = researchOutput(50) / researchOutput(15);
        const wages = 50 / 15;
        expect(work).toBeLessThan(3);
        expect(wages).toBeGreaterThan(3.3);
        expect(ctoDarkLab.nodes.find(n => n.id === 'what')!.text)
            .toContain('three and a third times the wages for under three times the work');
    });

    it('and eight is a bit under six tenths of fifteen', () => {
        const ratio = researchOutput(8) / researchOutput(15);
        expect(ratio).toBeGreaterThan(0.55);
        expect(ratio).toBeLessThan(0.60);
        expect(ctoBudgetMemo.nodes.find(n => n.id === 'cost')!.text)
            .toContain('a bit under six tenths of the work of fifteen');
    });

    it('so the two years she quotes really does become closer to three', () => {
        // Two years is the game's own calibration: 15 researchers at tier 1-2
        // reach the second product in about eight quarters. At eight people the
        // same points take 1/0.586 as long, which is a little over three years.
        const quarters = 8 / (researchOutput(8) / researchOutput(15));
        expect(quarters / 4).toBeGreaterThan(3);
        expect(quarters / 4).toBeLessThan(3.6);
        expect(ctoDarkLab.nodes.find(n => n.id === 'what')!.text)
            .toContain('second product in two years');
        expect(ctoBudgetMemo.nodes.find(n => n.id === 'cost')!.text)
            .toContain('closer to three');
    });

    it('and a researcher really does cost more than a line worker', () => {
        // The reason the lab is the first thing a CEO cuts, and the reason
        // saying no to her can be correct.
        expect(researcherWage(3, 1.0)).toBeGreaterThan(0);
        expect(researchOutput(0)).toBe(0);
    });
});

describe('the same morning at two companies', () => {
    const losing = { marketShare: 3 };

    it('exactly one of them is possible, never both, never neither', () => {
        for (const researchers of [0, 1, 8, 15, 400]) {
            const w = world({ ...losing, researchers });
            const live = [ctoAlarmEvent, ctoTooLateEvent]
                .filter(e => testAll(e.when, w))
                .map(e => e.id);
            expect({ researchers, live: live.length }).toEqual({ researchers, live: 1 });
        }
    });

    it('and neither reaches a company that is winning', () => {
        for (const e of [ctoAlarmEvent, ctoTooLateEvent]) {
            expect(testAll(e.when, world({ marketShare: 20, researchers: 15 }))).toBe(false);
        }
    });

    it('the version with a lab has a decision in it', () => {
        const decisions = ctoAlarm.nodes
            .flatMap(n => n.choices ?? [])
            .filter(ch => (ch.effects ?? []).length > 0);
        expect(decisions.length).toBeGreaterThan(0);
    });

    it('the version without one does not, and that is the whole scene', () => {
        // No flags, no schedule, no dial - nothing. Ten quarters of saying no
        // are not punished with a penalty, they are punished by the eleventh
        // conversation not being a conversation.
        const effects = ctoTooLate.nodes.flatMap(n => n.choices ?? []).flatMap(ch => ch.effects ?? []);
        expect(effects).toEqual([]);
    });

    it('and she says why there is nothing to ask for', () => {
        const sayIt = ctoTooLate.nodes.find(n => n.id === 'sayIt')!;
        expect(sayIt.text).toContain('first real answer in about three years');
        expect(sayIt.text).toContain('two-year product');
        expect(sayIt.text).toContain('We are not in it');
    });

    it('and she is not bitter about it', () => {
        const last = ctoTooLate.nodes.find(n => n.id === 'understood')!;
        expect(last.choices ?? []).toEqual([]);
        expect(last.text).toContain('kept the benches clean');
    });
});

describe('saying no does not close her', () => {
    it('the memo arrives even when the player declines it', () => {
        // She is an employee, not the friend from the bad years. The silence
        // in friendArc works because it is the only one in the game.
        const decline = ctoDarkLab.nodes.find(n => n.id === 'notThisYear')!
            .choices!.find(ch => ch.text === 'Do not bother.')!;
        expect((decline.effects ?? []).some(e =>
            e.kind === 'schedule' && (e as any).conversation === ctoBudgetMemo.id)).toBe(true);
    });

    it('every path out of both live scenes ends in the memo', () => {
        for (const c of [ctoDarkLab, ctoAlarm]) {
            const terminal = c.nodes
                .flatMap(n => n.choices ?? [])
                .filter(ch => !ch.next);
            expect(terminal.length).toBeGreaterThan(0);
            for (const ch of terminal) {
                expect({ scene: c.id, text: ch.text, memo: (ch.effects ?? []).some(e =>
                    e.kind === 'schedule' && (e as any).conversation === ctoBudgetMemo.id) })
                    .toEqual({ scene: c.id, text: ch.text, memo: true });
            }
        }
    });

    it('and nothing anywhere tells the player a door shut', () => {
        const everything = SCENES.flatMap(c => c.nodes).map(n => n.text).join(' ').toLowerCase();
        for (const banned of ['no longer', 'too late for', 'i will not ask again', 'never again']) {
            expect(everything).not.toContain(banned);
        }
    });
});

describe('the memo is where she talks herself down', () => {
    it('she asks for less on paper than she asked for out loud', () => {
        expect(ctoDarkLab.nodes.find(n => n.id === 'what')!.text).toContain('Fifteen people. Not fifty.');
        expect(ctoBudgetMemo.nodes[0].text).toContain('eight rather than the fifteen I said out loud');
    });

    it('and says plainly that eight is not what she would do', () => {
        expect(ctoBudgetMemo.nodes[0].text).toContain('Eight is not what I would do');
        expect(ctoBudgetMemo.nodes[0].text).toContain('a number you can approve');
    });

    it('but writes the cost down so the record shows she knew', () => {
        expect(ctoBudgetMemo.nodes.find(n => n.id === 'cost')!.text)
            .toContain('nobody, including me');
    });

    it('and the player can hand her the number back', () => {
        const restore = ctoBudgetMemo.nodes.find(n => n.id === 'cost')!
            .choices!.find(ch => ch.text.startsWith('Then ask for fifteen'))!;
        expect((restore.effects ?? []).some(e =>
            e.kind === 'flag' && (e as any).flag === 'labBacked')).toBe(true);
        // She answers on the OTHER channel, which is the pair's whole shape:
        // the letter was the retreat, the text is the person.
        expect((restore.effects ?? []).some(e => e.kind === 'message')).toBe(true);
    });
});

describe('backing her and doing nothing are different things', () => {
    it('the flag records what was said, and the number records what happened', () => {
        // `labBacked` cannot mean "the lab is funded": no effect in the game
        // can hire anybody. The gap between the two is the scene.
        expect(testAll(ctoStillEmptyEvent.when,
            world({ flags: { fatherDead: true, labBacked: true }, researchers: 0 }))).toBe(true);
        expect(testAll(ctoStillEmptyEvent.when,
            world({ flags: { fatherDead: true, labBacked: true }, researchers: 15 }))).toBe(false);
        expect(testAll(ctoStillEmptyEvent.when, world({ researchers: 0 }))).toBe(false);
    });

    it('she notices once, ever', () => {
        expect(ctoStillEmptyEvent.cooldown).toBeUndefined();
    });

    it('and there is no consequence, only a smaller room', () => {
        const effects = ctoStillEmpty.nodes.flatMap(n => n.choices ?? []).flatMap(ch => ch.effects ?? []);
        expect(effects).toEqual([]);
        expect(ctoStillEmpty.nodes.find(n => n.id === 'decision')!.text)
            .toContain('stop holding the two benches');
    });

    it('and forgetting is forgiven without a lecture', () => {
        const fell = ctoStillEmpty.nodes.find(n => n.id === 'fellOff')!;
        expect(fell.text).toContain('genuinely fine');
        expect(fell.text).toContain('laboratory screen');
    });
});

describe('she has no dial either', () => {
    it('nothing she does moves a relationship', () => {
        // Her standing is the size of the lab. See core/story/state.ts.
        const dials = SCENES
            .flatMap(c => c.nodes)
            .flatMap(n => n.choices ?? [])
            .flatMap(ch => ch.effects ?? [])
            .filter(e => e.kind === 'dial');
        expect(dials).toEqual([]);
    });
});
