// src/navigation/jumpToCompany.ts
//
// ============================================================================
//  THE ONE TAB THAT IS NOT A ROUTE
// ============================================================================
//
//  Every other item on the bar is a RootStack route, so `navigate(name)` is
//  the whole story. My Company is not: it lives inside the swipe navigator
//  that RootStack registers as 'Home'.
//
//  ---------------------------------------------------------------------------
//  AND THAT IS WHY IT WORKED EVERYWHERE EXCEPT THE PLACE IT IS USED MOST
//  ---------------------------------------------------------------------------
//  `navigate('Home', { screen: 'MyCompany' })` is the documented form and it
//  does work - FROM SOMEWHERE ELSE. From Messages it switches the stack to
//  Home and hands the nested action down on the way.
//
//  From Home it does nothing, because RootStack is already on Home, and a
//  navigate to the route you are already on is a no-op that never reaches the
//  child navigator. Which is precisely the case the tab bar is in most of the
//  time: pressing Company from the home screen, reported as "it just does not
//  go".
//
//  The previous comment in CrystalNavBar described the opposite failure and
//  was right about it at the time. Both are the same shape - a name resolved
//  in the wrong navigator - and only one of them can be fixed by choosing a
//  better argument.
//
//  ---------------------------------------------------------------------------
//  SO IT ADDRESSES THE CHILD NAVIGATOR DIRECTLY
//  ---------------------------------------------------------------------------
//  React Navigation lets an action be aimed at a specific navigator with
//  `target`, and the root state knows the key of the one it is looking for.
//  Find 'Home' in the root state, take its state key, and jump. That works
//  whether or not RootStack is already on Home, because it never asks
//  RootStack for anything.
//
//  The nested navigate stays as the fallback, for the one case the direct
//  jump cannot cover: the swipe navigator has not been mounted yet, so it has
//  no key, and there is nothing to aim at. Then the stack has to go there
//  first, which is exactly what the fallback does.
// ============================================================================

import { CommonActions, type NavigationContainerRef } from '@react-navigation/native';

/** The RootStack route that owns the swipe navigator. */
const HOST = 'Home';

/**
 * Put one of the swipe tabs on screen, from anywhere.
 *
 * ---------------------------------------------------------------------------
 *  THIS WAS ONLY EVER ABOUT MY COMPANY, AND IT SHOULD NOT HAVE BEEN
 * ---------------------------------------------------------------------------
 *  The bug this file documents - a navigate to the route you are already on
 *  never reaches the child navigator - is not a fact about My Company. It is a
 *  fact about every tab in the swipe navigator, and the bar's Home button had
 *  it too: pressing Home while on the Company tab called `navigate('Home')`,
 *  RootStack was already there, and nothing happened.
 *
 *  It went unreported because Home is where people start, so the button is
 *  usually pressed when it is already correct. React Navigation was saying it
 *  out loud the whole time:
 *
 *      Found screens with the same name nested inside one another.
 *      Check: Home, Home > Home
 *
 *  Two routes named Home, one inside the other, and every `navigate('Home')`
 *  in the app resolving to whichever the caller happened to be nearest.
 *
 * Takes the container ref rather than a screen's `navigation`, because the bar
 * is rendered outside every screen - once, at the root - and the whole point
 * is not to care which navigator the caller happens to be sitting in.
 */
export const jumpToTab = (
    ref: Pick<NavigationContainerRef<any>, 'isReady' | 'getRootState' | 'dispatch'>,
    tab: string,
): boolean => {
    if (!ref.isReady?.()) return false;

    try {
        const root = ref.getRootState();
        const host = root?.routes?.find((r: any) => r.name === HOST) as any;
        const key = host?.state?.key;

        if (key) {
            // Aimed at the swipe navigator itself. RootStack is not consulted,
            // so being already on its Home route cannot swallow it.
            ref.dispatch({ ...CommonActions.navigate(tab), target: key });
            return true;
        }

        // Not mounted yet, so there is nothing to aim at. Send the stack, and
        // the nested action rides along.
        ref.dispatch(CommonActions.navigate(HOST, { screen: tab }));
        return true;
    } catch {
        // The bar is on every screen in the game. It does not get to throw.
        return false;
    }
};

/** The original caller, kept so the bar reads as what it does. */
export const jumpToCompany = (
    ref: Pick<NavigationContainerRef<any>, 'isReady' | 'getRootState' | 'dispatch'>,
): boolean => jumpToTab(ref, 'MyCompany');
