// src/features/assets/screens/CompanyScreens.tsx
//
// ============================================================================
//  THE COMPANY SECTIONS, AS SCREENS
// ============================================================================
//
//  Board Members, Team Morale, Finance, My Empire, Hostile Takeover and the
//  Stock Market were all RN Modals raised from My Company. Two things followed
//  from that and both were visible:
//
//  1) THEY CAME UP FROM THE BOTTOM while Products slid in from the right,
//     because Products was a route and these were not. The same kind of
//     navigation with two different gestures is what made the app feel like
//     separate pieces.
//
//  2) THE NAV BAR VANISHED ON THEM. An RN Modal renders above everything in
//     the tree, including the bar - so on these screens the bar was either
//     absent or, where a screen drew its own copy inside the modal, present
//     but sitting outside the touchable area. That is the "it is there but it
//     does nothing" case.
//
//  Both are fixed by making them real routes. The components themselves are
//  unchanged: each wrapper mounts the existing component with `visible` fixed
//  open and `onClose` wired to going back. Their own child modals (Borrow,
//  Repay, Buyback, Dilution, Dividend) stay modals, because those ARE
//  transient decisions rather than places.
// ============================================================================

import React, { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';

import CorporateFinanceHubModal from '../../../components/MyCompany/Finance/CorporateFinanceHubModal';
import BorrowModal from '../../../components/MyCompany/Finance/BorrowModal';
import RepayModal from '../../../components/MyCompany/Finance/RepayModal';
import EmployeesModule from '../../../components/MyCompany/Management/EmployeesModule';
import BoardRoomModal from '../../../components/MyCompany/Shares/BoardRoomModal';
import MemberInteractionModal from '../../../components/MyCompany/Shares/MemberInteractionModal';
import ShareControlHub from '../../../components/MyCompany/Shares/ShareControlHub';
import { SiliconNewsModal } from '../../news';
import BuybackModal from '../../../components/MyCompany/Shares/BuybackModal';
import DilutionModal from '../../../components/MyCompany/Shares/DilutionModal';
import DividendModal from '../../../components/MyCompany/Shares/DividendModal';
import IpoModal from '../../../components/MyCompany/Shares/IpoModal';
import { AcquisitionModal } from '../../../components/MyCompany/Actions/AcquisitionModal';
import ExistingCompaniesModal from '../../../components/MyCompany/Finance/ExistingCompaniesModal';
import CapitalInjectionModal from '../../../components/MyCompany/Finance/CapitalInjectionModal';
import SharkDealModal from '../../../components/MyCompany/Finance/SharkDealModal';
import { useShareholderStore } from '../../../features/shareholders/stores/useShareholderStore';

// A route of its own file because it is long enough to deserve one. Named
// here so the navigator still has a single import for every company route.
export { default as SubsidiaryScreen } from './SubsidiaryScreen';

/** Going back is what "close" means once these are screens. */
const useGoBack = () => {
    const navigation = useNavigation<any>();
    return () => navigation.goBack();
};

export const BoardMembersScreen = () => {
    const close = useGoBack();
    return <BoardRoomModal asScreen visible onClose={close} />;
};

/**
 * One director, and everything you can do about them.
 *
 * A ROUTE rather than a modal raised from the board room, for the reason at
 * the top of this file plus one of its own: the board list was carrying the
 * member's trust bar, their promises and two action buttons INSIDE each row,
 * so the list of directors read as a stack of dashboards. Everything about a
 * person belongs on that person's page.
 */
export const BoardMemberScreen = () => {
    const close = useGoBack();
    const route = useRoute<any>();
    return (
        <MemberInteractionModal
            asScreen
            visible
            onClose={close}
            memberId={route.params?.memberId ?? ''}
        />
    );
};

export const TeamMoraleScreen = () => {
    const close = useGoBack();
    return <EmployeesModule asScreen visible onClose={close} />;
};

export const FinanceScreen = () => {
    const close = useGoBack();
    const navigation = useNavigation<any>();
    // Borrowing and repaying are their OWN routes rather than modals raised
    // here. As modals they drew above the nav bar, so the bar vanished on them
    // - the same fault the company sections had before they became routes.
    return (
        <CorporateFinanceHubModal
            asScreen
            visible
            onClose={close}
            onRequestLoan={() => navigation.navigate('BorrowLoan')}
            onRepayDebt={() => navigation.navigate('RepayDebt')}
        />
    );
};

/**
 * SILICON NEWS, as a route.
 *
 * It was a Modal raised from the home screen, which meant it arrived from the
 * BOTTOM while every other destination in the game pushes in from the right.
 * See the note at the top of SiliconNewsModal.
 */
export const NewsScreen = () => {
    const close = useGoBack();
    return <SiliconNewsModal asScreen visible onClose={close} />;
};

export const BorrowLoanScreen = () => {
    const close = useGoBack();
    return <BorrowModal asScreen visible onClose={close} />;
};

export const RepayDebtScreen = () => {
    const close = useGoBack();
    return <RepayModal asScreen visible onClose={close} />;
};

/**
 * PUTTING YOUR OWN MONEY IN, and BORROWING FROM A DIRECTOR.
 *
 * Both were modals raised from two small buttons stacked above Request New
 * Loan - buttons duplicating the two rows further up the screen, which were
 * drawn with a "›" and did nothing at all. So the funding options looked
 * like doors that were dead, and worked from controls that read as an
 * afterthought. They are routes now, opened by the rows themselves.
 */
export const CapitalInjectionScreen = () => {
    const close = useGoBack();
    return <CapitalInjectionModal asScreen visible onClose={close} />;
};

export const SharkDealScreen = () => {
    const close = useGoBack();
    // The screen finds the lender itself rather than taking him as a route
    // param: a param would go stale if the board changed underneath it.
    const shark = useShareholderStore(s =>
        s.members.find((m: any) => m.trait === 'Shark'));
    // No shark on the board means no deal to offer. The row that opens this
    // is already hidden in that case, but a route can be reached by other
    // means and must not mount a screen with no lender.
    if (!shark) return null;
    return <SharkDealModal asScreen visible onClose={close} sharkMember={shark} />;
};

export const MyEmpireScreen = () => {
    const close = useGoBack();
    return <ExistingCompaniesModal asScreen visible onClose={close} />;
};

export const HostileTakeoverScreen = ({ route }: any) => {
    const close = useGoBack();
    // ------------------------------------------------------------------
    //  ARRIVING WITH A DEAL ALREADY DONE
    // ------------------------------------------------------------------
    //  The mail negotiation ends here: a board agreed, or refused and the
    //  player went over its head. Either way the target and the terms are
    //  settled and only the financing is left, which is what this screen
    //  owns. Handed down as a param rather than read from the negotiation
    //  store, so this screen has no opinion about where the deal came from.
    // ------------------------------------------------------------------
    return <AcquisitionModal asScreen visible onClose={close} acquire={route?.params?.acquire} />;
};

export const StockMarketScreen = () => {
    const close = useGoBack();
    const [buyback, setBuyback] = useState(false);
    const [dilution, setDilution] = useState(false);
    const [dividend, setDividend] = useState(false);
    // ------------------------------------------------------------------
    //  THE FOURTH SIBLING, AND IT USED TO BE THE ODD ONE OUT
    // ------------------------------------------------------------------
    //  SHELVED, and it was a bug rather than a style:
    //
    //      // The IPO confirmation lives on My Company, which owns the
    //      // panel that shows it, so it is handed in as a route param
    //      // rather than duplicated.
    //      const onOpenIPO = route?.params?.onOpenIPO || (() => {});
    //
    //  That comment describes the fault accurately. `handleLaunchIPO` in
    //  MyCompanyScreen called `setPanel` on MY COMPANY'S state, and My
    //  Company is not the screen in front of you when you press Launch
    //  IPO. So the button did nothing, and the confirmation was sitting
    //  there waiting when the player navigated back.
    //
    //  A screen cannot raise a dialog on another screen. So the IPO owns
    //  its own modal now, like the three below it have always done.
    // ------------------------------------------------------------------
    const [ipo, setIpo] = useState(false);
    return (
        <>
            <ShareControlHub
                asScreen
                visible
                onClose={close}
                onOpenIPO={() => setIpo(true)}
                onOpenDilution={() => setDilution(true)}
                onOpenDividend={() => setDividend(true)}
                onOpenBuyback={() => setBuyback(true)}
            />
            <IpoModal visible={ipo} onClose={() => setIpo(false)} />
            <BuybackModal visible={buyback} onClose={() => setBuyback(false)} />
            <DilutionModal visible={dilution} onClose={() => setDilution(false)} />
            <DividendModal visible={dividend} onClose={() => setDividend(false)} />
        </>
    );
};
