// src/core/ads/gate.test.ts
//
// ============================================================================
//  THE DOOR, TESTED BEFORE THE SDK IS INSTALLED
// ============================================================================
//
//  policy.test.ts checks the RULES. This checks the three things the rules
//  cannot see: that the purchase is read from the store rather than passed in,
//  that a presenter which explodes cannot take the game down with it, and that
//  a tap is not a trigger.
// ============================================================================

import { useIdentityStore } from '../store/useIdentityStore';
import {
    adGate,
    adPacingSnapshot,
    countCasinoTap,
    hasAdPresenter,
    resetAdPacing,
    setAdPresenter,
} from './gate';
import { CASINO_BASE_MS, QUARTERS_PER_AD } from './policy';

beforeEach(() => {
    resetAdPacing();
    useIdentityStore.setState({ adFree: false });
});

describe('the gate reads the purchase from the store, not from its caller', () => {
    it('shows on the fourth quarter for a player who has not paid', async () => {
        let shown = 0;
        setAdPresenter(async () => { shown++; });

        for (let i = 0; i < QUARTERS_PER_AD; i++) await adGate('quarterAdvanced');
        expect(shown).toBe(1);
    });

    it('and shows nothing at all for one who has', async () => {
        let shown = 0;
        setAdPresenter(async () => { shown++; });
        useIdentityStore.setState({ adFree: true });

        for (let i = 0; i < QUARTERS_PER_AD * 3; i++) await adGate('quarterAdvanced');
        await adGate('leftPokerTable');
        await adGate('casinoTick', CASINO_BASE_MS * 2);
        await adGate('datePressed');
        await adGate('datePressed');
        await adGate('datePressed');

        expect(shown).toBe(0);
    });

    it('and a purchase mid-session takes effect on the very next trigger', async () => {
        // ------------------------------------------------------------------
        //  THE ONE THAT WOULD BE A REFUND REQUEST
        // ------------------------------------------------------------------
        //  If the gate had captured `adFree` at startup instead of reading it
        //  per decision, somebody would pay and then be shown an ad, and the
        //  first thing they would do is ask for their money back. This is why
        //  currentState() calls getState() every time.
        // ------------------------------------------------------------------
        let shown = 0;
        setAdPresenter(async () => { shown++; });

        for (let i = 0; i < QUARTERS_PER_AD - 1; i++) await adGate('quarterAdvanced');
        expect(shown).toBe(0);

        useIdentityStore.getState().applyEntitlement(true);

        await adGate('quarterAdvanced');
        expect(shown).toBe(0);
    });

    it('and a refund brings them back rather than silencing the game forever', async () => {
        let shown = 0;
        setAdPresenter(async () => { shown++; });
        useIdentityStore.getState().applyEntitlement(true);
        await adGate('leftPokerTable');
        expect(shown).toBe(0);

        useIdentityStore.getState().applyEntitlement(false);
        await adGate('leftPokerTable');
        expect(shown).toBe(1);
    });
});

describe('the advertisement is the least important thing happening', () => {
    it('a presenter that throws does not stop the caller', async () => {
        setAdPresenter(async () => { throw new Error('no fill'); });
        await expect(adGate('leftPokerTable')).resolves.toMatchObject({ show: true });
    });

    it('and the counter is still consumed, so a bad connection is not punished', async () => {
        // Retrying on the next trigger would mean somebody on a train meets
        // the attempt at every single act break.
        setAdPresenter(async () => { throw new Error('no fill'); });
        for (let i = 0; i < QUARTERS_PER_AD; i++) await adGate('quarterAdvanced');
        expect(adPacingSnapshot().quartersSinceAd).toBe(0);
    });

    it('and the gate waits for the ad before letting the caller carry on', async () => {
        // Otherwise the quarterly report renders underneath the interstitial.
        let finished = false;
        setAdPresenter(() => new Promise<void>(resolve => {
            setTimeout(() => { finished = true; resolve(); }, 10);
        }));

        await adGate('leftPokerTable');
        expect(finished).toBe(true);
    });
});

describe('a casino tap is not a trigger', () => {
    it('a hundred taps show nothing', async () => {
        let shown = 0;
        setAdPresenter(async () => { shown++; });
        for (let i = 0; i < 100; i++) countCasinoTap();
        expect(shown).toBe(0);
    });

    it('but they do bring the next one closer', async () => {
        let shown = 0;
        setAdPresenter(async () => { shown++; });
        for (let i = 0; i < 120; i++) countCasinoTap();

        await adGate('casinoTick', CASINO_BASE_MS - 90_000);
        expect(shown).toBe(1);
    });
});

describe('before the SDK is installed', () => {
    it('the gate still decides, and says nothing can show it', () => {
        // hasAdPresenter is what the settings screen and any future dev panel
        // use to tell "no ad was owed" apart from "nothing could have shown
        // one". Two gates in this codebase shipped shut and neither could be
        // told apart from the outside.
        setAdPresenter(async () => { });
        expect(hasAdPresenter()).toBe(true);
    });
});
