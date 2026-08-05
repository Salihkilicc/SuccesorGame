import { t } from '../../../core/i18n';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../../../storage/persist';
import { useEquityStore } from '../../finance/stores/useEquityStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import {
    BoardEvent,
    BoardPromise,
    CompanyContext,
    GovMember,
    OVERRIDE_RESIGN_CHANCE,
    OVERRIDE_TRUST_COST,
    Proposal,
    VoteResult,
    boardMoodFrom,
    decayTrust,
    castVotes,
    checkNoConfidence,
    lobbyMember,
    requiresVote,
    resolvePromise,
    trustDelta,
    voteNoConfidence, giftEffect, RELATIONSHIP_NEUTRAL, type Motivation,
    detectDemand, evaluateDemand, decayRelationship,
    DEMAND_COOLDOWN_MET, DEMAND_COOLDOWN_FAILED, DEMAND_QUIET,
    NO_CONFIDENCE_COOLDOWN, FATIGUE_CAP, FATIGUE_RECOVERY,
    DEMAND_MET_TRUST, DEMAND_MET_TRUST_OTHERS, DEMAND_FAILED_TRUST, DEMAND_FAILED_TRUST_OTHERS,
    type BoardDemand, type DemandContext, type DemandKind, type PetIssue,
}from '../../../core/market/governance';
import { formatMoney, formatNumber } from '../../../core/utils';



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

export interface BoardMember {
    id: string;
    name: string;
    shareCount: number; // Absolute share count (e.g., 1,250,000)
    trait: TraitType;
    /** SONUCLARIN olusturdugu profesyonel guven. Oyu YALNIZCA bu belirler. */
    trust: number; // 0-100
    /** JESTLERIN olusturdugu kisisel yakinlik. Oy vermez, kapi acar.
     *  Bkz. core/market/governance.ts -> "GUVEN vs ILISKI" */
    relationship?: number; // 0-100, varsayilan 50
    /** Aslinda ne pesinde — hangi jestin ise yaradigini belirler. */
    motivation?: Motivation;
    /**
     * TAKINTI. Bu uyenin her toplantida donup dolasip geldigi konu.
     * Kurulunda borc takintili kimse yoksa borcunu kimse sormaz —
     * kimi kurula aldigin, neyin hesabini verecegini belirler.
     */
    petIssue?: PetIssue;
    /** Bu uyeye yapilan jest sayisi — azalan getiri icin */
    gestureCount?: number;
    /** Olay turu -> ust uste kac kez goruldu (tekrar yorgunlugu) */
    fatigue?: Record<string, number>;
    isHostile: boolean; // True if trust < 20
    origin: 'Founder' | 'Investor' | 'Network' | 'DebtShark';
    networkId?: string; // If they came from the "Love/Friends" module
}

/** Bir jestin sonucu — ekranda gerekcesiyle gostermek icin. */
export interface GestureResult {
    success: boolean;
    delta: number;
    message: string;
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
    seizedShareCount: number; // Absolute share count seized
    lenderName: string;
    loanAmount: number;
    playerShareCountRemaining: number; // Absolute share count remaining
}


interface ShareholderState {
    // State
    members: BoardMember[];
    totalShares: number; // Total shares in company (e.g., 10,000,000)
    playerShareCount: number; // Absolute share count owned by player (e.g., 6,500,000)
    /**
     * Kurulun BASKIN HUYU (hisse agirlikli). Bu bir "hava" degil, kurulun
     * karakteri: cogunlugu Conservative olan bir kurul farkli sey ister.
     */
    boardMood: TraitType;
    /**
     * Kurulun SANA KARSI TAVRI — ortalama guvenden gelir.
     * Bunlar iki AYRI kavram ve baslangicta ayni alani paylasiyorlardi.
     * Kurul Conservative olabilir ve yine de seni destekliyor olabilir.
     */
    boardStance: 'Supportive' | 'Neutral' | 'Restless' | 'Hostile';
    sharkLoans: SharkLoan[]; // Active predatory loans

    // Actions
    initializeGame: () => void;
    recalculateBoardMood: () => void;
    evaluatePlayerAction: (actionType: 'DIVIDEND' | 'DILUTION' | 'ACQUISITION' | 'HOLD_CASH') => void;
    appointDirectorFromNetwork: (networkContact: NetworkContact, shareCount?: number) => { success: boolean; message: string };
    calculateBuyoutPrice: (memberId: string, currentStockPrice: number) => BuyoutResult | null;
    takeSharkLoan: (lenderId: string, amount: number, deadlineTurn: number, addCashFn: (n: number) => void) => { success: boolean; message: string };
    repaySharkLoan: (loanId: string, spendCashFn: (amount: number) => boolean) => { success: boolean; message: string };
    seizeCollateral: (loanId: string, currentStockPrice: number) => SeizureResult | null;

    // Interaction Actions
    giftMember: (memberId: string, giftType: 'small' | 'large') => { success: boolean; message: string; trustChange: number };
    askForAdvice: (memberId: string) => { text: string; quality: 'good' | 'bad' | 'neutral' };
    calculateNegotiationChance: (memberId: string, offerPremium: number) => { success: boolean; reaction: 'insulted' | 'neutral' | 'happy' };

    // Trading Actions
    negotiateSharePurchase: (memberId: string, shareCount: number, offerPremium: number) => { success: boolean; message: string; sharesBought: number };
    sellSharesToMember: (memberId: string, shareCount: number, priceMultiplier: number) => { success: boolean; message: string; sharesSold: number };

    // Helper Selectors
    // ================= YONETISIM (bkz. core/market/governance.ts) =========
    /** Verilen ve henuz kapanmamis sozler */
    promises: BoardPromise[];
    /** Bu ceyrek kimlere lobi yapildi: memberId -> egilim katkisi */
    lobbied: Record<string, number>;
    /** Son oylamanin sonucu — ekranda gosterilir */
    lastVote?: VoteResult & { title: string };
    /** CEO gorevden alindi mi */
    ceoRemoved: boolean;
    /** Guvensizlik oyunun kac kosulu saglandi (erken uyari) */
    noConfidenceLevel: number;
    /** Kurulun bu ceyrek gordugu olaylar — rapor ekraninda listelenir */
    boardLog: { label: string; effect: string }[];

    /** Bir olayi kurula bildir: dereceli, baglamli tepki */
    applyBoardEvent: (event: BoardEvent, ctx: CompanyContext) => void;
    /** Bu karar oya gitmeli mi */
    needsVote: (proposal: Proposal) => { required: boolean; reason: string };
    /** Oylamayi yurut */
    holdVote: (proposal: Proposal, ctx: CompanyContext) => VoteResult;
    /** Bir uyeye lobi yap */
    lobby: (memberId: string, proposal: Proposal) => ReturnType<typeof lobbyMember>;
    /** Soz ver */
    makePromise: (memberId: string, kind: BoardPromise['kind'], dueQuarter: number, magnitude: number, description: string) => void;
    /** Vadesi gelen sozleri degerlendir */
    settlePromises: (currentQuarter: number, keptKinds: BoardPromise['kind'][], ctx: CompanyContext) => void;
    /** Guvensizlik kontrolu — ceyrek sonunda */
    runNoConfidence: (ctx: CompanyContext, quarter?: number) => { called: boolean; removed: boolean; result?: VoteResult; warning?: string };
    /** Ceyrek basinda lobi ve gunlugu temizle */
    /**
     * KISISEL JEST — hediye, yemek, ilgi.
     *
     * GUVENI DEGIL ILISKIYI artirir. Para oy satin alamaz; iliskinin
     * getirisi bilgi ve zamandir. Motivasyon filtresinden gecer: yanlis
     * adama yanlis jest ters teper.
     * Bkz. core/market/governance.ts -> giftEffect
     */
    offerGesture: (memberId: string, gestureFor: Motivation, magnitude: number) => GestureResult;

    // ================= KURULUN KENDI GUNDEMI =============================
    /** Kurulun senden istedigi, henuz kapanmamis seyler */
    boardDemands: BoardDemand[];
    /** Tur bazinda bekleme: bu ceyrekten once ayni talep acilamaz */
    demandCooldowns: Partial<Record<DemandKind, number>>;
    /** Bir talep kapandiktan sonra kurulun sustugu ceyrek */
    demandQuietUntil: number;
    /** Son guvensizlik oyunun yapildigi ceyrek — arka arkaya yapilamaz */
    lastNoConfidenceQuarter: number;
    /** Ceyrek sonunda: yeni talep dogar mi, acik talepler ne oldu */
    reviewDemands: (ctx: DemandContext, quarter: number) => {
        raised?: BoardDemand; met: BoardDemand[]; failed: BoardDemand[];
    };
    /** Oyuncu acikca bir talebi karsiladi (temettu odedi, Ar-Ge yapti...) */
    satisfyDemand: (kind: DemandKind) => void;
    resetQuarterlyBoard: () => void;

    getPlayerOwnershipPercent: () => number;
    getMemberOwnershipPercent: (memberId: string) => number;
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
//  TEK DÖNÜŞTÜRÜCÜ — bu dosyadaki en sinsi hata sinifinin ilaci
// ============================================================================
//  `GovMember` yedi ayri yerde ELLE kuruluyordu ve her yeni alan (iliski,
//  motivasyon, takinti, yorgunluk) bu literallerin altisinda sessizce
//  dusuyordu. Yani ozellik yazilmis, kaydedilmis, ekranda gorulmus ama
//  motora HIC ULASMAMIS oluyordu.
//
//  Artik tek yer var. Yeni bir alan eklendiginde burayi guncellemek
//  yeterli; unutulacak ikinci bir kopya yok.
// ============================================================================
const toGov = (m: BoardMember): GovMember => ({
    id: m.id,
    name: m.name,
    trait: m.trait as any,
    trust: m.trust,
    shareCount: m.shareCount,
    isHostile: m.isHostile,
    relationship: m.relationship ?? RELATIONSHIP_NEUTRAL,
    motivation: m.motivation,
    petIssue: m.petIssue,
    fatigue: m.fatigue,
});

// ============================================================================
// CONSTANTS
// ============================================================================

const TOTAL_SHARES = 10_000_000; // 10 million shares total

// ============================================================================
// INITIAL NPC BOARD MEMBERS (3.5M shares = 35% Total)
// ============================================================================

const INITIAL_BOARD_MEMBERS: BoardMember[] = [
    {
        id: 'npc-marcus-wolf',
        name: "Marcus 'The Wolf'",
        shareCount: 1_200_000, // 12% of company
        trait: 'Shark',
        trust: 50,
        isHostile: false,
        origin: 'Investor',
        // Parayi sever, gideri dert edinir. Hediye ONA gecer.
        motivation: 'money',
        petIssue: 'headcount',
    },
    {
        id: 'npc-elena-vance',
        name: 'Elena Vance',
        shareCount: 1_000_000, // 10% of company
        trait: 'Conservative',
        trust: 65,
        isHostile: false,
        origin: 'Founder',
        // Kurucu: adi bu sirketle anilsin ister. Ona para uzatirsan
        // hakaret sayar; masaya davet edersen kazanirsin.
        motivation: 'legacy',
        petIssue: 'debt',
    },
    {
        id: 'npc-victor-k',
        name: 'Victor K.',
        shareCount: 800_000, // 8% of company
        trait: 'Snake',
        trust: 40,
        isHostile: false,
        origin: 'Investor',
        // Talep acmaz — zayif kalmak isine gelir. Peşinde koltuk var.
        motivation: 'control',
    },
    {
        id: 'npc-sarah-jen',
        name: 'Sarah Jen',
        shareCount: 500_000, // 5% of company
        trait: 'Aggressive',
        trust: 55,
        isHostile: false,
        origin: 'Founder',
        motivation: 'vindication',
        petIssue: 'market_share',
    },
];

// ============================================================================
// ZUSTAND STORE
// ============================================================================

/**
 * Yonetisim olayini hisse fiyatina isle.
 * Zaten kurulmus olan sinyal borusundan gecer (marketMultiplier).
 */
const applyGovernanceSignal = (key: string) => {
    try {
        const { GOVERNANCE_SIGNALS } = require('../../../core/market/governance');
        const sig = GOVERNANCE_SIGNALS[key];
        if (!sig) return;
        const eq = require('../../finance/stores/useEquityStore').useEquityStore;
        const cur = eq.getState().marketMultiplier || 1;
        eq.setState({
            marketMultiplier: Math.max(0.3, cur * (1 + sig.impactPercent / 100)),
        });
    } catch { /* piyasa sinyali uygulanamadi */ }
};

export const useShareholderStore = create<ShareholderState>()(
    persist(
        (set, get) => ({
            // ========================================================================
            // STATE
            // ========================================================================
            members: [] as BoardMember[],
            totalShares: TOTAL_SHARES,
            playerShareCount: 6_500_000, // 65% of 10M
            boardMood: 'Conservative',
            boardStance: 'Neutral' as const,
            sharkLoans: [] as SharkLoan[], // No loans initially

            // ========================================================================
            // ACTIONS
            // ========================================================================

            /**
             * Initialize the game with default board members and player shares.
             * Player starts with 6.5M shares (65%), NPCs hold 3.5M (35%).
             */
            promises: [] as BoardPromise[],
            lobbied: {} as Record<string, number>,
            ceoRemoved: false,
            noConfidenceLevel: 0,
            boardLog: [] as { label: string; effect: string }[],
            boardDemands: [] as BoardDemand[],
            demandCooldowns: {} as Partial<Record<DemandKind, number>>,
            demandQuietUntil: 0,
            lastNoConfidenceQuarter: -99,

            initializeGame: () => {
                const members = INITIAL_BOARD_MEMBERS;

                // Calculate player shares
                const totalMemberShares = members.reduce((sum, m) => sum + m.shareCount, 0);
                const playerShareCount = TOTAL_SHARES - totalMemberShares;

                // Validation
                if (playerShareCount < 0) {
                    console.error('[Shareholder Store] ERROR: Member shares exceed total shares!');
                    return;
                }

                const playerOwnershipPercent = (playerShareCount / TOTAL_SHARES) * 100;

                console.log('[Shareholder Store] Initialized:', {
                    totalShares: TOTAL_SHARES.toLocaleString(),
                    playerShareCount: playerShareCount.toLocaleString(),
                    playerOwnership: `${playerOwnershipPercent.toFixed(1)}%`,
                    memberCount: members.length,
                    totalMemberShares: totalMemberShares.toLocaleString(),
                });

                set({
                    members,
                    totalShares: TOTAL_SHARES,
                    playerShareCount,
                    boardMood: 'Conservative',
                    sharkLoans: [],

                    // --------------------------------------------------
                    //  YENI OYUN GERCEKTEN YENI BASLASIN
                    // --------------------------------------------------
                    //  Burada yalnizca uyeler ve hisseler sifirlaniyordu;
                    //  yonetisim durumunun tamami onceki oyundan
                    //  DEVREDIYORDU. En agiri `ceoRemoved`: yeni oyuna
                    //  gorevden alinmis olarak basliyordun. Acik talepler,
                    //  bekleme sureleri ve verilmis sozler de tasiniyordu.
                    // --------------------------------------------------
                    promises: [],
                    lobbied: {},
                    lastVote: undefined,
                    ceoRemoved: false,
                    noConfidenceLevel: 0,
                    lastNoConfidenceQuarter: -99,
                    boardLog: [],
                    boardDemands: [],
                    demandCooldowns: {},
                    demandQuietUntil: 0,
                });

                // Calculate initial board mood
                get().recalculateBoardMood();
                // YONETISIM KIRMIZI BAYRAGI.
                // Bir yonetim kurulu uyesinin sirkete borc vermesi, ustelik
                // teminat olarak CEO'nun hisselerini almasi, ciddi bir cikar
                // catismasidir. Piyasa bunu bankadan borc almaktan cok daha
                // agir okur. Bkz. core/market/credit.ts -> FINANCING_SIGNALS
                try {
                    const eq = require('../../finance/stores/useEquityStore').useEquityStore;
                    const sig = require('../../../core/market/credit').FINANCING_SIGNALS.insider_loan;
                    eq.setState((st: any) => ({
                        marketMultiplier: Math.max(0.3, st.marketMultiplier * (1 + sig.impactPercent / 100)),
                    }));
                } catch { /* piyasa tepkisi uygulanamadi */ }
            },

            /**
             * Recalculate the board mood based on the dominant trait.
             * The trait with the highest total share percentage becomes the boardMood.
             */
            recalculateBoardMood: () => {
                const { members } = get();

                // 1) BASKIN HUY — hisse agirlikli. Kurulun karakteri.
                const byTrait: Record<string, number> = {};
                members.forEach(m => {
                    byTrait[m.trait] = (byTrait[m.trait] || 0) + m.shareCount;
                });
                const dominant = Object.entries(byTrait)
                    .sort((a, b) => b[1] - a[1])[0]?.[0] as TraitType | undefined;

                // 2) SANA KARSI TAVIR — ortalama guvenden. Esikler
                //    governance.ts icinde, tek kaynak.
                const stance = boardMoodFrom(members.map(toGov));

                set({
                    boardMood: dominant ?? get().boardMood,
                    boardStance: stance,
                });
            },

            /**
             * Evaluate player action and update board member trust based on their traits.
             * Each trait reacts differently to different actions.
             */
            /**
             * EMEKLİYE AYRILDI — çağırmayın.
             *
             * Dort secenekli bir enum aliyordu ve motor her ceyrek "en
             * belirgin hamle neydi" diye TAHMIN edip birini yolluyordu.
             * Tepki yalnizca huya bakiyor, BUYUKLUGE ve BAGLAMA bakmiyordu:
             * 1 dolarlik temettu ile 500 milyonluk temettu ayni +15'i
             * veriyordu.
             *
             * Yerine `applyBoardEvent` geldi: her hamle kendi buyuklugu ve
             * baglamiyla ulasir. Bu fonksiyonu birakmiyoruz cunku bu
             * projede IKINCI YOL biraktigimiz her yerde iki sayi sessizce
             * birbirinden ayrildi.
             */
            evaluatePlayerAction: (actionType) => {
                console.warn(
                    `[Board] evaluatePlayerAction is retired. Use applyBoardEvent ` +
                    `with a magnitude and context instead. (${actionType})`
                );
            },

            /**
             * Appoint a friend/partner from the Love/Network module to the Board of Directors.
             * Transfers shares from player to the new director.
             */
            appointDirectorFromNetwork: (networkContact: NetworkContact, shareCount: number = 500_000) => {
                const { playerShareCount, members, totalShares } = get();

                // ============================================================
                // VALIDATION
                // ============================================================

                // Check if player has enough shares to give
                if (playerShareCount < shareCount) {
                    return {
                        success: false,
                        message: `Insufficient shares. You have ${formatNumber(playerShareCount)}, need ${formatNumber(shareCount)}.`,
                    };
                }

                // Check minimum share requirement (at least 100k shares = 1%)
                const MIN_SHARE_COUNT = totalShares * 0.01; // 100,000 shares
                if (shareCount < MIN_SHARE_COUNT) {
                    return {
                        success: false,
                        message: `Minimum share allocation is ${formatNumber(MIN_SHARE_COUNT)} shares (1%).`,
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
                    shareCount: shareCount,
                    trait: convertPersonalityToTrait(networkContact.personality.id),
                    trust: 80, // Start high because they're your friend
                    isHostile: false,
                    origin: 'Network',
                    networkId: networkContact.id,
                };

                // ============================================================
                // UPDATE STATE
                // ============================================================

                const newPlayerShareCount = playerShareCount - shareCount;
                const updatedMembers = [...members, newMember];

                set({
                    playerShareCount: newPlayerShareCount,
                    members: updatedMembers,
                });

                // Recalculate board mood with new member
                get().recalculateBoardMood();

                const ownershipPercent = (shareCount / totalShares) * 100;

                console.log('[Shareholder Store] New Director Appointed:', {
                    name: newMember.name,
                    shareCount: newMember.shareCount.toLocaleString(),
                    ownershipPercent: `${ownershipPercent.toFixed(2)}%`,
                    trait: newMember.trait,
                    playerShareCountRemaining: newPlayerShareCount.toLocaleString(),
                });

                return {
                    success: true,
                    message: `${networkContact.name} appointed to Board with ${formatNumber(shareCount)} shares (${ownershipPercent.toFixed(1)}%).`,
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
                    message: `Loan of ${formatMoney(amount)} secured from ${lender.name}. Due by turn ${deadlineTurn}.`,
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
                const { sharkLoans, members, playerShareCount, totalShares } = get();

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
                const shareCountToSeize = Math.floor((loan.amount / currentStockPrice) * PENALTY_MULTIPLIER);

                // Safety: Don't seize more than player has
                const actualSeizedShareCount = Math.min(shareCountToSeize, playerShareCount);

                // ============================================================
                // TRANSFER OWNERSHIP
                // ============================================================

                const newPlayerShareCount = Math.max(0, playerShareCount - actualSeizedShareCount);

                const updatedMembers = members.map((member) => {
                    if (member.id === loan.lenderId) {
                        return {
                            ...member,
                            shareCount: member.shareCount + actualSeizedShareCount,
                        };
                    }
                    return member;
                });

                // Mark loan as inactive
                const updatedLoans = sharkLoans.map((l) =>
                    l.id === loanId ? { ...l, isActive: false } : l
                );

                set({
                    playerShareCount: newPlayerShareCount,
                    members: updatedMembers,
                    sharkLoans: updatedLoans,
                });

                // Recalculate board mood with new ownership structure
                get().recalculateBoardMood();

                const result: SeizureResult = {
                    seizedShareCount: actualSeizedShareCount,
                    lenderName: lender.name,
                    loanAmount: loan.amount,
                    playerShareCountRemaining: newPlayerShareCount,
                };

                const percentSeized = (actualSeizedShareCount / totalShares) * 100;

                console.log('[Shareholder Store] Collateral Seized:', {
                    loanId,
                    lender: lender.name,
                    loanAmount: loan.amount,
                    stockPrice: currentStockPrice,
                    shareCountToSeize,
                    actualSeizedShareCount: actualSeizedShareCount.toLocaleString(),
                    percentSeized: `${percentSeized.toFixed(2)}%`,
                    playerShareCountRemaining: newPlayerShareCount.toLocaleString(),
                    lenderNewShareCount: (lender.shareCount + actualSeizedShareCount).toLocaleString(),
                });

                return result;
            },

            /**
             * Gift a board member to increase trust.
             * Small gifts cost $10k and give +5 trust.
             * Large gifts cost $100k and give +15 trust.
             */
            giftMember: (memberId: string, giftType: 'small' | 'large') => {
                const { members } = get();

                // Find the target member
                const member = members.find((m) => m.id === memberId);

                if (!member) {
                    return {
                        success: false,
                        message: 'Board member not found.',
                        trustChange: 0,
                    };
                }

                // Determine gift cost and trust increase
                const giftCost = giftType === 'small' ? 10_000 : 100_000;
                const trustIncrease = giftType === 'small' ? 5 : 15;

                // Check if player has enough money
                const { money, spendMoney } = require('../../../core/store/useStatsStore').useStatsStore.getState();

                if (money < giftCost) {
                    return {
                        success: false,
                        message: `Insufficient funds. Need ${formatMoney(giftCost)}, have ${formatMoney(money)}.`,
                        trustChange: 0,
                    };
                }

                // Deduct money
                const paymentSuccess = spendMoney(giftCost);

                if (!paymentSuccess) {
                    return {
                        success: false,
                        message: 'Failed to process payment.',
                        trustChange: 0,
                    };
                }

                // Update member trust
                const updatedMembers = members.map((m) => {
                    if (m.id === memberId) {
                        const newTrust = Math.min(100, m.trust + trustIncrease);
                        return {
                            ...m,
                            trust: newTrust,
                            isHostile: newTrust < 20, // Clear hostile flag if trust improves
                        };
                    }
                    return m;
                });

                set({ members: updatedMembers });
                get().recalculateBoardMood();

                const giftName = giftType === 'small' ? 'Small Gift' : 'Large Gift';

                console.log('[Shareholder Store] Gift Sent:', {
                    member: member.name,
                    giftType,
                    cost: giftCost,
                    trustIncrease,
                    newTrust: Math.min(100, member.trust + trustIncrease),
                });

                return {
                    success: true,
                    message: `${giftName} sent to ${member.name}. Trust increased by ${trustIncrease}.`,
                    trustChange: trustIncrease,
                };
            },

            /**
             * Ask a board member for advice.
             * Quality and content depend on trust level and personality trait.
             */
            askForAdvice: (memberId: string) => {
                const { members } = get();

                // Find the target member
                const member = members.find((m) => m.id === memberId);

                if (!member) {
                    return {
                        text: 'Member not found.',
                        quality: 'bad' as const,
                    };
                }

                // ============================================================
                // LOW TRUST (< 30): Dismissive/Hostile
                // ============================================================
                if (member.trust < 30) {
                    const dismissiveResponses = [
                        "I'm too busy for your questions.",
                        'Figure it out yourself.',
                        "Why should I help you? You've lost my trust.",
                        'Ask someone who cares.',
                        "I have nothing to say to you.",
                    ];
                    const randomIndex = Math.floor(Math.random() * dismissiveResponses.length);
                    return {
                        text: dismissiveResponses[randomIndex],
                        quality: 'bad' as const,
                    };
                }

                // ============================================================
                // MID TRUST (30-70): Generic Advice
                // ============================================================
                if (member.trust >= 30 && member.trust <= 70) {
                    const genericAdvice = [
                        'Market looks volatile, keep some cash on hand.',
                        'Diversify your portfolio to reduce risk.',
                        'Watch the quarterly reports closely.',
                        'Consider hedging against market downturns.',
                        'Keep an eye on competitor movements.',
                    ];
                    const randomIndex = Math.floor(Math.random() * genericAdvice.length);
                    return {
                        text: genericAdvice[randomIndex],
                        quality: 'neutral' as const,
                    };
                }

                // ============================================================
                // HIGH TRUST (> 70): Trait-Specific Strategic Advice
                // ============================================================
                let adviceText = '';

                switch (member.trait) {
                    case 'Shark':
                        adviceText = 'Acquire competitors now while they are weak. Strike fast and consolidate power.';
                        break;
                    case 'Conservative':
                        adviceText = 'Focus on steady dividends and build cash reserves. Stability wins in the long run.';
                        break;
                    case 'Aggressive':
                        adviceText = 'Double down on expansion. Strike while the iron is hot and dominate the market.';
                        break;
                    case 'Visionary':
                        adviceText = 'Invest heavily in R&D now. Future technology will dominate the next decade.';
                        break;
                    case 'Snake':
                        adviceText = 'Watch your back. Someone on this board is plotting against you. Trust no one.';
                        break;
                    case 'Loyalist':
                        adviceText = "I'll support whatever you decide. You have my complete trust and loyalty.";
                        break;
                    default:
                        adviceText = 'Stay the course and trust your instincts.';
                }

                console.log('[Shareholder Store] Advice Given:', {
                    member: member.name,
                    trait: member.trait,
                    trust: member.trust,
                    advice: adviceText,
                });

                return {
                    text: adviceText,
                    quality: 'good' as const,
                };
            },

            /**
             * Calculate negotiation success chance for share buyout.
             * Based on trust level and offer premium.
             */
            calculateNegotiationChance: (memberId: string, offerPremium: number) => {
                const { members } = get();

                // Find the target member
                const member = members.find((m) => m.id === memberId);

                if (!member) {
                    return {
                        success: false,
                        reaction: 'insulted' as const,
                    };
                }

                // ============================================================
                // CALCULATE SUCCESS CHANCE
                // ============================================================

                let chance = member.trust; // Base chance = trust level (0-100)
                let reaction: 'insulted' | 'neutral' | 'happy' = 'neutral';

                // Negative premium = Insulting offer
                if (offerPremium < 0) {
                    chance = 0;
                    reaction = 'insulted';
                }
                // Premium 0-20% = Neutral
                else if (offerPremium >= 0 && offerPremium <= 20) {
                    reaction = 'neutral';
                    // Chance stays at base (trust level)
                }
                // Premium > 20% = Happy (generous offer)
                else if (offerPremium > 20) {
                    chance = Math.min(100, chance + 30); // +30% bonus
                    reaction = 'happy';
                }

                // Clamp chance to 0-100
                chance = Math.max(0, Math.min(100, chance));

                // ============================================================
                // RANDOM ROLL
                // ============================================================

                const roll = Math.random() * 100;
                const success = roll <= chance;

                console.log('[Shareholder Store] Negotiation Calculation:', {
                    member: member.name,
                    trust: member.trust,
                    offerPremium: `${offerPremium}%`,
                    chance: `${chance.toFixed(1)}%`,
                    roll: roll.toFixed(1),
                    success,
                    reaction,
                });

                return {
                    success,
                    reaction,
                };
            },

            /**
             * Negotiate share purchase from a board member.
             * Includes negotiation, cash transfer, and positive price impact.
             * ATOMIC TRANSFER: Deduct from member, add to player.
             */
            negotiateSharePurchase: (memberId: string, shareCount: number, offerPremium: number) => {
                const { members, playerShareCount, totalShares } = get();

                // 1. Find the Seller
                const memberIndex = members.findIndex((m) => m.id === memberId);
                if (memberIndex === -1) {
                    return {
                        success: false,
                        message: 'Member not found.',
                        sharesBought: 0,
                    };
                }
                const member = members[memberIndex];

                // 2. STRICT VALIDATION & CAPPING
                // If player tries to buy more than member has, cap it to member's max shares.
                let actualBuyAmount = shareCount;
                if (shareCount > member.shareCount) {
                    actualBuyAmount = member.shareCount; // Take everything they have
                }

                if (actualBuyAmount <= 0) {
                    return {
                        success: false,
                        message: `${member.name} has no shares to sell.`,
                        sharesBought: 0,
                    };
                }

                // Calculate price with ACTUAL amount
                const stockPrice = useEquityStore.getState().stockPrice;
                const basePrice = stockPrice * actualBuyAmount;
                const premiumMultiplier = 1 + (offerPremium / 100);
                const finalPrice = basePrice * premiumMultiplier;

                // Check if player has enough cash
                const { money, spendMoney } = useStatsStore.getState();
                if (money < finalPrice) {
                    return {
                        success: false,
                        message: `Insufficient funds. Need ${formatMoney(finalPrice)} but only have ${formatMoney(money)}.`,
                        sharesBought: 0,
                    };
                }

                // Negotiation check
                const negotiationResult = get().calculateNegotiationChance(memberId, offerPremium);
                if (!negotiationResult.success) {
                    return {
                        success: false,
                        message: `${member.name} rejected your offer. They seem ${negotiationResult.reaction}.`,
                        sharesBought: 0,
                    };
                }

                // ------------------------------------------------------------
                // EXECUTE ATOMIC TRANSFER
                // ------------------------------------------------------------

                // 3. Deduct Cash
                spendMoney(finalPrice);

                set((state) => {
                    const updatedMembers = [...state.members];
                    // Re-find in current state to be safe, though unlikely to change in sync action
                    const currentMemberIndex = updatedMembers.findIndex((m) => m.id === memberId);
                    if (currentMemberIndex === -1) return state;

                    const currentMember = updatedMembers[currentMemberIndex];
                    const newMemberShareCount = currentMember.shareCount - actualBuyAmount;

                    // 4. CHECK FOR REMOVAL (The Veto)
                    if (newMemberShareCount <= 0) {
                        // REMOVE from array
                        updatedMembers.splice(currentMemberIndex, 1);
                        console.log(`[Shareholder Store] ${currentMember.name} has left the board.`);
                    } else {
                        // Update count
                        updatedMembers[currentMemberIndex] = {
                            ...currentMember,
                            shareCount: newMemberShareCount,
                        };
                    }

                    return {
                        members: updatedMembers,
                        playerShareCount: state.playerShareCount + actualBuyAmount,
                    };
                });

                // Trust impact (slight decrease if premium < 10%)
                if (offerPremium < 10) {
                    set((state) => {
                        // Check if member still exists before updating trust
                        const memberExists = state.members.some(m => m.id === memberId);
                        if (!memberExists) return state;

                        return {
                            members: state.members.map((m) =>
                                m.id === memberId
                                    ? {
                                        ...m,
                                        trust: Math.max(0, m.trust - 5),
                                        isHostile: m.trust - 5 < 20,
                                    }
                                    : m
                            ),
                        };
                    });
                }

                // Recalculate board mood
                get().recalculateBoardMood();

                // Price impact
                const percentTraded = (actualBuyAmount / totalShares) * 100;
                const PRICE_IMPACT_SENSITIVITY = 0.05;
                const currentValuation = useEquityStore.getState().getMarketCap();
                const impactMultiplier = 1 + (percentTraded / 100 * PRICE_IMPACT_SENSITIVITY);
                const newValuation = currentValuation * impactMultiplier;
                useEquityStore.getState().syncStockPrice(newValuation);

                console.log('[Share Purchase]', {
                    buyer: 'Player',
                    seller: member.name,
                    shareCount: actualBuyAmount.toLocaleString(),
                    percentOfCompany: `${percentTraded.toFixed(2)}%`,
                    premium: `${offerPremium}%`,
                    cost: finalPrice,
                    priceImpact: `+${((impactMultiplier - 1) * 100).toFixed(2)}%`,
                });

                return {
                    success: true,
                    message: `Acquired ${formatNumber(actualBuyAmount)} shares from ${member.name}.`,
                    sharesBought: actualBuyAmount,
                };
            },

            /**
             * Sell shares to a board member.
             * Trait-based willingness, trust loss, and negative price impact.
             */
            sellSharesToMember: (memberId: string, shareCount: number, priceMultiplier: number) => {
                const { members, playerShareCount, totalShares } = get();

                // Find the target member
                const member = members.find((m) => m.id === memberId);

                if (!member) {
                    return {
                        success: false,
                        message: 'Member not found.',
                        sharesSold: 0,
                    };
                }

                // Validation: Player must keep minimum 10% ownership
                const minOwnershipShares = totalShares * 0.10;
                if (playerShareCount - shareCount < minOwnershipShares) {
                    return {
                        success: false,
                        message: 'Cannot sell below 10% ownership. You must maintain control.',
                        sharesSold: 0,
                    };
                }

                // Validation: Maximum 20% per transaction
                const maxTransactionShares = totalShares * 0.20;
                if (shareCount > maxTransactionShares) {
                    return {
                        success: false,
                        message: `Cannot sell more than ${formatNumber(maxTransactionShares)} shares (20%) in a single transaction.`,
                        sharesSold: 0,
                    };
                }

                // Check trait-based willingness
                const isWillingToBuy = (() => {
                    switch (member.trait) {
                        case 'Shark':
                            // Loves discounts, hates premiums
                            return priceMultiplier <= 0.95;

                        case 'Loyalist':
                            // Helps player, accepts fair price
                            return priceMultiplier <= 1.05 && member.trust >= 50;

                        case 'Conservative':
                            // Only buys at deep discount
                            return priceMultiplier <= 0.80;

                        case 'Visionary':
                            // Buys if they believe in growth
                            return priceMultiplier <= 1.0 && member.trust >= 60;

                        case 'Aggressive':
                            // Opportunistic, buys at discount
                            return priceMultiplier <= 0.90;

                        case 'Snake':
                            // Only buys if they see weakness
                            return priceMultiplier <= 0.85 && get().getPlayerOwnershipPercent() < 40;

                        default:
                            return false;
                    }
                })();

                if (!isWillingToBuy) {
                    const reasons: Record<TraitType, string> = {
                        Shark: 'They want a better discount.',
                        Loyalist: 'They need more trust or a fairer price.',
                        Conservative: 'They demand a deep discount.',
                        Visionary: 'They need more trust or a discount.',
                        Aggressive: 'They want a discount.',
                        Snake: 'They sense you\'re not desperate enough.',
                    };

                    return {
                        success: false,
                        message: `${member.name} refuses. ${reasons[member.trait]}`,
                        sharesSold: 0,
                    };
                }

                // Calculate price
                const stockPrice = useEquityStore.getState().stockPrice;
                const basePrice = stockPrice * shareCount;
                const finalPrice = basePrice * priceMultiplier;

                // ------------------------------------------------------------
                // EXECUTE ATOMIC TRANSFER
                // ------------------------------------------------------------

                // ----------------------------------------------------------
                //  1. PARA NEREYE GIDIYOR
                // ----------------------------------------------------------
                //  Bunlar SENIN hisselerin; sattiginda para SIRKETE degil
                //  SANA gider (ikincil satis). Gercek hayatta da boyledir.
                //
                //  Ama oyuncu bunu goremiyordu: sirket kasasina bakiyor,
                //  hicbir sey degismedigi icin "para gelmedi" diyordu.
                //  Artik donus mesajinda hangi cebe girdigi yaziyor.
                // ----------------------------------------------------------
                useStatsStore.getState().earnMoney(finalPrice);

                set((state) => {
                    const updatedMembers = state.members.map((m) =>
                        m.id === memberId
                            ? { ...m, shareCount: m.shareCount + shareCount } // ADD
                            : m
                    );

                    return {
                        members: updatedMembers,
                        playerShareCount: state.playerShareCount - shareCount, // DEDUCT
                    };
                });

                // Trust impact (selling seen as abandoning ship)
                const percentTraded = (shareCount / totalShares) * 100;
                const trustLoss = Math.floor(percentTraded * 2); // 2 trust per 1% sold
                set((state) => ({
                    members: state.members.map((m) =>
                        m.id === memberId
                            ? {
                                ...m,
                                trust: Math.max(0, m.trust - trustLoss),
                                isHostile: m.trust - trustLoss < 20,
                            }
                            : m
                    ),
                }));

                // Recalculate board mood
                get().recalculateBoardMood();

                // ----------------------------------------------------------
                //  FIYAT ETKISI — iki yonden birden kirikti
                // ----------------------------------------------------------
                //  1) BUYUKLUK: `percentTraded / 100 * 0.05` idi. %10 hisse
                //     satmak fiyati %0,5 dusuruyordu — gorulmez.
                //
                //  2) KALICILIK: degerlemeyi bir kez oynatip birakiyordu.
                //     Motor bir sonraki ceyrekte degerlemeyi temel verilerden
                //     yeniden hesapladigi icin etki SILINIYORDU.
                //
                //  Dogrusu: kurucunun hisse satmasi bir SINYALDIR, temel
                //  veri degildir. O yuzden digerleri gibi piyasa duygusu
                //  carpanindan gecer ve zamanla soner.
                //
                //  Gercek piyasada icerideki birinin sattigini duyurmasi en
                //  guclu olumsuz isaretlerden biridir: sirketi en iyi tanian
                //  kisi cikiyor demektir. %10'luk bir satis ~%12 dusurur.
                // ----------------------------------------------------------
                const INSIDER_SELL_IMPACT = 1.2;   // satilan her %1 icin %1,2 dusus
                const drop = Math.min(0.35, (percentTraded * INSIDER_SELL_IMPACT) / 100);
                const eq = useEquityStore.getState();
                useEquityStore.setState({
                    marketMultiplier: Math.max(0.3, eq.marketMultiplier * (1 - drop)),
                });
                eq.syncStockPrice(useStatsStore.getState().companyValue || eq.getMarketCap());
                const impactMultiplier = 1 - drop;

                console.log('[Share Sale]', {
                    seller: 'Player',
                    buyer: member.name,
                    shareCount: shareCount.toLocaleString(),
                    percentOfCompany: `${percentTraded.toFixed(2)}%`,
                    multiplier: priceMultiplier,
                    revenue: finalPrice,
                    trustLoss: -trustLoss,
                    priceImpact: `${((impactMultiplier - 1) * 100).toFixed(2)}%`,
                });

                return {
                    success: true,
                    message:
                        `Sold ${formatNumber(shareCount)} shares to ${member.name} for ` +
                        `${formatMoney(finalPrice)}. The proceeds go to you personally, not the ` +
                        `company. The market read it as an insider exit: the share price fell ` +
                        `${(drop * 100).toFixed(1)}%.`,
                    sharesSold: shareCount,
                };
            },

            /**
             * Get player's ownership percentage
             */

            // ================================================================
            //  YÖNETİŞİM — bkz. core/market/governance.ts
            // ================================================================

            applyBoardEvent: (event, ctx) => {
                const { members } = get();
                const log: { label: string; effect: string }[] = [];

                const updated = members.map(m => {
                    const gm: GovMember = toGov(m);
                    const delta = trustDelta(gm, event, ctx);
                    if (delta !== 0) {
                        log.push({
                            label: `${m.name} (${t('data.trait.' + m.trait)})`,
                            effect: `${delta > 0 ? '+' : ''}${delta} trust`,
                        });
                    }
                    const trust = Math.max(0, Math.min(100, m.trust + delta));
                    // Bu olay turunu bir kez daha gordu: bir dahakine
                    // daha az etkilenecek. Ust sinir var ki tamamen
                    // duyarsizlasmasin.
                    const fatigue = {
                        ...(m.fatigue || {}),
                        [event.kind]: Math.min(FATIGUE_CAP, (m.fatigue?.[event.kind] ?? 0) + 1),
                    };
                    return { ...m, trust, isHostile: trust < 20, fatigue };
                });

                set(state => ({
                    members: updated,
                    boardLog: [...state.boardLog, { label: event.label, effect: '' }, ...log],
                }));
                get().recalculateBoardMood();
            },

            needsVote: (proposal) =>
                requiresVote(proposal, get().getPlayerOwnershipPercent()),

            holdVote: (proposal, ctx) => {
                const { members, playerShareCount, totalShares, lobbied } = get();
                const gov: GovMember[] = members.map(toGov);

                const result = castVotes(gov, playerShareCount, totalShares, proposal, ctx, lobbied);

                // ----------------------------------------------------------
                //  KURULA RAĞMEN GEÇİRMENİN BEDELİ
                // ----------------------------------------------------------
                //  Cogunluktaysan oyu kaybedemezsin — gercek hayatta da
                //  oyle. Ama kurulun aleyhine oy verdigi bir karari yine de
                //  gecirmek bedava degildir: guven coker, yoneticiler
                //  istifa eder, piyasa bunu yonetisim sorunu olarak fiyatlar.
                //  Kurulu, kaybedemeyecegin bir oyda bile onemli kilan sey.
                // ----------------------------------------------------------
                if (result.overrode) {
                    const survivors: typeof members = [];
                    let resigned = 0;
                    members.forEach(m => {
                        const votedNo = result.votes.find(v => v.memberId === m.id)?.vote === 'NO';
                        if (votedNo && Math.random() < OVERRIDE_RESIGN_CHANCE) {
                            resigned++;
                            return; // istifa etti — hisseleri dolasima cikar
                        }
                        const trust = votedNo
                            ? Math.max(0, m.trust - OVERRIDE_TRUST_COST)
                            : m.trust;
                        survivors.push({ ...m, trust, isHostile: trust < 20 });
                    });
                    set(state => ({
                        members: survivors,
                        boardLog: [...state.boardLog, {
                            label: `You overrode the board on "${proposal.title}"`,
                            effect: resigned > 0
                                ? `${resigned} director(s) resigned`
                                : `−${OVERRIDE_TRUST_COST} trust from every dissenter`,
                        }],
                    }));
                    applyGovernanceSignal('proposal_rejected');
                    if (resigned > 0) applyGovernanceSignal('director_resigned');
                } else if (!result.passed) {
                    applyGovernanceSignal('proposal_rejected');
                }

                set({ lastVote: { ...result, title: proposal.title } });
                get().recalculateBoardMood();
                return result;
            },

            lobby: (memberId, proposal) => {
                const { members, lobbied } = get();
                const m = members.find(x => x.id === memberId);
                if (!m) {
                    return { success: false, pull: 0, message: 'Member not found.' };
                }
                const gm: GovMember = toGov(m);
                const res = lobbyMember(gm, proposal, lobbied[memberId] !== undefined);
                if (res.success) {
                    set({ lobbied: { ...lobbied, [memberId]: res.pull } });
                } else {
                    // Basarisiz lobi de kaydedilir: ayni ceyrek tekrar denenemez.
                    set({ lobbied: { ...lobbied, [memberId]: 0 } });
                }
                return res;
            },

            makePromise: (memberId, kind, dueQuarter, magnitude, description) => {
                set(state => ({
                    promises: [...state.promises, {
                        id: `PROM_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                        memberId, kind, dueQuarter, magnitude, description,
                    }],
                }));
            },

            settlePromises: (currentQuarter, keptKinds, ctx) => {
                const { promises } = get();
                const due = promises.filter(p => !p.resolved && p.dueQuarter <= currentQuarter);
                if (due.length === 0) return;

                due.forEach(p => {
                    const kept = keptKinds.includes(p.kind);
                    const event = resolvePromise(p, kept);
                    // Soz KISIYE verilir: yalnizca o uyenin guveni oynar.
                    const { members } = get();
                    const updated = members.map(m => {
                        if (m.id !== p.memberId) return m;
                        const gm: GovMember = toGov(m);
                        const d = trustDelta(gm, event, ctx);
                        const trust = Math.max(0, Math.min(100, m.trust + d));
                        return { ...m, trust, isHostile: trust < 20 };
                    });
                    set(state => ({
                        members: updated,
                        boardLog: [...state.boardLog, { label: event.label, effect: kept ? 'trust restored' : 'trust broken' }],
                    }));
                    if (!kept) applyGovernanceSignal('promise_broken');
                });

                set(state => ({
                    promises: state.promises.map(p =>
                        due.find(d => d.id === p.id)
                            ? { ...p, resolved: keptKinds.includes(p.kind) ? 'kept' as const : 'broken' as const }
                            : p,
                    ),
                }));
                get().recalculateBoardMood();
            },

            runNoConfidence: (ctx, quarter = 0) => {
                const { members, playerShareCount, totalShares } = get();
                const gov: GovMember[] = members.map(toGov);
                const check = checkNoConfidence(gov, get().getPlayerOwnershipPercent(), ctx);
                set({ noConfidenceLevel: check.conditionsMet });

                if (!check.triggered) {
                    return { called: false, removed: false, warning: check.warning };
                }

                // Atlatilan bir oylamadan sonra kurul bir sure yeniden
                // toplanamaz. Yoksa her ceyrek oylama yapiliyor ve her
                // cagri hisseye ayri bir darbe vuruyordu.
                if (quarter - get().lastNoConfidenceQuarter < NO_CONFIDENCE_COOLDOWN) {
                    return { called: false, removed: false, warning: check.warning };
                }

                applyGovernanceSignal('no_confidence_called');
                const result = voteNoConfidence(gov, playerShareCount, ctx, totalShares);
                applyGovernanceSignal(result.passed ? 'ceo_removed' : 'ceo_survived');

                set(state => ({
                    lastNoConfidenceQuarter: quarter,
                    ceoRemoved: result.passed,
                    lastVote: { ...result, title: 'Vote of No Confidence' },
                    boardLog: [...state.boardLog, {
                        label: 'Vote of no confidence',
                        effect: result.summary,
                    }],
                }));
                return { called: true, removed: result.passed, result };
            },


            // ================= KURULUN KENDI GUNDEMI =====================
            //  Kurul artik sadece not vermiyor, ISTIYOR.
            reviewDemands: (ctx, quarter) => {
                const { members, boardDemands } = get();
                const gov = (): GovMember[] => get().members.map(toGov);

                const met: BoardDemand[] = [];
                const failed: BoardDemand[] = [];
                const still: BoardDemand[] = [];

                // --- Acik talepleri degerlendir --------------------------
                for (const d of boardDemands) {
                    if (d.status !== 'open') continue;
                    const verdict = evaluateDemand(d, ctx, quarter, (d as any).__satisfied === true);
                    if (verdict === 'met') met.push({ ...d, status: 'met' });
                    else if (verdict === 'failed') failed.push({ ...d, status: 'failed' });
                    else still.push(d);
                }

                // --- Guven sonuclarini isle -----------------------------
                let next = get().members;
                const log = [...get().boardLog];
                const applyTrust = (d: BoardDemand, own: number, others: number, label: string) => {
                    next = next.map(m => {
                        const delta = m.id === d.raisedBy ? own : others;
                        return { ...m, trust: Math.max(0, Math.min(100, m.trust + delta)) };
                    });
                    log.push({ label, effect: `${own > 0 ? '+' : ''}${own}` });
                };
                met.forEach(d => applyTrust(d, DEMAND_MET_TRUST, DEMAND_MET_TRUST_OTHERS,
                    t('board.demandMetLog', { v1: d.raisedByName })));
                failed.forEach(d => applyTrust(d, DEMAND_FAILED_TRUST, DEMAND_FAILED_TRUST_OTHERS,
                    t('board.demandFailedLog', { v1: d.raisedByName })));

                // --- Bekleme sureleri ----------------------------------
                //  Kapanan her talep turu bir sure geri gelmez ve kurul
                //  en az bir ceyrek susar. Aksi halde ihmal edilen talep
                //  cezayi kesip AYNI ceyrekte yeniden aciliyordu.
                const cooldowns = { ...get().demandCooldowns };
                met.forEach(d => { cooldowns[d.kind] = quarter + DEMAND_COOLDOWN_MET; });
                failed.forEach(d => { cooldowns[d.kind] = quarter + DEMAND_COOLDOWN_FAILED; });
                const closed = met.length + failed.length;
                const quietUntil = closed > 0
                    ? Math.max(get().demandQuietUntil, quarter + DEMAND_QUIET)
                    : get().demandQuietUntil;

                // --- Yeni talep: ayni anda tek bir tane -----------------
                let raised: BoardDemand | undefined;
                if (still.length === 0 && quarter >= quietUntil) {
                    const d = detectDemand(gov(), ctx, quarter, cooldowns);
                    if (d) { raised = d; still.push(d); }
                }

                set({
                    members: next, boardDemands: still, boardLog: log,
                    demandCooldowns: cooldowns, demandQuietUntil: quietUntil,
                });
                get().recalculateBoardMood();
                return { raised, met, failed };
            },

            satisfyDemand: (kind) => {
                set({
                    boardDemands: get().boardDemands.map(d =>
                        d.kind === kind && d.status === 'open' ? ({ ...d, __satisfied: true } as BoardDemand) : d,
                    ),
                });
            },

            offerGesture: (memberId, gestureFor, magnitude) => {
                const { members } = get();
                const member = members.find(m => m.id === memberId);
                if (!member) {
                    return { success: false, delta: 0, message: 'Member not found' };
                }

                const delta = giftEffect(
                    {
                        id: member.id, name: member.name, trait: member.trait,
                        trust: member.trust, shareCount: member.shareCount,
                        relationship: member.relationship ?? RELATIONSHIP_NEUTRAL,
                        motivation: member.motivation,
                    },
                    gestureFor,
                    magnitude,
                    // Ayni adama ust uste jest yapmak sonuk kalir.
                    member.gestureCount ?? 0,
                );

                const before = member.relationship ?? RELATIONSHIP_NEUTRAL;
                const after = Math.max(0, Math.min(100, before + delta));

                set({
                    members: members.map(m =>
                        m.id === memberId
                            ? { ...m, relationship: after, gestureCount: (m.gestureCount ?? 0) + 1 }
                            : m,
                    ),
                });

                return {
                    success: delta > 0,
                    delta,
                    message:
                        delta > 0
                            ? `${member.name}: ${before.toFixed(0)} -> ${after.toFixed(0)}`
                            : `${member.name} bunu bir jest olarak gormedi.`,
                };
            },

            resetQuarterlyBoard: () => {
                // NOTRE CEKIM: guven her ceyrek 55'e dogru kayar. Olaylar
                // uygulanmadan ONCE, ki o ceyregin hamleleri taze kalsin.
                const decayed = get().members.map(m => {
                    const t = decayTrust(m.trust);
                    return {
                        ...m,
                        trust: Math.round(t),
                        isHostile: t < 20,
                        // ILISKI DE SONER — ve guvenden daha yavas.
                        // Bir kez yemek yiyip yillarca dost kalinmaz; ama
                        // bir kotu ceyrek de dostlugu bitirmez.
                        relationship: Math.round(decayRelationship(m.relationship)),
                        // Jest yorgunlugu ceyrek basi bir kademe dinlenir.
                        gestureCount: Math.max(0, (m.gestureCount ?? 0) - 1),
                        // Olay yorgunlugu da soner: tekrarlanmayan bir
                        // hamle zamanla yeniden sasirtici olur. Sonme
                        // artistan yavas, yoksa hicbir zaman birikmez.
                        fatigue: Object.fromEntries(
                            Object.entries(m.fatigue || {})
                                .map(([k, v]) => [k, Math.max(0, v - FATIGUE_RECOVERY)])
                                .filter(([, v]) => (v as number) > 0),
                        ) as Record<string, number>,
                    };
                });
                set({ members: decayed, lobbied: {}, boardLog: [] });
                get().recalculateBoardMood();
            },

            getPlayerOwnershipPercent: () => {
                const { playerShareCount, totalShares } = get();
                return (playerShareCount / totalShares) * 100;
            },

            /**
             * Get a member's ownership percentage
             */
            getMemberOwnershipPercent: (memberId: string) => {
                const { members, totalShares } = get();
                const member = members.find(m => m.id === memberId);
                if (!member) return 0;
                return (member.shareCount / totalShares) * 100;
            },

        }),
        {
            name: 'shareholder-store',
            storage: createJSONStorage(() => zustandStorage),
        }
    )
);

// Export types for UI components
export type { BuyoutResult, SharkLoan, SeizureResult };

