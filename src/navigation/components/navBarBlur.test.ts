// src/navigation/components/navBarBlur.test.ts
//
// ============================================================================
//  THE BAR THAT IS ON EVERY SCREEN, AND THE DEFAULT THAT BURIES IT
// ============================================================================
//
//  CrystalNavBar is a blue gradient whose four stops are all between 0.4 and
//  0.5 alpha, with a blur behind it. That translucency IS the component; it is
//  the reason the file is called Crystal and the reason it has no background
//  colour to cache its shadow against.
//
//  `blurType` is an iOS word. UIVisualEffectView has named effect styles;
//  Android has no such thing, so @react-native-community/blur translates the
//  name through a lookup table into a flat overlay colour, and the entry for
//  'dark' is sixty four per cent near-black.
//
//  Sixty four per cent laid over stops of 0.45 is not a blur that failed. It
//  is a blur that worked and was then painted over, which is why the bar came
//  back from the device as "eksiklik var, crystal gibi degil" rather than as
//  anything that looked broken.
//
//  ---------------------------------------------------------------------------
//  WHY THIS IS READ AS TEXT
//  ---------------------------------------------------------------------------
//  Nothing that runs JavaScript can catch this. The prop is valid, the types
//  are satisfied, the component renders, and jest's Platform is whichever one
//  the test file asked for. The failure only exists in the pixels on a device
//  nobody is holding while the suite runs.
//
//  So it is checked the same way androidBoot.test.ts checks the three strings
//  that decide whether Android opens at all: by reading the source.
//
//  ---------------------------------------------------------------------------
//  AND WHY THE DEFAULT IS READ FROM THE LIBRARY RATHER THAN TYPED IN
//  ---------------------------------------------------------------------------
//  A test that hardcodes 0.64 stops meaning anything the day the library
//  changes it. This one asks the library what its default actually is and
//  requires ours to be meaningfully lighter than whatever that turns out to
//  be, so the assertion survives a version bump with its point intact.
// ============================================================================

import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const BAR = 'src/navigation/components/CrystalNavBar.tsx';

/** Pull the alpha out of an rgba() string. */
const alphaOf = (rgba: string): number => {
    const m = rgba.match(/rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/);
    if (!m) throw new Error(`not an rgba colour: ${rgba}`);
    return Number(m[1]);
};

describe('the nav bar keeps its translucency on android', () => {
    it('names an overlay colour instead of taking the platform default', () => {
        const source = read(BAR);

        // The prop has to be there at all. Without it the library substitutes
        // its own value and the bar goes flat with nothing in the diff to say
        // why.
        expect(source).toMatch(/overlayColor/);

        // And it has to be guarded, because iOS has no such prop and the bar
        // on iOS was tuned on the device it runs on. A change here must not
        // reach across.
        const guarded = source.match(
            /overlayColor=\{\s*Platform\.OS === 'android'\s*\?\s*ANDROID_BLUR_OVERLAY\s*:\s*undefined\s*\}/,
        );
        expect(guarded).not.toBeNull();

        // The value itself lives at file scope, because the reachability audit
        // skips `//` comments and not JSX ones - the first draft of this fix
        // put the explanation inside the JSX and the audit counted the library
        // hex quoted in the prose, going 123 to 124. The number was right.
        const declared = source.match(/const ANDROID_BLUR_OVERLAY = '([^']+)'/);
        expect(declared).not.toBeNull();

        const ours = alphaOf(declared![1]);

        // ------------------------------------------------------------------
        //  AGAINST WHAT THE LIBRARY WOULD HAVE DONE
        // ------------------------------------------------------------------
        const libraryDefault = alphaOf(
            fs
                .readFileSync(
                    path.join(
                        ROOT,
                        'node_modules/@react-native-community/blur/lib/module/components/BlurView.android.js',
                    ),
                    'utf8',
                )
                .match(/dark:\s*'([^']+)'/)![1],
        );

        // Half of the default or lighter. Anything closer and the gradient is
        // still being buried, just a little more slowly.
        expect(ours).toBeLessThanOrEqual(libraryDefault / 2);

        // But not zero. The icons are white and whatever scrolls behind the
        // bar is not guaranteed to be dark, so some floor has to stay.
        expect(ours).toBeGreaterThan(0.15);

        // ------------------------------------------------------------------
        //  AND IT IS THE GAME'S OWN DARK, NOT THE LIBRARY'S
        // ------------------------------------------------------------------
        //  The library dims with 16,12,12. Copying that number in brings
        //  #100C0C into the tree, and the reachability audit counts every hex
        //  outside the fifteen tokens - it went from 123 to 124 the moment
        //  this line was first written with the library's value in it.
        //
        //  #1C242C is the ground the whole game is drawn on, and the stats
        //  overlay in this same file already dims with it.
        expect(declared![1]).toMatch(/rgba\(28,\s*36,\s*44,/);
    });

    it('still asks for a dark blur, so ios is untouched', () => {
        // The fix is additive. If blurType went away to "simplify" it, iOS
        // loses its effect style and this is the only place that would notice.
        expect(read(BAR)).toMatch(/blurType="dark"/);
    });
});

// ============================================================================
//  THE GLOW UNDER THE BAR
// ============================================================================
//  BaseViewManager.setShadowColor forwards the colour to the outline shadow
//  from Android 9 onward, and the shadow is cast from the view's OUTLINE,
//  which a border radius provides with or without a fill. I had told him the
//  opposite on both counts, which is why "altinda gri bir parlaklik var" came
//  back as a surprise rather than as something already accounted for.
//
//  What Android has no equivalent of is `shadowOpacity`. It draws the colour
//  at whatever alpha the colour carries, so an opaque hex lands at full
//  strength, and the spread comes from the elevation rather than the radius.
//  A shadow declared for iOS therefore arrives on Android both wider and
//  brighter than it was drawn.
// ============================================================================
describe('the nav bar glow weighs the same on both platforms', () => {
    const barStyles = () => {
        const source = read(BAR);
        const start = source.indexOf('blurContainer: {');
        expect(start).toBeGreaterThan(-1);
        return source.slice(start, source.indexOf('\n    },', start));
    };

    it('carries its alpha in the colour on android, because there is no shadowOpacity', () => {
        const block = barStyles();

        const colour = block.match(
            /shadowColor:\s*Platform\.OS === 'android'\s*\?\s*'([^']+)'\s*:\s*['"]([^'"]+)['"]/,
        );
        expect(colour).not.toBeNull();

        const androidAlpha = Number(colour![1].match(/,\s*([\d.]+)\s*\)$/)![1]);
        const iosOpacity = Number(block.match(/shadowOpacity:\s*([\d.]+)/)![1]);

        // The one number iOS applies separately has to be inside the Android
        // colour, or the glow arrives at full strength.
        expect(androidAlpha).toBeCloseTo(iosOpacity, 2);

        // And it is the same grey. A different one here would be a second
        // palette entry hiding behind a platform check.
        expect(colour![1]).toMatch(/rgba\(207,\s*208,\s*210,/);
        expect(colour![2]).toBe('#CFD0D2');
    });

    it('spreads as far as the ios radius rather than as far as it likes', () => {
        const block = barStyles();

        const radius = Number(block.match(/shadowRadius:\s*(\d+)/)![1]);
        const elevation = block.match(
            /elevation:\s*Platform\.OS === 'android'\s*\?\s*(\d+)\s*:\s*(\d+)/,
        );
        expect(elevation).not.toBeNull();

        // Android spreads by elevation the way iOS blurs by radius. Fifteen
        // against eight is what made the halo read as its own object rather
        // than as the bar being lifted.
        expect(Number(elevation![1])).toBe(radius);
    });
});
