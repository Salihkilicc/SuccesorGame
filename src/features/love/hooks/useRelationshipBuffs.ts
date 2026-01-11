import { useUserStore } from '../../../core/store/useUserStore';

export const useRelationshipBuffs = () => {
    const partner = useUserStore(state => state.partner);

    // Visual Buffs (Percentages for UI)
    let intellectBoost = 0; // e.g. 10 for +10%
    let strengthBoost = 0;
    let socialBoost = 0;

    // Logic Buffs (Multipliers for calculation)
    let medicalDiscount = 0; // 0.5 means 50% discount

    if (partner && partner.job) {
        const { buffType, buffValue = 0 } = partner.job;

        // Handle Multipliers (e.g., 1.1 in DB means +10%)
        // We convert them to user-friendly percentages

        switch (buffType) {
            case 'INTELLECT_GAIN': // e.g. 1.1
                intellectBoost = Math.round((buffValue - 1) * 100);
                break;
            case 'GYM_GAINS':      // e.g. 1.2
            case 'STRENGTH_TRAINING':
                strengthBoost = Math.round((buffValue - 1) * 100);
                break;
            case 'FAME_BOOST':     // e.g. 1.5
            case 'REPUTATION_BOOST':
                socialBoost = Math.round((buffValue - 1) * 100);
                break;
            case 'MEDICAL_DISCOUNT': // e.g. 0.5 (meaning 50% cost)
                // If value is 0.5, discount is 50%
                medicalDiscount = 1 - buffValue;
                break;
        }
    }

    return {
        intellectBoost, // Returns integer (e.g. 10)
        strengthBoost,
        socialBoost,
        medicalDiscount,
        hasPartner: !!partner,
        partnerName: partner?.name || '',
    };
};
