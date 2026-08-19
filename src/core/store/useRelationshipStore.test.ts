// src/core/store/useRelationshipStore.test.ts
//
// ============================================================================
//  THE FAMILY IS IN THE SCRIPT, NOT IN A NAME POOL
// ============================================================================
//
//  `generateParents` invented a mother called Emma and a father called Liam,
//  both alive, both aged somewhere between eighteen and forty. The player's
//  father is GERALD HALE - he explains the company in the first quarter, he
//  dies in the sixth, and the entire opening act is his.
//
//  So the game was creating a SECOND father, alive, in a store nothing
//  displays, while the real one was in the messages app. It is the
//  Tom-the-brother bug with a longer reach, because this one ran at the
//  quarterly tick of every game rather than sitting in an initial value.
//
//  The mother is written too, and the writing already decided she is gone:
//  she came into the plant on Saturdays and talked to the machines out loud
//  (fatherQ1), and in the fourth quarter he says she "WOULD HAVE asked twice".
//  Past tense, without stopping to say so.
//
//  ---------------------------------------------------------------------------
//  AND A TWENTY-FIVE YEAR OLD COULD HAVE AN EIGHTEEN YEAR OLD MOTHER
//  ---------------------------------------------------------------------------
//  `randInt(18, 40)` was the parent's ABSOLUTE age, not their age relative to
//  the player. About one game in twenty produced a mother younger than her
//  child. Derived from the player now.
// ============================================================================

import {
    useRelationshipStore,
    initialRelationshipState,
    PARENT_AGE_GAP,
} from './useRelationshipStore';
import { useGameStore } from './useGameStore';
import { useStoryStore, initialStoryState } from './useStoryStore';
import { CAST } from '../../data/story/cast';

const freshAt = (age: number, flags: Record<string, true> = {}) => {
    useRelationshipStore.setState({ ...initialRelationshipState, _hasHydrated: true });
    useStoryStore.setState({ ...initialStoryState, flags: flags as never });
    useGameStore.setState({ age } as never);
};

const find = (type: string) =>
    useRelationshipStore.getState().contacts.find(c => c.type === type);

describe('who the player is related to', () => {
    beforeEach(() => freshAt(25));

    it('is the man from the script, not a name from a pool', () => {
        useRelationshipStore.getState().generateParents();
        expect(find('Father')?.name).toBe(CAST.father.name);
    });

    it('and the brother who owns fifteen percent', () => {
        // He is already a relationship the game models, in shares and in a
        // whole arc of messages. The family tree had never heard of him.
        useRelationshipStore.getState().generateParents();
        expect(find('Sibling')?.name).toBe(CAST.brother.name);
    });

    it('while the mother is gone before the game opens', () => {
        // fatherQ4: "your mother would have asked twice." The script says it
        // in the tense rather than in a line, and this is the store agreeing.
        useRelationshipStore.getState().generateParents();
        expect(find('Mother')?.isDeceased).toBe(true);
    });

    it('and she is not given a name, because the script never gave her one', () => {
        // The phone calls the father "Your Father" for the same reason -
        // nobody saves a parent under their full legal name. Inventing a
        // first name for the player's dead mother is a writing decision and
        // this is not the place it gets made.
        useRelationshipStore.getState().generateParents();
        expect(find('Mother')?.name).toBe('Your Mother');
    });
});

describe('how old they are', () => {
    it('is derived from the player, not rolled in a vacuum', () => {
        // The bug this replaces: `randInt(18, 40)` was the parent's absolute
        // age, so about one game in twenty gave a twenty-five year old player
        // a mother younger than they were.
        for (const age of [25, 40, 60]) {
            freshAt(age);
            useRelationshipStore.getState().generateParents();
            for (const type of ['Mother', 'Father']) {
                const gap = find(type)!.age - age;
                expect(gap).toBeGreaterThan(20);
                expect(gap).toBeCloseTo(PARENT_AGE_GAP, -1);
            }
        }
    });

    it('and the brother is older, because the player is the successor', () => {
        // The one who did not get the company. It is why he owns fifteen
        // percent and writes at eleven at night.
        freshAt(25);
        useRelationshipStore.getState().generateParents();
        expect(find('Sibling')!.age).toBeGreaterThan(25);
    });
});

describe('the father dying', () => {
    it('is the story store\'s decision, not this one\'s', () => {
        freshAt(26, { fatherDead: true });
        useRelationshipStore.getState().generateParents();
        expect(find('Father')?.isDeceased).toBe(true);
    });

    it('and it reaches a family tree that was built before it', () => {
        // Without `syncFromStory` this store lists him as alive for the rest
        // of the game - the quiet disagreement between two stores that this
        // whole migration has been about.
        freshAt(25);
        useRelationshipStore.getState().generateParents();
        expect(find('Father')?.isDeceased).toBe(false);

        useStoryStore.setState({ flags: { fatherDead: true } as never });
        useRelationshipStore.getState().syncFromStory();
        expect(find('Father')?.isDeceased).toBe(true);
    });

    it('while nobody else is buried by it', () => {
        freshAt(25);
        useRelationshipStore.getState().generateParents();
        useStoryStore.setState({ flags: { fatherDead: true } as never });
        useRelationshipStore.getState().syncFromStory();
        expect(find('Sibling')?.isDeceased).toBe(false);
    });

    it('and a living father is left alone', () => {
        freshAt(25);
        useRelationshipStore.getState().generateParents();
        useRelationshipStore.getState().syncFromStory();
        expect(find('Father')?.isDeceased).toBe(false);
    });
});

describe('generating twice', () => {
    it('does nothing the second time', () => {
        freshAt(25);
        useRelationshipStore.getState().generateParents();
        const before = useRelationshipStore.getState().contacts.length;
        useRelationshipStore.getState().generateParents();
        expect(useRelationshipStore.getState().contacts).toHaveLength(before);
    });

    it('and the dead do not have birthdays', () => {
        freshAt(25);
        useRelationshipStore.getState().generateParents();
        const motherAge = find('Mother')!.age;
        useRelationshipStore.getState().ageUpNPCs();
        expect(find('Mother')!.age).toBe(motherAge);
        expect(find('Sibling')!.age).toBeGreaterThan(25);
    });
});
