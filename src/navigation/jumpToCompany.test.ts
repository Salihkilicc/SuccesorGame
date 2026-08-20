// src/navigation/jumpToCompany.test.ts
//
// ============================================================================
//  THE TAB THAT WORKED EVERYWHERE EXCEPT WHERE IT IS USED
// ============================================================================
//
//  Reported: Company on the tab bar works from Messages and does nothing from
//  Home. Both halves of that are the same fact.
//
//  `navigate('Home', { screen: 'MyCompany' })` asks ROOTSTACK to go to Home
//  and carries a nested action for the child. From Messages that is a real
//  navigation and the child action rides along. From Home it is a navigate to
//  the route you are already on, which is a no-op, and the child never hears
//  about it.
//
//  So the fix cannot be a better argument to the same call. It has to stop
//  asking RootStack anything.
// ============================================================================

import { jumpToCompany } from './jumpToCompany';

const rootState = (opts: { swipeMounted: boolean }) => ({
    routes: [
        { name: 'Messages' },
        {
            name: 'Home',
            state: opts.swipeMounted
                ? { key: 'swipe-key-1', routes: [{ name: 'Home' }, { name: 'MyCompany' }] }
                : undefined,
        },
    ],
});

const refFor = (opts: { swipeMounted: boolean; ready?: boolean }) => {
    const dispatched: any[] = [];
    return {
        dispatched,
        ref: {
            isReady: () => opts.ready !== false,
            getRootState: () => rootState(opts) as any,
            dispatch: (a: any) => { dispatched.push(a); },
        },
    };
};

describe('when the swipe navigator is on screen', () => {
    it('aims the action at it by key, so RootStack is never asked', () => {
        // The whole fix. Being already on Home cannot swallow an action that
        // was never addressed to Home.
        const { ref, dispatched } = refFor({ swipeMounted: true });
        expect(jumpToCompany(ref)).toBe(true);
        expect(dispatched).toHaveLength(1);
        expect(dispatched[0].target).toBe('swipe-key-1');
    });

    it('and asks for My Company rather than for Home', () => {
        const { ref, dispatched } = refFor({ swipeMounted: true });
        jumpToCompany(ref);
        expect(JSON.stringify(dispatched[0])).toContain('MyCompany');
        // No nested `{ screen: ... }` payload: the child is the target now,
        // so there is nothing to nest.
        expect(dispatched[0].payload?.params?.screen).toBeUndefined();
    });
});

describe('when it has not been mounted yet', () => {
    it('sends the stack, and the nested action rides along', () => {
        // The one case the direct jump cannot cover: no key, nothing to aim
        // at. This is the old behaviour, kept exactly where it is correct.
        const { ref, dispatched } = refFor({ swipeMounted: false });
        expect(jumpToCompany(ref)).toBe(true);
        expect(dispatched[0].target).toBeUndefined();
        expect(JSON.stringify(dispatched[0])).toContain('Home');
        expect(JSON.stringify(dispatched[0])).toContain('MyCompany');
    });
});

describe('and the bar is on every screen in the game', () => {
    it('so it does nothing rather than throwing before the container is ready', () => {
        const { ref, dispatched } = refFor({ swipeMounted: true, ready: false });
        expect(jumpToCompany(ref)).toBe(false);
        expect(dispatched).toHaveLength(0);
    });

    it('and swallows a broken state rather than taking the app down', () => {
        const thrower = {
            isReady: () => true,
            getRootState: () => { throw new Error('no state'); },
            dispatch: () => { },
        };
        expect(jumpToCompany(thrower as any)).toBe(false);
    });
});
