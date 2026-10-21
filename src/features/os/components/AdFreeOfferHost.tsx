// src/features/os/components/AdFreeOfferHost.tsx
//
// ============================================================================
//  THE OTHER END OF THE OFFER SEAM
// ============================================================================
//
//  policy.ts decides WHEN (every tenth advertisement) and gate.ts owns the
//  MOMENT (after the advertisement closes, never during). Neither of them can
//  draw anything, deliberately: the rules stay pure and testable without a
//  device, which is the arrangement the whole advertising module is built on.
//
//  This is the piece that draws. It registers itself with the gate once, holds
//  one boolean, and opens the sheet that Settings already opens. Nothing else.
//
//  ---------------------------------------------------------------------------
//  WHY IT IS MOUNTED AT THE ROOT AND NOT ON A SCREEN
//  ---------------------------------------------------------------------------
//  The four triggers live on four different screens: the home screen advances
//  a quarter, the poker table is left, the casino ticks, a date is pressed.
//  An offer owned by any one of them would appear only when that screen
//  happened to be mounted, and the one that fires most is the one the player
//  is navigating AWAY from.
//
//  ---------------------------------------------------------------------------
//  AND WHY THE SHEET IS THE SAME COMPONENT SETTINGS USES
//  ---------------------------------------------------------------------------
//  Two purchase surfaces is two sets of words, two prices and two restore
//  controls, and the one that falls behind is always the one nobody opened
//  while testing. removeAdsSheet.test.ts walks the whole app to make sure
//  there stays exactly one.
// ============================================================================

import React, { useEffect, useState } from 'react';

import { setOfferPresenter } from '../../../core/ads/gate';
import RemoveAdsSheet from './RemoveAdsSheet';

const AdFreeOfferHost: React.FC = () => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        // ------------------------------------------------------------------
        //  REGISTERED ONCE, AND DELIBERATELY NOT UNREGISTERED
        // ------------------------------------------------------------------
        //  This component is mounted for the life of the app. A cleanup that
        //  set the presenter back to the no-op would run on a fast refresh in
        //  development and leave the gate with nothing registered, which is a
        //  feature that works in release and silently does not while somebody
        //  is building it. That is the worst shape of bug to debug.
        // ------------------------------------------------------------------
        setOfferPresenter(() => setOpen(true));
    }, []);

    return <RemoveAdsSheet visible={open} onClose={() => setOpen(false)} />;
};

export default AdFreeOfferHost;
