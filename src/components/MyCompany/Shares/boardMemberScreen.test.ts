// src/components/MyCompany/Shares/boardMemberScreen.test.ts
//
// ============================================================================
//  EVERYTHING ABOUT A DIRECTOR IS ON THE DIRECTOR'S PAGE
// ============================================================================
//
//  "Her seyi bu board memberin kendi ekraninda toplayalim, her seyi oradan
//  yapalim" and "ekrandaki seyler cok buyuk duzensiz duruyor".
//
//  What was wrong was not any one screen. It was that the things you can do
//  about one person were split across two places with no rule for which was
//  where: the board room list carried a trust bar, that person's outstanding
//  promises, a "Speak privately" button AND a button whose only job was to
//  open their page. With six directors that is six stacked control panels.
//
//  These are structural assertions, read off the source, because the layout
//  itself is not testable here and the thing that will quietly come undone is
//  the SPLIT - somebody adding one more action to the list row because that is
//  where the last one was.
// ============================================================================

import fs from 'fs';
import path from 'path';

const read = (file: string) => fs.readFileSync(path.join(__dirname, file), 'utf8');

/** Comments in this codebase describe the bugs at length; rules are about code. */
const codeOf = (file: string) => read(file)
    .split('\n')
    .filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l))
    .join('\n');

describe('the board room is a list', () => {
    const code = () => codeOf('BoardRoomModal.tsx');

    it('and a row opens the person rather than acting on them', () => {
        expect(code()).toContain("navigation.navigate('BoardMember'");
    });

    it('and carries no actions of its own any more', () => {
        // The two buttons that used to sit on every row.
        expect(code()).not.toContain('board.speakPrivately');
        expect(code()).not.toContain('board.openMember');
    });

    it('and no trust bar, and no promises', () => {
        // A list answers who, how much and where they stand. A progress bar
        // per row and a promise box per row is a dashboard per row.
        expect(code()).not.toContain('styles.trustBarFill');
        expect(code()).not.toContain('styles.promiseBox');
    });

    it('while the member page is not raised from inside it', () => {
        // A modal on top of a modal draws above the nav bar and comes up from
        // the bottom, which is the one transition nothing else in the game
        // uses. See components/common/ScreenHost.tsx.
        expect(code()).not.toContain('<MemberInteractionModal');
    });
});

describe('and the member page has all of it', () => {
    const code = () => codeOf('MemberInteractionModal.tsx');

    it('including speaking to them privately', () => {
        expect(code()).toContain('board.speakPrivately');
        expect(code()).toContain('const handleLobby');
    });

    it('and the promises you owe this one', () => {
        expect(code()).toMatch(/promises[\s\S]{0,200}pr\.memberId === member\.id/);
    });

    it('and the gestures, which were always here', () => {
        expect(code()).toContain('equity.sendGift');
        expect(code()).toContain('equity.privateDinner');
        expect(code()).toContain('equity.buyout');
    });

    it('and it is a route, with the same header as every other page', () => {
        expect(code()).toContain('<ScreenHost');
        expect(code()).toContain('<ScreenHeader');
        expect(code()).not.toContain('<GameModal');
    });

    it('and the name is in the header rather than in the page', () => {
        // The hero opened with an avatar, the name, the trait and a trust
        // pill before a single number appeared - most of a phone spent saying
        // who you were looking at, on a page reached by tapping their name.
        expect(code()).not.toContain('styles.heroName');
        expect(code()).not.toContain('styles.heroAvatar');
        expect(code()).toMatch(/title=\{member\.name\}/);
    });
});

describe('and the route exists', () => {
    const nav = () => fs.readFileSync(
        path.join(__dirname, '..', '..', '..', 'navigation', 'RootNavigator.tsx'), 'utf8',
    );

    it('so the transition is the one every other detail page uses', () => {
        expect(nav()).toContain('name="BoardMember"');
        expect(nav()).toMatch(/BoardMember:\s*\{\s*memberId:\s*string\s*\}/);
    });

    it('and the nav bar keeps the Company tab lit on it', () => {
        // Pushed on top of the Company tab, so dropping the highlight would
        // read as having left the section.
        expect(nav()).toMatch(/COMPANY_ROUTES[\s\S]{0,400}'BoardMember'/);
    });
});
