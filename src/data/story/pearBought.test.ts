// src/data/story/pearBought.test.ts
//
// ============================================================================
//  THE LAST LETTER, AND THE ONE FACT IT MUST NOT GET WRONG
// ============================================================================
//
//  Most of what is checked here is wiring, and one thing is not: this letter
//  concedes a company, and it is gated on a flag raised one line away from an
//  almost identical one. `movedOnPear` is a bid he noticed. `ownsPear` is the
//  transfer completing. Gated on the wrong one, Vogel writes to hand over a
//  company he still owns, on a run where the player made an offer and was
//  refused.
//
//  There is a second gate now, and a second letter behind it: `succeeded`
//  splits the founder's version from the one an heir gets. See the note in
//  pearBought.ts and the measurement in pearBoughtHeir.test.ts.
//
//  Nothing else in the codebase would catch that. The types are both `Flag`,
//  the audit checks the flag EXISTS rather than which one this wanted, and the
//  scene is unreachable in a normal play session until somebody has forty
//  quarters and three trillion dollars.
// ============================================================================

/// <reference types="node" />
//  Reads the finance store as text, to check the flag has a raiser. See the
//  note in navigation/routes.test.ts for why the Node reference is here.
import * as fs from 'fs';
import * as path from 'path';

import { pearBought } from './pearBought';
import { CONVERSATIONS, STORY_BEATS } from './index';
import { ENDINGS } from './endings';
import { CAST } from './cast';

const FINANCE_STORE = path.join(
    __dirname, '..', '..', 'features', 'finance', 'stores', 'useCorporateFinanceStore.ts',
);

const lines = () => [
    pearBought.subject ?? '',
    ...pearBought.nodes.map(n => n.text),
    ...pearBought.nodes.flatMap(n => (n.choices ?? []).map(c => c.text)),
];

describe('when it arrives', () => {
    it('is the quarter the acquisition CLOSES, not the quarter it is attempted', () => {
        // The whole point of the file. See the header.
        expect(pearBought.when).toContainEqual({ kind: 'flag', flag: 'ownsPear' });
        expect(JSON.stringify(pearBought.when)).not.toContain('movedOnPear');
    });

    it('and it is the FOUNDER who reads it, because he wrote it to the founder', () => {
        // ------------------------------------------------------------------
        //  THE SECOND FACT IT MUST NOT GET WRONG
        // ------------------------------------------------------------------
        //  Reported: the letter talks as though a particular generation
        //  bought the company. It does, and it has to: 1997, nineteen years,
        //  your father, a refusal the writer kept himself. None of that
        //  survives a succession, and by the fourth Hale the Pear seat is
        //  held by somebody four names down the roster.
        //
        //  pearBoughtHeir carries the same beat for them. Which of the two
        //  arrives is measured in pearBoughtHeir.test.ts, through the gate
        //  the runner actually calls.
        // ------------------------------------------------------------------
        expect(pearBought.when).toContainEqual({ kind: 'noFlag', flag: 'succeeded' });
    });

    it('and something actually raises that flag', () => {
        // A gate on a flag nobody writes is a scene that never fires, and it
        // would look completely correct in every file that mentions it.
        const store = fs.readFileSync(FINANCE_STORE, 'utf8')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/^\s*\/\/.*$/gm, '');
        expect(store).toMatch(/raise\('ownsPear'\)/);
        // Under the branch that only runs for Pear itself.
        expect(store).toMatch(/tech_pear/);
    });

    it('and it is queued as a beat rather than waiting to be scheduled', () => {
        // Nothing else can schedule it: every other scene that could have is
        // twenty years and one acquisition away from this moment.
        const beat = STORY_BEATS.find(b => b.conversation === pearBought.id);
        expect(beat).toBeDefined();
        // Urgent. Third in a queue behind two other letters is not where the
        // last thing Vogel writes should sit, whether or not it ends the run.
        expect(beat?.urgent).toBe(true);
        // Not weather. It happens because the player did something enormous.
        expect(beat?.chance).toBeUndefined();
    });

    it('and the runner can play it', () => {
        expect(CONVERSATIONS.map(c => c.id)).toContain(pearBought.id);
    });
});

describe('it is mail', () => {
    it('because he texted once, ever, and said he would not do it again', () => {
        // pearMidnight ends with "I will not use this number again". Spending
        // that on a bigger occasion would spend the most expensive thing the
        // character owns on the scene that needs it least.
        expect(pearBought.channel).toBe('mail');
        expect(pearBought.channelBreak).toBeUndefined();
        expect(CAST.pear.channels).toBe('mail');
    });

    it('and it has a subject with his reference number on it', () => {
        // He opened on this channel with a reference number and he closes on
        // it with the same one. One filing system, and it does not care who
        // owns the building.
        expect(pearBought.subject).toMatch(/7724-B/);
    });
});

// ============================================================================
//  AND THE RUN GOES ON
// ============================================================================
//  These three used to assert the opposite: every leaf raised `boughtPear`
//  and the game stopped. Reported as simply wrong, and it was. Buying the man
//  who tried to buy your father is what the whole spine of this game has been
//  asking about, and stopping there takes the company away from a player who
//  has just won it. It also read as a punishment for succeeding: the other
//  nine endings are losing the company, dying, or choosing to stop.
//
//  They are rewritten rather than removed, because "no ending here" is the
//  kind of thing a later edit puts back while tidying.
// ============================================================================
describe('and however the player answers', () => {
    it('it does NOT end the game', () => {
        for (const choice of pearBought.nodes.flatMap(n => n.choices ?? [])) {
            const ends = (choice.effects ?? []).filter((e: any) => e.kind === 'ending');
            expect({ text: choice.text, ends }).toEqual({ text: choice.text, ends: [] });
        }
    });

    it('and every leaf still marks the day', () => {
        // A branch that runs out in silence on the largest purchase in the
        // game reads as a bug. The headline does in one line what the ending
        // used to do, without closing the account.
        const terminal = pearBought.nodes
            .flatMap(n => (n.choices ?? []).map(c => ({ node: n.id, choice: c })))
            .filter(x => !x.choice.next);
        expect(terminal.length).toBeGreaterThan(0);
        for (const { node, choice } of terminal) {
            const news = (choice.effects ?? []).filter((e: any) => e.kind === 'news');
            expect({ node, news: news.length }).toEqual({ node, news: 1 });
        }
    });

    it('and the shelved ending is still written, in case it is ever wanted', () => {
        // ------------------------------------------------------------------
        //  NOT DELETED, JUST NO LONGER REACHED FROM HERE
        // ------------------------------------------------------------------
        //  `boughtPear` is a finished piece of writing. Nothing raises it any
        //  more; the reward for the endgame is quieter and already existed.
        //  `ownsPear` is what silences the letter Vogel's successor writes to
        //  every heir, for the rest of the dynasty.
        // ------------------------------------------------------------------
        expect(ENDINGS.boughtPear).toBeDefined();
        expect(JSON.stringify(pearBought)).not.toContain('boughtPear');
    });

    it('and nothing else in it moves a number', () => {
        // Still deliberate, for a different reason. The player has just spent
        // a fortune and the balance sheet has already said so; a dial nudge
        // on top would be the scene paying twice for one event.
        for (const choice of pearBought.nodes.flatMap(n => n.choices ?? [])) {
            for (const effect of choice.effects ?? []) {
                expect(effect.kind).toBe('news');
            }
        }
    });
});

// ============================================================================
//  AND HE DOES NOT BEG
// ============================================================================
//  The brief, and the hardest part of it. The obvious version has him broken:
//  pleading, or bitter, or making a speech about respect. All three are worse
//  in the same way - they let the player win an ARGUMENT, and an argument is
//  something you can lose.
//
//  He concedes nothing. He says out loud that you overpaid, which is true. He
//  is not humbled by the letter, he is simply writing it, and having to write
//  it is the whole of it. The FACT does the work.
//
//  This is a writing rule enforced as a test, which is unusual and is the
//  point: it is the thing most likely to be softened by somebody editing the
//  scene later without the brief in front of them.
// ============================================================================
describe('the man himself', () => {
    const text = lines().join(' ').toLowerCase();

    it('does not plead', () => {
        for (const word of ['please', 'i beg', 'sorry', 'forgive']) {
            expect(text).not.toContain(word);
        }
    });

    it('nor congratulate, nor concede, nor make a speech about respect', () => {
        for (const word of [
            'congratulations', 'well played', 'you won', 'you win',
            'i respect', 'you deserve', 'better man',
        ]) {
            expect(text).not.toContain(word);
        }
    });

    it('and says out loud that the player overpaid', () => {
        // The line that carries the whole characterisation: he is unbowed,
        // and he is right.
        expect(text).toContain('paid too much');
    });

    it('while the one crack in it is that he was up in the night again', () => {
        // The second time in this game. The first was pearMidnight at 00:41,
        // the one time he ever used the player's number. Neither scene
        // mentions the other, and a player who saw only this one loses
        // nothing.
        expect(text).toContain('last night');
    });

    it('and nobody says the word Pear in it', () => {
        // He would not. It is his company and he has never once needed to
        // name it in a letter to this family.
        expect(text).not.toContain('pear');
    });
});
