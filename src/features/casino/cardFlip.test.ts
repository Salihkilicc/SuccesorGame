// src/features/casino/cardFlip.test.ts
//
// ============================================================================
//  HALF OF EVERY TURN WAS A CARD SEEN FROM BEHIND
// ============================================================================
//
//  Reported as "half the card looks completely faded and missing while it is
//  opening, and there is no turning effect".
//
//  Two complaints, one cause. The component returned EITHER a back OR a face
//  depending on a prop, and animated a rotateY across the swap:
//
//      if (hidden) return <back  rotateY   0deg -> 180deg />
//      return             <face  rotateY 180deg -> 360deg />
//
//  So the instant the hole card was revealed React threw the back away and
//  mounted the FACE at 180 degrees, which is the face seen from behind. With no
//  backface handling that is drawn anyway - mirrored and washed out - and it
//  stays that way for the whole first half of the turn.
//
//  And it is why nothing ELSE ever turned over: a card dealt face up was
//  constructed at flip = 1 and simply slid in. The only thing that ever moved
//  the value was the hole card. Every other card at the table arrived already
//  open, which is not something a dealer can do.
//
//  The fix is what a card actually is: two sides, both there, one of them
//  pointing away from you and therefore not drawn.
//
//  ---------------------------------------------------------------------------
//  WHY THIS TEST READS SOURCE
//  ---------------------------------------------------------------------------
//  There is no renderer here - no react-test-renderer, no native host - so
//  nothing can assert on a pixel. What CAN be pinned is the structure that made
//  the defect possible: a conditional return, a missing backfaceVisibility, a
//  flip value that only one card ever moved. Each of those is a shape, and a
//  shape is what regressed.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { CARD_SHOW_MS, DEAL_MS, FLIP_MS, TURN_AT } from './components/AnimatedCard';

const card = () =>
    fs.readFileSync(path.join(__dirname, 'components', 'AnimatedCard.tsx'), 'utf8');

describe('a card has two sides', () => {
    it('both of them are mounted, rather than swapped for each other', () => {
        // THE DEFECT. `if (hidden) return <back/>` meant the face did not
        // exist until the moment it was already halfway through turning.
        const src = card();
        expect(src).not.toMatch(/if \(hidden\) \{\s*return \(/);
        // One return, holding both faces.
        const returns = (src.match(/^\s{2}return \(/gm) || []).length;
        expect(returns).toBe(1);
    });

    it('and the one pointing away from you is not drawn', () => {
        // THE MISSING PIECE, and the whole of "half of it looks faded and
        // missing". Without this the back of a face is rendered mirrored.
        //
        // ANCHORED TO THE STYLE BLOCK, not to the string. The first version
        // of this test was `toMatch(/backfaceVisibility: 'hidden'/)` and it
        // PASSED with the property deleted - because the file's own header
        // comment explains the fix and contains the words. A test that its
        // own documentation can satisfy is not a test. Fourth time this
        // pattern has bitten in this codebase.
        const src = card();
        const styles = src.slice(src.indexOf('const styles = StyleSheet.create('));
        expect(styles).toMatch(/^ {4}backfaceVisibility: 'hidden',$/m);
    });

    it('and they sit exactly half a turn apart', () => {
        // Any other offset and there is a moment where both are facing you,
        // or a moment where neither is and the card blinks out.
        const src = card();
        expect(src).toMatch(/outputRange: \['0deg', '180deg'\]/);
        expect(src).toMatch(/outputRange: \['180deg', '360deg'\]/);
    });

    it('and each face carries its own rotation', () => {
        const src = card();
        expect(src).toMatch(/rotateY: faceDownSpin/);
        expect(src).toMatch(/rotateY: faceUpSpin/);
        expect(src).toMatch(/perspective: 800/);
    });

    it('and neither face is measured, so the card cannot change width mid turn', () => {
        // Both are absolutely positioned inside a slot that holds the space.
        const src = card();
        expect(src).toMatch(/slot: \{/);
        expect(src).toMatch(/card: \{\s*\.\.\.StyleSheet\.absoluteFillObject/);
    });
});

describe('and every card turns over, not just the hole card', () => {
    it('a card starts face down whatever it is going to become', () => {
        // THE DEFECT. `new Animated.Value(hidden ? 0 : 1)` meant a card dealt
        // face up was BORN face up and never turned.
        const src = card();
        expect(src).toMatch(/const flip = useRef\(new Animated\.Value\(0\)\)/);
        expect(src).not.toMatch(/new Animated\.Value\(hidden \? 0 : 1\)/);
    });

    it('and it turns while it is still travelling, the way a flick does', () => {
        // Landing and THEN turning reads as two events. It should be one.
        expect(TURN_AT).toBeLessThan(DEAL_MS);
        expect(TURN_AT).toBeGreaterThan(0);
    });

    it('and the whole thing is still quick', () => {
        expect(CARD_SHOW_MS).toBe(TURN_AT + FLIP_MS);
        expect(CARD_SHOW_MS).toBeLessThan(600);
    });
});

describe('and a deal is told apart from a reveal', () => {
    // The fiddly part. A card being DEALT waits out the stagger ahead of it;
    // the hole card being REVEALED, minutes later, must turn immediately. Both
    // go through the same effect, so something has to distinguish them.
    it('by whether this card has been flipped before', () => {
        const src = card();
        expect(src).toMatch(/const flippedFor = useRef<string \| null>\(null\)/);
        expect(src).toMatch(/const beingDealt = flippedFor\.current !== cardKey/);
    });

    it('and only a card being dealt waits for the stagger', () => {
        // If the reveal took the deal delay too, the dealer would pause before
        // showing you the card that decides the hand.
        expect(card()).toMatch(/delay: beingDealt \? dealDelay \+ TURN_AT : 0/);
    });
});

describe('and it is all still on the UI thread', () => {
    it('every animation is native driven', () => {
        const src = card();
        expect(src).not.toMatch(/useNativeDriver: false/);
        const timings = (src.match(/Animated\.(timing|spring)\(/g) || []).length;
        const natives = (src.match(/useNativeDriver: true/g) || []).length;
        expect(natives).toBe(timings);
    });

    it('and both animations stop when the card goes away', () => {
        // Two effects, two teardowns. A timing left running against an
        // unmounted view is a leak that only shows up as jank.
        const src = card();
        expect((src.match(/return \(\) => anim\.stop\(\)/g) || []).length).toBe(2);
    });
});
