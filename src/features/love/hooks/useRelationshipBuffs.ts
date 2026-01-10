import { useUserStore } from '../../../core/store/useUserStore';

/**
 * Hook to retrieve active relationship buffs from the current partner.
 * Returns multipliers and bonuses based on partner's job and tier.
 */
export const useRelationshipBuffs = () => {
    const partner = useUserStore(state => state.partner);

    // Default values (no buff)
    let medicalDiscount = 0; // 0 = no discount
    let gymBoost = 0;
    let legalProtection = 0;
    let socialRepBonus = 0;

    // Check if partner exists and has the new Deep Persona structure
    if (partner && 'job' in partner && 'buffType' in (partner as any).job) {
        const deepPartner = partner as any;
        const buffType = deepPartner.job.buffType;
        const buffValue = deepPartner.job.buffValue || 0;

        switch (buffType) {
            case 'MEDICAL_DISCOUNT':
            case 'HEALTH_CARE':
                // buffValue is typically a percentage (e.g., 25 = 25% discount)
                medicalDiscount = buffValue / 100;
                break;

            case 'STRENGTH_TRAINING':
            case 'BRAVERY':
                gymBoost = buffValue;
                break;

            case 'LEGAL_DEFENSE':
            case 'LEGAL_IMMUNITY':
                legalProtection = buffValue;
                break;

            case 'REPUTATION_BOOST':
            case 'PARTY_INVITES':
                socialRepBonus = buffValue;
                break;
        }
    }

    return {
        medicalDiscount, // 0 to 1 (e.g., 0.25 = 25% discount)
        gymBoost,
        legalProtection,
        socialRepBonus,
        hasPartner: !!partner,
        partnerName: partner?.name || null,
    };
};
