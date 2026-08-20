// src/features/profile/logic/useProfileLogic.ts
//
// ============================================================================
//  PROFILE & DYNASTY SCREEN LOGIC (CUSTOM HOOK)
// ============================================================================
//
//  Decouples state calculations, formatting, and interactions for the
//  Personal Life, Dynasty & Luxury profile dashboard from the UI.
//
// ============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { fullName } from '../../../core/identity';
import { useIdentityStore } from '../../../core/store/useIdentityStore';
import { usePlayerStore } from '../../../core/store/usePlayerStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { useFamilyStore, Child, PartnerProfile } from '../../../core/store/useFamilyStore';
import { useLuxoNetStore } from '../../../core/store/useLuxoNetStore';
import { useAssetStore } from '../../shopping/store/useAssetStore';
import { formatPrestigeScore } from '../../shopping/data/shoppingRegistry';
import { useMarketStore } from '../../../core/store/useMarketStore';
import {
    handleMessyBreakup,
    handleMarriage,
    handleGift,
} from '../../../logic/relationshipEvents';
import { SelectedMember } from '../components/FamilyMemberDetailModal';
import { useEncounterSystem } from '../../love/components/useEncounterSystem';

export interface FormattedVitals {
    age: number;
    health: number;
    happiness: number;
    energy: number;
    looks: number;
    smarts: number;
    stress: number;
}

export interface FormattedFinances {
    personalCash: string;
    netWorth: string;
    companyValuation: string;
}

export const useProfileLogic = () => {
    // --- Navigation ---
    const navigation = useNavigation<any>();

    // --- Global Stores ---
    const identity = useIdentityStore();
    const player = usePlayerStore();
    const stats = useStatsStore();
    const family = useFamilyStore();
    const luxo = useLuxoNetStore();
    const market = useMarketStore();

    // --- Local Modal State ---
    const [isLuxoNetModalVisible, setIsLuxoNetModalVisible] = useState(false);
    const [isInventoryModalVisible, setIsInventoryModalVisible] = useState(false);
    const [selectedMember, setSelectedMember] = useState<SelectedMember | null>(null);
    const [actionFeedback, setActionFeedback] = useState<string | null>(null);

    // --- Formatted Strings & Computed Values ---
    const ceoFullName = useMemo(() => {
        const first = identity.firstName || 'Salih';
        const last = identity.lastName || 'Hale';
        return fullName(first, last);
    }, [identity.firstName, identity.lastName]);

    const children = useMemo(() => {
        return family.children.map((c) => {
            if (!c.name.endsWith('Hale')) {
                const firstName = c.name.split(' ')[0] || 'Heir';
                return { ...c, name: `${firstName} Hale` };
            }
            return c;
        });
    }, [family.children]);

    const companyName = useMemo(() => {
        return stats.companyName && stats.companyName.trim().length > 0
            ? stats.companyName.trim()
            : 'Hale Technologies';
    }, [stats.companyName]);

    const currentQuarter = market.currentQuarter || 1;

    const finances: FormattedFinances = useMemo(() => {
        const cash = player.core.money || 0;
        const netWorth = player.core.netWorth || cash;
        const companyVal = stats.companyValue || 0;

        const formatCurrency = (val: number): string => {
            if (val >= 1_000_000_000_000) return `$${(val / 1_000_000_000_000).toFixed(2)}T`;
            if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`;
            if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
            if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
            return `$${val.toLocaleString()}`;
        };

        return {
            personalCash: formatCurrency(cash),
            netWorth: formatCurrency(netWorth),
            companyValuation: formatCurrency(companyVal),
        };
    }, [player.core.money, player.core.netWorth, stats.companyValue]);

    const vitals: FormattedVitals = useMemo(() => ({
        health: Math.max(0, Math.min(100, player.core.health || 100)),
        happiness: Math.max(0, Math.min(100, player.core.happiness || 100)),
        stress: Math.max(0, Math.min(100, player.core.stress || 0)),
    }), [player.core.health, player.core.happiness, player.core.stress]);

    const ownedAssets = useAssetStore((state) => state.ownedItems);

    const luxurySummary = useMemo(() => {
        const ownedCount = ownedAssets.length;
        const totalValue = ownedAssets.reduce(
            (sum, item) => sum + (item.marketValue || item.price || 0),
            0,
        );
        const prestigeFormatted = formatPrestigeScore(totalValue);

        const formatShort = (v: number) => {
            if (v >= 1_000_000_000_000) return `$${(v / 1_000_000_000_000).toFixed(2)}T`;
            if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
            if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
            if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
            return `$${v.toLocaleString()}`;
        };

        return {
            count: ownedCount,
            totalValueFormatted: formatShort(totalValue),
            prestige: prestigeFormatted,
            tier: luxo.membershipTier,
        };
    }, [ownedAssets, luxo.membershipTier]);

    const designatedSuccessor = useMemo(() => {
        if (!family.designatedSuccessorId) return null;
        return family.children.find((c) => c.id === family.designatedSuccessorId) || null;
    }, [family.designatedSuccessorId, family.children]);

    // --- Encounter System (Finding Partners) ---
    const encounter = useEncounterSystem();

    // --- Member Navigation Handlers ---
    const openPartnerModal = useCallback(() => {
        if (family.partner) {
            navigation.navigate('FamilyMember', {
                memberId: family.partner.id || 'partner',
                memberType: 'partner',
                memberName: family.partner.name,
            });
        } else {
            // Find a partner in VIP Lounge / Gala
            encounter.triggerEncounter('VIP_LOUNGE');
        }
    }, [family.partner, navigation, encounter]);

    const handleAcceptEncounterDate = useCallback(() => {
        const res = encounter.handleDate();
        if (res.success && encounter.candidate) {
            family.setPartner(encounter.candidate);
            setActionFeedback(res.message || `Started dating ${encounter.candidate.name}!`);
            setTimeout(() => setActionFeedback(null), 3500);
        }
    }, [encounter, family]);

    const openChildModal = useCallback(
        (child: Child) => {
            navigation.navigate('FamilyMember', {
                memberId: child.id,
                memberType: 'child',
                memberName: child.name,
            });
        },
        [navigation],
    );

    const closeMemberModal = useCallback(() => {
        setSelectedMember(null);
    }, []);

    // --- LuxoNet Navigation Handlers ---
    const openLuxoNetModal = useCallback(() => {
        navigation.navigate('Shopping');
    }, [navigation]);

    const closeLuxoNetModal = useCallback(() => {
        setIsLuxoNetModalVisible(false);
    }, []);

    // --- Inventory Navigation Handlers ---
    const openInventoryModal = useCallback(() => {
        navigation.navigate('Belongings');
    }, [navigation]);

    const closeInventoryModal = useCallback(() => {
        setIsInventoryModalVisible(false);
    }, []);

    // --- Family & Life Actions ---
    const handleDesignateSuccessor = useCallback((childId: string) => {
        const targetChild = family.children.find((c) => c.id === childId);
        if (targetChild) {
            family.designateSuccessor(childId);
            setActionFeedback(`${targetChild.name} is now the primary heir.`);
            setTimeout(() => setActionFeedback(null), 3000);
        }
    }, [family]);

    const handleDatePartner = useCallback(() => {
        if (!family.partner) return;
        const cost = 2500;
        if (player.core.money < cost) {
            setActionFeedback('Insufficient cash for a high-society date.');
            setTimeout(() => setActionFeedback(null), 3000);
            return;
        }

        player.spendMoney(cost);
        family.updateLove(8);
        player.updateCore('happiness', Math.min(100, player.core.happiness + 6));
        player.updateCore('stress', Math.max(0, player.core.stress - 8));
        setActionFeedback(`Exclusive date night with ${family.partner.name} (+8 Love, -8 Stress).`);
        setTimeout(() => setActionFeedback(null), 3500);
    }, [family, player]);

    const handleGiftPartner = useCallback((amount: number = 15000) => {
        const res = handleGift(amount);
        if (!res.success) {
            setActionFeedback(res.error || 'Gift failed.');
        } else {
            setActionFeedback(`Luxury gift delivered (+${res.loveDelta} Love).`);
        }
        setTimeout(() => setActionFeedback(null), 3500);
    }, []);

    const handleProposePartner = useCallback((hasPrenup: boolean = true) => {
        const res = handleMarriage(hasPrenup);
        if (!res.success) {
            setActionFeedback(res.error || 'Marriage proposal failed.');
        } else {
            setActionFeedback(`💍 Wedding celebrated! Brand Surge: +${res.brandValueDelta} pts`);
        }
        setTimeout(() => setActionFeedback(null), 4000);
    }, []);

    const handleBreakupPartner = useCallback(() => {
        const res = handleMessyBreakup('drifted');
        if (!res.success) {
            setActionFeedback(res.error || 'Breakup failed.');
        } else {
            setActionFeedback(`Relationship dissolved. News: "${res.newsHeadline}"`);
        }
        setTimeout(() => setActionFeedback(null), 4500);
    }, []);

    return {
        // State
        ceoFullName,
        companyName,
        currentQuarter,
        finances,
        vitals,
        partner: family.partner,
        children,
        designatedSuccessorId: family.designatedSuccessorId,
        designatedSuccessor,
        familyReputation: family.familyReputation,
        luxurySummary,
        isLuxoNetModalVisible,
        isInventoryModalVisible,
        selectedMember,
        actionFeedback,

        // Encounter System
        encounter,
        handleAcceptEncounterDate,

        // Actions
        openPartnerModal,
        openChildModal,
        closeMemberModal,
        openLuxoNetModal,
        closeLuxoNetModal,
        openInventoryModal,
        closeInventoryModal,
        handleDesignateSuccessor,
        handleDatePartner,
        handleGiftPartner,
        handleProposePartner,
        handleBreakupPartner,
    };
};
