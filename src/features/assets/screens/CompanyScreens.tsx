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
import { useNavigation } from '@react-navigation/native';

import CorporateFinanceHubModal from '../../../components/MyCompany/Finance/CorporateFinanceHubModal';
import BorrowModal from '../../../components/MyCompany/Finance/BorrowModal';
import RepayModal from '../../../components/MyCompany/Finance/RepayModal';
import EmployeesModule from '../../../components/MyCompany/Management/EmployeesModule';
import BoardRoomModal from '../../../components/MyCompany/Shares/BoardRoomModal';
import ShareControlHub from '../../../components/MyCompany/Shares/ShareControlHub';
import BuybackModal from '../../../components/MyCompany/Shares/BuybackModal';
import DilutionModal from '../../../components/MyCompany/Shares/DilutionModal';
import DividendModal from '../../../components/MyCompany/Shares/DividendModal';
import { AcquisitionModal } from '../../../components/MyCompany/Actions/AcquisitionModal';
import ExistingCompaniesModal from '../../../components/MyCompany/Finance/ExistingCompaniesModal';
import CapitalInjectionModal from '../../../components/MyCompany/Finance/CapitalInjectionModal';
import SharkDealModal from '../../../components/MyCompany/Finance/SharkDealModal';
import { useShareholderStore } from '../../../features/shareholders/stores/useShareholderStore';

/** Going back is what "close" means once these are screens. */
const useGoBack = () => {
    const navigation = useNavigation<any>();
    return () => navigation.goBack();
};

export const BoardMembersScreen = () => {
    const close = useGoBack();
    return <BoardRoomModal asScreen visible onClose={close} />;
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

export const HostileTakeoverScreen = () => {
    const close = useGoBack();
    return <AcquisitionModal asScreen visible onClose={close} />;
};

export const StockMarketScreen = ({ route }: any) => {
    const close = useGoBack();
    const [buyback, setBuyback] = useState(false);
    const [dilution, setDilution] = useState(false);
    const [dividend, setDividend] = useState(false);
    // The IPO confirmation lives on My Company, which owns the panel that
    // shows it, so it is handed in as a route param rather than duplicated.
    const onOpenIPO = route?.params?.onOpenIPO || (() => {});
    return (
        <>
            <ShareControlHub
                asScreen
                visible
                onClose={close}
                onOpenIPO={onOpenIPO}
                onOpenDilution={() => setDilution(true)}
                onOpenDividend={() => setDividend(true)}
                onOpenBuyback={() => setBuyback(true)}
            />
            <BuybackModal visible={buyback} onClose={() => setBuyback(false)} />
            <DilutionModal visible={dilution} onClose={() => setDilution(false)} />
            <DividendModal visible={dividend} onClose={() => setDividend(false)} />
        </>
    );
};
