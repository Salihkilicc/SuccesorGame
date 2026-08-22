// src/features/assets/screens/SubsidiaryScreen.tsx
//
// ============================================================================
//  ONE COMPANY YOU OWN, AS A ROUTE
// ============================================================================
//
//  "Sirketlere girerken ekrandan sagdan gelmeli, cikarken saga gitmeli,
//  oyunda her yerdeki gibi ekran gecisi olsun."
//
//  It was a Modal raised from the list, so it faded in on top of a screen that
//  had itself slid in from the right: two different gestures one after the
//  other on the way to the same place. It also drew above the nav bar, which
//  is the other half of what ScreenHost exists for.
//
//  The ID travels, not the company. Route params must be serialisable, and the
//  store is the only place the valuation is right anyway.
// ============================================================================

import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';

import SubsidiaryDetailModal from '../../../components/MyCompany/Finance/SubsidiaryDetailModal';

const SubsidiaryScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    return (
        <SubsidiaryDetailModal
            asScreen
            visible
            subsidiaryId={route.params?.companyId ?? null}
            onClose={() => navigation.goBack()}
        />
    );
};

export default SubsidiaryScreen;
