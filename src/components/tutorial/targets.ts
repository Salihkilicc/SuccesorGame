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
};

export const useTutorialTargets = create<TargetStore>((set) => ({
    rects: {},
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
}));
