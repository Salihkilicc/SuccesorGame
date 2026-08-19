// src/features/love/logic/heirs.test.ts
//
// ============================================================================
//  THE CHILDREN HAVE WORKED OUT WHAT THE COMPANY IS
// ============================================================================
//
//  A succession system where the heir is a field on a store is a spreadsheet.
//  What makes it a story is that the OTHER ONES KNOW.
//
//  WHICH SCENE fires comes entirely from the family: how old they are, whether
//  they are alone, and whether they were the one chosen. WHO sends it is drawn
//  at random among everybody with something to say - see the note further
//  down, and the version that did not.
// ============================================================================

import { heirTurnFor, pressure, HEIR_VOICE_AGE, type Heir } from './heirs';
import { HEIR_CONVERSATIONS, heirAlone, heirPassedOver, heirChosen } from '../../../data/story/heirs';
import { CONVERSATIONS } from '../../../data/story';
import { CAST } from '../../../data/story/cast';

const child = (over: Partial<Heir> & { id: string }): Heir => ({
    name: 'A Child', age: 18, ambition: 70, loyalty: 50, ...over,
});

describe('who is old enough to have a view', () => {
    it('nobody under sixteen', () => {
        // A nine year old lobbying for the chairmanship is a joke the game
        // would only be able to tell once.
        expect(heirTurnFor([child({ id: 'a', age: HEIR_VOICE_AGE - 1, ambition: 100 })], null, () => 0))
            .toBeUndefined();
    });

    it('and at sixteen they do', () => {
        expect(heirTurnFor([child({ id: 'a', age: HEIR_VOICE_AGE, ambition: 100 })], null, () => 0))
            .toBeDefined();
    });

    it('while a quiet one says nothing at all', () => {
        // Most quarters are quiet and have to be. A family that files a
        // grievance every three months is not a family.
        expect(heirTurnFor([child({ id: 'a', ambition: 10 })], null, () => 0)).toBeUndefined();
    });
});

describe('which of the three things they say', () => {
    it('an only child sells themselves, because there is nobody to run down', () => {
        const turn = heirTurnFor([child({ id: 'a', ambition: 90 })], null, () => 0);
        expect(turn?.scene).toBe('alone');
    });

    it('and somebody passed over takes it out on whoever was not', () => {
        // b is the heir with loyalty 50, so its pressure falls under the
        // threshold and only a can speak.
        const turn = heirTurnFor([
            child({ id: 'a', ambition: 60 }),
            child({ id: 'b', ambition: 60 }),
        ], 'b', () => 0);
        expect(turn?.speaker.id).toBe('a');
        expect(turn?.scene).toBe('passedOver');
    });

    it('while the chosen one defends a position nobody attacked', () => {
        // Only when they are ambitious AND unsure. A loyal heir has nothing
        // to prove and never sends it - see the test below.
        const turn = heirTurnFor([
            child({ id: 'a', ambition: 5 }),
            child({ id: 'b', ambition: 100, loyalty: 0 }),
        ], 'b', () => 0);
        expect(turn?.speaker.id).toBe('b');
        expect(turn?.scene).toBe('chosen');
    });

    it('and a loyal heir stays quiet', () => {
        expect(pressure(child({ id: 'b', ambition: 80, loyalty: 80 }), true, true))
            .toBeLessThan(pressure(child({ id: 'b', ambition: 80, loyalty: 0 }), true, true));
    });
});

describe('the loudest person in a succession', () => {
    it('is rarely the one who won', () => {
        // Being passed over is worth thirty on top of ambition, so a modest
        // sibling outranks a hungrier heir. That is the whole shape of it.
        const passedOver = pressure(child({ id: 'a', ambition: 50 }), false, true);
        const chosen = pressure(child({ id: 'b', ambition: 70, loyalty: 40 }), true, true);
        expect(passedOver).toBeGreaterThan(chosen);
    });

    it('and only one of them writes at a time', () => {
        // Three teenagers arriving in the same tick is a group chat, and a
        // group chat is not a scene.
        const turn = heirTurnFor([
            child({ id: 'a', ambition: 90 }),
            child({ id: 'b', ambition: 95 }),
            child({ id: 'c', ambition: 99 }),
        ], 'a', () => 0);
        expect(turn).toBeDefined();
        expect(['a', 'b', 'c']).toContain(turn!.speaker.id);
    });
});

// ============================================================================
//  AND IT IS NOT ALWAYS THE SAME MOUTH
// ============================================================================
//  The first version let the loudest child speak every time, and `pressure` is
//  stable - so after a year it was the same child every quarter. That is one
//  person's grievance on a timer rather than a family.
//
//  The speaker is drawn at random among everybody with something to say, and
//  WEIGHTED by how much: uniform would make an ambitious passed-over sibling
//  exactly as likely as a contented heir, which throws away the only
//  characterisation `pressure` encodes.
// ============================================================================
describe('who actually writes', () => {
    const house = [
        child({ id: 'passed', ambition: 70 }),
        child({ id: 'heir', ambition: 95, loyalty: 10 }),
    ];

    it('can be the heir OR the one nobody chose', () => {
        const speakers = new Set<string>();
        for (let i = 0; i < 200; i++) {
            const t = heirTurnFor(house, 'heir', () => i / 200);
            if (t) speakers.add(t.speaker.id);
        }
        expect(speakers).toContain('passed');
        expect(speakers).toContain('heir');
    });

    it('and the one with more to say is heard from more', () => {
        // The shape survives the randomness, which is the whole reason it is
        // weighted rather than a coin.
        let passed = 0, heir = 0;
        for (let i = 0; i < 1000; i++) {
            const t = heirTurnFor(house, 'heir', () => i / 1000);
            if (t?.speaker.id === 'passed') passed++;
            if (t?.speaker.id === 'heir') heir++;
        }
        // `passed` carries +30 for being passed over; `heir` loses its
        // loyalty. Both speak, and the angrier one speaks more often.
        expect(passed).toBeGreaterThan(heir);
        expect(heir).toBeGreaterThan(0);
    });

    it('while a house with nothing to say stays silent however the die falls', () => {
        const quiet = [child({ id: 'a', ambition: 5 }), child({ id: 'b', ambition: 5 })];
        for (let i = 0; i < 50; i++) {
            expect(heirTurnFor(quiet, 'a', () => i / 50)).toBeUndefined();
        }
    });
});

// ============================================================================
//  AND NOBODY IS NAMED IN ANY OF IT
// ============================================================================
//  A Conversation is STATIC DATA and children are named by the player, so a
//  line saying "Elena has never sold anything" would need a templating
//  language inside a data file - which the whole story system exists to keep
//  out of one.
//
//  The constraint turned out to be the writing advice. "The one you put in the
//  annual report" is how people talk about a sibling they are furious with,
//  and it works whether there are two children or five.
// ============================================================================
describe('the scenes', () => {
    const lines = (c: typeof heirAlone) => [
        ...c.nodes.map(n => n.text),
        ...c.nodes.flatMap(n => (n.choices ?? []).map(ch => ch.text)),
    ];

    it('are ordinary conversations, so the runner plays them', () => {
        // Which buys everything: the player answers, the scene ends, the
        // transcript files itself, the audit validates the graph and the
        // translator gets keys.
        const ids = new Set(CONVERSATIONS.map(c => c.id));
        for (const c of Object.values(HEIR_CONVERSATIONS)) {
            expect(ids.has(c.id)).toBe(true);
            expect(c.channel).toBe('message');
        }
    });

    it('and their sender is a stand-in, because a child has no cast entry', () => {
        // The poster puts the real name on the thread. This is what the audit
        // and the graph validate against.
        expect(CAST.heir).toBeDefined();
        expect(CAST.heir.channels).toBe('message');
        for (const c of Object.values(HEIR_CONVERSATIONS)) expect(c.from).toBe('heir');
    });

    it('and every one of them ENDS', () => {
        // The second half of "let them write and we answer and it finishes"
        // is the harder one to hold to. Every scene has at least one terminal
        // choice - no `next` - so it cannot run on.
        for (const c of Object.values(HEIR_CONVERSATIONS)) {
            const terminal = c.nodes.flatMap(n => n.choices ?? []).filter(ch => !ch.next);
            expect(terminal.length).toBeGreaterThan(0);
        }
    });

    it('and none of them moves a number', () => {
        // Deliberate for now: a child lobbying you should be a thing you feel
        // rather than a thing you optimise. The moment it pays out, the
        // player answers to farm it.
        for (const c of Object.values(HEIR_CONVERSATIONS)) {
            for (const ch of c.nodes.flatMap(n => n.choices ?? [])) {
                expect(ch.effects ?? []).toEqual([]);
            }
        }
    });

    it('and the angry one has the digs in it', () => {
        const text = lines(heirPassedOver).join(' ');
        expect(text).toMatch(/annual report/i);
        expect(text).toMatch(/every summer since/i);
    });

    it('while the only child runs themselves up instead', () => {
        expect(lines(heirAlone).join(' ')).toMatch(/I read it|not fishing/i);
    });

    it('and the chosen one is not reassured by being reassured', () => {
        // Which is the truth about that kind of anxiety and the reason the
        // scene is worth having.
        expect(lines(heirChosen).join(' ')).toMatch(/back here asking again/i);
    });

    it('and no dash got into any of it', () => {
        const DASH = /[—–]|(?:^|\s)-(?:\s|$)/;
        for (const c of Object.values(HEIR_CONVERSATIONS)) {
            expect(lines(c).filter(l => DASH.test(l))).toEqual([]);
        }
    });
});
