// src/features/casino/tableWiring.test.ts
//
// ============================================================================
//  TWO TABLES THAT STOPPED WORKING FOR OPPOSITE REASONS
// ============================================================================
//
//  BLACKJACK LOCKED SOLID. Reported as "in blackjack I cannot play any more
//  after I lose, it is bizarre". It was mine, from the pacing change, and it
//  is the plainest kind of mistake: `busy` is raised when the table starts
//  showing you something, and every path lowered it again EXCEPT the one that
//  runs when you stand. Standing is how most hands end, so most hands left the
//  table frozen and DEAL dead forever.
//
//  It is fixed in `resolveRound` rather than in the three callers, because
//  "the hand is over" and "the table has stopped showing you things" are the
//  same moment - and three callers is three chances to forget, which is
//  exactly what happened.
//
//  POKER NEVER STARTED. Reported as "the table keeps changing... we do not win
//  the money in the pot... this mechanic is weak, it should be like a real
//  table". The hook reseated five new people with fresh stacks every hand and
//  cashed your profit out immediately, so there was no table to be at. There
//  is a session now; the engine side of it is pinned in
//  core/casino/pokerSession.test.ts and this is the wiring.
// ============================================================================

import fs from 'fs';
import path from 'path';

const read = (...p: string[]) => fs.readFileSync(path.join(__dirname, ...p), 'utf8');
const bj = () => read('logic', 'useBlackjackLogic.ts');
const poker = () => read('logic', 'useSixHandedPoker.ts');
const screen = () => read('screens', 'PokerGameScreen.tsx');

describe('blackjack lets you play again after you lose', () => {
    it('the round ending is what frees the table', () => {
        // THE DEFECT. One shared exit, not one per caller.
        const src = bj();
        const resolve = src.slice(src.indexOf('const resolveRound ='));
        const body = resolve.slice(0, resolve.indexOf('\n    };'));
        expect(body).toMatch(/setRoundState\('done'\);/);
        expect(body).toMatch(/setBusy\(false\);/);
    });

    it('and standing is the path that used to be missed', () => {
        // It scheduled the settlement and never cleared the flag itself.
        const src = bj();
        const standAt = src.indexOf("stand: () =>");
        const stand = src.slice(standAt, src.indexOf('adjustBet:', standAt));
        expect(stand).toMatch(/setBusy\(true\);/);
        expect(stand).toMatch(/after\(showing, \(\) => resolveRound\(outcome\)\)/);
    });

    it('and every other path still gets there too', () => {
        const src = bj();
        expect((src.match(/setBusy\(false\)/g) || []).length).toBeGreaterThanOrEqual(3);
    });
});

describe('and poker is a table you sit at', () => {
    it('sitting down, dealing and leaving are three different actions', () => {
        // They used to be one function called `deal`, which is the bug in
        // miniature: if buying in and being dealt a hand are the same event,
        // every hand is a new buy-in and there is no table.
        const src = poker();
        expect(src).toMatch(/const sitDown = useCallback/);
        expect(src).toMatch(/const deal = useCallback/);
        expect(src).toMatch(/const leave = useCallback/);
        expect(src).toMatch(/sitDown,\s*\n\s*deal,\s*\n\s*leave,/);
    });

    it('and cash moves exactly twice, in and out', () => {
        // THE DEFECT. `settle` used to move your profit into your cash on
        // every hand, which is why the pot was converted rather than won.
        const src = poker();
        const settleAt = src.indexOf('const settle = useCallback');
        const settle = src.slice(settleAt, src.indexOf('// ---', settleAt + 100));
        expect(settle).not.toMatch(/setField\('money'/);
        // Sitting down pays, leaving collects.
        expect(src).toMatch(/setField\('money', Math\.max\(0, money - buyIn\)\)/);
        expect(src).toMatch(/getState\(\)\.money \+ back/);
    });

    it('and the hand is dealt from the chips already on the table', () => {
        const src = poker();
        expect(src).toMatch(/startRound\(\s*toPlayers\(current\), current\.stake/);
        expect(src).not.toMatch(/stack: startingStack/);
    });

    it('and nobody is reseated between hands', () => {
        // `seatTable` used to be called on every deal. It is called when you
        // sit down, and when a seat needs a new person.
        const src = poker();
        const dealAt = src.indexOf('const deal = useCallback');
        const deal = src.slice(dealAt, src.indexOf('const leave', dealAt));
        expect(deal).not.toMatch(/seatTable\(/);
        expect(deal).not.toMatch(/seatBots\(/);
    });

    it('and a busted seat is filled by somebody new', () => {
        expect(poker()).toMatch(/replaceBusted\(banked, seatTable\(vip, Math\.random, gone\)/);
    });

    it('and leaving the screen cashes you out rather than binning your chips', () => {
        // Chips that only exist inside a hook vanish when the player presses
        // back, which would be a worse bug than the one being fixed.
        const src = poker();
        expect(src).toMatch(/useEffect\(\(\) => \(\) => \{[\s\S]{0,400}cashOut\(current\)/);
        expect(src).toMatch(/sessionRef/);
    });
});

describe('and the screen shows a lobby, then a table', () => {
    it('the chips choose a stake and the buy-in follows from it', () => {
        const src = screen();
        expect(src).toMatch(/\{!seated && \(/);
        expect(src).toMatch(/money\(buyIn\)/);
    });

    it('and MAX picks the biggest stake the bankroll covers', () => {
        // Asked for by name.
        const src = screen();
        expect(src).toMatch(/const topStake = maxStakeFor\(cash, chipsFor\(currentLocation, cash\)\)/);
        expect(src).toMatch(/onPress=\{\(\) => actions\.setAnte\(topStake\)\}/);
    });

    it('and you cannot sit down with money you do not have', () => {
        // Asked for as "if there is no money, do not sit down". The button
        // says so rather than throwing an alert after the tap.
        const src = screen();
        expect(src).toMatch(/const canAfford = cash >= buyIn && ante > 0/);
        expect(src).toMatch(/disabled=\{!canAfford\}/);
        expect(src).toMatch(/casino\.notEnough/);
    });

    it('and once seated the choice is deal or leave', () => {
        const src = screen();
        expect(src).toMatch(/\{seated && \(!round \|\| handOver\) && \(/);
        expect(src).toMatch(/onPress=\{actions\.leave\}/);
        expect(src).toMatch(/casino\.cashOut/);
    });

    it('and a seat shows its chips between hands, not zero', () => {
        // Between hands there is no round at all. A table of five zero
        // stacks would be the old model showing through.
        expect(screen()).toMatch(/stack=\{p\?\.stack \?\? seats\[i \+ 1\]\?\.stack \?\? 0\}/);
    });

    it('and you can see whether the session is up or down', () => {
        // Muted, not green or red: those belong to the company's profit and
        // loss and a warm poker session is not that.
        const src = screen();
        expect(src).toMatch(/sessionUp/);
        const style = src.slice(src.indexOf('sessionUp: {'));
        expect(style.slice(0, style.indexOf('}'))).toMatch(/theme\.colors\.textMuted/);
    });

    it('and every new string exists in both languages', () => {
        const en = fs.readFileSync(path.join(__dirname, '..', '..', 'core', 'i18n', 'en.ts'), 'utf8');
        const tr = fs.readFileSync(path.join(__dirname, '..', '..', 'core', 'i18n', 'tr.ts'), 'utf8');
        for (const key of [
            'casino.sitDown', 'casino.notEnough', 'casino.cashOut', 'casino.outOfChips',
            'casino.tapWheel', 'casino.placeChipsFirst',
        ]) {
            expect([key, en.includes(`'${key}'`)]).toEqual([key, true]);
            expect([key, tr.includes(`'${key}'`)]).toEqual([key, true]);
        }
    });

    it('and no player-visible string uses a dash', () => {
        // The house rule. Turkish and English both.
        const en = fs.readFileSync(path.join(__dirname, '..', '..', 'core', 'i18n', 'en.ts'), 'utf8');
        const tr = fs.readFileSync(path.join(__dirname, '..', '..', 'core', 'i18n', 'tr.ts'), 'utf8');
        for (const src of [en, tr]) {
            for (const key of ['casino.sitDown', 'casino.cashOut', 'casino.tapWheel', 'casino.outOfChips']) {
                const line = src.split('\n').find(l => l.includes(`'${key}'`)) || '';
                expect([key, /—| - /.test(line)]).toEqual([key, false]);
            }
        }
    });
});
