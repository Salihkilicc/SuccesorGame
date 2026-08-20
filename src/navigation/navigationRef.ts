// src/navigation/navigationRef.ts
//
// ============================================================================
//  THE CONTAINER REF, ON ITS OWN, BECAUSE OF A CYCLE
// ============================================================================
//
//  This was one line inside RootNavigator.tsx, which is the natural place for
//  it right up until something outside a screen needs it.
//
//  CrystalNavBar is that something: the bar is rendered once, at the root,
//  outside every screen, so it has no screen navigation of its own and has to
//  address the container directly. Importing the ref from RootNavigator made
//  a CYCLE, because RootNavigator imports CrystalNavBar:
//
//      RootNavigator -> CrystalNavBar -> RootNavigator
//
//  Jest resolves that quietly. Metro does not have to: when CrystalNavBar is
//  evaluated it is being evaluated FROM INSIDE RootNavigator's own evaluation,
//  so RootNavigator's exports are still empty and `rootNavigationRef` binds to
//  undefined. The import looks correct in both files and the value is not
//  there, which is the worst version of this failure.
//
//  A leaf module cannot take part in a cycle. Both sides import from here.
// ============================================================================

import { createNavigationContainerRef } from '@react-navigation/native';

import type { RootStackParamList } from './RootNavigator';

/**
 * The one container ref.
 *
 * Typed against RootStackParamList, which is a TYPE-only import and therefore
 * erased at build time - so it does not put the cycle back.
 */
export const rootNavigationRef = createNavigationContainerRef<RootStackParamList>();
