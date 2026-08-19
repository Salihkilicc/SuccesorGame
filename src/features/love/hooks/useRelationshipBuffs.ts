import { useEffect, useMemo } from 'react';
import { useFamilyStore } from '../../../core/store/useFamilyStore';
import { usePlayerStore } from '../../../core/store/usePlayerStore';

export const useRelationshipBuffs = () => {
    // useFamilyStore, not useUserStore. There was a partner in each and the
    // buffs read the one that no encounter ever wrote to - see the note at the
    // top of useFamilyStore.ts.
    const partner = useFamilyStore(state => state.partner);
    const setRelationshipBuffs = usePlayerStore(state => state.setRelationshipBuffs);

    // Calculate Buffs from Partner Logic
    const { attributes, reputation, security, hidden, core } = useMemo(() => {
        const buffs = {
            attributes: { intellect: 0, strength: 0, charm: 0, looks: 0 },
            reputation: { social: 0, street: 0, business: 0, police: 0, casino: 0 },
            security: { digital: 0, personal: 0 },
            hidden: { luck: 0 },
            core: { stress: 0 }
        };

        if (!partner || !partner.job) return buffs;

        const { buffType, buffValue = 0 } = partner.job;
        const val = Math.round(buffValue); // Ensure integer

        switch (buffType) {
            // --- REPUTATION ---
            case 'STREET_CRED_BOOST':
                buffs.reputation.street = val;
                break;
            case 'BUSINESS_TRUST_BOOST':
                buffs.reputation.business = val;
                break;
            case 'SOCIAL_STATUS_BOOST':
            case 'FAME_BOOST':
            case 'REPUTATION_BOOST':
                buffs.reputation.social = val;
                break;
            case 'CASINO_VIP_BOOST':
                buffs.reputation.casino = val * 10; // Casino rep scale is 0-1000
                break;

            // --- ATTRIBUTES ---
            case 'INTELLECT_GAIN':
                buffs.attributes.intellect = val;
                break;
            case 'CHARM_BOOST':
                buffs.attributes.charm = val;
                break;
            case 'STRENGTH_BOOST':
            case 'STRENGTH_TRAINING':
            case 'GYM_GAINS':
                buffs.attributes.strength = val;
                break;

            // --- SECURITY ---
            case 'PROTECTION':
                buffs.security.personal = val;
                break;

            // --- SPECIAL ---
            case 'LUCK_BOOST':
                buffs.hidden.luck = val;
                break;
            case 'STRESS_RELIEF':
                // Handled specially in logic, but good to track
                // buffs.core.stress = -val; 
                break;
        }

        return buffs;
    }, [partner]);

    // --- SYNC WITH PLAYER STORE ---
    useEffect(() => {
        if (!partner) {
            setRelationshipBuffs({
                attributes: {},
                reputation: {},
                security: {}
            });
            return;
        }

        setRelationshipBuffs({
            attributes,
            reputation,
            security
        });

    }, [partner, attributes, reputation, security, setRelationshipBuffs]);

    return {
        // Derived for UI convenience (Legacy support + New)
        intellectBoost: attributes.intellect,
        strengthBoost: attributes.strength,
        socialBoost: reputation.social,
        streetBoost: reputation.street, // New
        businessBoost: reputation.business, // New
        casinoBoost: reputation.casino, // New
        luckBoost: hidden.luck, // New

        hasPartner: !!partner,
        partnerName: partner?.name || '',
    };
};
