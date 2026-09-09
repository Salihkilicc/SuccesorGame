// src/core/story/castGenerationsWired.test.ts
//
// ============================================================================
//  SEVEN PLACES READ THE CAST, AND ONE LEFT BEHIND IS TWO NAMES FOR ONE PERSON
// ============================================================================
//
//  The roster is measured next door. This is the half that matters: whether
//  the inbox, the message list, the chaser and the transcript all agree about
//  who is writing.
//
//  Any single reader left on the raw `CAST` table gives a save where the row
//  says Ingrid Sollberg and the header above the reply says Arthur Vance -
//  the same letter, two names, one tap apart. That is the bug the avatar tint
//  had before it was centralised, and it survived three fixes because each
//  screen looked right on its own.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { useMessageStore, initialMessageState } from '../store/useMessageStore';
import { useMailStore, initialMailState } from '../store/useMailStore';
import { useFamilyStore, initialFamilyState } from '../store/useFamilyStore';
import { deliver } from './deliver';
import { castNow } from './castNow';
import { CAST } from '../../data/story/cast';
import { CONVERSATIONS } from '../../data/story';
import { faceFor, poolFace } from '../portraits/faces';
import { PORTRAITS } from '../portraits/registry';

const fileOf = (src: unknown) =>
    Object.keys(PORTRAITS).find(k => PORTRAITS[k] === src) ?? '';

/** A scene from a seat that changes hands, on whichever channel it uses. */
const sceneFrom = (id: string) => CONVERSATIONS.find(c => c.from === id);

const atGeneration = (g: number) => {
    useFamilyStore.setState({ ...initialFamilyState, generation: g, _hasHydrated: true } as never);
    useMessageStore.setState({ ...initialMessageState, _hasHydrated: true } as never);
    useMailStore.setState({ ...initialMailState, _hasHydrated: true } as never);
};

afterEach(() => atGeneration(1));

describe('a letter in the third generation is signed by the third holder', () => {
    it('the mail row carries the new name', () => {
        const scene = CONVERSATIONS.find(c => c.from === 'pear' && c.channel === 'mail');
        expect(scene).toBeDefined();

        atGeneration(3);
        expect(deliver(scene!.id)).toBe(true);

        const posted = useMailStore.getState().inbox[0];
        expect(posted.fromName).toContain(castNow('pear', 3)!.name);
        expect(posted.fromName).not.toContain(CAST.pear.name);
    });

    it('and enough with it to draw somebody who has no photograph', () => {
        const scene = CONVERSATIONS.find(c => c.from === 'pear' && c.channel === 'mail')!;
        atGeneration(3);
        deliver(scene.id);

        const posted = useMailStore.getState().inbox[0];
        expect(posted.fromGender).toBe(castNow('pear', 3)!.gender);
        expect(posted.fromAge).toBe(castNow('pear', 3)!.age);
    });

    it('and in the founder game it carries neither, so he keeps his own face', () => {
        // ------------------------------------------------------------------
        //  THE HALF THAT MUST NOT MOVE
        // ------------------------------------------------------------------
        //  Generation one has portraits drawn for them and finds them by id.
        //  A gender arriving on those letters would push them onto the pool
        //  and take every drawn face off the founder's inbox at once.
        // ------------------------------------------------------------------
        const scene = CONVERSATIONS.find(c => c.from === 'pear' && c.channel === 'mail')!;
        atGeneration(1);
        deliver(scene.id);

        const posted = useMailStore.getState().inbox[0];
        expect(posted.fromName).toContain(CAST.pear.name);
        expect(posted.fromGender).toBeUndefined();
        expect(posted.fromAge).toBeUndefined();
    });
});

describe('and a message in the fourth is from the fourth', () => {
    const messageSeat = ['cfo', 'coo', 'cto', 'friend']
        .find(id => sceneFrom(id) && sceneFrom(id)!.channel !== 'mail')!;

    it('there is such a scene, or this proves nothing', () => {
        expect(messageSeat).toBeTruthy();
    });

    it('the thread carries the new name and a face to go with it', () => {
        const scene = sceneFrom(messageSeat)!;
        atGeneration(4);
        deliver(scene.id);

        const thread = useMessageStore.getState().threads.find(t => t.id === messageSeat)!;
        const who = castNow(messageSeat, 4)!;
        expect(thread.name).toBe(who.name);
        expect(thread.gender).toBe(who.gender);
        expect(thread.age).toBe(who.age);

        // ------------------------------------------------------------------
        //  AND IT IS A POOL FACE, NOT THE SEAT'S OLD PHOTOGRAPH
        // ------------------------------------------------------------------
        //  This is what the first version got wrong. `faceFor` looks the id
        //  up before anything else, and the id here is a JOB: 'cfo' resolves
        //  to cfo.png, so the fourth generation's chief financial officer
        //  came back wearing Arthur Vance's face under her own name. The
        //  screens ask `poolFace` now, which does not look.
        // ------------------------------------------------------------------
        const face = fileOf(poolFace({
            id: thread.id, name: thread.name,
            female: thread.gender === 'female', age: thread.age,
        }));
        expect(face).toMatch(/^face_(mid|old|young)_/);
    });

    it('and in generation one the same thread has no gender at all', () => {
        const scene = sceneFrom(messageSeat)!;
        atGeneration(1);
        deliver(scene.id);
        const thread = useMessageStore.getState().threads.find(t => t.id === messageSeat)!;
        expect(thread.name).toBe(CAST[messageSeat].name);
        expect(thread.gender).toBeUndefined();
    });
});

describe('and every reader was moved, not just the two that were noticed', () => {
    const src = (...p: string[]) =>
        fs.readFileSync(path.join(__dirname, '..', '..', ...p), 'utf8')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/^\s*\/\/.*$/gm, '');

    it('nothing outside the cast files still reads CAST for a name', () => {
        // ------------------------------------------------------------------
        //  THE SWEEP
        // ------------------------------------------------------------------
        //  Written as a list of files rather than a walk, because the two
        //  legitimate exceptions have to be named:
        //
        //    runNeglect's address lookup - an email belongs to the SEAT and
        //    does not change hands. a.vance@hale.co outlives Vance.
        //
        //    useRelationshipStore - the father and the brother, who are the
        //    founder's story and have no roster.
        // ------------------------------------------------------------------
        const offenders: string[] = [];
        for (const rel of [
            ['core', 'story', 'deliver.ts'],
            ['core', 'story', 'gameSink.ts'],
            ['core', 'story', 'runSuccession.ts'],
            ['components', 'story', 'ConversationRunner.tsx'],
            ['components', 'tutorial', 'TutorialOverlay.tsx'],
        ]) {
            const text = src(...rel);
            if (/CAST\[[^\]]+\]\??\.name|CAST\.\w+\??\.name/.test(text)) offenders.push(rel.join('/'));
        }
        expect(offenders).toEqual([]);
    });

    it('and each of them asks castNow instead', () => {
        for (const rel of [
            ['core', 'story', 'deliver.ts'],
            ['core', 'story', 'gameSink.ts'],
            ['core', 'story', 'runNeglect.ts'],
            ['core', 'story', 'runSuccession.ts'],
            ['components', 'story', 'ConversationRunner.tsx'],
            ['components', 'tutorial', 'TutorialOverlay.tsx'],
        ]) {
            expect({ file: rel.join('/'), asks: src(...rel).includes('castNow(') })
                .toEqual({ file: rel.join('/'), asks: true });
        }
    });

    it('and the mail screens draw the pool face when the letter carries one', () => {
        for (const screen of ['MailScreen.tsx', 'MailDetailScreen.tsx']) {
            const text = src('features', 'os', 'screens', screen);
            expect({ screen, reads: text.includes('mail.fromGender !== undefined') })
                .toEqual({ screen, reads: true });
            // POOL, not faceFor: the id is a seat and faceFor would find the
            // previous holder's photograph. See core/portraits/faces.poolFace.
            expect({ screen, pool: text.includes('poolFace({') })
                .toEqual({ screen, pool: true });
            expect({ screen, looksUp: text.includes('faceFor({') })
                .toEqual({ screen, looksUp: false });
            // And still falls back to the id, or generation one loses its faces.
            expect({ screen, keeps: text.includes('portraitFor(mail.fromId)') })
                .toEqual({ screen, keeps: true });
        }
    });
});
