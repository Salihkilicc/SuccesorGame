import { t } from '../i18n';
import { founderOf } from '../../data/market/founders';
// src/core/market/governance.ts
//
// ============================================================================
//  GOVERNANCE — where the board actually has power
// ============================================================================
//
//  WHAT WAS HERE BEFORE: A PET GAUGE
//  ---------------------------------
//  The board system was written and even had a screen, but it had NO POWER:
//
//    - `trust` moved between 0-100 and was NEVER READ. It only drew a bar
//      on the profile screen.
//    - `isHostile` was set; no code ever read the flag.
//    - `boardMood` only decided the COLOUR of a label.
//    - `VotingOverlay.tsx` was written and called from no screen.
//    - The "Call Emergency Vote" button ran `console.log`.
//    - `appointDirectorFromNetwork` was called from nowhere.
//
//  So the board could not APPROVE anything, BLOCK anything, or REMOVE
//  anyone. Driving trust to zero and driving it to a hundred had the same
//  consequence: none.
//
//  Only one thing makes a board real:
//
//                  IT CAN TAKE THE COMPANY FROM YOU.
//
//  SECOND PROBLEM: BLIND REACTION
//  ------------------------------
//  `evaluatePlayerAction` took a four-option enum, and each quarter the
//  engine GUESSED "what was the most notable move" and sent one of them.
//  In that quarter you might have taken a loan shark's money, cut 200 jobs
//  and gone public — the board only heard "ACQUISITION".
//
//  Worse, the reaction looked only at TEMPERAMENT, not at SIZE or CONTEXT.
//  A $1 dividend and a $500M dividend both gave the same +15. Paying a
//  dividend while losing money was the same as paying one out of record
//  profit.
//
//  WHAT THIS FILE BUILDS
//  ---------------------
//      player move -> board event (SIZE + CONTEXT)
//                       |- each member's trust
//                       |- board mood
//                       '- share-price signal
//
//      major decisions -> A VOTE (SHARE-WEIGHTED)
//                       |- passes / IS REJECTED   <- the first real wall
//                       '- rejection = reputation + share-price hit
//
//      poor performance + low trust + loss of majority
//                    -> NO-CONFIDENCE VOTE -> the CEO is gone
//
//  THE SPINE OF THE DESIGN: the board is NOT a separate feature. It is the
//  consequence layer for the cap table that already existed. Until now, IPOs,
//  dilution, mezzanine conversion and selling shares to a member all moved
//  shares but cost you nothing — only a percentage changed. The moment a
//  vote exists, every one of them starts costing CONTROL.
//
// ============================================================================

export type { TraitType } from './governanceTypes';
import type { TraitType } from './governanceTypes';

export interface GovMember {
    id: string;
    name: string;
    trait: TraitType;
    /** Professional trust, built by RESULTS. This is what decides votes. */
    trust: number;
    shareCount: number;
    isHostile?: boolean;

    // --- KISISEL KATMANLAR (bkz. asagidaki "KISI" bolumu) ---
    /** JESTLERIN olusturdugu kisisel yakinlik. Oy vermez, kapi acar. */
    relationship?: number;
    /** What they actually want — decides which gift and which argument lands. */
    motivation?: Motivation;
    /** Kurula nasil geldi. Her cumlesinin rengi buradan cikar. */
    origin?: DirectorOrigin;
    /** Orantisiz onemsedigi tek konu. Toplantida hep bunu kasir. */
    petIssue?: PetIssue;
    /** Ust uste ayni hamleyi gormenin yorgunlugu (olay turu -> tekrar sayisi). */
    fatigue?: Record<string, number>;
}

// ============================================================================
//  THE PERSON — a character type is a skeleton, not a human being
// ============================================================================
//  Six character types are a good backbone, but two members of the same type
//  behaved identically. Personal layers sit on top: what they want, where
//  they came from, and the one issue they care about out of all proportion.
// ============================================================================

/** What is this person actually after? Determines which gesture works. */
export type Motivation =
    | 'money'      // temettu, geri alim, kisisel kazanc
    | 'legacy'     // buyuk isler, adinin gecmesi
    | 'control'    // koltuk, oy, soz hakki
    | 'safety'     // dusuk borc, nakit, risksizlik
    | 'vindication'; // hakli cikmak

/** Kurula nasil geldi. */
export type DirectorOrigin =
    | 'founder_acquired'  // satin aldigin sirketin kurucusu
    | 'bank_imposed'      // banka dayatti
    | 'early_investor'    // ilk gunden vardi
    | 'activist';         // hisse toplayip koltuk istedi

/** Orantisiz onemsedigi konu. */
export type PetIssue = 'debt' | 'headcount' | 'rnd' | 'dividend' | 'market_share';

// ============================================================================
//  TRUST vs RELATIONSHIP — two different things, and they must stay apart
// ============================================================================
//  THE DANGER: gifts raised trust, and trust decided votes. So money bought
//  votes outright. A rich CEO would be untouchable and the board would end
//  up meaningless again, just from the opposite direction.
//
//  The split:
//    TRUST        <- results only (profit, share, debt, promises kept). Votes.
//    RELATIONSHIP <- gestures (gifts, dinners, attention). Does NOT vote.
//
//  What a relationship buys you is information and time, never a vote:
//    - private warnings ("the board will discuss you next quarter")
//    - whispers about how the others intend to vote
//    - if UNDECIDED, they break your way (only when undecided!)
//    - they hold out longest in a no-confidence vote
// ============================================================================

export const RELATIONSHIP_NEUTRAL = 50;
/** Relationship drifts to neutral too, but SLOWER than trust: personal ties last longer. */
export const RELATIONSHIP_GRAVITY = 0.03;
/** Kararsiz bir uyeyi iliskinin cevirebilecegi en fazla egilim. */
export const RELATIONSHIP_TIEBREAK = 0.35;
/** Above this relationship a private channel opens: warnings and whispers. */
export const RELATIONSHIP_CONFIDANT = 70;

/** Iliskiyi bir ceyrek ilerlet — ilgi gostermezsen yavasca soner. */
export const decayRelationship = (relationship: number | undefined): number => {
    const r = relationship ?? RELATIONSHIP_NEUTRAL;
    return r + (RELATIONSHIP_NEUTRAL - r) * RELATIONSHIP_GRAVITY;
};

/**
 * The effect of a gesture on the relationship.
 *
 * MOTIVATION FILTER: the wrong gesture to the wrong person backfires.
 * Gifting cash to a visionary founder insults them; what they need to hear
 * is "I proved you right". That is why every gesture targets a motivation.
 */
/**
 * Diminishing returns on repeated gestures. The first gift is a gesture,
 * the fifth is an invoice. Without this the player could spend $50k five
 * times and befriend everyone — relationships would be purchasable.
 */
export const GESTURE_FATIGUE = 0.55;

export const giftEffect = (
    member: GovMember,
    gestureFor: Motivation,
    magnitude: number,
    /** How many gestures this member has already received */
    priorGestures = 0,
): number => {
    const fatigue = Math.pow(GESTURE_FATIGUE, Math.max(0, priorGestures));
    const base = 12 * Math.max(0, Math.min(1, magnitude)) * fatigue;
    const want = member.motivation ?? 'money';
    if (gestureFor === want) return Math.round(base * 1.5);
    // Yanlis jest: kucuk bir artis, hatta kimi tipte hakaret.
    if (want === 'legacy' && gestureFor === 'money') return -Math.round(base * 0.4);
    if (want === 'vindication' && gestureFor === 'money') return -Math.round(base * 0.3);
    return Math.round(base * 0.4);
};

/**
 * ILISKININ OY UZERINDEKI TEK ETKISI: kararsizi kirmak.
 *
 * `inclination` castVotes icindeki egilim (isaret oyu belirler). Iliski
 * bunu yalnizca SIFIRA YAKINSA cevirebilir. Guclu bir hayir'i eve
 * cevirmez — para oy satin almaz, sadece tereddudu lehine kirar.
 */
export const relationshipTiebreak = (
    member: GovMember,
    inclination: number,
): number => {
    if (Math.abs(inclination) > 0.25) return inclination; // kararli: dokunma
    const r = (member.relationship ?? RELATIONSHIP_NEUTRAL) - RELATIONSHIP_NEUTRAL;
    return inclination + (r / 50) * RELATIONSHIP_TIEBREAK;
};

/** Is this member close enough to speak to you privately? */
export const isConfidant = (m: GovMember): boolean =>
    (m.relationship ?? RELATIONSHIP_NEUTRAL) >= RELATIONSHIP_CONFIDANT;

// ============================================================================
//  REPETITION FATIGUE
// ============================================================================
//  Surfaced by a verification run: repeating the same move pinned a member
//  at the bottom and they never came back (a Conservative fell from 70 to 3
//  over five loss quarters and stayed there). In reality the first dividend
//  is news, the fifth is routine. Each repeat of the same event lands softer.
// ============================================================================
export const FATIGUE_DECAY = 0.65;
/** Yorgunluk ust siniri — uye tamamen duyarsizlasmasin. */
export const FATIGUE_CAP = 5;
/** Ceyrek basi sonme. Artistan (1) yavas, yoksa hic birikmez. */
export const FATIGUE_RECOVERY = 0.5;

/** Ayni olayin ust uste tekrarinda etkiyi soker. */
export const fatigueMultiplier = (member: GovMember, kind: string): number => {
    const seen = member.fatigue?.[kind] ?? 0;
    return Math.pow(FATIGUE_DECAY, Math.max(0, seen));
};

// ============================================================================
//  1. BOARD EVENTS — the ones that carry size and context
// ============================================================================

export type BoardEventKind =
    | 'dividend'          // temettu dagitildi
    | 'buyback'           // hisse geri alimi
    | 'dilution'          // yeni hisse ihraci
    | 'ipo'               // halka arz
    | 'acquisition'       // sirket satin alindi
    | 'divestiture'       // istirak satildi
    | 'debt_taken'        // kredi cekildi
    | 'mezzanine_taken'   // mezzanine cekildi
    | 'shark_loan'        // tefeciden borc
    | 'layoffs'           // isten cikarma
    | 'capex'             // tesis yatirimi
    | 'outsourcing'       // fason uretime kayma
    | 'hold_cash'         // atil nakit
    | 'quarter_profit'    // karli ceyrek
    | 'quarter_loss'      // zararli ceyrek
    | 'covenant_breach'   // sozlesme ihlali
    | 'rating_downgrade'  // not dususu
    | 'promise_kept'
    | 'promise_broken';

export interface BoardEvent {
    kind: BoardEventKind;
    /**
     * The SIZE of the event, normalised 0-1 against the company's scale.
     * Example: dividend paid / quarterly profit. For layoffs: people cut /
     * total headcount. This way the same "how big a move was that" measure
     * applies to a small company and a large one alike.
     */
    magnitude: number;
    /** Ekranda gosterilecek tek cumlelik ozet */
    label: string;
}

/** Sirketin o anki durumu — ayni hamle farkli baglamda farkli okunur. */
export interface CompanyContext {
    /** Son ceyrek karli miydi */
    profitable: boolean;
    /** Borc / EBITDA */
    leverage: number;
    /** Sozlesme ihlalinde mi */
    inBreach: boolean;
    /** Ust uste kac zararli ceyrek */
    lossStreak: number;
    /** Hisse fiyati zirveye gore nerede (0-1) */
    priceVsPeak: number;
}

// ----------------------------------------------------------------------------
//  TEMPERAMENT STANCE
// ----------------------------------------------------------------------------
//  Each temperament's baseline stance towards each event: -1 (hates it) to
//  +1 (loves it). This sets DIRECTION only; `magnitude` sets the intensity.
//
//  These are not arbitrary — each one represents an investor archetype:
//    Conservative -> likes dividends, avoids debt and risk
//    Aggressive   -> likes growth, hates idle cash
//    Visionary    -> likes long-term investment, sees dividends as waste
//    Shark        -> opportunist; feeds on chaos and leverage
//    Loyalist     -> weighs TRUST far more than temperament (see weights below)
//    Snake        -> feeds on weakness; bad news is an opportunity
// ----------------------------------------------------------------------------
const STANCE: Record<TraitType, Partial<Record<BoardEventKind, number>>> = {
    Conservative: {
        dividend: 1.0, buyback: 0.5, dilution: -0.9, ipo: -0.3,
        acquisition: -0.6, divestiture: 0.3, debt_taken: -0.8,
        mezzanine_taken: -1.0, shark_loan: -1.0, layoffs: 0.2,
        capex: -0.4, outsourcing: 0.1, hold_cash: 0.8,
        quarter_profit: 0.8, quarter_loss: -1.0,
        covenant_breach: -1.0, rating_downgrade: -1.0,
    },
    Aggressive: {
        dividend: -0.6, buyback: -0.2, dilution: 0.5, ipo: 0.6,
        acquisition: 1.0, divestiture: -0.5, debt_taken: 0.4,
        mezzanine_taken: 0.2, shark_loan: -0.4, layoffs: 0.5,
        capex: 0.7, outsourcing: 0.4, hold_cash: -1.0,
        quarter_profit: 0.6, quarter_loss: -0.6,
        covenant_breach: -0.5, rating_downgrade: -0.4,
    },
    Visionary: {
        dividend: -0.5, buyback: -0.6, dilution: 0.3, ipo: 0.4,
        acquisition: 0.9, divestiture: -0.6, debt_taken: 0.1,
        mezzanine_taken: 0.0, shark_loan: -0.6, layoffs: -0.3,
        capex: 1.0, outsourcing: -0.5, hold_cash: -0.7,
        quarter_profit: 0.4, quarter_loss: -0.3,
        covenant_breach: -0.6, rating_downgrade: -0.5,
    },
    Shark: {
        dividend: -0.2, buyback: 0.6, dilution: 0.4, ipo: 0.8,
        acquisition: 0.6, divestiture: 0.5, debt_taken: 0.5,
        mezzanine_taken: 0.6, shark_loan: 0.3, layoffs: 0.7,
        capex: -0.2, outsourcing: 0.6, hold_cash: -0.9,
        quarter_profit: 0.5, quarter_loss: -0.4,
        covenant_breach: -0.2, rating_downgrade: -0.2,
    },
    Loyalist: {
        dividend: 0.3, buyback: 0.2, dilution: -0.3, ipo: 0.1,
        acquisition: 0.2, divestiture: -0.1, debt_taken: -0.2,
        mezzanine_taken: -0.4, shark_loan: -0.7, layoffs: -0.4,
        capex: 0.3, outsourcing: -0.2, hold_cash: 0.0,
        quarter_profit: 0.5, quarter_loss: -0.4,
        covenant_breach: -0.5, rating_downgrade: -0.4,
    },
    Snake: {
        dividend: 0.1, buyback: 0.2, dilution: 0.3, ipo: 0.4,
        acquisition: 0.1, divestiture: 0.4, debt_taken: 0.3,
        mezzanine_taken: 0.7, shark_loan: 0.6, layoffs: 0.4,
        capex: -0.3, outsourcing: 0.4, hold_cash: -0.3,
        // Kotu haber Snake icin FIRSATTIR: zayiflayan CEO'yu devirmek
        // kolaylasir. Bu yuzden isaretler ters.
        quarter_profit: -0.1, quarter_loss: 0.3,
        covenant_breach: 0.4, rating_downgrade: 0.3,
    },
};

/** The largest possible reaction — how far one move can swing trust. */
export const MAX_TRUST_SWING = 22;

/**
 * PULL TO NEUTRAL. Each quarter trust drifts towards 55 at this rate.
 *
 * An investor's trust in you is NOT PERMANENT; they remember what you did,
 * but it neutralises over time. Without this, a single good run made you
 * untouchable forever.
 */
export const TRUST_GRAVITY = 0.06;
export const TRUST_NEUTRAL = 55;

/** Bir ceyrek sonunda guveni notre dogru cek. */
export const decayTrust = (trust: number): number =>
    trust + (TRUST_NEUTRAL - trust) * TRUST_GRAVITY;

/**
 * CONTEXT MULTIPLIER — the same move reads differently in a different situation.
 *
 * Separating this out matters: a real director does not think "do I like
 * dividends", they think "should THIS COMPANY have paid a dividend IN THIS
 * SITUATION". Paying one while losing money annoys even the dividend lover,
 * because that cash was what kept the company alive.
 */
export const contextMultiplier = (kind: BoardEventKind, ctx: CompanyContext): number => {
    let m = 1;

    // Nakit disari cikaran hamleler, sirket zorda ise sorumsuzluktur.
    if (kind === 'dividend' || kind === 'buyback') {
        if (!ctx.profitable) m *= -1.2;          // ISARET DONER: sevenler bile kizar
        if (ctx.inBreach) m *= 1.6;
        if (ctx.leverage > 4) m *= 1.4;
    }

    // Borc, zaten kaldiracliyken cok daha sert okunur.
    if (kind === 'debt_taken' || kind === 'mezzanine_taken') {
        if (ctx.leverage > 3) m *= 1.5;
        if (ctx.inBreach) m *= 1.8;
    }

    // Buyume hamleleri, batarken yapilirsa kumar sayilir.
    if (kind === 'acquisition' || kind === 'capex') {
        if (ctx.lossStreak >= 2) m *= 1.5;
        if (!ctx.profitable) m *= 1.3;
    }

    // Isten cikarma, KARLI iken yapilirsa acgozluluk okunur.
    if (kind === 'layoffs' && ctx.profitable) m *= 1.3;

    // Nakit yigmak, hisse dipteyken daha cok sinir eder.
    if (kind === 'hold_cash' && ctx.priceVsPeak < 0.7) m *= 1.4;

    return m;
};

/**
 * The effect of one event on one member's trust.
 *
 * trust change = stance x size x context x MAX_TRUST_SWING
 *
 * The Loyalist is special: their temperament is weak, but if their current
 * trust is high they will defend the move (a high-trust Loyalist reacts more
 * softly). The Snake is the reverse: the lower their trust, the worse they
 * read everything.
 */
export const trustDelta = (
    member: GovMember,
    event: BoardEvent,
    ctx: CompanyContext,
): number => {
    const stance = STANCE[member.trait]?.[event.kind] ?? 0;
    if (stance === 0 && event.kind !== 'promise_kept' && event.kind !== 'promise_broken') {
        return 0;
    }

    // Soz tutmak/bozmak huydan BAGIMSIZDIR. Kimse sozunu bozan biriyle
    // is yapmak istemez — huyu ne olursa olsun.
    if (event.kind === 'promise_kept') return Math.round(10 * clamp01(event.magnitude));
    if (event.kind === 'promise_broken') return -Math.round(25 * clamp01(event.magnitude));

    const mag = clamp01(event.magnitude);
    let delta = stance * mag * contextMultiplier(event.kind, ctx) * MAX_TRUST_SWING;

    // ------------------------------------------------------------------
    //  DIMINISHING RETURNS — trust only ever climbed
    // ------------------------------------------------------------------
    //  After a few hours of play the tester said "the board doesn't feel
    //  alive, it's always supportive". The reason was plain: every
    //  profitable quarter gave +7 trust and NOTHING pulled it down. By the
    //  sixth quarter everyone was pinned at 100 and never came off it — so
    //  the board was an exam you passed once and forgot forever.
    //
    //  Trust does not work like that. A routine good quarter is what was
    //  EXPECTED; it impresses nobody. Climbing gets harder, falling stays
    //  easy. The asymmetry is deliberate.
    // ------------------------------------------------------------------
    if (delta > 0) {
        // The closer to 100, the harder it is to gain. Full at 55, zero at 100.
        // Repetition fatigue is NOT applied here: this is already a damper, and
        // stacking the two meant routine profit could never rebuild trust at all.
        // A verification run caught it: the "one bad year, then recovery"
        // scenario ended with the CEO removed even though the company had
        // turned around.
        const headroom = Math.max(0, (100 - member.trust) / 45);
        delta *= Math.min(1, headroom);
    } else {
        // No such protection on the way down: trust is lost fast.
        delta *= 1.15;
        // Fatigue applies to BAD news only: the fifth loss quarter is not the
        // shock the first one was. This is what stops the board sticking to
        // the floor and never coming back.
        delta *= fatigueMultiplier(member, event.kind);
    }

    // Personal filter: the trusting are more forgiving, the distrustful harsher.
    if (member.trait === 'Loyalist' && member.trust > 60 && delta < 0) delta *= 0.6;
    if (member.trait === 'Snake' && member.trust < 40 && delta < 0) delta *= 1.4;

    return Math.round(delta);
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v || 0));

// ============================================================================
//  2. VOTING — the real wall
// ============================================================================

export type ProposalKind =
    | 'acquisition'
    | 'debt'
    | 'mezzanine'
    | 'dividend'
    | 'buyback'
    | 'dilution'
    | 'ipo'
    | 'capex'
    | 'divestiture';

/**
 * CONTROL THRESHOLD.
 *
 * The player's own request: "below 50%, most things should go straight to
 * the board". That single rule locks the system together, because it stops
 * voting being a separate feature and makes it a DIRECT CONSEQUENCE OF THE
 * CAP TABLE.
 *
 * While you hold a majority only genuinely large decisions go to a vote —
 * a real board does not run day-to-day operations either. The moment you
 * lose the majority everything changes: a coalition runs the company, not you.
 */
export const CONTROL_THRESHOLD = 50;

/** Cogunluktayken oya gitmesi icin gereken buyukluk esikleri. */
export const MAJORITY_VOTE_THRESHOLDS: Partial<Record<ProposalKind, number>> = {
    /** Degerlemenin %25'ini asan devralmalar */
    acquisition: 0.25,
    /** Degerlemenin %20'sini asan borclanma */
    debt: 0.20,
    /** Mezzanine HER ZAMAN oya gider — alacakli kurula girecek */
    mezzanine: 0,
};

export interface Proposal {
    kind: ProposalKind;
    /** Islemin buyuklugu (dolar) */
    amount: number;
    /** Sirketin degerlemesi — buyukluk buna gore olculur */
    valuation: number;
    /** Ekranda gosterilecek baslik */
    title: string;
    /** Is this a hostile takeover — the board turns far more cautious */
    hostile?: boolean;
}

/**
 * Bu karar oya gitmeli mi?
 *
 * Iki kapi var ve sirasi onemli:
 *   1) Cogunlugu kaybettiysen -> HER SEY oya gider.
 *   2) Cogunluktaysan -> yalnizca esigi asan buyuk kararlar.
 */
export const requiresVote = (
    proposal: Proposal,
    playerOwnershipPercent: number,
): { required: boolean; reason: string } => {
    const owns = playerOwnershipPercent || 0;

    if (owns < CONTROL_THRESHOLD) {
        return {
            required: true,
            reason:
                t('gov.belowMajorityDecides', { v1: owns.toFixed(1) }),
        };
    }

    // ------------------------------------------------------------------
    //  ISSUING SHARES ALWAYS GOES TO A VOTE
    // ------------------------------------------------------------------
    //  Not an operational call. New equity dilutes every existing holder, and
    //  in real company law that is the shareholders' decision regardless of
    //  who runs the business - one of the few things a controlling founder
    //  cannot simply do alone.
    //
    //  It was falling through to "within your authority as majority" at ANY
    //  size, which is how issuing shares became an unlimited source of cash:
    //  the raise lifts the valuation, and the larger valuation supports a
    //  larger raise next time. A majority holder still wins the vote - but
    //  carrying it against the board's advice is an override, and overrides
    //  cost trust and can trigger resignations.
    // ------------------------------------------------------------------
    if (proposal.kind === 'dilution') {
        return {
            required: true,
            get reason() { return t('gov.dilutionAlwaysVotes'); },
        };
    }
    const threshold = MAJORITY_VOTE_THRESHOLDS[proposal.kind];
    if (threshold === undefined) {
        return { required: false, reason: t('data.governance.withinYourAuthorityAsMajority') };
    }

    const val = Math.max(1, proposal.valuation || 1);
    const ratio = Math.max(0, proposal.amount || 0) / val;

    if (proposal.kind === 'mezzanine') {
        return {
            required: true,
            get reason() { return t('data.governance.mezzanineAlwaysGoesToA'); },
        };
    }
    if (ratio >= threshold) {
        return {
            required: true,
            reason:
                t('gov.needsApprovalAbove', {
                    v1: (ratio * 100).toFixed(0),
                    v2: (threshold * 100).toFixed(0),
                }),
        };
    }
    return { required: false, reason: t('data.governance.withinYourAuthorityAsMajority') };
};

/** A member's baseline stance towards a proposal. */
const proposalStance = (trait: TraitType, p: Proposal): number => {
    const map: Record<ProposalKind, BoardEventKind> = {
        acquisition: 'acquisition',
        debt: 'debt_taken',
        mezzanine: 'mezzanine_taken',
        dividend: 'dividend',
        buyback: 'buyback',
        dilution: 'dilution',
        ipo: 'ipo',
        capex: 'capex',
        divestiture: 'divestiture',
    };
    let s = STANCE[trait]?.[map[p.kind]] ?? 0;
    // Dusmanca devralma herkesi tedirgin eder: pahali, dagitici, riskli.
    if (p.hostile) s -= 0.35;
    return s;
};

/** How much TRUST weighs on a vote. It can override temperament, not erase it. */
export const TRUST_VOTE_WEIGHT = 0.9;

/**
 * Serbest dolasimin kurul tavsiyesini izleme orani.
 * Gercek vekalet oylamalarinda kurumsal yatirimcilarin ezici cogunlugu
 * kurulun tavsiyesiyle oy verir.
 */
export const FLOAT_FOLLOW_RATIO = 0.75;

export interface MemberVote {
    memberId: string;
    name: string;
    trait: TraitType;
    vote: 'YES' | 'NO';
    shareCount: number;
    /** Why they voted this way — shown on screen */
    reason: string;
}

export interface VoteResult {
    passed: boolean;
    /** Odadaki cogunluk destekledi mi — dolasim bunu izler */
    boardRecommends?: boolean;
    /** Kurul karsi ciktigi halde oyuncu kendi hisseleriyle gecirdi mi */
    overrode?: boolean;
    votes: MemberVote[];
    yesShares: number;
    noShares: number;
    playerShares: number;
    totalVoting: number;
    /** Gecmek icin gereken hisse */
    requiredShares: number;
    summary: string;
}

/**
 * The vote. SHARE-WEIGHTED, not one member one vote.
 *
 * That distinction is the whole point of the system: what decides an outcome
 * is not how many people sit on the board but who holds how many shares. It
 * is what finally gives IPOs, dilution and mezzanine conversion a REAL price
 * — you gain money and you lose votes.
 */
export const castVotes = (
    members: GovMember[],
    playerShares: number,
    totalShares: number,
    proposal: Proposal,
    ctx: CompanyContext,
    lobbied: Record<string, number> = {},
): VoteResult => {
    // ------------------------------------------------------------------
    //  THE PUBLIC FLOAT VOTES TOO
    // ------------------------------------------------------------------
    //  In the first draft only the player and the board members voted. That
    //  was WRONG and a simulation exposed it immediately: with the player
    //  diluted to 45% and four of five directors voting against, the
    //  proposal still passed with 65% — because the 20% public float was
    //  never counted.
    //
    //  In reality institutional investors and proxy advisers (ISS, Glass
    //  Lewis) almost always follow THE BOARD'S RECOMMENDATION. That is what
    //  makes losing the board genuinely dangerous: you lose not just the
    //  votes in the room, but the float standing behind them.
    // ------------------------------------------------------------------
    const votes: MemberVote[] = members.map(m => {
        const stance = proposalStance(m.trait, proposal);
        const trustPull = ((m.trust - 50) / 50) * TRUST_VOTE_WEIGHT;

        // Performans: kotu giden sirkette herkes daha temkinli.
        let performance = 0;
        if (ctx.lossStreak >= 2) performance -= 0.4;
        if (ctx.inBreach) performance -= 0.5;
        if (ctx.leverage > 4) performance -= 0.3;
        if (ctx.profitable && ctx.lossStreak === 0) performance += 0.2;

        const lobby = lobbied[m.id] || 0;
        const raw = stance + trustPull + performance + lobby;

        // ------------------------------------------------------------------
        //  PERSONAL RELATIONSHIP — but ONLY on the undecided
        // ------------------------------------------------------------------
        //  This call was missing: gifts and dinners raised the relationship,
        //  and the relationship then did nothing at all in a vote. Now it
        //  does — and only when the inclination is near zero. A firm "no"
        //  stays a no even at relationship 95. Money does not buy a vote,
        //  it breaks a tie.
        // ------------------------------------------------------------------
        const inclination = relationshipTiebreak(m, raw);
        const swayed = Math.sign(inclination) !== Math.sign(raw) && raw !== 0;

        const vote: 'YES' | 'NO' = inclination > 0 ? 'YES' : 'NO';

        // Karari OKUNABILIR yap — oyuncu neden kaybettigini gormeli.
        let reason: string;
        if (swayed) {
            reason = t('gov.personalFavor');
        } else if (Math.abs(trustPull) > Math.abs(stance) && trustPull !== 0) {
            reason = trustPull > 0
                ? t('gov.backsYou', { v1: m.trust })
                : t('gov.doesNotTrust', { v1: m.trust });
        } else if (stance > 0.2) reason = t('gov.traitLikes', { v1: t('data.trait.' + m.trait) });
        else if (stance < -0.2) reason = t('gov.traitAgainst', { v1: t('data.trait.' + m.trait) });
        else if (performance < -0.3) reason = t('gov.cannotAffordRisk');
        else if (lobby > 0) reason = t('gov.persuadedInPrivate');
        else reason = t('gov.undecided');

        return { memberId: m.id, name: m.name, trait: m.trait, vote, shareCount: m.shareCount, reason };
    });

    const insiderShares = members.reduce((s, m) => s + m.shareCount, 0);
    const floatShares = Math.max(0, (totalShares || 0) - playerShares - insiderShares);

    // Kurul ODA ICINDE ne dedi — dolasim bunu izleyecek.
    const yesHeads = votes.filter(v => v.vote === 'YES').length;
    const boardRecommends = yesHeads > votes.length / 2;

    let yesShares =
        votes.filter(v => v.vote === 'YES').reduce((s, v) => s + v.shareCount, 0) + playerShares;
    let noShares = votes.filter(v => v.vote === 'NO').reduce((s, v) => s + v.shareCount, 0);

    // Dolasimin %75'i tavsiyeyi izler, %25'i bagimsiz davranir.
    yesShares += floatShares * (boardRecommends ? FLOAT_FOLLOW_RATIO : 1 - FLOAT_FOLLOW_RATIO);
    noShares += floatShares * (boardRecommends ? 1 - FLOAT_FOLLOW_RATIO : FLOAT_FOLLOW_RATIO);

    const totalVoting = yesShares + noShares;
    const requiredShares = Math.floor(totalVoting / 2) + 1;
    const passed = yesShares >= requiredShares;

    // ------------------------------------------------------------------
    //  A MAJORITY HOLDER CANNOT LOSE A VOTE — BUT CANNOT WIN ONE FOR FREE
    // ------------------------------------------------------------------
    //  While you hold a majority you win every vote mathematically; that is
    //  true in real life too. But pushing through a decision the board voted
    //  against is a "board override" and it is NOT FREE: directors resign,
    //  trust collapses, and the market prices it as a governance problem.
    //
    //  That is what keeps the board relevant even in a vote you cannot lose.
    // ------------------------------------------------------------------
    const overrode = passed && !boardRecommends;

    return {
        passed,
        votes,
        yesShares: Math.round(yesShares),
        noShares: Math.round(noShares),
        playerShares,
        totalVoting: Math.round(totalVoting),
        requiredShares,
        boardRecommends,
        overrode,
        summary: overrode
            ? t('gov.carriedAlone')
            : passed
                ? t('gov.approvedPct', { v1: ((yesShares / Math.max(1, totalVoting)) * 100).toFixed(1) })
                : t('gov.rejectedPct', { v1: ((yesShares / Math.max(1, totalVoting)) * 100).toFixed(1) }),
    };
};

/** Kurulun aleyhine karar gecirmenin uyeler uzerindeki guven bedeli. */
export const OVERRIDE_TRUST_COST = 12;
/** Override sonrasi bir yoneticinin istifa etme olasiligi. */
export const OVERRIDE_RESIGN_CHANCE = 0.25;

// ============================================================================
//  3. THE NO-CONFIDENCE VOTE — the board's real weapon
// ============================================================================
//
//  This is the mechanic that makes the board the most important thing in the
//  game. Everything else is preparation for it.
//
//  THREE CONDITIONS AT ONCE are required, and that is deliberate: a single
//  bad quarter must not cost you your chair. Removal is the result of a
//  relationship neglected for a long time — not a sudden penalty.
// ============================================================================

export interface NoConfidenceCheck {
    /** Oy cagrilir mi */
    triggered: boolean;
    /** Hangi kosullar saglandi — oyuncuya gosterilir */
    reasons: string[];
    /** Kac kosul saglandi (3 uzerinden) */
    conditionsMet: number;
    /** How far to the next stage — an early warning */
    warning?: string;
}

/** This many consecutive loss quarters trips the performance condition. */
export const NO_CONFIDENCE_LOSS_STREAK = 4;
/** Below this average board loyalty, the relationship condition is met. */
export const NO_CONFIDENCE_TRUST = 35;

/**
 * THE ODDS THAT A MEMBER ACTUALLY BACKS YOU.
 *
 * NOT the same thing as `trust` — and a simulation is what revealed it.
 * In the Snake's stance table, bad news is POSITIVE: disaster is an
 * opportunity, because a weakened CEO is easier to depose. So over a
 * catastrophic year a Snake's `trust` was CLIMBING from 30 to 78.
 *
 * The result was absurd: the board's average trust went up, and the man
 * trying to depose you was PROTECTING YOU FROM REMOVAL.
 *
 * The conceptual error: `trust` measures "is this member pleased with the
 * situation", when what we need is "is this member behind ME". For a Snake
 * those two are INVERSELY related. Hence loyalty is computed separately.
 */
export { loyaltyOf, trustForLoyalty } from './loyalty';
import { loyaltyOf } from './loyalty';

/**
 * The inverse: what `trust` must be for a member of this trait to have this
 * loyalty.
 *
 * Exists so the story can talk about the brother in the only terms that make
 * sense to a writer - "is he behind me" - while the board keeps storing the
 * field it has always stored. Without this the two numbers drift, and they
 * drift in OPPOSITE DIRECTIONS for a Snake, which is the worst version: a
 * scene warms him up and the cap table reads it as a threat.
 *
 * `trustForLoyalty(trait, loyaltyOf(m)) === m.trust` for every trait.
 */

export const checkNoConfidence = (
    members: GovMember[],
    playerOwnershipPercent: number,
    ctx: CompanyContext,
): NoConfidenceCheck => {
    const reasons: string[] = [];

    // 1) KONTROL — cogunluktaysan kimse seni indiremez. Matematiksel.
    const lostControl = playerOwnershipPercent < CONTROL_THRESHOLD;
    if (lostControl) {
        reasons.push(t('gov.noLongerMajority', { v1: playerOwnershipPercent.toFixed(1) }));
    }

    // 2) RELATIONSHIP — the board does not trust you.
    // SHARE-WEIGHTED LOYALTY. Two fixes at once:
    //   1) `loyaltyOf`, not `trust` — a Snake's opportunism must not protect you
    //   2) share-weighted, not per head — a large holder's word carries further
    const totalW = members.reduce((s, m) => s + Math.max(1, m.shareCount), 0);
    const avgTrust = members.length
        ? members.reduce((s, m) => s + loyaltyOf(m) * Math.max(1, m.shareCount), 0) / Math.max(1, totalW)
        : 100;
    const lostRoom = avgTrust < NO_CONFIDENCE_TRUST;
    if (lostRoom) {
        reasons.push(t('gov.loyaltyGone', { v1: avgTrust.toFixed(0) }));
    }

    // 3) PERFORMANS — sonuclar kotu.
    const failing =
        ctx.lossStreak >= NO_CONFIDENCE_LOSS_STREAK ||
        ctx.inBreach ||
        ctx.priceVsPeak < 0.45;
    if (failing) {
        if (ctx.lossStreak >= NO_CONFIDENCE_LOSS_STREAK) {
            reasons.push(t('gov.losingQuarters', { v1: ctx.lossStreak }));
        }
        if (ctx.inBreach) reasons.push(t('gov.inBreach'));
        if (ctx.priceVsPeak < 0.45) {
            reasons.push(t('gov.belowPeak', { v1: ((1 - ctx.priceVsPeak) * 100).toFixed(0) }));
        }
    }

    const conditionsMet = [lostControl, lostRoom, failing].filter(Boolean).length;

    // ERKEN UYARI: iki kosul saglandiysa oyuncu ucuncusunun geldigini
    // gormeli. Habersiz kaybetmek adil degil.
    let warning: string | undefined;
    if (conditionsMet === 2) {
        if (!lostControl) warning = t('gov.warnControl');
        else if (!lostRoom) warning = t('gov.warnTrust');
        else warning = t('gov.warnPerformance');
    }

    return { triggered: conditionsMet === 3, reasons, conditionsMet, warning };
};

/**
 * The no-confidence vote itself.
 *
 * In this ballot the player votes THEIR OWN shares — as they would in real
 * life. While you hold a majority it never triggers; once you do not, your
 * shares are still your defence. That gives a direct, readable link between
 * "losing my shares" and "losing my chair".
 */
/**
 * VOTING INTERVAL. Having survived a no-confidence vote, the board cannot
 * repeat it every quarter.
 *
 *  Surfaced by a verification run: a no-confidence vote was being held EVERY
 *  quarter for 20 quarters. Absurd (an annual meeting is not quarterly), and
 *  every call landed another hit on the share price — a vote the CEO won was
 *  punishing them when it should have strengthened them.
 */
export const NO_CONFIDENCE_COOLDOWN = 4;

export const voteNoConfidence = (
    members: GovMember[],
    playerShares: number,
    ctx: CompanyContext,
    /** Sirketin toplam hissesi — halka acik kismi hesaplamak icin */
    totalShares = 0,
): VoteResult => {
    const votes: MemberVote[] = members.map(m => {
        // The lower the trust, the stronger the appetite to remove.
        // LOYALTY here too, not `trust`: the more 'pleased' a Snake is,
        // the more willing they are to bring you down.
        let removal = (50 - loyaltyOf(m)) / 50;
        if (ctx.lossStreak >= 4) removal += 0.4;
        if (ctx.inBreach) removal += 0.5;
        // Snake icin ek carpan gerekmez; loyaltyOf zaten tersine cevirdi.
        if (m.trait === 'Loyalist') removal -= 0.6;   // son ana kadar yaninda

        // NO = "CEO kalsin", YES = "CEO gitsin" olarak okunuyor;
        // burada YES gorevden almadir.
        const vote: 'YES' | 'NO' = removal > 0 ? 'YES' : 'NO';
        return {
            memberId: m.id,
            name: m.name,
            trait: m.trait,
            vote,
            shareCount: m.shareCount,
            reason: vote === 'YES'
                ? t('gov.votesToRemove', { v1: m.trust })
                : t('gov.standsByYou', { v1: m.trust }),
        };
    });

    const boardYes = votes.filter(v => v.vote === 'YES').reduce((s, v) => s + v.shareCount, 0);
    const boardNo = votes.filter(v => v.vote === 'NO').reduce((s, v) => s + v.shareCount, 0);

    // ------------------------------------------------------------------
    //  THE PUBLIC FLOAT VOTES TOO
    // ------------------------------------------------------------------
    //  This was missing and it left the whole mechanic dead: because the
    //  board holds at most 35%, a CEO holding 40% was MATHEMATICALLY
    //  UNREMOVABLE. Five straight years of losses, a covenant breach and
    //  zero loyalty across the entire board — none of it was enough.
    //
    //  In reality institutional investors do vote in these ballots, and they
    //  broadly follow the board's read. Not all of them: a share abstains
    //  (FLOAT_FOLLOW_RATIO).
    // ------------------------------------------------------------------
    const boardShares = boardYes + boardNo;
    const float = Math.max(0, totalShares - playerShares - boardShares);
    const floatVoting = float * FLOAT_FOLLOW_RATIO;
    const boardLean = boardShares > 0 ? boardYes / boardShares : 0;
    const floatYes = floatVoting * boardLean;
    const floatNo = floatVoting - floatYes;

    const removeShares = boardYes + floatYes;
    // Oyuncunun kendi hisseleri her zaman kalmaktan yana.
    const keepShares = boardNo + floatNo + playerShares;
    const totalVoting = removeShares + keepShares;
    const requiredShares = Math.floor(totalVoting / 2) + 1;
    const removed = removeShares >= requiredShares;

    return {
        passed: removed,
        votes,
        yesShares: removeShares,
        noShares: keepShares,
        playerShares,
        totalVoting,
        requiredShares,
        summary: removed
            ? t('gov.removedAsCeo', { v1: ((removeShares / Math.max(1, totalVoting)) * 100).toFixed(1) })
            : t('gov.survivedVote', { v1: ((keepShares / Math.max(1, totalVoting)) * 100).toFixed(1) }),
    };
};

// ============================================================================
//  4. LOBBYING AND PROMISES — where a one-to-one conversation is real
// ============================================================================
//
//  Before a vote you can call a member and ask for their support. It is not
//  free: you give a PROMISE in return, and that promise is recorded. Keep it
//  and trust rises; break it and it comes back at double, whatever their
//  temperament.
//
//  Punishing a broken promise INDEPENDENTLY of temperament is deliberate.
//  An investor may dislike you being aggressive or cautious — but nobody
//  likes being lied to.
// ============================================================================

export type PromiseKind =
    | 'dividend_next'     // gelecek ceyrek temettu
    | 'board_seat'        // kurul koltugu
    | 'no_dilution'       // seyreltme yok
    | 'reduce_debt'       // borcu azalt
    | 'share_grant';      // hisse ver

export interface BoardPromise {
    id: string;
    memberId: string;
    kind: PromiseKind;
    /** The quarter by which it must be kept */
    dueQuarter: number;
    /** How large a promise — the trust effect scales with it */
    magnitude: number;
    description: string;
    resolved?: 'kept' | 'broken';
}

/** How much lobbying weighs on a vote — not enough to override temperament. */
export const LOBBY_MAX_PULL = 0.75;

export interface LobbyResult {
    success: boolean;
    /** Bu uyenin oyuna eklenecek egilim */
    pull: number;
    /** Destek karsiliginda ne istiyor */
    demands?: PromiseKind;
    message: string;
}

/**
 * A one-to-one conversation with a member.
 *
 * The chance of persuading them depends on trust and temperament. A
 * high-trust Loyalist backs you for nothing; a low-trust Snake wants
 * something first — and if you refuse, they were voting against you anyway.
 */
export const lobbyMember = (
    member: GovMember,
    proposal: Proposal,
    alreadyLobbiedThisQuarter: boolean,
    random: () => number = Math.random,
): LobbyResult => {
    if (alreadyLobbiedThisQuarter) {
        return {
            success: false,
            pull: 0,
            message: `${member.name} has already heard your case this quarter. Pushing again looks desperate.`,
        };
    }

    const stance = proposalStance(member.trait, proposal);
    // Zaten senden yana olani ikna etmek kolay; karsi olani zor.
    const base = 0.35 + (member.trust / 100) * 0.45 + stance * 0.2;
    const success = random() < Math.max(0.05, Math.min(0.95, base));

    if (!success) {
        return {
            success: false,
            pull: 0,
            message: `${member.name} listens, says nothing, and gives you nothing.`,
        };
    }

    // Low trust means no free support — they want something.
    const wantsSomething = member.trust < 55 || member.trait === 'Snake' || member.trait === 'Shark';
    const demands: PromiseKind | undefined = wantsSomething
        ? (member.trait === 'Conservative' ? 'dividend_next'
            : member.trait === 'Snake' ? 'board_seat'
                : member.trait === 'Shark' ? 'share_grant'
                    : 'no_dilution')
        : undefined;

    const pull = LOBBY_MAX_PULL * (0.5 + (member.trust / 100) * 0.5);

    return {
        success: true,
        pull,
        demands,
        message: demands
            ? `${member.name} will vote with you — if you commit to something in return.`
            : `${member.name} will vote with you. No conditions.`,
    };
};

/** Bir sozun tutulup tutulmadigini degerlendirir. */
export const resolvePromise = (
    promise: BoardPromise,
    kept: boolean,
): BoardEvent => ({
    kind: kept ? 'promise_kept' : 'promise_broken',
    magnitude: clamp01(promise.magnitude),
    label: kept
        ? t('gov.keptWord', { v1: promise.description })
        : t('gov.brokeWord', { v1: promise.description }),
});

// ============================================================================
//  5. BOARD MOOD AND THE SHARE-PRICE SIGNAL
// ============================================================================

export type BoardMood = 'Supportive' | 'Neutral' | 'Restless' | 'Hostile';

export const boardMoodFrom = (members: GovMember[]): BoardMood => {
    if (members.length === 0) return 'Neutral';
    const avg = members.reduce((s, m) => s + m.trust, 0) / members.length;
    if (avg >= 70) return 'Supportive';
    if (avg >= 50) return 'Neutral';
    if (avg >= 30) return 'Restless';
    return 'Hostile';
};

/**
 * Yonetisim olaylarinin hisse fiyatina etkisi.
 *
 * Yonetisim piyasada FIYATLANIR. Kurul catismasi, istifa eden yonetici,
 * guvensizlik oyu — hepsi kurumsal yatirimcinin dogrudan izledigi
 * seylerdir. Zaten kurulmus olan `marketMultiplier` sinyal borusundan
 * gecerler (bkz. credit.ts FINANCING_SIGNALS).
 */
export const GOVERNANCE_SIGNALS: Record<string, { impactPercent: number; note: string }> = {
    proposal_rejected: { impactPercent: -4, get note() { return t('data.governance.theBoardPubliclyOverruledIts'); } },
    director_resigned: { impactPercent: -6, get note() { return t('data.governance.aDirectorWalkedOutInvestors'); } },
    no_confidence_called: { impactPercent: -14, get note() { return t('data.governance.aNoConfidenceVoteIs'); } },
    ceo_removed: { impactPercent: -22, get note() { return t('data.governance.theFounderHasBeenRemoved'); } },
    ceo_survived: { impactPercent: -5, get note() { return t('data.governance.survivedButTheFightWas'); } },
    board_aligned: { impactPercent: 2, get note() { return t('data.governance.aUnitedBoardReadsAs'); } },
    promise_broken: { impactPercent: -3, get note() { return t('data.governance.wordGetsAroundThatThe'); } },
};

// ============================================================================
//  A DIRECTOR FROM AN ACQUISITION — "rollover equity"
// ============================================================================
//
//  Until now there was exactly one route onto the board: borrowing from a
//  loan shark and failing to repay. So the board only ever grew through
//  FAILURE, and a player doing well had the same board on day one thousand
//  as on day one.
//
//  In reality boards grow mostly through ACQUISITIONS. In a friendly deal the
//  target's founder usually takes part of the price in SHARES ("rollover
//  equity") and stays with the company for a while — both because they know
//  the business and because you want them tied to its success.
//
//  WHY IT MATTERS FOR THE GAME: it puts a real difference between a friendly
//  and a hostile takeover.
//
//    FRIENDLY -> cheaper premium (15%), but ONE MORE PERSON at the table
//                and your own stake erodes a notch
//    HOSTILE  -> expensive premium (35%), hard integration, but nobody
//                joins; you already fired their management
//
//  So "the cheap option" slowly costs you control. That is deliberate: every
//  acquisition takes a slice of your control, and given enough of them the
//  player one day drops below 50% — which is exactly where the board system
//  comes alive. Growth itself becomes a risk.
// ============================================================================

/** Devralma bu buyuklugun altindaysa kimse koltuk istemez. */
export const SEAT_MIN_DEAL_RATIO = 0.03;
/** The smallest and largest stake an acquisition can hand over. */
export const SEAT_MIN_STAKE = 0.005;
export const SEAT_MAX_STAKE = 0.03;

export interface IncomingDirector {
    name: string;
    trait: TraitType;
    trust: number;
    /** Kendisine ihrac edilecek hisse adedi */
    shareCount: number;
    note: string;
    /** Set for the named founders - decides what they are fixated on. */
    motivation?: Motivation;
    petIssue?: PetIssue;
    /** True when he is here because he lost. Seats him as a standing threat. */
    resentful?: boolean;
}

/**
 * The target's risk profile decides the TEMPERAMENT of the incoming director.
 *
 * A sensible link: someone running a mature, profitable company turns out
 * cautious; someone running a cash-burning startup likes risk. So who you
 * acquire also shapes the future character of your board — and that is a
 * choice entirely under your control.
 */
const TRAIT_BY_RISK: Record<string, TraitType> = {
    'Very Low': 'Conservative',
    Low: 'Conservative',
    Medium: 'Loyalist',
    'Medium-High': 'Visionary',
    High: 'Aggressive',
    Extreme: 'Snake',
};

export const directorFromAcquisition = (
    targetName: string,
    dealPrice: number,
    acquirerValuation: number,
    totalShares: number,
    risk: string,
    hostile: boolean,
    /** Market id. Named founders are looked up on it; unknown ids stay generic. */
    targetId?: string,
): IncomingDirector | null => {
    const named = targetId ? founderOf(targetId) : undefined;

    // ------------------------------------------------------------------
    //  HOSTILE
    // ------------------------------------------------------------------
    //  A generic target's management does not stay. You paid a 35% premium
    //  precisely so you would not have to negotiate with them, and that
    //  remains the deal.
    //
    //  A NAMED founder does stay, and this is a deliberate exception. The
    //  point of these three is that they are people rather than rows, and a
    //  man who lost his company and now has to sit at your table every
    //  quarter is worth more to the game than a tidy board. He arrives near
    //  hostile - see `hostileTrust` in data/market/founders.ts - which means
    //  he is a standing problem, not a mood that passes.
    // ------------------------------------------------------------------
    if (hostile && !named) return null;

    const val = Math.max(1, acquirerValuation || 1);
    const ratio = Math.max(0, dealPrice || 0) / val;

    // The size floor applies to everyone, named or not. Buying a company
    // worth 2% of yours does not hand anyone a board seat, and exempting the
    // named three would have made a token purchase the cheapest way to put a
    // Shark on your own board.
    if (ratio < SEAT_MIN_DEAL_RATIO) return null;

    // The stake scales with deal size, but within a narrow band. Even buying
    // a company larger than yours, no single person takes half the board.
    const stake = Math.max(SEAT_MIN_STAKE, Math.min(SEAT_MAX_STAKE, ratio * 0.35));
    const shareCount = Math.round((totalShares || 10_000_000) * stake);

    if (named) {
        return {
            name: named.name,
            trait: named.trait,
            trust: hostile ? named.hostileTrust : named.trust,
            shareCount,
            note: hostile ? named.hostileLine : named.line,
            motivation: named.motivation,
            petIssue: named.petIssue,
            resentful: hostile,
        };
    }

    return {
        get name() { return t('gov.founderOf', { v1: targetName }); },
        trait: TRAIT_BY_RISK[risk] ?? 'Loyalist',
        // They joined you willingly: well-intentioned, but not blindly.
        trust: 60,
        shareCount,
        note:
            t('gov.rolloverNote', { v1: (stake * 100).toFixed(1) }),
    };
};

// ============================================================================
//  THE BOARD'S OWN AGENDA
// ============================================================================
//
//  UP TO HERE the board only ever REACTED: you did something, they scored it.
//  That is why the table felt lonely — there was nobody across from you, you
//  were looking at a gauge.
//
//  A real board WANTS SOMETHING FROM YOU. It does not sit quietly. Lose money
//  two quarters running and somebody will certainly ask what the plan on costs
//  is. Let cash pile up idle and they want a dividend. Let debt swell and they
//  want it paid down.
//
//  And crucially: a demand is raised not by EVERYONE but by the member who
//  CARES about that issue (`petIssue`). If nobody on your board is fixated on
//  debt, nobody asks about your debt. You choose your board — who you take on
//  decides what you will be held to account for.
//
//  Meeting a demand earns trust; ignoring one costs it, and paves the road to
//  a no-confidence vote.
// ============================================================================

export type DemandKind =
    | 'cut_costs'      // zarar serisi -> gideri kis
    | 'deleverage'     // kaldirac yuksek -> borc odemesi
    | 'pay_dividend'   // atil nakit -> hissedara dagit
    | 'invest_rnd'     // urun yaslandi -> Ar-Ge
    | 'grow_share';    // pazar payi eriyor -> buyu

export interface DemandContext extends CompanyContext {
    /** Kasadaki nakit */
    cash: number;
    /** Ceyreklik gelir — atil nakiti olceklemek icin */
    revenue: number;
    /** Toplam borc */
    debt: number;
    /** Toplam pazar payi (%) */
    marketShare: number;
    /** Son ceyrekte Ar-Ge'ye harcanan */
    rndSpend: number;
}

export interface BoardDemand {
    id: string;
    kind: DemandKind;
    /** The member who raised it — this is a PERSON asking, not an institution */
    raisedBy: string;
    raisedByName: string;
    quarterRaised: number;
    /** Must be met by this quarter */
    deadline: number;
    /** Sayisal hedef (temettu tutari, inilecek kaldirac vb.) */
    target: number;
    /** Was it raised privately by a close member */
    confidential?: boolean;
    status: 'open' | 'met' | 'failed';
}

/** Talebi karsilamak icin taninan sure. */
export const DEMAND_GRACE = 3;
/**
 * COOLDOWNS — the cure for a bug a verification run exposed.
 *
 *  The first run showed this: a demand was ignored in Q7 (-14 trust) and the
 *  SAME demand was reopened in the SAME quarter. The board handed down the
 *  penalty and then repeated itself word for word. A real board does not
 *  behave that way: a director who sees they were ignored does not repeat
 *  themselves, they GO QUIET and remember.
 *
 *  A demand repeated endlessly also loses its credibility rather than
 *  applying pressure. A met demand stays away for a while too.
 */
export const DEMAND_COOLDOWN_MET = 3;
export const DEMAND_COOLDOWN_FAILED = 5;
/** How many quarters the board stays silent after a demand closes. */
export const DEMAND_QUIET = 2;
/** Sana yakin bir uyenin tanidigi ek sure. */
export const CONFIDANT_GRACE_BONUS = 2;
/** A met demand: more for whoever raised it, a smaller amount for the rest. */
export const DEMAND_MET_TRUST = 9;
export const DEMAND_MET_TRUST_OTHERS = 3;
/** An ignored demand — it costs more than meeting one gains. */
export const DEMAND_FAILED_TRUST = -14;
export const DEMAND_FAILED_TRUST_OTHERS = -5;
/** Idle cash counts as "a lot" at this multiple of revenue. */
export const IDLE_CASH_MULTIPLE = 4;

/** Whether a member cares about an issue: petIssue first, then temperament. */
const caresAbout = (m: GovMember, kind: DemandKind): number => {
    const pet: Record<DemandKind, PetIssue> = {
        cut_costs: 'headcount', deleverage: 'debt', pay_dividend: 'dividend',
        invest_rnd: 'rnd', grow_share: 'market_share',
    };
    if (m.petIssue && m.petIssue === pet[kind]) return 1;
    const byTrait: Record<TraitType, Partial<Record<DemandKind, number>>> = {
        Conservative: { cut_costs: 0.8, deleverage: 0.9, pay_dividend: 0.8 },
        Aggressive: { grow_share: 0.9, cut_costs: 0.5 },
        Visionary: { invest_rnd: 0.9, grow_share: 0.5 },
        Shark: { cut_costs: 0.9, deleverage: 0.4, pay_dividend: 0.5 },
        Loyalist: { grow_share: 0.3, invest_rnd: 0.3 },
        // Snake talep acmaz: zayifligin devam etmesi onun isine gelir.
        Snake: {},
    };
    return byTrait[m.trait]?.[kind] ?? 0;
};

/**
 * Does the board want something this quarter?
 *
 * Only ONE demand is open at a time — a board that shouts constantly is
 * noise, not pressure. If no condition is met, or nobody on the board cares
 * about the issue, this returns `null`: the board is genuinely silent.
 */
export const detectDemand = (
    members: GovMember[],
    ctx: DemandContext,
    quarter: number,
    /** Per-kind record of "cannot be raised before this quarter" */
    cooldowns: Partial<Record<DemandKind, number>> = {},
): BoardDemand | null => {
    const idleThreshold = Math.max(0, ctx.revenue) * IDLE_CASH_MULTIPLE;
    const candidates: { kind: DemandKind; urgency: number; target: number }[] = [];

    if (ctx.lossStreak >= 2) {
        candidates.push({ kind: 'cut_costs', urgency: 1.0 + ctx.lossStreak * 0.2, target: 0 });
    }
    if (ctx.leverage > 3 || ctx.inBreach) {
        candidates.push({ kind: 'deleverage', urgency: ctx.inBreach ? 1.4 : 0.7 + ctx.leverage * 0.1, target: ctx.debt * 0.8 });
    }
    if (ctx.profitable && ctx.cash > idleThreshold && idleThreshold > 0) {
        candidates.push({ kind: 'pay_dividend', urgency: 0.6 + ctx.cash / Math.max(1, idleThreshold) * 0.2, target: ctx.cash * 0.1 });
    }
    if (ctx.rndSpend <= 0) {
        candidates.push({ kind: 'invest_rnd', urgency: 0.5, target: 1 });
    }
    if (ctx.marketShare < 2 && !ctx.inBreach) {
        candidates.push({ kind: 'grow_share', urgency: 0.5 + (2 - ctx.marketShare) * 0.2, target: ctx.marketShare + 0.5 });
    }
    // Yakin zamanda kapanmis turleri ele: kurul kendini tekrar etmez.
    const fresh = candidates.filter(c => quarter >= (cooldowns[c.kind] ?? 0));
    if (fresh.length === 0) return null;
    candidates.length = 0;
    candidates.push(...fresh);

    // For each candidate: who cares most about this issue? If nobody, drop it.
    let best: { kind: DemandKind; target: number; member: GovMember; score: number } | null = null;
    for (const c of candidates) {
        for (const m of members) {
            const care = caresAbout(m, c.kind);
            if (care <= 0) continue;
            // A member with low trust speaks louder.
            const voice = care * c.urgency * (1 + (TRUST_NEUTRAL - (m.trust ?? 50)) / 100);
            if (!best || voice > best.score) best = { kind: c.kind, target: c.target, member: m, score: voice };
        }
    }
    if (!best) return null;

    // ------------------------------------------------------------------
    //  A CLOSE MEMBER TELLS YOU FIRST
    // ------------------------------------------------------------------
    //  The second thing a relationship buys you: a director close to you
    //  raises the issue privately instead of dropping it in the meeting,
    //  and gives you extra time to fix it. It does not change their vote —
    //  it buys TIME, which is exactly what a relationship buys in real life.
    // ------------------------------------------------------------------
    const friendly = isConfidant(best.member);

    return {
        id: `dem_${quarter}_${best.kind}`,
        kind: best.kind,
        raisedBy: best.member.id,
        raisedByName: best.member.name,
        quarterRaised: quarter,
        deadline: quarter + DEMAND_GRACE + (friendly ? CONFIDANT_GRACE_BONUS : 0),
        target: best.target,
        confidential: friendly,
        status: 'open',
    };
};

/**
 * Has an open demand been met?
 *
 * `satisfiedManually`: explicit player moves such as a dividend or R&D
 * spend are flagged by the store; everything else is read from company state.
 */
export const evaluateDemand = (
    demand: BoardDemand,
    ctx: DemandContext,
    quarter: number,
    satisfiedManually = false,
): 'open' | 'met' | 'failed' => {
    let met = satisfiedManually;
    if (!met) {
        switch (demand.kind) {
            case 'cut_costs': met = ctx.profitable || ctx.lossStreak === 0; break;
            case 'deleverage': met = ctx.debt <= demand.target && !ctx.inBreach; break;
            case 'invest_rnd': met = ctx.rndSpend > 0; break;
            case 'grow_share': met = ctx.marketShare >= demand.target; break;
            case 'pay_dividend': met = false; break; // sadece acik hamleyle
        }
    }
    if (met) return 'met';
    return quarter >= demand.deadline ? 'failed' : 'open';
};
