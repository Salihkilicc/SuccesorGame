// src/core/changeCharacter.test.ts
//
// ============================================================================
//  BECOMING SOMEBODY ELSE
// ============================================================================
//
//  Asked for as: we cannot change our gender or our name, and there should be
//  a way. Not on the new game screen, but a button under New Game in Settings.
//  Changing the character changes the company name too, so it is like starting
//  from scratch, and the game restarts. With a warning first.
//
//  ---------------------------------------------------------------------------
//  IT NEEDED ALMOST NO NEW MACHINERY, AND THAT IS THE INTERESTING PART
//  ---------------------------------------------------------------------------
//  `RootNavigator` already decides what to ask from DATA rather than a flag:
//
//      no identity            -> ask everything (name, gender, company)
//      identity, no company   -> ask the company only
//
//  So the whole feature is: run a new game, then set `created` back to false.
//  The full form appears by itself, because the state is the memory.
//
//  ---------------------------------------------------------------------------
//  AND THE ORDER IS LOAD BEARING
//  ---------------------------------------------------------------------------
//  Forgetting the identity FIRST deadlocks. The navigator returns the
//  onboarding form early, above `<NewGameQuestion />` - so the component
//  holding the promise unmounts while the caller is still awaiting it, and the
//  opening question can never be answered.
//
//  That is not a hypothetical. It is the obvious way to write this function
//  and it hangs the app on a screen with no way out.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { changeCharacter, useNewGameQuestion } from './newGamePrompt';
import { useIdentityStore, initialIdentityState } from './store/useIdentityStore';
import { useStatsStore } from './store/useStatsStore';

/** Answer whatever the dialog asks, in order, as a player would. */
const answerWith = (choices: string[]) => {
    const asked: string[] = [];
    let i = 0;
    const unsub = useNewGameQuestion.subscribe((s) => {
        if (!s.asking || !s.answer) return;
        asked.push(s.mode ?? '');
        const choice = choices[i++] ?? 'erase';
        const answer = s.answer;
        // Out of the store's own set call, the way a button press would be.
        setTimeout(() => answer(choice as never), 0);
    });
    return { asked, stop: unsub };
};

const aPlayerMidRun = () => {
    useIdentityStore.setState({
        ...initialIdentityState,
        _hasHydrated: true,
        created: true,
        firstName: 'Salih',
        ownFirstName: 'Salih',
        lastName: 'Hale',
        gender: 'male',
        runsStarted: 2,
        openingSeen: true,
        tutorialCompleted: true,
        endingsSeen: ['soldToPear', 'boughtPear'],
    } as never);
    useStatsStore.setState({ companyName: 'Hale Industries' } as never);
};

beforeEach(() => {
    useNewGameQuestion.getState().clear();
    aPlayerMidRun();
});

describe('it warns before it touches anything', () => {
    it('and the warning is its own, not the new game one', () => {
        // ------------------------------------------------------------------
        //  A DIFFERENT WARNING, BECAUSE IT WARNS ABOUT A DIFFERENT THING
        // ------------------------------------------------------------------
        //  The erase panel says the run goes. This one has to say the run
        //  goes AND that the player is about to be asked who they are. A
        //  player who read the first and got the second was told the smaller
        //  half.
        // ------------------------------------------------------------------
        const seen = answerWith(['cancel']);
        void changeCharacter();
        expect(useNewGameQuestion.getState().asking).toBe(true);
        expect(useNewGameQuestion.getState().mode).toBe('newCharacter');
        seen.stop();
    });

    it('and saying no changes nothing at all', async () => {
        const seen = answerWith(['cancel']);
        const went = await changeCharacter();
        seen.stop();

        expect(went).toBe(false);
        expect(useIdentityStore.getState().created).toBe(true);
        expect(useIdentityStore.getState().firstName).toBe('Salih');
        expect(useStatsStore.getState().companyName).toBe('Hale Industries');
    });
});

describe('and saying yes sends the player back to the form', () => {
    it('the identity is forgotten, which is what the navigator reads', async () => {
        const seen = answerWith(['erase', 'skip']);
        const went = await changeCharacter();
        seen.stop();

        expect(went).toBe(true);
        // THE WHOLE FEATURE. `created: false` and no company name is the
        // exact state RootNavigator answers with the full form.
        expect(useIdentityStore.getState().created).toBe(false);
        expect(useStatsStore.getState().companyName).toBe('');
    });

    it('and the run really is torn down, not just renamed', async () => {
        useStatsStore.setState({ money: 987_654_321 } as never);
        const seen = answerWith(['erase', 'skip']);
        await changeCharacter();
        seen.stop();
        expect(useStatsStore.getState().money).not.toBe(987_654_321);
    });

    it('and it asks the same opening question New Game asks', async () => {
        // Not a second copy of the rule. A player who is offered the skip
        // from one door must be offered it from the other.
        const seen = answerWith(['erase', 'skip']);
        await changeCharacter();
        seen.stop();
        expect(seen.asked).toEqual(['newCharacter', 'skip']);
    });
});

describe('and what it keeps is what belongs to the person, not the character', () => {
    it('endings already read, runs counted, tutorial done', async () => {
        // ------------------------------------------------------------------
        //  THE LINE THIS DRAWS
        // ------------------------------------------------------------------
        //  A new name does not un-read four endings, and being offered the
        //  tutorial again for changing your name would be the feature
        //  punishing you for using it.
        // ------------------------------------------------------------------
        const seen = answerWith(['erase', 'skip']);
        await changeCharacter();
        seen.stop();

        const id = useIdentityStore.getState();
        expect(id.endingsSeen).toEqual(['soldToPear', 'boughtPear']);
        expect(id.tutorialCompleted).toBe(true);
        expect(id.openingSeen).toBe(true);
        expect(id.runsStarted).toBeGreaterThanOrEqual(2);
    });

    it('and the old name is still there until the form overwrites it', async () => {
        // Clearing it here would leave a window in which the game knows
        // nobody at all, and several screens read the name to draw a header.
        const seen = answerWith(['erase', 'skip']);
        await changeCharacter();
        seen.stop();
        expect(useIdentityStore.getState().firstName).toBe('Salih');
    });

    it('and forgetIdentity on its own touches one field and no others', () => {
        aPlayerMidRun();
        const before = useIdentityStore.getState();
        useIdentityStore.getState().forgetIdentity();
        const after = useIdentityStore.getState();

        expect(after.created).toBe(false);
        for (const key of ['firstName', 'lastName', 'gender', 'ownFirstName',
            'runsStarted', 'openingSeen', 'tutorialCompleted'] as const) {
            expect({ key, v: after[key] }).toEqual({ key, v: before[key] });
        }
    });
});

// ============================================================================
//  AND THE ORDER, WHICH NO BEHAVIOURAL TEST HERE CAN CATCH
// ============================================================================
//
//  Probed it: swapping the two lines so the identity is forgotten FIRST left
//  every assertion above green. It would still hang the real app.
//
//  The reason is the harness. The deadlock needs `RootNavigator` to unmount
//  `<NewGameQuestion />` the moment there is no identity, and in jest there is
//  no navigator, nothing unmounts, and the promise resolves happily. So the
//  most dangerous property of this function is exactly the one its behaviour
//  cannot demonstrate here.
//
//  Which leaves two honest options: render the whole navigator in a test, or
//  pin the order by reading the source. The first is a large, slow test that
//  would fail for a dozen unrelated reasons; the second is small and says
//  plainly what it is doing. Written down rather than quietly skipped, because
//  a reader deserves to know this one is weaker than the ones above it.
// ============================================================================

describe('the order is pinned by reading the code, and here is why', () => {
    const source = fs.readFileSync(path.join(__dirname, 'newGamePrompt.ts'), 'utf8');
    const at = source.indexOf('export const changeCharacter');
    const fn = source.slice(at, at + source.slice(at).indexOf('\n};'));
    // The doc block ABOVE the export, which is where the reason lives. The
    // first draft of this test sliced from the export and then asserted the
    // reason was inside it, which it never could be.
    const doc = source.slice(Math.max(0, source.lastIndexOf('/**', at)), at);

    it('the new game runs before the identity is forgotten', () => {
        const started = fn.indexOf('startNewGameAsking()');
        const forgot = fn.indexOf('forgetIdentity()');
        expect(started).toBeGreaterThan(-1);
        expect(forgot).toBeGreaterThan(-1);
        expect(forgot).toBeGreaterThan(started);
    });

    it('and the reason is written where somebody about to swap them will read it', () => {
        // A bare ordering assertion tells the next person that they broke a
        // test. The comment tells them what breaks in the app.
        expect(doc).toMatch(/deadlock/i);
        expect(doc).toMatch(/NewGameQuestion/);
    });

    it('and the navigator really does return early on a missing identity', () => {
        // The other half of the claim. If this ever stops being true the
        // ordering above stops mattering, and the note should be revisited
        // rather than trusted.
        const nav = fs.readFileSync(
            path.join(__dirname, '..', 'navigation', 'RootNavigator.tsx'), 'utf8');
        expect(nav).toMatch(/if \(identityHydrated && \(!identityCreated \|\| !companyName\)\)/);
        expect(nav.indexOf('<OnboardingScreen')).toBeLessThan(nav.indexOf('<NewGameQuestion'));
    });
});
