// src/core/iosTargets.test.ts
//
// ============================================================================
//  WHICH DEVICES THIS SHIPS TO, AND WHY THAT IS PINNED
// ============================================================================
//
//  The game is an iPhone game. Portrait only, one application target, no watch
//  app, no iPad, no Mac. That is a deliberate choice and it is currently the
//  state of the project: TARGETED_DEVICE_FAMILY is 1 in both configurations.
//
//  ---------------------------------------------------------------------------
//  IT IS PINNED BECAUSE THE XCODE UI CAN FLIP IT WITHOUT BEING ASKED TWICE
//  ---------------------------------------------------------------------------
//  "Supported Destinations" in the General tab is one checkbox away from adding
//  iPad, and Xcode has added destinations across version upgrades. Nothing
//  about that failure announces itself:
//
//    * the build succeeds
//    * the upload succeeds
//    * App Store Connect then REQUIRES a 13 inch iPad screenshot set before the
//      version can be submitted, which is the first anybody hears of it
//    * and App Review runs a portrait phone layout on an iPad, where a design
//      that assumes one hand and one column does not hold up
//
//  By then the version is blocked and the cause is a checkbox nobody remembers
//  touching. One line here is cheaper than that afternoon.
//
//  ---------------------------------------------------------------------------
//  THE NUMBERS
//  ---------------------------------------------------------------------------
//  TARGETED_DEVICE_FAMILY is a comma separated list:
//
//      1  iPhone and iPod touch
//      2  iPad
//      3  Apple TV
//      4  Apple Watch
//      6  Mac (Catalyst)
//      7  Vision
//
//  So "1" is the whole statement. "1,2" is the regression this file catches.
//
//  If iPad is ever actually wanted, this test is the place the decision gets
//  recorded, and the work that comes with it is a tablet layout and a second
//  screenshot set rather than a checkbox.
// ============================================================================

import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..', '..');
const PBXPROJ = 'ios/Succesor.xcodeproj/project.pbxproj';
const PLIST = 'ios/Succesor/Info.plist';

const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const hasIos = fs.existsSync(path.join(ROOT, PBXPROJ));
const describeIos = hasIos ? describe : describe.skip;

describeIos('the iOS build ships to iPhone and nothing else', () => {
    it('sets the device family to iPhone in EVERY configuration', () => {
        const found = [...read(PBXPROJ).matchAll(/TARGETED_DEVICE_FAMILY = "?([^";\n]+)"?;/g)]
            .map(m => m[1].trim());

        // Both configurations, not just one. Debug and Release drift apart
        // easily and a Release-only iPad flag is invisible until the upload.
        expect(found.length).toBeGreaterThanOrEqual(2);
        expect(found).toEqual(found.map(() => '1'));
    });

    it('does not quietly carry iPad, Watch, TV, Mac or Vision', () => {
        const families = [...read(PBXPROJ).matchAll(/TARGETED_DEVICE_FAMILY = "?([^";\n]+)"?;/g)]
            .flatMap(m => m[1].split(',').map(s => s.trim()));
        expect(families).not.toContain('2');   // iPad
        expect(families).not.toContain('3');   // Apple TV
        expect(families).not.toContain('4');   // Apple Watch
        expect(families).not.toContain('6');   // Mac Catalyst
        expect(families).not.toContain('7');   // Vision
    });

    it('keeps both Mac routes switched off', () => {
        const project = read(PBXPROJ);
        expect(project).toContain('SUPPORTS_MACCATALYST = NO;');
        expect(project).toContain('SUPPORTS_MAC_DESIGNED_FOR_IPHONE_IPAD = NO;');
        expect(project).not.toMatch(/SUPPORTS_MACCATALYST = YES;/);
        expect(project).not.toMatch(/SUPPORTS_MAC_DESIGNED_FOR_IPHONE_IPAD = YES;/);
    });

    it('has exactly one application target and no watch app', () => {
        const project = read(PBXPROJ);

        const apps = [...project.matchAll(
            /productType = "com\.apple\.product-type\.application"/g)];
        expect(apps).toHaveLength(1);

        // A watch app arrives as its own target with its own product type, and
        // brings a WKApplication key with it. Neither exists, and this is what
        // notices if one appears.
        expect(project).not.toMatch(/product-type\.application\.watchapp/);
        expect(project).not.toMatch(/watchkit/i);
        expect(project).not.toMatch(/WATCHOS_DEPLOYMENT_TARGET/);
        expect(read(PLIST)).not.toMatch(/WKApplication|WKWatchKitApp/);
    });

    it('stays portrait, which is why the phone only decision holds', () => {
        // The device family and the orientation are one argument, not two: a
        // single portrait column is the reason an iPad build would look wrong.
        const plist = read(PLIST);
        const block = plist.match(
            /<key>UISupportedInterfaceOrientations<\/key>\s*<array>([\s\S]*?)<\/array>/);
        expect(block).not.toBeNull();
        const orientations = [...block![1].matchAll(/<string>([^<]+)<\/string>/g)]
            .map(m => m[1]);
        expect(orientations).toEqual(['UIInterfaceOrientationPortrait']);
    });
});
