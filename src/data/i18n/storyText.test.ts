// src/data/i18n/storyText.test.ts
//
// ============================================================================
//  THE TRANSLATION LAYER, AND THE ONE FAILURE IT CANNOT SEE ON ITS OWN
// ============================================================================
//
//  The dangerous fault here is not a missing translation - a missing entry
//  falls back to English and somebody notices it in the first playthrough.
//
//  The dangerous fault is a STALE one. A scene gets rewritten, a card is
//  renamed, an answer moves from position 1 to position 0, and the Turkish
//  entry for the old key stays in the dictionary. Nothing throws. The player
//  reads a Turkish line that answers a question the card no longer asks, or a
//  perfectly good translation simply stops appearing and the English comes
//  back for that one card only. Both are invisible to anyone reading English.
//
//  So: every key IN the dictionary must exist in the story. That check costs
//  nothing and is the only one that catches a rename.
//
//  Coverage itself is deliberately NOT asserted at 100%. The translation is
//  done in batches and a test that fails until every one of eleven hundred
//  lines is in would be switched off on day one.
// ============================================================================

import { CONVERSATIONS } from '../story/index';
import { TUTORIAL_SEQUENCE } from '../tutorial/sequence';
import { allStoryKeys, allStoryLines } from './storyKeys';
import { useLocaleStore, type Locale } from '../../core/i18n';
import {
    STORY_TR, coverage, line, nodeKey, choiceKey, subjectKey, storyLanguage,
} from './storyText';

// The story language IS the app language - there is no second setting to
// reach for here, which is the point of the note in storyText.ts.
const speak = (locale: Locale) => useLocaleStore.getState().setLocale(locale);

afterEach(() => speak('en'));

describe('keys', () => {
    it('are unique, so no line can overwrite another', () => {
        const keys = allStoryKeys();
        expect(new Set(keys).size).toBe(keys.length);
    });

    it('covers every card, every answer, every subject line and every lock', () => {
        let expected = 0;
        for (const c of CONVERSATIONS) {
            if (c.subject) expected += 1;
            for (const n of c.nodes) expected += 1 + (n.choices?.length ?? 0);
        }
        // The tutorial instructions are the father speaking over a dimmed
        // screen. They are dialogue, they live in this dictionary, and
        // leaving them out would have shipped a Turkish game whose first
        // hour is in English.
        expected += TUTORIAL_SEQUENCE.length;
        expect(allStoryKeys().length).toBe(expected);
    });

    it('and the tutorial lines are attributed to somebody', () => {
        const locks = allStoryLines().filter(l => l.kind === 'lock');
        expect(locks.length).toBe(TUTORIAL_SEQUENCE.length);
        // Not 'system', not blank. A dimmed screen instructed by nobody is
        // what this replaced.
        expect(locks.every(l => !!l.speaker && l.speaker !== 'player')).toBe(true);
    });

    it('shapes match the three builders the runner calls', () => {
        expect(nodeKey('scene', 'card')).toBe('scene/card');
        expect(choiceKey('scene', 'card', 0)).toBe('scene/card#0');
        expect(subjectKey('scene')).toBe('scene/@subject');
    });

    it('marks answers as the player speaking, not the sender', () => {
        // The single most common mistranslation in a branching game is an
        // answer rendered as a description of an action rather than a line of
        // dialogue. The export leans on this field to say so.
        const choices = allStoryLines().filter(l => l.kind === 'choice');
        expect(choices.length).toBeGreaterThan(500);
        expect(choices.every(l => l.speaker === 'player')).toBe(true);
    });

    it('carries no empty English, which would export as a blank to translate', () => {
        expect(allStoryLines().filter(l => !l.english.trim())).toEqual([]);
    });
});

describe('the dictionary', () => {
    it('has no key that is not in the story', () => {
        // The rename check. If this fails, a scene moved and the dictionary
        // did not - find the stale keys in the message and re-export.
        const known = new Set(allStoryKeys());
        const stale = Object.keys(STORY_TR).filter(k => !known.has(k));
        expect(stale).toEqual([]);
    });

    it('counts what is left rather than estimating it', () => {
        const c = coverage(allStoryKeys(), 'tr');
        expect(c.total).toBe(allStoryKeys().length);
        expect(c.translated + c.missing.length).toBe(c.total);
    });
});

describe('lookup', () => {
    it('returns English when the app is in English', () => {
        speak('en');
        expect(storyLanguage()).toBeUndefined();
        expect(line('anything/at-all', 'the English')).toBe('the English');
    });

    it('follows the app language rather than a setting of its own', () => {
        STORY_TR['test-only/follows'] = 'Türkçe';
        speak('en');
        expect(line('test-only/follows', 'English')).toBe('English');
        speak('tr');
        expect(line('test-only/follows', 'English')).toBe('Türkçe');
        delete STORY_TR['test-only/follows'];
    });

    it('returns English for a key the dictionary does not have', () => {
        speak('tr');
        expect(line('not-a-real/key', 'the English')).toBe('the English');
    });

    it('returns the translation when there is one', () => {
        STORY_TR['test-only/card'] = 'Türkçe satır';
        speak('tr');
        expect(line('test-only/card', 'the English')).toBe('Türkçe satır');
        delete STORY_TR['test-only/card'];
    });

    it('treats a whitespace-only entry as missing', () => {
        // An exporter that emits an empty string for a line the translator
        // skipped would otherwise blank the card entirely.
        STORY_TR['test-only/blank'] = '   ';
        speak('tr');
        expect(line('test-only/blank', 'the English')).toBe('the English');
        delete STORY_TR['test-only/blank'];
    });

    it('reports no story language for one nothing has been written for', () => {
        // 'en' is that case today: the English lives in the scene files and an
        // `en` dictionary would be a second copy of all eighteen thousand
        // words. A locale added to the app before its story dictionary exists
        // lands here too, and reads in English rather than blank.
        speak('en');
        expect(storyLanguage()).toBeUndefined();
    });
});
