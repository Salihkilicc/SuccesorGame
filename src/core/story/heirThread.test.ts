// src/core/story/heirThread.test.ts
//
// ============================================================================
//  YOUR CHILD WROTE TO YOU AND THE PHONE DID NOT KNOW WHO THEY WERE
// ============================================================================
//
//  Reported as the child's messages looking like everybody else's. Measured:
//  sixteen people can write to the player, eleven find their portrait off the
//  thread id, four are institutions with no face by design, and one is the
//  player's own child.
//
//  The cast file has them as `{ id: 'heir', name: 'Your Successor' }`, which
//  is honest - they do not exist when that file is written and the player
//  names them years later. So four conversations arrived on a thread called
//  YOUR SUCCESSOR with a blank circle, sitting between Dana Whitfield and
//  Arthur Vance who both had their photographs.
//
//  Nothing had to be invented. The name, the gender and the age are the three
//  things the family list already draws their face from.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { useMessageStore, initialMessageState } from '../store/useMessageStore';
import { useFamilyStore, initialFamilyState } from '../store/useFamilyStore';
import { deliver } from './deliver';
import { CAST } from '../../data/story/cast';
import { faceFor } from '../portraits/faces';
import { PORTRAITS } from '../portraits/registry';
import { CONVERSATIONS } from '../../data/story';

const nameOfFile = (src: unknown) =>
    Object.keys(PORTRAITS).find(k => PORTRAITS[k] === src) ?? '';

const child = (over: Record<string, unknown> = {}) => ({
    id: 'child-1', name: 'Juno Hale', gender: 'Female' as const, age: 19,
    birthYear: 2026, birthQuarter: 1, educationLevel: 'None',
    role: 'Heir', stats: {
        intellect: 70, charm: 70, businessAcumen: 70,
        loyalty: 90, ambition: 70, health: 90, creativity: 70,
    },
    relationshipWithPlayer: 90, isSuccessorCandidate: true,
    traits: [], allowance: 0, ...over,
});

/** The story conversations that come FROM the heir. */
const heirScenes = CONVERSATIONS.filter(c => c.from === 'heir');

beforeEach(() => {
    useMessageStore.setState({ ...initialMessageState, _hasHydrated: true } as never);
    useFamilyStore.setState({ ...initialFamilyState, _hasHydrated: true } as never);
});

describe('the child writes as themselves', () => {
    it('and there really are conversations from them, or this proves nothing', () => {
        expect(heirScenes.length).toBeGreaterThan(0);
        expect(CAST.heir.name).toBe('Your Successor');
    });

    it('the thread carries their name rather than the placeholder', () => {
        useFamilyStore.setState({ children: [child()] } as never);
        expect(deliver(heirScenes[0].id)).toBe(true);

        const thread = useMessageStore.getState().threads.find(t => t.id === 'heir');
        expect(thread).toBeDefined();
        expect(thread!.name).toBe('Juno Hale');
        expect(thread!.name).not.toBe('Your Successor');
        expect(thread!.initials).toBe('JH');
    });

    it('and enough about them to draw a face', () => {
        useFamilyStore.setState({ children: [child()] } as never);
        deliver(heirScenes[0].id);

        const thread = useMessageStore.getState().threads.find(t => t.id === 'heir')!;
        expect(thread.gender).toBe('female');
        expect(thread.age).toBe(19);

        // And the face that comes out of those is a young woman, which is
        // what a nineteen year old daughter should be.
        const face = nameOfFile(faceFor({
            id: thread.id, name: thread.name,
            female: thread.gender === 'female', age: thread.age,
        }));
        expect(face).toMatch(/^face_young_f_/);
    });

    it('and a son gets a son', () => {
        useFamilyStore.setState({
            children: [child({ id: 'child-m', name: 'Otto Hale', gender: 'Male', age: 41 })],
        } as never);
        deliver(heirScenes[0].id);

        const thread = useMessageStore.getState().threads.find(t => t.id === 'heir')!;
        expect(thread.gender).toBe('male');
        const face = nameOfFile(faceFor({
            id: thread.id, name: thread.name,
            female: false, age: thread.age,
        }));
        expect(face).toMatch(/^face_mid_m_/);
    });

    it('and it is the one who would actually take the chair', () => {
        // ------------------------------------------------------------------
        //  THE SAME ANSWER `successorFor` GIVES
        // ------------------------------------------------------------------
        //  The designated heir if there is one, the eldest otherwise. A
        //  message from a child who is not next in line, about the company,
        //  would be a different scene.
        // ------------------------------------------------------------------
        useFamilyStore.setState({
            children: [
                child({ id: 'a', name: 'Alba Hale', age: 34 }),
                child({ id: 'b', name: 'Bram Hale', gender: 'Male', age: 22 }),
            ],
            designatedSuccessorId: 'b',
        } as never);
        deliver(heirScenes[0].id);
        expect(useMessageStore.getState().threads.find(t => t.id === 'heir')!.name)
            .toBe('Bram Hale');

        // And with nobody named, the eldest.
        useMessageStore.setState({ ...initialMessageState, _hasHydrated: true } as never);
        useFamilyStore.setState({ designatedSuccessorId: null } as never);
        deliver(heirScenes[0].id);
        expect(useMessageStore.getState().threads.find(t => t.id === 'heir')!.name)
            .toBe('Alba Hale');
    });

    it('and a player with no children still gets the scene, placeholder and all', () => {
        // The scenes are gated on having an heir elsewhere; if one arrives
        // anyway it must not throw and must not invent a person.
        useFamilyStore.setState({ children: [] } as never);
        expect(deliver(heirScenes[0].id)).toBe(true);
        const thread = useMessageStore.getState().threads.find(t => t.id === 'heir')!;
        expect(thread.name).toBe('Your Successor');
        expect(thread.gender).toBeUndefined();
    });
});

describe('and nobody else was touched', () => {
    it('the fifteen named senders keep their own name and no pool face', () => {
        const scenes = CONVERSATIONS.filter(c => c.from !== 'heir');
        const seen = new Set<string>();
        for (const c of scenes) {
            if (seen.has(c.from)) continue;
            seen.add(c.from);
            useMessageStore.setState({ ...initialMessageState, _hasHydrated: true } as never);
            useFamilyStore.setState({ children: [child()] } as never);
            deliver(c.id);
            const thread = useMessageStore.getState().threads.find(t => t.id === c.from);
            if (!thread) continue;
            expect({ from: c.from, name: thread.name })
                .toEqual({ from: c.from, name: CAST[c.from].name });
            // No gender means the screen draws the portrait by id, as before.
            expect({ from: c.from, gender: thread.gender })
                .toEqual({ from: c.from, gender: undefined });
        }
        expect(seen.size).toBeGreaterThan(5);
    });
});

describe('and the screen reads what the thread carries', () => {
    const screen = fs.readFileSync(
        path.join(__dirname, '..', '..', 'features', 'os', 'screens', 'MessagesScreen.tsx'),
        'utf8');

    it('it asks the pool only when there is somebody to ask about', () => {
        // ------------------------------------------------------------------
        //  UNDEFINED, NOT NULL, AND THE DIFFERENCE COST ELEVEN PORTRAITS
        // ------------------------------------------------------------------
        //  Portrait reads `undefined` as "look this one up for me" and `null`
        //  as "this one has no face, do not look". Written as null first,
        //  which suppressed the id lookup and took the photographs off every
        //  named sender in the game at once - Dana, the CFO, the brother, all
        //  of them - while fixing the one that had none.
        //
        //  inboxFaces.test.tsx caught it, which is exactly what that file is
        //  for. This line is here so it cannot come back quietly.
        // ------------------------------------------------------------------
        // `poolFace`, not `faceFor`. faceFor looks the id up first, which is
        // right for a person who owns a portrait and wrong when the id names
        // a SEAT: 'cfo' finds Arthur Vance and the fourth generation's chief
        // financial officer wore his face. See core/portraits/faces.poolFace.
        // `seatFace`, which tries a DRAWN file for this person first and
        // falls back to the pool. Not `faceFor`, which looks the THREAD id
        // up - and the thread id is a seat, so 'cfo' finds Arthur Vance.
        expect(screen).toContain('thread.gender === undefined ? undefined : seatFace({');
        expect(screen).not.toContain('thread.gender === undefined ? null');
        expect(screen).not.toContain('undefined : faceFor(');
    });

    it('and it passes the age, or every child is the same band', () => {
        const call = /seatFace\(\{[\s\S]*?\}\)/.exec(screen)?.[0] ?? '';
        expect(call).toContain('age: thread.age');
        expect(call).toContain("female: thread.gender === 'female'");
    });

    it('and the note that said this was impossible is gone', () => {
        expect(screen).not.toContain('no gender or age on the thread');
    });
});
