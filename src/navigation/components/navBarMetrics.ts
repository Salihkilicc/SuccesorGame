// src/navigation/components/navBarMetrics.ts
//
// ============================================================================
//  HOW BIG THE FLOATING NAV BAR IS, WITHOUT THE NAV BAR
// ============================================================================
//
//  These numbers used to live inside CrystalNavBar.tsx, which is correct for
//  the styles and wrong for everybody else. 73 places import NAV_BAR_CLEARANCE
//  to leave room at the bottom of a screen, and importing it dragged in the
//  whole component: the blur view, the gradient, the stats overlay, and
//  `navigationRef`.
//
//  That stayed invisible while the importers were all screens, which need the
//  navigator anyway. TutorialOverlay is not a screen, and the moment it asked
//  for the same number its test suite stopped loading on
//  `createNavigationContainerRef is not a function` - a tutorial test failing
//  on a navigation ref it has no interest in.
//
//  So the geometry moves here, where it has no imports at all, and
//  CrystalNavBar re-exports the clearance so that none of the 73 callers has
//  to change. One source, as before; just not inside the thing it describes.
//
//  ---------------------------------------------------------------------------
//  WHY THE HEIGHT IS DERIVED RATHER THAN MEASURED ONCE AND WRITTEN DOWN
//  ---------------------------------------------------------------------------
//  Kept from the original note, because it is the reason this is a sum:
//  resizing the bar and updating the number screens use to clear it were two
//  separate acts, and the second one kept being forgotten. Named here and read
//  by both the bar's styles and the clearance, so the bar cannot grow without
//  the space under it growing with it.
// ============================================================================

import { Platform } from 'react-native';

/** How far the bar floats off the bottom edge. */
export const BAR_LIFT = Platform.OS === 'ios' ? 44 : 32;

/** Breathing room inside the bar, above the icon and below the label. */
export const BAR_PAD_V = 20;

/** The glyph, and the word under it. */
export const BAR_ICON = 28;
export const BAR_LABEL = 11;
export const BAR_LABEL_GAP = 4;

/** What the bar actually measures, derived rather than estimated. */
export const BAR_HEIGHT =
    BAR_PAD_V * 2 + BAR_ICON + BAR_LABEL_GAP + Math.round(BAR_LABEL * 1.3);

/**
 * How much room the floating bar takes at the bottom of every screen.
 *
 * Screens that end in a button need to clear it, and every one of them was
 * guessing a number. One constant, derived from the bar's own geometry, plus
 * eight points so a button does not sit flush against it.
 *
 * 138 on iOS, 126 on Android. Worth knowing, because the tutorial card
 * hardcoded 120 and was therefore under both.
 */
export const NAV_BAR_CLEARANCE = BAR_LIFT + BAR_HEIGHT + 8;
