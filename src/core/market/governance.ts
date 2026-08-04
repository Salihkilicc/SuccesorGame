// src/core/market/governance.ts
//
// ============================================================================
//  YÖNETİŞİM — kurulun gerçekten gücü olduğu yer
// ============================================================================
//
//  ONCE NE VARDI: BIR EVCIL HAYVAN GOSTERGESI
//  ------------------------------------------
//  Kurul sistemi yazilmisti ve ekrani bile vardi ama HICBIR GUCU YOKTU:
//
//    - `trust` 0-100 arasi oynuyordu ve HIC OKUNMUYORDU. Yalnizca
//      profil ekraninda bir bar ciziyordu.
//    - `isHostile` isaretleniyordu; hicbir kod bu bayragi okumuyordu.
//    - `boardMood` yalnizca bir etiketin RENGINI belirliyordu.
//    - `VotingOverlay.tsx` yazilmisti, hicbir ekrandan cagrilmiyordu.
//    - "Call Emergency Vote" dugmesi `console.log` yapiyordu.
//    - `appointDirectorFromNetwork` hicbir yerden cagrilmiyordu.
//
//  Yani kurul bir sey ONAYLAYAMIYOR, ENGELLEYEMIYOR, kimseyi GOREVDEN
//  ALAMIYORDU. Guveni sifira dusurmenin de yuze cikarmanin da sonucu
//  ayniydi: hicbir sey.
//
//  Bir kurulu gercek yapan tek sey vardir:
//
//                  SIRKETI SENDEN ALABILMESI.
//
//  IKINCI SORUN: KORU KORUNE TEPKI
//  --------------------------------
//  `evaluatePlayerAction` dort secenekli bir enum aliyordu ve motor her
//  ceyrek "en belirgin hamle neydi" diye TAHMIN edip birini yolluyordu.
//  O ceyrekte tefeciden borc almis, 200 kisi cikarmis, halka acilmis
//  olabilirsin — kurul yalnizca "ACQUISITION" duyuyordu.
//
//  Ustelik tepki yalnizca HUYA bakiyordu, BUYUKLUGE ve BAGLAMA degil.
//  1 dolarlik temettu ile 500 milyonluk temettu ayni +15'i veriyordu.
//  Zarar ederken temettu dagitmakla rekor kardan dagitmak ayni seydi.
//
//  BU DOSYANIN KURDUGU SEY
//  -----------------------
//      oyuncu hamlesi -> kurul olayi (BUYUKLUK + BAGLAM)
//                          |- her uyenin guveni
//                          |- kurul havasi
//                          '- hisse sinyali
//
//      buyuk kararlar -> OYLAMA (HISSE AGIRLIKLI)
//                          |- gecer / REDDEDILIR   <- ilk gercek duvar
//                          '- ret = itibar + hisse darbesi
//
//      kotu performans + dusuk guven + cogunluk kaybi
//                       -> GUVENSIZLIK OYU -> CEO gider
//
//  TASARIMIN OMURGASI: kurul ayri bir ozellik DEGIL, zaten kurulmus olan
//  KAP TABLOSUNUN SONUC KATMANI. Bugune kadar IPO, seyreltme, mezzanine
//  donusumu ve uyeye hisse satisi hisse hareket ettiriyor ama sana
//  hicbir seye mal olmuyordu — yalnizca bir yuzde degisiyordu. Oylama
//  eklendigi anda hepsi KONTROLE mal olmaya basliyor.
//
// ============================================================================

export type TraitType =
    | 'Shark'
    | 'Loyalist'
    | 'Conservative'
    | 'Visionary'
    | 'Aggressive'
    | 'Snake';

export interface GovMember {
    id: string;
    name: string;
    trait: TraitType;
    trust: number;
    shareCount: number;
    isHostile?: boolean;
}

// ============================================================================
//  1. KURUL OLAYLARI — büyüklüğü ve bağlamı olan
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
     * Olayin BUYUKLUGU, sirketin olcegine gore normalize edilmis 0-1.
     * Ornek: temettude odenen / ceyrek kari. Isten cikarmada cikarilan /
     * toplam kadro. Bu sayede kucuk sirkette de buyuk sirkette de ayni
     * "ne kadar buyuk bir hamleydi" olcusu kullanilir.
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
//  HUY DURUŞU
// ----------------------------------------------------------------------------
//  Her huyun her olaya karsi temel duruşu: -1 (nefret) ile +1 (bayilir).
//  Bu SADECE yon verir; siddeti `magnitude` belirler.
//
//  Bunlar rastgele degil, her biri bir yatirimci arketipini temsil eder:
//    Conservative -> temettu sever, borctan ve riskten kacar
//    Aggressive   -> buyume sever, atil nakitten nefret eder
//    Visionary    -> uzun vadeli yatirim sever, temettuyu israf sayar
//    Shark        -> firsatci; kaostan ve kaldirac'tan beslenir
//    Loyalist     -> huydan cok GUVENE bakar (asagida agirligi farkli)
//    Snake        -> zayifliktan beslenir; kotu haber onun icin firsattir
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

/** Tepkinin azami buyuklugu — tek bir hamle guveni bu kadar oynatabilir. */
export const MAX_TRUST_SWING = 22;

/**
 * NÖTRE ÇEKİM. Her ceyrek guven bu oranda 55'e dogru kayar.
 *
 * Bir yatirimcinin sana duydugu guven KALICI DEGILDIR; ne yaptigini
 * hatirlar ama zamanla notralize olur. Bu olmadan tek bir iyi donem
 * seni sonsuza kadar dokunulmaz yapiyordu.
 */
export const TRUST_GRAVITY = 0.06;
export const TRUST_NEUTRAL = 55;

/** Bir ceyrek sonunda guveni notre dogru cek. */
export const decayTrust = (trust: number): number =>
    trust + (TRUST_NEUTRAL - trust) * TRUST_GRAVITY;

/**
 * BAĞLAM ÇARPANI — aynı hamle, farklı durumda farklı okunur.
 *
 * Bunu ayirmak onemli: gercek bir kurul uyesi "temettuyu sever misin"
 * diye dusunmez, "BU SIRKET BU DURUMDA temettu dagitmali miydi" diye
 * dusunur. Zarar ederken temettu dagitmak temettu sevenin bile canini
 * sikar, cunku para sirketin yasamasi icin gerekliydi.
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
 * Bir olayin bir uyenin guvenine etkisi.
 *
 * guven degisimi = durus × buyukluk × baglam × MAX_TRUST_SWING
 *
 * Loyalist ozel: huyu zayiftir ama mevcut guveni yuksekse hamleyi
 * savunur (guven yuksekken tepkisi yumusar). Snake tam tersi: guveni
 * dusukse her seyi daha kotu okur.
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
    //  AZALAN VERİM — güven tek yönlü tırmanıyordu
    // ------------------------------------------------------------------
    //  Oyuncu birkac saat oynadiktan sonra "kurul canli gibi degil, hep
    //  supportive" dedi. Sebebi acikti: her karli ceyrek +7 guven
    //  veriyordu ve HICBIR SEY asagi cekmiyordu. Altinci ceyrekte herkes
    //  100'e yapisiyor, bir daha inmiyordu — yani kurul sadece bir kez
    //  kazanilip sonsuza kadar unutulan bir sinavdi.
    //
    //  Gercekte guven boyle calismaz: rutin bir iyi ceyrek zaten
    //  BEKLENEN seydir, kimseyi hayran birakmaz. Yukari cikmak zorlasir,
    //  asagi inmek kolaydir. Asimetri kasitli.
    // ------------------------------------------------------------------
    if (delta > 0) {
        // 100'e yaklastikca kazanmak zorlasir. 55'te tam, 100'de sifir.
        const headroom = Math.max(0, (100 - member.trust) / 45);
        delta *= Math.min(1, headroom);
    } else {
        // Dususte boyle bir koruma YOK: guven hizli kaybedilir.
        delta *= 1.15;
    }

    // Kisisel filtre: cok guvenen daha bagislayici, guvenmeyen daha sert.
    if (member.trait === 'Loyalist' && member.trust > 60 && delta < 0) delta *= 0.6;
    if (member.trait === 'Snake' && member.trust < 40 && delta < 0) delta *= 1.4;

    return Math.round(delta);
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v || 0));

// ============================================================================
//  2. OYLAMA — asıl duvar
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
 * KONTROL EŞİĞİ.
 *
 * Oyuncunun kendi istegi: "%50'den az ise cogu sey zaten direkt kurula
 * sorulmali". Bu tek kural sistemi kilitliyor, cunku oylamayi ayri bir
 * ozellik olmaktan cikarip KAP TABLOSUNUN DOGRUDAN SONUCU yapiyor.
 *
 * Cogunluktayken yalnizca gercekten buyuk kararlar oya gider — gercek
 * hayatta da kurul gunluk isletmeye karismaz. Cogunlugu kaybettigin an
 * her sey degisir: artik sirketi sen degil, bir koalisyon yonetir.
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
    /** Dusmanca devralma mi — kurul cok daha temkinli olur */
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
                `You hold ${owns.toFixed(1)}% — below majority. The board decides this, not you.`,
        };
    }

    const threshold = MAJORITY_VOTE_THRESHOLDS[proposal.kind];
    if (threshold === undefined) {
        return { required: false, reason: 'Within your authority as majority holder.' };
    }

    const val = Math.max(1, proposal.valuation || 1);
    const ratio = Math.max(0, proposal.amount || 0) / val;

    if (proposal.kind === 'mezzanine') {
        return {
            required: true,
            reason: 'Mezzanine always goes to a vote — the lender may end up on this board.',
        };
    }
    if (ratio >= threshold) {
        return {
            required: true,
            reason:
                `This is ${(ratio * 100).toFixed(0)}% of the company's value. ` +
                `Anything above ${(threshold * 100).toFixed(0)}% needs board approval.`,
        };
    }
    return { required: false, reason: 'Within your authority as majority holder.' };
};

/** Bir uyenin bir teklife karsi temel durusu. */
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

/** GUVENIN oy uzerindeki agirligi. Huyu bastirabilir ama silemez. */
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
    /** Neden boyle oy verdi — ekranda gosterilir */
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
 * Oylama. HISSE AGIRLIKLI, kisi basi degil.
 *
 * Bu ayrim sistemin butun anlamidir: kurulda kac kisi oldugu degil, kimin
 * kac hissesi oldugu belirler. Boylece IPO, seyreltme ve mezzanine
 * donusumu ilk kez GERCEK bir bedel tasir — para kazanirsin, oy
 * kaybedersin.
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
    //  SERBEST DOLAŞIM DA OY VERİR
    // ------------------------------------------------------------------
    //  Ilk yazimda yalnizca oyuncu ve kurul uyeleri oy veriyordu. Bu
    //  YANLISTI ve simulasyonda hemen ortaya cikti: oyuncu %45'e
    //  seyreltilip kurulun 5 uyesinden 4'u aleyhine oy verdiginde bile
    //  teklif %65 ile geciyordu — cunku halka acik %20 hic sayilmiyordu.
    //
    //  Gercekte kurumsal yatirimcilar ve vekalet danismanlari (ISS,
    //  Glass Lewis) neredeyse her zaman KURULUN TAVSIYESINI izler.
    //  Kurulu kaybetmenin gercekten tehlikeli olmasinin sebebi budur:
    //  yalnizca o odadaki oylari degil, arkalarindaki dolasimi da
    //  kaybedersin.
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
        const inclination = stance + trustPull + performance + lobby;

        const vote: 'YES' | 'NO' = inclination > 0 ? 'YES' : 'NO';

        // Karari OKUNABILIR yap — oyuncu neden kaybettigini gormeli.
        let reason: string;
        if (Math.abs(trustPull) > Math.abs(stance) && trustPull !== 0) {
            reason = trustPull > 0
                ? `Backs you personally (trust ${m.trust}).`
                : `Does not trust you (trust ${m.trust}).`;
        } else if (stance > 0.2) reason = `A ${m.trait} likes this kind of move.`;
        else if (stance < -0.2) reason = `A ${m.trait} is against this on principle.`;
        else if (performance < -0.3) reason = 'Thinks the company cannot afford risk right now.';
        else if (lobby > 0) reason = 'Persuaded in private.';
        else reason = 'Undecided, leaning on the numbers.';

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
    //  ÇOĞUNLUK SAHİBİ OYU KAYBEDEMEZ — AMA BEDELSİZ DE KAZANAMAZ
    // ------------------------------------------------------------------
    //  Cogunluktayken matematiksel olarak her oyu kazanirsin; gercek
    //  hayatta da oyle. Ama kurulun aleyhine oy verdigi bir karari yine
    //  de gecirmek "board override"dir ve BEDAVA DEGILDIR: yoneticiler
    //  istifa eder, guven cokerr, piyasa bunu yonetisim sorunu olarak
    //  fiyatlar.
    //
    //  Kurulu, kaybedemeyecegin bir oyda bile onemli kilan sey budur.
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
            ? `Carried on your shares alone — the board voted against you. That will be remembered.`
            : passed
                ? `Approved — ${((yesShares / Math.max(1, totalVoting)) * 100).toFixed(1)}% in favour.`
                : `Rejected — only ${((yesShares / Math.max(1, totalVoting)) * 100).toFixed(1)}% in favour.`,
    };
};

/** Kurulun aleyhine karar gecirmenin uyeler uzerindeki guven bedeli. */
export const OVERRIDE_TRUST_COST = 12;
/** Override sonrasi bir yoneticinin istifa etme olasiligi. */
export const OVERRIDE_RESIGN_CHANCE = 0.25;

// ============================================================================
//  3. GÜVENSİZLİK OYU — kurulun asıl silahı
// ============================================================================
//
//  Bu, kurulu oyunun en onemli seyi yapan mekanik. Digerlerinin hepsi
//  buna hazirlik.
//
//  UC KOSUL BIRDEN gerekiyor ve bu bilincli: tek bir kotu ceyrek seni
//  koltugundan etmemeli. Gorevden alinma, uzun sure ihmal edilmis bir
//  iliskinin sonucudur — ani bir ceza degil.
// ============================================================================

export interface NoConfidenceCheck {
    /** Oy cagrilir mi */
    triggered: boolean;
    /** Hangi kosullar saglandi — oyuncuya gosterilir */
    reasons: string[];
    /** Kac kosul saglandi (3 uzerinden) */
    conditionsMet: number;
    /** Bir sonraki asamaya ne kadar var — erken uyari */
    warning?: string;
}

/** Ust uste bu kadar zararli ceyrek performans kosulunu tetikler. */
export const NO_CONFIDENCE_LOSS_STREAK = 4;
/** Kurul ortalama guveni bu esigin altinda ise iliski kosulu saglanir. */
export const NO_CONFIDENCE_TRUST = 35;

/**
 * BİR ÜYENİN SANA GERÇEKTEN ARKA ÇIKMA İHTİMALİ.
 *
 * `trust` ile ayni sey DEGIL — ve bunu simulasyonda fark ettim.
 * Snake'in stance tablosunda kotu haber POZITIFTIR: felaket onun icin
 * firsattir, cunku zayiflayan CEO'yu devirmek kolaylasir. Dolayisiyla
 * felaket bir yilda Snake'in `trust` degeri 30'dan 78'e CIKIYORDU.
 *
 * Sonuc absurd: kurulun ortalama guveni yukseliyor ve seni devirmek
 * isteyen adam seni GOREVDEN ALINMAKTAN KORUYOR.
 *
 * Kavram hatasi suydu: `trust` "bu uye durumdan memnun mu" olcuyor,
 * bizim ihtiyacimiz olan ise "bu uye BENIM arkamda mi". Snake icin
 * bu ikisi TERS orantili. O yuzden sadakat ayri hesaplanir.
 */
export const loyaltyOf = (m: GovMember): number =>
    m.trait === 'Snake' ? 100 - m.trust : m.trust;

export const checkNoConfidence = (
    members: GovMember[],
    playerOwnershipPercent: number,
    ctx: CompanyContext,
): NoConfidenceCheck => {
    const reasons: string[] = [];

    // 1) KONTROL — cogunluktaysan kimse seni indiremez. Matematiksel.
    const lostControl = playerOwnershipPercent < CONTROL_THRESHOLD;
    if (lostControl) {
        reasons.push(`You hold ${playerOwnershipPercent.toFixed(1)}% — no longer a majority.`);
    }

    // 2) ILISKI — kurul sana guvenmiyor.
    // HISSE AGIRLIKLI SADAKAT. Iki duzeltme birden:
    //   1) `trust` degil `loyaltyOf` — Snake'in firsatciligi seni korumasin
    //   2) kisi basi degil hisse agirlikli — buyuk hissedarin sozu daha agir
    const totalW = members.reduce((s, m) => s + Math.max(1, m.shareCount), 0);
    const avgTrust = members.length
        ? members.reduce((s, m) => s + loyaltyOf(m) * Math.max(1, m.shareCount), 0) / Math.max(1, totalW)
        : 100;
    const lostRoom = avgTrust < NO_CONFIDENCE_TRUST;
    if (lostRoom) {
        reasons.push(`Weighted board loyalty is ${avgTrust.toFixed(0)} — they have stopped defending you.`);
    }

    // 3) PERFORMANS — sonuclar kotu.
    const failing =
        ctx.lossStreak >= NO_CONFIDENCE_LOSS_STREAK ||
        ctx.inBreach ||
        ctx.priceVsPeak < 0.45;
    if (failing) {
        if (ctx.lossStreak >= NO_CONFIDENCE_LOSS_STREAK) {
            reasons.push(`${ctx.lossStreak} consecutive losing quarters.`);
        }
        if (ctx.inBreach) reasons.push('The company is in breach of its covenants.');
        if (ctx.priceVsPeak < 0.45) {
            reasons.push(`The share price is ${((1 - ctx.priceVsPeak) * 100).toFixed(0)}% below its peak.`);
        }
    }

    const conditionsMet = [lostControl, lostRoom, failing].filter(Boolean).length;

    // ERKEN UYARI: iki kosul saglandiysa oyuncu ucuncusunun geldigini
    // gormeli. Habersiz kaybetmek adil degil.
    let warning: string | undefined;
    if (conditionsMet === 2) {
        if (!lostControl) warning = 'If you fall below 50%, the board can move against you.';
        else if (!lostRoom) warning = 'Trust is the only thing keeping you in the chair.';
        else warning = 'One more bad quarter and they will call a vote.';
    }

    return { triggered: conditionsMet === 3, reasons, conditionsMet, warning };
};

/**
 * Guvensizlik oyunun kendisi.
 *
 * Bu oylamada oyuncu KENDI hisseleriyle oy verir — gercek hayatta da
 * boyledir. Cogunluktaysan zaten tetiklenmez; cogunlugun yoksa
 * hisselerin yine de savunmandir. Bu yuzden "hisselerimi kaybetmek"
 * ile "koltugu kaybetmek" arasinda dogrudan ve okunabilir bir bag var.
 */
export const voteNoConfidence = (
    members: GovMember[],
    playerShares: number,
    ctx: CompanyContext,
): VoteResult => {
    const votes: MemberVote[] = members.map(m => {
        // Guven ne kadar dusukse gorevden alma istegi o kadar yuksek.
        // Burada da `trust` degil SADAKAT: Snake ne kadar 'memnun'sa
        // seni indirmeye o kadar isteklidir.
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
                ? `Votes to remove you (trust ${m.trust}).`
                : `Stands by you (trust ${m.trust}).`,
        };
    });

    const removeShares = votes.filter(v => v.vote === 'YES').reduce((s, v) => s + v.shareCount, 0);
    // Oyuncunun kendi hisseleri her zaman kalmaktan yana.
    const keepShares =
        votes.filter(v => v.vote === 'NO').reduce((s, v) => s + v.shareCount, 0) + playerShares;
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
            ? `The board has removed you as CEO. ${((removeShares / Math.max(1, totalVoting)) * 100).toFixed(1)}% voted against you.`
            : `You survive. ${((keepShares / Math.max(1, totalVoting)) * 100).toFixed(1)}% of the register stood by you.`,
    };
};

// ============================================================================
//  4. LOBİ VE SÖZ — 1:1 konuşmanın gerçek olduğu yer
// ============================================================================
//
//  Oylamadan once bir uyeyi arayip destegini isteyebilirsin. Bedava
//  degil: karsiliginda bir SOZ verirsin ve o soz kayda gecer. Tutarsan
//  guven artar; tutmazsan huyu ne olursa olsun iki katiyla geri doner.
//
//  Sozu bozmanin huydan BAGIMSIZ cezalandirilmasi bilincli. Bir yatirimci
//  senin agresif ya da temkinli olmandan hoslanmayabilir — ama yalan
//  soylemenden kimse hoslanmaz.
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
    /** Hangi ceyrege kadar tutulmali */
    dueQuarter: number;
    /** Ne kadarlik bir soz — guven etkisi buna olcekli */
    magnitude: number;
    description: string;
    resolved?: 'kept' | 'broken';
}

/** Lobinin oy uzerindeki agirligi — huyu bastirabilecek kadar guclu degil. */
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
 * Bir uyeyle 1:1 konusma.
 *
 * Ikna sansi guvene ve huya bagli. Yuksek guvenli bir Loyalist bedavaya
 * destekler; dusuk guvenli bir Snake once bir sey ister — ve istedigini
 * vermezsen zaten aleyhine oy verecektir.
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

    // Guven dusukse bedava destek yok — bir sey ister.
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
        ? `You kept your word: ${promise.description}`
        : `You broke your word: ${promise.description}`,
});

// ============================================================================
//  5. KURUL HAVASI VE HİSSE SİNYALİ
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
    proposal_rejected: { impactPercent: -4, note: 'The board publicly overruled its CEO.' },
    director_resigned: { impactPercent: -6, note: 'A director walked out. Investors ask why.' },
    no_confidence_called: { impactPercent: -14, note: 'A no-confidence vote is a governance crisis.' },
    ceo_removed: { impactPercent: -22, note: 'The founder has been removed.' },
    ceo_survived: { impactPercent: -5, note: 'Survived, but the fight was public.' },
    board_aligned: { impactPercent: 2, note: 'A united board reads as stability.' },
    promise_broken: { impactPercent: -3, note: 'Word gets around that the CEO does not keep commitments.' },
};

// ============================================================================
//  SATIN ALMADAN GELEN YÖNETİCİ — "rollover equity"
// ============================================================================
//
//  Bugune kadar kurula tek bir yoldan uye geliyordu: tefeciden borc alip
//  odeyememek. Yani kurul yalnizca BASARISIZLIKLA buyuyordu ve iyi giden
//  bir oyuncunun kurulu ilk gunku haliyle donuyordu.
//
//  Gercekte kurul en cok SATIN ALMALARLA buyur. Dostane bir devralmada
//  hedefin kurucusu genelde bedelin bir kismini HISSE olarak alir
//  ("rollover equity") ve bir sure sirkette kalir — hem sirketi tanidigi
//  icin hem de basarisina bagli kalmasi istendigi icin.
//
//  OYUN ACISINDAN ONEMI: bu, dostane ve dusmanca devralma arasina gercek
//  bir fark koyar.
//
//    DOSTANE  -> daha ucuz prim (%15), ama masaya BIR KISI DAHA oturur
//                ve senin payin bir tik erir
//    DUSMANCA -> pahali prim (%35), entegrasyon zor, ama kimse gelmez;
//                yonetimlerini zaten sen kovdun
//
//  Yani "ucuz olan" seni yavas yavas kontrolden eder. Bu bilincli: her
//  devralma kontrolunden bir dilim goturur ve yeterince buyurse oyuncu
//  bir gun %50'nin altina duser — kurul sistemi de tam orada devreye
//  girer. Buyumenin kendisi bir risk haline gelir.
// ============================================================================

/** Devralma bu buyuklugun altindaysa kimse koltuk istemez. */
export const SEAT_MIN_DEAL_RATIO = 0.03;
/** Bir devralmanin verebilecegi en kucuk ve en buyuk pay. */
export const SEAT_MIN_STAKE = 0.005;
export const SEAT_MAX_STAKE = 0.03;

export interface IncomingDirector {
    name: string;
    trait: TraitType;
    trust: number;
    /** Kendisine ihrac edilecek hisse adedi */
    shareCount: number;
    note: string;
}

/**
 * Hedefin risk profili, gelen kisinin HUYUNU belirler.
 *
 * Mantikli bir bag: olgun ve karli bir sirketi yoneten kisi temkinli
 * olur; para yakan bir girisimi yoneten kisi risk sever. Boylece kimi
 * satin aldigin, kurulunun gelecekteki karakterini de sekillendirir —
 * ve bu tamamen senin kontrolunde bir seçim.
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
): IncomingDirector | null => {
    // Dusmanca devralmada hedefin yonetimi kalmaz. Odedigin yuksek prim
    // zaten bunun bedelidir.
    if (hostile) return null;

    const val = Math.max(1, acquirerValuation || 1);
    const ratio = Math.max(0, dealPrice || 0) / val;
    if (ratio < SEAT_MIN_DEAL_RATIO) return null;

    // Pay islemin buyuklugune gore, ama dar bir bantta. Kendinden buyuk
    // bir sirketi alsan bile tek bir kisi kurulun yarisini alamaz.
    const stake = Math.max(SEAT_MIN_STAKE, Math.min(SEAT_MAX_STAKE, ratio * 0.35));
    const shareCount = Math.round((totalShares || 10_000_000) * stake);

    return {
        name: `${targetName} founder`,
        trait: TRAIT_BY_RISK[risk] ?? 'Loyalist',
        // Sana kendi istegiyle katildi: iyi niyetli ama korlemesine degil.
        trust: 60,
        shareCount,
        note:
            `Rolled ${(stake * 100).toFixed(1)}% of your company into the deal and took a board seat. ` +
            `Friendly deals are cheaper, but they cost you a slice of control.`,
    };
};
