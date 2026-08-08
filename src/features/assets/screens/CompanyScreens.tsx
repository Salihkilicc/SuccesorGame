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
    const [borrow, setBorrow] = useState(false);
    const [repay, setRepay] = useState(false);
    return (
        <>
            <CorporateFinanceHubModal
                asScreen
                visible
                onClose={close}
                onRequestLoan={() => setBorrow(true)}
                onRepayDebt={() => setRepay(true)}
            />
            <BorrowModal visible={borrow} onClose={() => setBorrow(false)} />
            <RepayModal visible={repay} onClose={() => setRepay(false)} />
        </>
    );
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
