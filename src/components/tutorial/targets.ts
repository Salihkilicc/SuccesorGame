// src/components/tutorial/targets.ts
//
// Where the highlightable controls currently are on screen.
//
// Not persisted and not part of the game: these are pixel positions, valid
// for as long as the screen is mounted and meaningless afterwards. Keeping
// them out of the story store is the point - a save file should never contain
// a coordinate.

import { create } from 'zustand';

export type Rect = { x: number; y: number; width: number; height: number };

type TargetStore = {
    rects: Record<string, Rect>;
    setRect: (key: string, rect: Rect) => void;
    /**
     * The control has left the screen.
     *
     * Without this a measurement outlived the screen that produced it: the
     * rect stayed in the store forever, so after one visit to My Company the
     * overlay believed the control was still there and went on dimming every
     * other screen in the app with a hole punched at coordinates belonging to
     * a screen the player had left.
     */
    clearRect: (key: string) => void;

    /**
     * Which key the overlay is drawing a ring around right now.
     *
     * ---------------------------------------------------------------------
     *  WHY THE TARGET NEEDS TO KNOW IT IS THE ONE BEING POINTED AT
     * ---------------------------------------------------------------------
     *  Every focused target used to re-measure on the same 250ms timer, and
     *  that number is a compromise between two things that pull in opposite
     *  directions: it has to be slow enough to be free on the targets nobody
     *  is looking at, and fast enough that the ring keeps up with a scroll.
     *
     *  It cannot be both, and the symptom was the ring arriving four times a
     *  second while the control moved continuously. Reported as the highlight
     *  not being fixed and looking like it was sliding, which is exactly what
     *  a quarter second of lag looks like.
     *
     *  Exactly ONE target is ringed at a time, so the compromise can be
     *  dropped: that one follows the control every frame and the rest keep
     *  the cheap timer. The overlay is the only thing that knows which, so
     *  the overlay publishes it here.
     *
     *  It stays in this store rather than being passed down because the rule
     *  the whole module is built on is that a screen holding a target must
     *  not have to know a tutorial exists.
     * ---------------------------------------------------------------------
     */
    activeKey: string | null;
    setActiveKey: (key: string | null) => void;
};

export const useTutorialTargets = create<TargetStore>((set) => ({
    rects: {},
    activeKey: null,

    setActiveKey: (key) =>
        set(state => (state.activeKey === key ? state : { activeKey: key })),

    setRect: (key, rect) =>
        set(state => {
            const old = state.rects[key];
            // Layout fires often. Skipping identical measurements keeps this
            // from re-rendering the overlay on every scroll frame.
            if (old && old.x === rect.x && old.y === rect.y &&
                old.width === rect.width && old.height === rect.height) {
                return state;
            }
            return { rects: { ...state.rects, [key]: rect } };
        }),

    clearRect: (key) =>
        set(state => {
            if (!(key in state.rects)) return state;
            const next = { ...state.rects };
            delete next[key];
            return { rects: next };
        }),
}));
