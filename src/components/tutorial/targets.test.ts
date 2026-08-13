// src/components/tutorial/targets.test.ts
//
// ============================================================================
//  A MEASUREMENT THAT OUTLIVES ITS SCREEN IS WORSE THAN NO MEASUREMENT
// ============================================================================
//
//  Nothing ever removed a rect from this store. One visit to My Company left
//  a coordinate in it for the rest of the session, and since the overlay
//  shows itself wherever its target is measured, the tutorial then followed
//  the player around the app - dimming screens and cutting a hole around
//  furniture that had been unmounted for ten minutes.
//
//  The leak and the overlay's early return are two halves of one fix. Either
//  alone leaves the tutorial in the wrong place.
// ============================================================================

import { useTutorialTargets, type Rect } from './targets';

const RECT: Rect = { x: 10, y: 20, width: 100, height: 44 };

beforeEach(() => useTutorialTargets.setState({ rects: {} }));

describe('measurements', () => {
    it('are recorded under the key the lock names', () => {
        useTutorialTargets.getState().setRect('products', RECT);
        expect(useTutorialTargets.getState().rects.products).toEqual(RECT);
    });

    it('are dropped when the control leaves the screen', () => {
        const { setRect, clearRect } = useTutorialTargets.getState();
        setRect('products', RECT);
        clearRect('products');
        expect(useTutorialTargets.getState().rects.products).toBeUndefined();
    });

    it('clearing one leaves the others alone', () => {
        const { setRect, clearRect } = useTutorialTargets.getState();
        setRect('products', RECT);
        setRect('teamMorale', { ...RECT, y: 200 });
        clearRect('products');
        expect(useTutorialTargets.getState().rects.teamMorale).toBeDefined();
    });

    it('clearing something that was never there is not an error', () => {
        // Unmount can run for a target that never measured - a zero-sized
        // control, a screen torn down in the same frame it mounted.
        expect(() => useTutorialTargets.getState().clearRect('nope')).not.toThrow();
        expect(useTutorialTargets.getState().rects).toEqual({});
    });

    it('an identical re-measure does not produce a new object', () => {
        // Layout fires on every scroll frame. A new rects object each time
        // re-renders the overlay continuously, which is a dropped-frame bug
        // rather than a wrong-pixels one and therefore harder to attribute.
        const { setRect } = useTutorialTargets.getState();
        setRect('products', RECT);
        const first = useTutorialTargets.getState().rects;
        setRect('products', { ...RECT });
        expect(useTutorialTargets.getState().rects).toBe(first);
    });

    it('a moved control does produce a new one', () => {
        const { setRect } = useTutorialTargets.getState();
        setRect('products', RECT);
        const first = useTutorialTargets.getState().rects;
        setRect('products', { ...RECT, y: RECT.y + 1 });
        expect(useTutorialTargets.getState().rects).not.toBe(first);
    });

    it('holds nothing at rest, so a fresh app dims nothing', () => {
        expect(useTutorialTargets.getState().rects).toEqual({});
    });
});
