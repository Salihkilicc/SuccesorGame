// src/core/store/useNewsStore.ts
//
// ============================================================================
//  THE WIRE
// ============================================================================
//
//  Until now the News app on the home screen showed four sentences hardcoded
//  into the JSX, identical in every game, in every quarter, forever. And the
//  story's `news` effect - a real entry in the effect vocabulary that scenes
//  are allowed to use - resolved to a console.log with a note saying it was
//  waiting for a home. This is the home.
//
//  WHAT IT IS FOR. News is how the world tells the player something happened
//  that they did not do. A divestiture, a rival's collapse, a raid: things
//  that are true whether or not a screen was open at the time. Without a
//  place to put them, every consequence had to be a modal interrupting the
//  player, which is why the game only ever tells you about your own actions.
//
//  DELIBERATELY SMALL. A headline, when, and a kind. No body text, no read
//  state, no images. Prompt 10 brings the event engine and prompt 28 the
//  scandals; both will want to publish here, and neither is served by a
//  schema invented in advance of them.
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../../storage/persist';

/**
 * Where the headline came from.
 *
 * Not decoration: the screen colours by kind, and prompt 10's event engine
 * needs to tell its own output apart from the story's when deciding whether
 * a quarter has already been noisy enough.
 */
export type NewsKind = 'market' | 'deal' | 'company' | 'story';

export interface NewsItem {
    id: string;
    headline: string;
    kind: NewsKind;
    /** Game month it was published, for ordering and for "this quarter" reads. */
    atMonth: number;
}

/**
 * How many are kept.
 *
 * The list is persisted, so an unbounded one grows for the length of a
 * campaign and is re-serialised on every publish. Twelve quarters of a busy
 * game is roughly this many, and nothing reads further back than the current
 * quarter anyway.
 */
export const MAX_ITEMS = 40;

interface NewsState {
    items: NewsItem[];
    /** Newest first. Returns the item so a caller can reference it. */
    publish: (headline: string, kind: NewsKind, atMonth: number) => NewsItem;
    reset: () => void;
    //  There was a `recent(months, now)` here and nothing called it. Written
    //  because prompt 10's event engine will probably want it, which is not a
    //  reason to ship it - a speculative action is dead code that happens to
    //  have been written recently. It goes in when something reads it.
    //
    //  Worth knowing: the audit did NOT catch it. The store-action pass looks
    //  for the bare word anywhere in any file, and "recent" appears in a
    //  comment in equity.ts, so it counted as used. Any action named with a
    //  common English word is effectively invisible to that check.
}

export const useNewsStore = create<NewsState>()(
    persist(
        (set, get) => ({
            items: [],

            publish: (headline, kind, atMonth) => {
                const item: NewsItem = {
                    // Date.now() alone collides when a quarter publishes several
                    // headlines inside the same millisecond, which it does -
                    // the tick is synchronous. Duplicate keys make React drop
                    // rows silently, so the counter is not optional.
                    id: `news_${atMonth}_${Date.now()}_${get().items.length}`,
                    headline,
                    kind,
                    atMonth,
                };
                set(state => ({ items: [item, ...state.items].slice(0, MAX_ITEMS) }));
                return item;
            },

            reset: () => set({ items: [] }),
        }),
        {
            name: 'succesor_news_v1',
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({ items: state.items }),
        },
    ),
);
