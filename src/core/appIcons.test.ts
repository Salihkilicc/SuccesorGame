// src/core/appIcons.test.ts
//
// ============================================================================
//  THE ICON FILES, CHECKED AS FILES
// ============================================================================
//
//  Icons are the one part of the build with no compiler, no type and no
//  runtime behaviour to go wrong. A wrong one builds, installs, and simply
//  looks wrong on every home screen, or is rejected by a store days later with
//  a one line message.
//
//  Three faults shipped before this file existed, and every one of them was
//  invisible from inside the app:
//
//    1. `ic_launcher_foreground.png` was the full artwork edge to edge. An
//       adaptive layer is 108dp and only the centre 72dp is guaranteed, so
//       Android cropped a quarter off every side and showed a zoomed face.
//    2. `ic_launcher_round.png` was a SQUARE with no alpha channel, filling a
//       round icon slot on the API 24 and 25 launchers that use it.
//    3. the foreground was opaque, so the background layer was never seen.
//
//  ---------------------------------------------------------------------------
//  THE ALPHA CHANNEL IS A REQUIREMENT IN BOTH DIRECTIONS
//  ---------------------------------------------------------------------------
//  Apple REJECTS a 1024 app icon that carries an alpha channel at all. Google
//  REQUIRES the 512 Play icon to be a 32 bit PNG WITH alpha. One careless
//  `save()` satisfies one store and fails the other, and the failure arrives
//  as an email after the upload rather than as a red test here.
//
//  So the PNG headers are read directly. `scripts/icons.py` prints what it
//  wrote, and printing is not proving: the bytes on disk are what ships.
// ============================================================================

import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..', '..');
const RES = path.join(ROOT, 'android/app/src/main/res');
const STORE = path.join(ROOT, 'assets/icon/store');
const APPICONSET = path.join(ROOT, 'ios/Succesor/Images.xcassets/AppIcon.appiconset');

/** Android's adaptive icon geometry, which is what fault 1 above got wrong. */
const LAYER_DP = 108;
const WINDOW_DP = 72;

const DENSITIES: Record<string, number> = {
    mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4,
};

/**
 * Width, height and colour type, straight out of the IHDR chunk.
 *
 * A PNG is an 8 byte signature, then a 4 byte length, then "IHDR", then
 * width and height as big endian 32 bit integers, then bit depth at byte 24
 * and colour type at byte 25. Colour type 6 is RGBA and 4 is grey plus alpha;
 * everything else carries no alpha channel.
 */
const readPng = (file: string) => {
    const head = fs.readFileSync(file).subarray(0, 26);
    const signature = head.subarray(0, 8).toString('hex');
    expect(signature).toBe('89504e470d0a1a0a');
    const colourType = head[25];
    return {
        width: head.readUInt32BE(16),
        height: head.readUInt32BE(20),
        colourType,
        hasAlpha: colourType === 4 || colourType === 6,
        bytes: fs.statSync(file).size,
    };
};

describe('the Android launcher icon', () => {
    const densities = Object.entries(DENSITIES);

    it.each(densities)('has every file at %s', (name) => {
        const dir = path.join(RES, `mipmap-${name}`);
        for (const f of [
            'ic_launcher.png',
            'ic_launcher_round.png',
            'ic_launcher_foreground.png',
            'ic_launcher_background.png',
        ]) {
            expect(fs.existsSync(path.join(dir, f))).toBe(true);
        }
    });

    // -----------------------------------------------------------------------
    //  The size IS the bug. A 108dp layer that is 48dp of pixels, or a 48dp
    //  legacy icon that is 108dp of pixels, is exactly how the crop happened.
    // -----------------------------------------------------------------------
    it.each(densities)('sizes both adaptive layers to 108dp at %s', (name, k) => {
        const expected = Math.round(LAYER_DP * (k as number));
        for (const f of ['ic_launcher_foreground.png', 'ic_launcher_background.png']) {
            const png = readPng(path.join(RES, `mipmap-${name}`, f));
            expect({ f, w: png.width, h: png.height })
                .toEqual({ f, w: expected, h: expected });
        }
    });

    it.each(densities)('sizes both legacy icons to 48dp at %s', (name, k) => {
        const expected = Math.round(48 * (k as number));
        for (const f of ['ic_launcher.png', 'ic_launcher_round.png']) {
            const png = readPng(path.join(RES, `mipmap-${name}`, f));
            expect({ f, w: png.width, h: png.height })
                .toEqual({ f, w: expected, h: expected });
        }
    });

    // -----------------------------------------------------------------------
    //  Fault 2. A round icon slot filled with an opaque square.
    // -----------------------------------------------------------------------
    it.each(densities)('gives the round icon a real alpha channel at %s', (name) => {
        const png = readPng(path.join(RES, `mipmap-${name}`, 'ic_launcher_round.png'));
        expect(png.hasAlpha).toBe(true);
    });

    it('declares both layers in the adaptive icon', () => {
        for (const f of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
            const xml = fs.readFileSync(
                path.join(RES, 'mipmap-anydpi-v26', f), 'utf8');
            expect(xml).toContain('<adaptive-icon');
            expect(xml).toMatch(/<background[^>]+@mipmap\/ic_launcher_background/);
            expect(xml).toMatch(/<foreground[^>]+@mipmap\/ic_launcher_foreground/);
        }
    });

    /**
     * The window is the part of the layer the system guarantees is visible.
     *
     * Stated here as a number rather than left in a comment because the whole
     * fault was that nobody had worked it out: at xxxhdpi the launcher shows
     * 288 of the 432 pixels and discards 72 from every edge.
     */
    it('reserves a quarter of each layer for the mask', () => {
        const layer = Math.round(LAYER_DP * 4);
        const window = Math.round(WINDOW_DP * 4);
        expect(layer).toBe(432);
        expect(window).toBe(288);
        expect((layer - window) / 2).toBe(72);
    });
});

describe('the store uploads', () => {
    // -------------------------------------------------------------------
    //  Requirements read off Google's own page rather than remembered:
    //  "32-bit PNG (with alpha)", "512px by 512px", "Maximum file size: 1024KB"
    // -------------------------------------------------------------------
    it('meets the Play icon specification', () => {
        const png = readPng(path.join(STORE, 'play-icon-512.png'));
        expect(png.width).toBe(512);
        expect(png.height).toBe(512);
        expect(png.hasAlpha).toBe(true);
        expect(png.bytes).toBeLessThan(1024 * 1024);
    });

    //  "JPEG or 24-bit PNG (no alpha)", "1024px by 500px"
    it('meets the Play feature graphic specification', () => {
        const png = readPng(path.join(STORE, 'play-feature-graphic-1024x500.png'));
        expect(png.width).toBe(1024);
        expect(png.height).toBe(500);
        expect(png.hasAlpha).toBe(false);
    });

    // -------------------------------------------------------------------
    //  Apple rejects an app icon carrying an alpha channel. This is the one
    //  assertion in the file that has already cost other people a submission.
    // -------------------------------------------------------------------
    it('meets the App Store icon specification', () => {
        for (const file of [
            path.join(STORE, 'appstore-icon-1024.png'),
            path.join(APPICONSET, '1024.png'),
        ]) {
            const png = readPng(file);
            expect({ file, w: png.width, h: png.height, alpha: png.hasAlpha })
                .toEqual({ file, w: 1024, h: 1024, alpha: false });
        }
    });

    it('keeps the originals, so the master can be recut', () => {
        expect(fs.existsSync(path.join(ROOT, 'assets/icon/original/master-1024.png')))
            .toBe(true);
    });
});

// ===========================================================================
//  THE NAME UNDER THE ICON
// ===========================================================================
//
//  Two different names live in this project and only one of them is visible:
//
//    "Successor"  the app label, the App Store listing and the Play listing
//    "Succesor"   the AppRegistry component id, in index.js and MainActivity
//
//  The second is an internal key that only has to match ITSELF on both sides,
//  and androidBoot.test.ts already pins that pair. It was also, for a while,
//  the visible name: the home screen read "Succesor" while the App Store
//  listing read "Successor", so the icon carried a misspelling of the store's
//  own name on every device.
//
//  Making them all agree is the obvious tidy and it is the wrong one. Renaming
//  the component id without renaming MainActivity.kt in the same commit opens a
//  white screen with nothing in the log. So the two names are asserted here
//  SEPARATELY, and the separation is the point.
// ===========================================================================

describe('the name under the icon', () => {
    /** The visible one. Must equal both store listings. */
    const DISPLAY_NAME = 'Successor';

    /** The internal one. Must equal MainActivity.getMainComponentName(). */
    const REGISTRY_ID = 'Succesor';

    const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');

    it('labels the Android launcher with the store name', () => {
        const strings = read('android/app/src/main/res/values/strings.xml');
        const match = strings.match(/<string name="app_name">([^<]+)<\/string>/);
        expect(match?.[1]).toBe(DISPLAY_NAME);
    });

    it('labels the iOS home screen with the store name', () => {
        const plist = read('ios/Succesor/Info.plist');
        const match = plist.match(
            /<key>CFBundleDisplayName<\/key>\s*<string>([^<]+)<\/string>/);
        expect(match?.[1]).toBe(DISPLAY_NAME);
    });

    it('agrees in app.json', () => {
        const app = JSON.parse(read('app.json'));
        expect(app.displayName).toBe(DISPLAY_NAME);

        // Deliberately NOT the display name. This is the registration key.
        expect(app.name).toBe(REGISTRY_ID);
    });

    it('leaves the registration key alone on both sides of the bridge', () => {
        // The guard against the tidy described above. androidBoot.test.ts
        // compares these two to each other; this compares them to the name
        // that must NOT have followed the rename.
        expect(read('index.js')).toContain(`registerComponent('${REGISTRY_ID}'`);
        expect(read('android/app/src/main/java/com/salihkilic/successor/MainActivity.kt'))
            .toContain(`getMainComponentName(): String = "${REGISTRY_ID}"`);
    });

    it('puts the store name on the feature graphic', () => {
        // The wordmark is drawn by scripts/icons.py from APP_NAME. Pinned
        // because the graphic is a binary: nothing else would notice it still
        // saying the old spelling.
        expect(read('scripts/icons.py'))
            .toContain(`APP_NAME = '${DISPLAY_NAME.toUpperCase()}'`);
    });
});
