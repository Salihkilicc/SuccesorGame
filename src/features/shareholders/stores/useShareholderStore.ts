import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../../../storage/persist';



// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type TraitType = 'Conservative' | 'Aggressive' | 'Snake' | 'Shark' | 'Loyalist' | 'Visionary';

// Network Contact Interface (from Love/Friends module)
interface NetworkContact {
    id: string;
    name: string;
    personality: {
        id: string;
        label: string;
    };
}

interface BoardMember {
    id: string;
    name: string;
    shares: number; // Percentage (e.g., 12.5)
    trait: TraitType;
    trust: number; // 0-100
    isHostile: boolean; // True if trust < 20
    origin: 'Founder' | 'Investor' | 'Network' | 'DebtShark';
    networkId?: string; // If they came from the "Love/Friends" module
}

// Buyout negotiation result
interface BuyoutResult {
    canSell: boolean;
    askingPrice: number | null; // null if they refuse
    basePrice: number;
    reluctanceFactor: number;
    traitMultiplier: number;
    totalPremium: number; // As percentage (e.g., 0.75 = 75% premium)
    refusalReason?: string;
}

// Shark Loan (Predatory Lending)
interface SharkLoan {
    id: string;
    lenderId: string; // Board member ID
    amount: number; // Loan amount
    deadlineTurn: number; // Game turn when loan is due
    isActive: boolean; // True if unpaid
}

// Collateral seizure result
interface SeizureResult {
    seizedShares: number;
    lenderName: string;
    loanAmount: number;
    playerSharesRemaining: number;
}


interface ShareholderState {
    // State
    members: BoardMember[];
    playerShares: number; // Starts at 65.0
    boardMood: TraitType; // The dominant personality of the board
    totalSharesCount: number; // Total volume (e.g. 1,000,000)
    sharkLoans: SharkLoan[]; // Active predatory loans

    // Actions
    initializeGame: () => void;
    recalculateBoardMood: () => void;
    evaluatePlayerAction: (actionType: 'DIVIDEND' | 'DILUTION' | 'ACQUISITION' | 'HOLD_CASH') => void;
    appointDirectorFromNetwork: (networkContact: NetworkContact, shareAmount?: number) => { success: boolean; message: string };
    calculateBuyoutPrice: (memberId: string, currentStockPrice: number) => BuyoutResult | null;
    takeSharkLoan: (lenderId: string, amount: number, deadlineTurn: number, addCashFn: (n: number) => void) => { success: boolean; message: string };
    repaySharkLoan: (loanId: string, spendCashFn: (amount: number) => boolean) => { success: boolean; message: string };
    seizeCollateral: (loanId: string, currentStockPrice: number) => SeizureResult | null;
}

// ============================================================================
// INITIAL NPC BOARD MEMBERS (35% Total)
// ============================================================================

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert Love module personality to Board trait.
 * Maps relationship personality types to shareholder behavior patterns.
 */
const convertPersonalityToTrait = (personalityId: string): TraitType => {
    const mapping: Record<string, TraitType> = {
        // High Maintenance -> Wants returns
        gold_digger: 'Shark',

        // Frugal -> Conservative with money
        frugal: 'Conservative',

        // Supportive -> Loyal to player
        supportive: 'Loyalist',

        // Party Animal -> Aggressive spender
        party: 'Aggressive',

        // Ambitious -> Visionary growth-focused
        ambitious: 'Visionary',
    };

    return mapping[personalityId] || 'Loyalist'; // Default to Loyalist for friends
};

// ============================================================================
// INITIAL NPC BOARD MEMBERS (35% Total)
// ============================================================================

const INITIAL_BOARD_MEMBERS: BoardMember[] = [
    {
        id: 'npc-marcus-wolf',
        name: "Marcus 'The Wolf'",
        shares: 12.0,
        trait: 'Shark',
        trust: 50,
        isHostile: false,
        origin: 'Investor',
    },
    {
        id: 'npc-elena-vance',
        name: 'Elena Vance',
        shares: 10.0,
        trait: 'Conservative',
        trust: 65,
        isHostile: false,
        origin: 'Founder',
    },
    {
        id: 'npc-victor-k',
        name: 'Victor K.',
        shares: 8.0,
        trait: 'Snake',
        trust: 40,
        isHostile: false,
        origin: 'Investor',
    },
    {
        id: 'npc-sarah-jen',
        name: 'Sarah Jen',
        shares: 5.0,
        trait: 'Aggressive',
        trust: 55,
        isHostile: false,
        origin: 'Founder',
    },
];

// ============================================================================
// ZUSTAND STORE
// ============================================================================

export const useShareholderStore = create<ShareholderState>()(
    persist(
        (set, get) => ({
            // ========================================================================
            // STATE
            // ========================================================================
            members: [],
            playerShares: 65.0,
            boardMood: 'Conservative', // Default mood
            totalSharesCount: 1_000_000, // 1 million shares total
            sharkLoans: [], // No loans initially

            // ========================================================================
            // ACTIONS
            // ========================================================================

            /**
             * Initialize the game with default board members and player shares.
             * Player starts with 65%, NPCs hold the remaining 35%.
             */
            initializeGame: () => {
                const playerShares = 65.0;
                const members = INITIAL_BOARD_MEMBERS;

                // Validation: Ensure total shares equal 100%
                const totalNPCShares = members.reduce((sum, member) => sum + member.shares, 0);
                const totalShares = playerShares + totalNPCShares;

                if (Math.abs(totalShares - 100.0) > 0.01) {
                    console.warn(
                        `[Shareholder Store] Share distribution error: Total = ${totalShares}% (Expected 100%)`
                    );
                }

                set({
                    playerShares,
                    members,
                });

                // Calculate initial board mood
                get().recalculateBoardMood();
            },

            /**
             * Recalculate the board mood based on the dominant trait.
             * The trait with the highest total share percentage becomes the boardMood.
             */
            recalculateBoardMood: () => {
                const { members } = get();

                // Group shares by trait
                const traitTotals: Record<TraitType, number> = {
                    Conservative: 0,
                    Aggressive: 0,
                    Snake: 0,
                    Shark: 0,
                    Loyalist: 0,
                    Visionary: 0,
                };

                members.forEach((member) => {
                    traitTotals[member.trait] += member.shares;
                });

                // Find the dominant trait (highest total shares)
                let dominantTrait: TraitType = 'Conservative';
                let maxShares = 0;

                (Object.keys(traitTotals) as TraitType[]).forEach((trait) => {
                    if (traitTotals[trait] > maxShares) {
                        maxShares = traitTotals[trait];
                        dominantTrait = trait;
                    }
                });

                set({ boardMood: dominantTrait });

                console.log('[Shareholder Store] Board Mood Recalculated:', {
                    boardMood: dominantTrait,
                    traitDistribution: traitTotals,
                });
            },

            /**
             * Evaluate player action and update board member trust based on their traits.
             * Each trait reacts differently to different actions.
             */
            evaluatePlayerAction: (actionType: 'DIVIDEND' | 'DILUTION' | 'ACQUISITION' | 'HOLD_CASH') => {
                const { members } = get();

                const updatedMembers = members.map((member) => {
                    let trustChange = 0;

                    // ============================================================
                    // TRAIT REACTION MATRIX
                    // ============================================================

                    switch (actionType) {
                        case 'DIVIDEND':
                            // Paying profits to shareholders
                            if (member.trait === 'Conservative') trustChange = 15; // Loves safety
                            if (member.trait === 'Shark') trustChange = -5; // Indifferent
                            if (member.trait === 'Aggressive') trustChange = -10; // Hates wasting cash
                            if (member.trait === 'Visionary') trustChange = -5; // Prefers reinvestment
                            break;

                        case 'DILUTION':
                            // Selling shares (issuing new equity)
                            if (member.trait === 'Conservative') trustChange = -20; // Hates risk
                            if (member.trait === 'Shark') trustChange = 15; // Loves chaos/opportunity
                            if (member.trait === 'Aggressive') trustChange = 10; // Loves growth funds
                            if (member.trait === 'Loyalist') trustChange = -5; // Follows but worried
                            break;

                        case 'ACQUISITION':
                            // Buying another company
                            if (member.trait === 'Conservative') trustChange = -10; // Too risky
                            if (member.trait === 'Aggressive') trustChange = 20; // Loves expansion
                            if (member.trait === 'Visionary') trustChange = 25; // Loves big moves
                            if (member.trait === 'Shark') trustChange = 10; // Opportunity for profit
                            break;

                        case 'HOLD_CASH':
                            // Sitting on money without investing
                            if (member.trait === 'Conservative') trustChange = 10; // Loves stability
                            if (member.trait === 'Shark') trustChange = -15; // Money must work!
                            if (member.trait === 'Aggressive') trustChange = -15; // Money must work!
                            break;

                        default:
                            console.warn(`[Shareholder Store] Unknown action type: ${actionType}`);
                    }

                    // Apply trust change and clamp between 0-100
                    const newTrust = Math.max(0, Math.min(100, member.trust + trustChange));

                    // Set hostile flag if trust drops below 20
                    const isHostile = newTrust < 20;

                    return {
                        ...member,
                        trust: newTrust,
                        isHostile,
                    };
                });

                set({ members: updatedMembers });

                // Recalculate board mood after trust changes
                get().recalculateBoardMood();

                // Log the action and reactions
                console.log(`[Shareholder Store] Action: ${actionType}`, {
                    reactions: updatedMembers.map((m) => ({
                        name: m.name,
                        trait: m.trait,
                        trust: m.trust,
                        isHostile: m.isHostile,
                    })),
                });
            },

            /**
             * Appoint a friend/partner from the Love/Network module to the Board of Directors.
             * Transfers shares from player to the new director.
             */
            appointDirectorFromNetwork: (networkContact: NetworkContact, shareAmount: number = 1.0) => {
                const { playerShares, members } = get();

                // ============================================================
                // VALIDATION
                // ============================================================

                // Check if player has enough shares to give
                if (playerShares < shareAmount) {
                    return {
                        success: false,
                        message: `Insufficient shares. You have ${playerShares.toFixed(1)}%, need ${shareAmount.toFixed(1)}%.`,
                    };
                }

                // Check minimum share requirement (at least 1%)
                if (shareAmount < 1.0) {
                    return {
                        success: false,
                        message: 'Minimum share allocation is 1.0%.',
                    };
                }

                // Check if this person is already on the board
                const alreadyOnBoard = members.some((m) => m.networkId === networkContact.id);
                if (alreadyOnBoard) {
                    return {
                        success: false,
                        message: `${networkContact.name} is already on the Board of Directors.`,
                    };
                }

                // ============================================================
                // CREATE NEW BOARD MEMBER
                // ============================================================

                const newMember: BoardMember = {
                    id: `network-${networkContact.id}`,
                    name: networkContact.name,
                    shares: shareAmount,
                    trait: convertPersonalityToTrait(networkContact.personality.id),
                    trust: 80, // Start high because they're your friend
                    isHostile: false,
                    origin: 'Network',
                    networkId: networkContact.id,
                };

                // ============================================================
                // UPDATE STATE
                // ============================================================

                const newPlayerShares = playerShares - shareAmount;
                const updatedMembers = [...members, newMember];

                set({
                    playerShares: newPlayerShares,
                    members: updatedMembers,
                });

                // Recalculate board mood with new member
                get().recalculateBoardMood();

                console.log('[Shareholder Store] New Director Appointed:', {
                    name: newMember.name,
                    shares: newMember.shares,
                    trait: newMember.trait,
                    playerSharesRemaining: newPlayerShares,
                });

                return {
                    success: true,
                    message: `${networkContact.name} appointed to Board with ${shareAmount.toFixed(1)}% shares.`,
                };
            },

            /**
             * Calculate the buyout price for a board member's shares.
             * Price is based on trust level, personality trait, and reluctance to sell.
             * Some members may refuse to sell entirely if trust is too low.
             */
            calculateBuyoutPrice: (memberId: string, currentStockPrice: number): BuyoutResult | null => {
                const { members } = get();

                // Find the target member
                const member = members.find((m) => m.id === memberId);

                if (!member) {
                    console.warn(`[Shareholder Store] Member not found: ${memberId}`);
                    return null;
                }

                // ============================================================
                // REFUSAL CHECK (Hostile members with certain traits)
                // ============================================================

                if (member.trust < 15 && (member.trait === 'Shark' || member.trait === 'Snake')) {
                    return {
                        canSell: false,
                        askingPrice: null,
                        basePrice: currentStockPrice,
                        reluctanceFactor: 0,
                        traitMultiplier: 0,
                        totalPremium: 0,
                        refusalReason: `${member.name} refuses to sell. Trust too low (${member.trust}/100). They want to block you.`,
                    };
                }

                // ============================================================
                // PRICING CALCULATION
                // ============================================================

                const basePrice = currentStockPrice;

                // Reluctance Factor: Low trust = High reluctance
                // Formula: (100 - trust) / 100
                // Examples:
                //   Trust 80 → Reluctance 0.20 (20% premium)
                //   Trust 50 → Reluctance 0.50 (50% premium)
                //   Trust 20 → Reluctance 0.80 (80% premium)
                const reluctanceFactor = (100 - member.trust) / 100;

                // Trait Multiplier: Personality-based premium
                let traitMultiplier = 0;

                switch (member.trait) {
                    case 'Shark':
                        traitMultiplier = 0.50; // Always wants +50% premium
                        break;
                    case 'Conservative':
                        traitMultiplier = 0.10; // Wants +10% premium (safety buffer)
                        break;
                    case 'Loyalist':
                        traitMultiplier = 0.00; // Fair price (no premium)
                        break;
                    case 'Aggressive':
                        traitMultiplier = 0.25; // Moderate premium
                        break;
                    case 'Visionary':
                        traitMultiplier = 0.15; // Slight premium (future value)
                        break;
                    case 'Snake':
                        traitMultiplier = 0.40; // High premium (manipulative)
                        break;
                    default:
                        traitMultiplier = 0.20; // Default moderate premium
                }

                // ============================================================
                // FINAL ASKING PRICE
                // ============================================================

                // Total Premium = Reluctance + Trait Multiplier
                const totalPremium = reluctanceFactor + traitMultiplier;

                // Final Asking Price Formula:
                // AskingPrice = BasePrice * (1 + TotalPremium)
                const askingPrice = basePrice * (1 + totalPremium);

                console.log(`[Shareholder Store] Buyout Calculation for ${member.name}:`, {
                    memberId,
                    trait: member.trait,
                    trust: member.trust,
                    basePrice,
                    reluctanceFactor: (reluctanceFactor * 100).toFixed(1) + '%',
                    traitMultiplier: (traitMultiplier * 100).toFixed(1) + '%',
                    totalPremium: (totalPremium * 100).toFixed(1) + '%',
                    askingPrice: askingPrice.toFixed(2),
                });

                return {
                    canSell: true,
                    askingPrice,
                    basePrice,
                    reluctanceFactor,
                    traitMultiplier,
                    totalPremium,
                };
            },

            /**
             * Take a predatory loan from a Shark board member.
             * High-risk financing with equity seizure as collateral.
             */
            takeSharkLoan: (lenderId: string, amount: number, deadlineTurn: number, addCashFn: (n: number) => void) => {
                const { members, sharkLoans } = get();

                // Find the lender
                const lender = members.find((m) => m.id === lenderId);

                if (!lender) {
                    return { success: false, message: 'Lender not found.' };
                }

                // Only Sharks can offer predatory loans
                if (lender.trait !== 'Shark') {
                    return { success: false, message: `${lender.name} is not a Shark investor.` };
                }

                // Create loan
                const newLoan: SharkLoan = {
                    id: `shark-loan-${Date.now()}`,
                    lenderId,
                    amount,
                    deadlineTurn,
                    isActive: true,
                };

                // Add cash to company
                addCashFn(amount);

                // Update state
                set({ sharkLoans: [...sharkLoans, newLoan] });

                // ============================================================
                // TRUST EFFECTS
                // ============================================================

                const updatedMembers = members.map((member) => {
                    if (member.id === lenderId) {
                        // Lender loves trapping you
                        return {
                            ...member,
                            trust: Math.min(100, member.trust + 15),
                            isHostile: false, // Reset hostile if trust improves
                        };
                    } else if (member.trait === 'Conservative') {
                        // Conservatives hate risky debt
                        const newTrust = Math.max(0, member.trust - 10);
                        return {
                            ...member,
                            trust: newTrust,
                            isHostile: newTrust < 20,
                        };
                    }
                    return member;
                });

                set({ members: updatedMembers });
                get().recalculateBoardMood();

                console.log('[Shareholder Store] Shark Loan Taken:', {
                    loanId: newLoan.id,
                    lender: lender.name,
                    amount,
                    deadline: deadlineTurn,
                });

                return {
                    success: true,
                    message: `Loan of $${amount.toLocaleString()} secured from ${lender.name}. Due by turn ${deadlineTurn}.`,
                };
            },

            /**
             * Repay a shark loan before the deadline.
             * Lender will be disappointed you escaped the trap.
             */
            repaySharkLoan: (loanId: string, spendCashFn: (amount: number) => boolean) => {
                const { sharkLoans, members } = get();

                const loan = sharkLoans.find((l) => l.id === loanId && l.isActive);

                if (!loan) {
                    return { success: false, message: 'Loan not found or already repaid.' };
                }

                // Try to spend cash
                const paymentSuccess = spendCashFn(loan.amount);

                if (!paymentSuccess) {
                    return { success: false, message: 'Insufficient funds to repay loan.' };
                }

                // Mark loan as inactive
                const updatedLoans = sharkLoans.map((l) =>
                    l.id === loanId ? { ...l, isActive: false } : l
                );

                set({ sharkLoans: updatedLoans });

                // ============================================================
                // TRUST EFFECTS
                // ============================================================

                const lender = members.find((m) => m.id === loan.lenderId);

                if (lender) {
                    const updatedMembers = members.map((member) => {
                        if (member.id === loan.lenderId) {
                            // Lender hates that you escaped the trap
                            const newTrust = Math.max(0, member.trust - 20);
                            return {
                                ...member,
                                trust: newTrust,
                                isHostile: newTrust < 20,
                            };
                        }
                        return member;
                    });

                    set({ members: updatedMembers });
                    get().recalculateBoardMood();

                    console.log('[Shareholder Store] Shark Loan Repaid:', {
                        loanId,
                        lender: lender.name,
                        amount: loan.amount,
                        lenderTrustChange: -20,
                    });
                }

                return {
                    success: true,
                    message: `Loan repaid to ${lender?.name}. They are not happy you escaped.`,
                };
            },

            /**
             * Seize collateral when player fails to repay a shark loan.
             * Transfers shares from player to lender with 1.5x penalty.
             */
            seizeCollateral: (loanId: string, currentStockPrice: number): SeizureResult | null => {
                const { sharkLoans, members, playerShares } = get();

                const loan = sharkLoans.find((l) => l.id === loanId && l.isActive);

                if (!loan) {
                    console.warn('[Shareholder Store] Loan not found or already closed.');
                    return null;
                }

                const lender = members.find((m) => m.id === loan.lenderId);

                if (!lender) {
                    console.warn('[Shareholder Store] Lender not found.');
                    return null;
                }

                // ============================================================
                // CALCULATE SHARES TO SEIZE
                // ============================================================

                // Formula: (Loan Amount / Stock Price) × 1.5 (Penalty Multiplier)
                const PENALTY_MULTIPLIER = 1.5;
                const sharesToSeize = (loan.amount / currentStockPrice) * PENALTY_MULTIPLIER;

                // Safety: Don't seize more than player has
                const actualSeizedShares = Math.min(sharesToSeize, playerShares);

                // ============================================================
                // TRANSFER OWNERSHIP
                // ============================================================

                const newPlayerShares = Math.max(0, playerShares - actualSeizedShares);

                const updatedMembers = members.map((member) => {
                    if (member.id === loan.lenderId) {
                        return {
                            ...member,
                            shares: member.shares + actualSeizedShares,
                        };
                    }
                    return member;
                });

                // Mark loan as inactive
                const updatedLoans = sharkLoans.map((l) =>
                    l.id === loanId ? { ...l, isActive: false } : l
                );

                set({
                    playerShares: newPlayerShares,
                    members: updatedMembers,
                    sharkLoans: updatedLoans,
                });

                // Recalculate board mood with new ownership structure
                get().recalculateBoardMood();

                const result: SeizureResult = {
                    seizedShares: actualSeizedShares,
                    lenderName: lender.name,
                    loanAmount: loan.amount,
                    playerSharesRemaining: newPlayerShares,
                };

                console.log('[Shareholder Store] Collateral Seized:', {
                    loanId,
                    lender: lender.name,
                    loanAmount: loan.amount,
                    stockPrice: currentStockPrice,
                    sharesToSeize,
                    actualSeizedShares,
                    playerSharesRemaining: newPlayerShares,
                    lenderNewShares: lender.shares + actualSeizedShares,
                });

                return result;
            },

        }),
        {
            name: 'shareholder-store',
            storage: createJSONStorage(() => zustandStorage),
        }
    )
);

// Export types for UI components
export type { BoardMember, BuyoutResult, SharkLoan, SeizureResult };

