// src/core/screenCategories.ts
//
// ============================================================================
//  WHICH PART OF THE APP AM I IN?
// ============================================================================
//
//  Every screen header carries a short coloured rule under its title, and the
//  colour says which section you are in - finance yellow, research violet,
//  and so on. The colours themselves live in `theme.categories`; this file is
//  the only place that decides which screen gets which.
//
//  IT RESOLVES FROM THE ROUTE, NOT FROM A PROP. A prop would mean every one
//  of thirty-odd screens has to remember to pass the right value, and the
//  first one to forget gets a silently wrong colour that nobody notices for
//  a month. A screen's section is a fact about the navigator, so the
//  navigator is where it is read from.
//
//  A route with no entry falls to `neutral`, which is the grey border colour
//  - visible, obviously unassigned, and never mistaken for a real category.
//  That is deliberate: a missing entry should look missing.
// ============================================================================

import { theme } from './theme';

export type ScreenCategory = keyof typeof theme.categories;

/**
 * Route name -> section. Grouped the way the player thinks about the app,
 * not the way the files are laid out: Borrow and Repay are finance even
 * though they live under components/MyCompany.
 */
const BY_ROUTE: Record<string, ScreenCategory> = {
    // --- The company itself
    MyCompany: 'company',
    MyEmpire: 'company',
    Assets: 'company',

    // --- Money in and out
    Finance: 'finance',
    BorrowLoan: 'finance',
    RepayDebt: 'finance',
    CapitalInjection: 'finance',
    SharkDeal: 'finance',
    FinancialReport: 'finance',

    // --- What you make
    Products: 'products',

    // --- What you learn
    Research: 'research',
    TechTree: 'research',
    Laboratory: 'research',

    // --- Who you answer to
    BoardMembers: 'people',
    TeamMorale: 'people',

    // --- What the market thinks
    StockMarket: 'market',
    HostileTakeover: 'market',

    // --- OS Apps
    Messages: 'company',
    MessageThread: 'company',
    Mail: 'products',
    MailDetail: 'products',

    Market: 'market',
    StockDetail: 'market',

    // --- The shell. Deliberately neutral: Home is not a section, it is the
    //     place all the sections are reached from.
    Home: 'neutral',
    Settings: 'neutral',
    Profile: 'neutral',
    Notes: 'neutral',
    Achievements: 'neutral',
    Calendar: 'neutral',
};

export const categoryForRoute = (route?: string): ScreenCategory =>
    (route && BY_ROUTE[route]) || 'neutral';

/** The rule colour for a route. What ScreenHeader actually calls. */
export const categoryColor = (route?: string): string =>
    theme.categories[categoryForRoute(route)];
