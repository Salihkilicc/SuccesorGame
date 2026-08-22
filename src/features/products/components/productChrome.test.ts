// src/features/products/components/productChrome.test.ts
//
// ============================================================================
//  THE FURNITURE ON THE PRODUCT SCREENS
// ============================================================================
//
//  Four separate complaints, one theme: controls that were built by accretion
//  rather than decided on.
//
//    FIVE PRESETS WHERE THREE ANSWERS EXIST. The contract row offered Off,
//    +25% Extra, +50% Extra, Match Gap and Max. The two percentages answer a
//    question nobody asks - you outsource to cover a shortfall, not to add a
//    fixed fraction of your own output - and five buttons wrapped onto a
//    second line on a phone.
//
//    EMOJI AS ICONS. 📦, 📊 and 🔒 sit at a different weight, in a different
//    typeface, in a colour nothing in the theme chose, next to text that
//    obeys all three.
//
//    A HEADER THAT DID NOT MEASURE. Both accessories are absolutely
//    positioned and the title reserved a FIXED gutter - the back button's
//    width - so anything wider on the right had the title running under it.
//    On the tech tree that is the research points, reported as
//    "innovation centerda RP points cakisiyor".
//
//    AND THE PLANT REBUILD WAS A SYSTEM ALERT with eight figures in three
//    paragraphs of prose.
//
//  Read off the source, because none of this is behaviour. What will quietly
//  come undone is somebody adding a fourth preset, or a sixth emoji.
// ============================================================================

import fs from 'fs';
import path from 'path';

const SRC = path.join(__dirname, '..', '..', '..');

const read = (...p: string[]) => fs.readFileSync(path.join(SRC, ...p), 'utf8');

/** Comments here describe the bugs at length. The rules are about code. */
const code = (...p: string[]) => read(...p)
    .split('\n')
    .filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l))
    .join('\n');

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

describe('the contract manufacturing row', () => {
    const src = () => code('features', 'products', 'components', 'ProductModals.tsx');

    it('offers three answers, not five', () => {
        // None of it, exactly the shortfall, or everything they will sell you.
        expect(src()).not.toContain('+25% Extra');
        expect(src()).not.toContain('+50% Extra');
        expect(src()).toContain("key: 'off'");
        expect(src()).toContain("key: 'gap'");
        expect(src()).toContain("key: 'max'");
    });

    it('and they sit in one row rather than wrapping', () => {
        expect(src()).toMatch(/contractPresetsRow:\s*\{[^}]*flexDirection:\s*'row'/);
        expect(src()).not.toMatch(/contractPresetsRow:\s*\{[^}]*flexWrap/);
    });

    it('while Match gap stays put when there is no gap', () => {
        // It used to vanish, which moved the other two buttons under the
        // player's thumb between one render and the next.
        expect(src()).toMatch(/off:\s*supplyGap >= 0/);
    });
});

describe('the icons are icons', () => {
    it('so no emoji is left doing an icon\'s job on the product screens', () => {
        const offenders = code('features', 'products', 'components', 'ProductModals.tsx')
            .split('\n')
            .filter(l => EMOJI.test(l));
        expect(offenders).toEqual([]);
    });

    it('and a row can carry one properly', () => {
        const disclosure = code('components', 'common', 'Disclosure.tsx');
        expect(disclosure).toMatch(/icon\?:\s*string/);
        expect(disclosure).toContain('<MaterialCommunityIcons');
    });

    it('including the inventory row that started this', () => {
        expect(code('features', 'products', 'components', 'ProductModals.tsx'))
            .toMatch(/icon="package-variant-closed"[\s\S]{0,80}label="Inventory"/);
    });
});

describe('the screen header', () => {
    const src = () => code('components', 'common', 'ScreenHeader.tsx');

    it('measures what is on the right instead of assuming', () => {
        expect(src()).toContain('onLayout');
        expect(src()).toMatch(/setRightWidth/);
    });

    it('and keeps the title optically centred by padding both sides', () => {
        // The same gutter on both, so a long title shrinks symmetrically
        // rather than sliding left into the back button.
        expect(src()).toMatch(/paddingHorizontal:\s*Math\.max\(HEADER_BACK_SIZE, rightWidth\)/);
    });
});

describe('rebuilding the plant', () => {
    const src = () => code('features', 'assets', 'components', 'FacilityPanel.tsx');

    it('is a panel in the game rather than an OS dialog', () => {
        expect(src()).not.toContain('Alert.alert');
        expect(src()).toContain('<ConfirmPanel');
    });

    it('and the eight figures are rows rather than a paragraph', () => {
        for (const label of [
            'Cost', 'Build time', 'Capacity while building',
            'Capacity when it lands', 'Crew it needs', 'Unit cost',
            'Brand ceiling', 'Quality ceiling',
        ]) {
            expect(src()).toContain(`label: '${label}'`);
        }
    });
});
