// src/core/story/inboxNoise.test.ts
//
// ============================================================================
//  FOUR THINGS THE PHONE WAS DOING WRONG
// ============================================================================
//
//  All four found by playing, and three of them share a shape: a system that
//  was correct in its own terms and was reaching past the edge of them.
//
//    THE CHASE wrote to people the player had never exchanged a word with,
//    every three months, forever. Its own letter was unread mail, and unread
//    mail was enough to qualify somebody - so it re-qualified them by
//    complaining at them.
//
//    THE CHASE also brought the dead back. `sendFromCharacter` CREATES a
//    thread when none exists, so a complaint aimed at somebody whose thread
//    had been deliberately removed rebuilt it and put them at the top of the
//    messages screen with a text box under them.
//
//    THE PREVIEW and the message were in different languages: the list stored
//    the English source and the reader rendered the Turkish.
//
//    AND THE TUTORIAL was switched off behind a player who had just been
//    asked whether they wanted it and said yes.
// ============================================================================

import fs from 'fs';
import path from 'path';

import { whoWasIgnored, NEGLECT_MONTHS, type Neglectable } from './neglect';
import { CHASES_PER_QUARTER } from './runNeglect';
import { DELIVERIES_PER_QUARTER } from './inbox';

const ROOT = path.join(__dirname, '..', '..', '..');
const live = (...p: string[]) =>
    fs.readFileSync(path.join(ROOT, ...p), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

/** Somebody who wrote `ago` months back and has not been answered. */
const wrote = (id: string, ago: number, over: Partial<Neglectable> = {}): Neglectable => ({
    id,
    unread: 1,
    unanswered: true,
    messages: [{ from: 'them', atMonth: 12 - ago }],
    ...over,
} as Neglectable);

describe('the chase stops when there is nothing to chase', () => {
    it('a letter that asks nothing does not make its sender chaseable', () => {
        // ------------------------------------------------------------------
        //  THE LOOP, WRITTEN OUT
        // ------------------------------------------------------------------
        //  an unopened letter qualifies the sender
        //    -> the chase arrives, as another letter
        //      -> the chase is unopened too and carries NO conversation
        //        -> and that qualified them again
        //
        //  Every three months, from anybody whose post went unopened,
        //  including people the player has never had an exchange with.
        // ------------------------------------------------------------------
        const src = live('src', 'core', 'story', 'runNeglect.ts');
        expect(src).toMatch(/const owes = !mail\.isRead && isUnanswered;/);
        expect(src).toMatch(/unread: owes \? 1 : 0/);
        // And the old line, which read the envelope rather than the question.
        expect(src).not.toMatch(/unread: mail\.isRead \? 0 : 1/);
    });

    it('and the rule itself still needs one of the two to hold', () => {
        // Unchanged, and checked so the fix above cannot be undone by
        // loosening this instead.
        expect(whoWasIgnored([wrote('cfo', NEGLECT_MONTHS)], 12)).toEqual(['cfo']);
        expect(whoWasIgnored(
            [wrote('cfo', NEGLECT_MONTHS, { unread: 0, unanswered: false })], 12,
        )).toEqual([]);
    });

    it('and only one person may complain in a quarter', () => {
        // There was no cap at all, so a quarter owing four replies produced
        // four complaints in one morning. Same number and same reasoning as
        // the inbox's own allowance.
        expect(CHASES_PER_QUARTER).toBe(DELIVERIES_PER_QUARTER);
        expect(CHASES_PER_QUARTER).toBe(1);
        const src = live('src', 'core', 'story', 'runNeglect.ts');
        expect(src).toMatch(/\.slice\(0, CHASES_PER_QUARTER\)/);
    });

    it('and the rule can still find several, so the cap is what limits it', () => {
        // If the rule itself only ever returned one, the slice would be
        // decoration and this whole test would prove nothing.
        const many = ['cfo', 'coo', 'cto', 'brother'].map(id => wrote(id, NEGLECT_MONTHS));
        expect(whoWasIgnored(many, 12)).toHaveLength(4);
    });
});

describe('and nobody writes to you after they are dead', () => {
    it('the chase refuses anybody whose thread has been removed', () => {
        // `sendFromCharacter` creates a thread when none exists, so a chase
        // does not fail quietly at somebody who has been closed - it rebuilds
        // them. That is how the father came back: `closeThread` is on both
        // answers to the death scene and works, and this undid it.
        const src = live('src', 'core', 'story', 'runNeglect.ts');
        expect(src).toMatch(/if \(who\.channels === 'mail'\) return true;/);
        expect(src).toMatch(/return \(store\.threads \?\? \[\]\)\.some\(t => t\.id === id\)/);
    });

    it('and it asks the store rather than keeping a list of the deceased', () => {
        // A hand-kept list of dead characters is a list somebody forgets to
        // add to, and the failure is silent. The thread being gone is the
        // fact that matters, whatever removed it.
        const src = live('src', 'core', 'story', 'runNeglect.ts');
        expect(src).not.toMatch(/fatherDead/);
        expect(src).not.toMatch(/DEAD_CAST|deceased/);
    });

    it('and the death scene still closes the thread on both answers', () => {
        // The other half. If this ever stops happening the guard above is
        // guarding nothing.
        const src = live('src', 'data', 'story', 'fatherDeath.ts');
        expect((src.match(/kind: 'closeThread', who: 'father'/g) || [])).toHaveLength(2);
    });
});

describe('and the preview says what the message says', () => {
    it('both channels store the line the reader will render', () => {
        // The list stored `opening.text`, which is the English source, and
        // tapping in ran it through `line(nodeKey(...))` and showed Turkish.
        // One function, used by both, so they cannot drift again.
        const src = live('src', 'core', 'story', 'deliver.ts');
        expect(src).toMatch(/const openingLine = \(c: Conversation\): string =>/);
        expect(src).toMatch(/line\(nodeKey\(c\.id, opening\.id\), opening\.text\)/);
        expect(src).toMatch(/body: openingLine\(c\)/);
        expect(src).toMatch(/openingLine\(c\),\n\s*atMonth,/);
        // And the raw reads are gone from both.
        expect(src).not.toMatch(/opening\?\.text \?\? ''/);
    });

    it('and the subject too, because the row shows that as well', () => {
        const src = live('src', 'core', 'story', 'deliver.ts');
        expect(src).toMatch(/line\(subjectKey\(c\.id\), c\.subject\)/);
    });

    it('and the reader is still the thing that decides how a line looks', () => {
        // The weld: both sides call `line`, so a change to the translation
        // moves the preview and the screen together.
        const reader = live('src', 'components', 'story', 'logic', 'useConversationRunnerLogic.ts');
        expect(reader).toMatch(/line\(nodeKey\(conversation\.id, nodeIdent\), text\)/);
    });
});

describe('and the tutorial plays when the player says play it', () => {
    it('the locks are only switched off on the skip path', () => {
        // It sat above the `skipOpening` return and ran on every new game a
        // returning player started - including the ones where they had just
        // been asked and said play it. The opening act arrived correctly and
        // every teaching lock was switched off behind it.
        const src = live('src', 'core', 'newGame.ts');
        const block = src.slice(src.indexOf('if (!skipOpening)'));
        expect(block).toMatch(/disabled: true/);
        // And nothing disables them before that point.
        const before = src.slice(0, src.indexOf('if (!skipOpening)'));
        expect(before).not.toMatch(/disabled: true/);
    });

    it('and the question is really asked of a returning player', () => {
        // If the prompt stopped asking, the fix above would silently mean
        // "the tutorial always replays", which is the opposite mistake.
        const src = live('src', 'core', 'newGamePrompt.ts');
        expect(src).toMatch(/useNewGameQuestion\.getState\(\)\.ask\(/);
        expect(src).toMatch(/choice === 'skip' \? \{ skipOpening: true \} : \{\}/);
    });
});

describe('and the father goes when the flag says he is gone', () => {
    const messages = () => require('../store/useMessageStore').useMessageStore;
    const story = () => require('../store/useStoryStore').useStoryStore;

    const withFather = () => messages().setState({
        threads: [
            {
                id: 'father', name: 'Your Father', role: 'Founder', initials: 'YF',
                messages: [{ id: 'f-1', from: 'them', text: 'hi', atMonth: 3 }],
                unread: 1, conversationId: 'father-q4',
            },
            {
                id: 'cfo', name: 'Arthur Vance', role: 'CFO', initials: 'AV',
                messages: [{ id: 'c-1', from: 'them', text: 'hi', atMonth: 5 }],
                unread: 1,
            },
        ] as never[],
    });

    beforeEach(() => {
        story().setState({ flags: {} });
        withFather();
    });

    it('raising the flag closes it, whatever raised it', () => {
        // ------------------------------------------------------------------
        //  IT WAS HANGING OFF ONE ANSWER TO ONE QUESTION
        // ------------------------------------------------------------------
        //  `closeThread` is an effect on both choices of the death scene's
        //  last card, and it works - measured, the thread goes the moment
        //  either is picked. But an effect on a CHOICE only fires if the
        //  player picks it, and the runner always offers a way out. Somebody
        //  who closes the card at the last question leaves a dead man at the
        //  top of the messages screen with a text box under him.
        //
        //  On the FLAG, the two are inseparable: he is dead exactly when this
        //  is raised, by the scene, by a skipped act, or by anything written
        //  later that has not been thought of yet.
        // ------------------------------------------------------------------
        story().getState().raise('fatherDead');
        expect(messages().getState().threads.map((t: { id: string }) => t.id)).toEqual(['cfo']);
    });

    it('and it does not take anybody else with him', () => {
        story().getState().raise('fatherDead');
        expect(messages().getState().threads).toHaveLength(1);
        expect(messages().getState().threads[0].id).toBe('cfo');
    });

    it('and raising it twice is not an error', () => {
        story().getState().raise('fatherDead');
        expect(() => story().getState().raise('fatherDead')).not.toThrow();
        expect(messages().getState().threads.map((t: { id: string }) => t.id)).toEqual(['cfo']);
    });

    it('and a save already in the broken state is reconciled by the quarter', () => {
        // The fix above does nothing for a save that is ALREADY carrying him,
        // and those are the ones being played. A reconcile in the tick, one
        // array scan a quarter, correct whatever put the thread there.
        const tick = live('src', 'core', 'store', 'useGameStore.ts');
        const block = tick.slice(tick.indexOf('runNeglect()'));
        expect(block).toMatch(/if \(flags\.fatherDead\)/);
        expect(block).toMatch(/removeThread\('father'\)/);
    });

    it('and the effect on the choices is still there, because it does more', () => {
        // It also drops his queued scenes and his saved positions, which the
        // flag handler does not. Belt and brace, and they are different
        // braces.
        const src = live('src', 'data', 'story', 'fatherDeath.ts');
        expect((src.match(/kind: 'closeThread', who: 'father'/g) || [])).toHaveLength(2);
        const sink = live('src', 'core', 'story', 'gameSink.ts');
        expect(sink).toMatch(/story\.setPending\(/);
    });
});

describe('and a subject line is what somebody typed, not a filing label', () => {
    // ------------------------------------------------------------------
    //  REPORTED AS "MAILIN ACIKLAMASI YAZIYOR"
    // ------------------------------------------------------------------
    //  A row in the inbox showed things like
    //
    //      OPERATIONS / Q-Review: Line throughput + automation proposal
    //      HALE / condolence + preliminary approach, ref 4471-C
    //
    //  which is a department, a slash, and a summary of the contents. Nobody
    //  writes that; a database prints it. And the sender line already carries
    //  the affiliation - "CEO, Pear", "Chief Operating Officer" - which was
    //  added precisely so the subject would not have to.
    //
    //  A pattern rather than a list of ten, because the next one somebody
    //  writes is the one nobody would have added to a list.
    // ------------------------------------------------------------------
    const { CONVERSATIONS } = require('../../data/story');
    const { STORY_TR, subjectKey } = require('../../data/i18n/storyText');

    const subjects = () => CONVERSATIONS
        .filter((c: { subject?: string }) => !!c.subject)
        .map((c: { id: string; subject: string }) => ({
            id: c.id,
            en: c.subject,
            tr: STORY_TR[subjectKey(c.id)] ?? '',
        }));

    it('no ALL CAPS department followed by a slash', () => {
        const bad = subjects()
            .filter((s: { en: string }) => /^[A-Z][A-Z &]{3,}\s*\//.test(s.en))
            .map((s: { id: string; en: string }) => `${s.id}  ${s.en}`);
        expect(bad).toEqual([]);
    });

    it('and none of them lists its own contents with a plus sign', () => {
        // "condolence + preliminary approach" is an agenda, not a subject.
        const bad = subjects()
            .filter((s: { en: string }) => / \+ /.test(s.en))
            .map((s: { id: string; en: string }) => `${s.id}  ${s.en}`);
        expect(bad).toEqual([]);
    });

    it('and the Turkish did not keep the shape the English dropped', () => {
        const bad = subjects()
            .filter((s: { tr: string }) => /^[A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ &]{3,}\s*\//.test(s.tr) || / \+ /.test(s.tr))
            .map((s: { id: string; tr: string }) => `${s.id}  ${s.tr}`);
        expect(bad).toEqual([]);
    });

    it('and no subject uses a dash, in either language', () => {
        // The standing rule, and the Turkish Pear subject was breaking it
        // with an em dash while the English used a comma.
        const bad = subjects()
            .filter((s: { en: string; tr: string }) =>
                /[–—]|\s-\s/.test(s.en) || /[–—]|\s-\s/.test(s.tr))
            .map((s: { id: string }) => s.id);
        expect(bad).toEqual([]);
    });

    it('and a formal reference is still allowed, because some senders use them', () => {
        // The regulator and the field office really do write like this, and
        // the rule above must not have quietly banned them.
        const refs = subjects().filter((s: { en: string }) => /ref|File|s\.14/i.test(s.en));
        expect(refs.length).toBeGreaterThan(2);
    });
});
