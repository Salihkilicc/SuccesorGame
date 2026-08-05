import { t } from '../i18n';
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
    /** SONUCLARIN olusturdugu profesyonel guven. Oyu bu belirler. */
    trust: number;
    shareCount: number;
    isHostile?: boolean;

    // --- KISISEL KATMANLAR (bkz. asagidaki "KISI" bolumu) ---
    /** JESTLERIN olusturdugu kisisel yakinlik. Oy vermez, kapi acar. */
    relationship?: number;
    /** Aslinda ne istiyor — hangi hediyenin ve argumanin ise yaradigini belirler. */
    motivation?: Motivation;
    /** Kurula nasil geldi. Her cumlesinin rengi buradan cikar. */
    origin?: DirectorOrigin;
    /** Orantisiz onemsedigi tek konu. Toplantida hep bunu kasir. */
    petIssue?: PetIssue;
    /** Ust uste ayni hamleyi gormenin yorgunlugu (olay turu -> tekrar sayisi). */
    fatigue?: Record<string, number>;
}

// ============================================================================
//  KİŞİ — karakter tipi iskelettir, insan degildir
// ============================================================================
//  Alti karakter tipi iyi bir omurga ama ayni tipteki iki uye birebir ayni
//  davraniyordu. Uzerine kisisel katmanlar biniyor: ne istedigi, nereden
//  geldigi, neyi takintili sekilde onemsedigi.
// ============================================================================

/** Bu adam aslinda ne pesinde? Hangi jestin ise yarayacagini belirler. */
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
//  GUVEN vs ILISKI — ayri iki sey, ve ayri kalmali
// ============================================================================
//  TEHLIKE: hediye guveni artiriyordu, guven de oyu belirliyordu. Yani
//  para dogrudan oy satin aliyordu. Zengin CEO dokunulmaz olurdu ve
//  kurul bu sefer ters yonden anlamsizlasirdi.
//
//  Ayrim:
//    GUVEN   <- yalnizca SONUCLAR (kar, pay, borc, tutulan sozler). Oy verir.
//    ILISKI  <- jestler (hediye, yemek, ilgi). Oy VERMEZ.
//
//  Iliskinin getirisi bilgi ve zamandir, oy degil:
//    - ozelden uyarir ("kurul seni onumuzdeki ceyrek konusacak")
//    - digerlerinin nasil oy verecegini fisildar
//    - KARARSIZ ise senden yana kirilir (yalnizca kararsizken!)
//    - guvensizlik oyunda son ana kadar direnir
// ============================================================================

export const RELATIONSHIP_NEUTRAL = 50;
/** Iliski de notre kayar ama guvenden YAVAS: kisisel bag daha kalicidir. */
export const RELATIONSHIP_GRAVITY = 0.03;
/** Kararsiz bir uyeyi iliskinin cevirebilecegi en fazla egilim. */
export const RELATIONSHIP_TIEBREAK = 0.35;
/** Bu iliskinin ustunde ozel kanal acilir: uyarilar ve fisiltilar gelir. */
export const RELATIONSHIP_CONFIDANT = 70;

/** Iliskiyi bir ceyrek ilerlet — ilgi gostermezsen yavasca soner. */
export const decayRelationship = (relationship: number | undefined): number => {
    const r = relationship ?? RELATIONSHIP_NEUTRAL;
    return r + (RELATIONSHIP_NEUTRAL - r) * RELATIONSHIP_GRAVITY;
};

/**
 * Bir jestin iliskiye etkisi.
 *
 * MOTIVASYON FILTRESI: yanlis adama yanlis jest ters teper. Vizyoner bir
 * kurucuya para hediye etmek onu asagilar; ona "seni hakli cikardim"
 * demek gerekir. Bu yuzden her jestin hedef motivasyonu var.
 */
/**
 * Ust uste yapilan jestin sonen etkisi. Ilk hediye jesttir, besincisi
 * fatura. Bu olmadan oyuncu 50 bin dolari bes kez basip herkesi
 * dost yapardi — iliski satin alinabilir bir sey olurdu.
 */
export const GESTURE_FATIGUE = 0.55;

export const giftEffect = (
    member: GovMember,
    gestureFor: Motivation,
    magnitude: number,
    /** Bu uyeye daha once kac kez jest yapildi */
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

/** Bu uye sana ozel konusacak kadar yakin mi? */
export const isConfidant = (m: GovMember): boolean =>
    (m.relationship ?? RELATIONSHIP_NEUTRAL) >= RELATIONSHIP_CONFIDANT;

// ============================================================================
//  TEKRAR YORGUNLUGU
// ============================================================================
//  Dogrulama kosusunda cikti: ayni hamleyi ust uste yapinca uye dibe
//  yapisiyor ve bir daha donmuyordu (Muhafazakar bes zarar ceyreginde
//  70'ten 3'e indi ve orada kaldi). Gercekte ilk temettu haber, besincisi
//  rutindir. Ayni olay tekrarlandikca etkisi soner.
// ============================================================================
export const FATIGUE_DECAY = 0.65;

/** Ayni olayin ust uste tekrarinda etkiyi soker. */
export const fatigueMultiplier = (member: GovMember, kind: string): number => {
    const seen = member.fatigue?.[kind] ?? 0;
    return Math.pow(FATIGUE_DECAY, Math.max(0, seen));
};

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
                t('gov.belowMajorityDecides', { v1: owns.toFixed(1) }),
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
            reason: t('data.governance.mezzanineAlwaysGoesToA'),
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
        reasons.push(t('gov.noLongerMajority', { v1: playerOwnershipPercent.toFixed(1) }));
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
 * Guvensizlik oyunun kendisi.
 *
 * Bu oylamada oyuncu KENDI hisseleriyle oy verir — gercek hayatta da
 * boyledir. Cogunluktaysan zaten tetiklenmez; cogunlugun yoksa
 * hisselerin yine de savunmandir. Bu yuzden "hisselerimi kaybetmek"
 * ile "koltugu kaybetmek" arasinda dogrudan ve okunabilir bir bag var.
 */
/**
 * OYLAMA ARALIGI. Bir guvensizlik oyunu atlattiysan kurul bunu her
 * ceyrek tekrarlayamaz.
 *
 *  Dogrulama kosusunda cikti: 20 ceyrek boyunca HER ceyrek guvensizlik
 *  oyu yapiliyordu. Hem sacma (yillik genel kurul ceyrekte bir olmaz),
 *  hem de her cagri hisse fiyatina ayri bir darbe vuruyordu — kaybedilen
 *  oy CEO'yu guclendirmesi gerekirken cezalandiriyordu.
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
                ? t('gov.votesToRemove', { v1: m.trust })
                : t('gov.standsByYou', { v1: m.trust }),
        };
    });

    const boardYes = votes.filter(v => v.vote === 'YES').reduce((s, v) => s + v.shareCount, 0);
    const boardNo = votes.filter(v => v.vote === 'NO').reduce((s, v) => s + v.shareCount, 0);

    // ------------------------------------------------------------------
    //  HALKA ACIK KISIM DA OY KULLANIR
    // ------------------------------------------------------------------
    //  Bu yoktu ve mekanigin tamamini olu birakiyordu: kurul en fazla
    //  %35 tasidigi icin %40 hissesi olan bir CEO matematiksel olarak
    //  INDIRILEMIYORDU. Bes yil ust uste zarar, sozlesme ihlali, tum
    //  kurulun sifir sadakati — hicbiri yetmiyordu.
    //
    //  Gercekte kurumsal yatirimci bu oylamalarda oy kullanir ve genel
    //  olarak kurulun okumasini takip eder. Tamami degil: bir kismi
    //  cekimser kalir (FLOAT_FOLLOW_RATIO).
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
        ? t('gov.keptWord', { v1: promise.description })
        : t('gov.brokeWord', { v1: promise.description }),
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
    proposal_rejected: { impactPercent: -4, note: t('data.governance.theBoardPubliclyOverruledIts') },
    director_resigned: { impactPercent: -6, note: t('data.governance.aDirectorWalkedOutInvestors') },
    no_confidence_called: { impactPercent: -14, note: t('data.governance.aNoConfidenceVoteIs') },
    ceo_removed: { impactPercent: -22, note: t('data.governance.theFounderHasBeenRemoved') },
    ceo_survived: { impactPercent: -5, note: t('data.governance.survivedButTheFightWas') },
    board_aligned: { impactPercent: 2, note: t('data.governance.aUnitedBoardReadsAs') },
    promise_broken: { impactPercent: -3, note: t('data.governance.wordGetsAroundThatThe') },
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
        name: t('gov.founderOf', { v1: targetName }),
        trait: TRAIT_BY_RISK[risk] ?? 'Loyalist',
        // Sana kendi istegiyle katildi: iyi niyetli ama korlemesine degil.
        trust: 60,
        shareCount,
        note:
            t('gov.rolloverNote', { v1: (stake * 100).toFixed(1) }),
    };
};

// ============================================================================
//  KURULUN KENDİ GÜNDEMİ
// ============================================================================
//
//  BURAYA KADAR kurul hep TEPKİ veriyordu: sen bir şey yapıyordun, onlar
//  puan veriyordu. Bu yüzden masada yalnız hissediliyordu — karşında kimse
//  yoktu, bir tabelaya bakıyordun.
//
//  Gerçek bir yönetim kurulu SENDEN BİR ŞEY İSTER. Sessiz kalmaz. İki çeyrek
//  zarar edersen biri kesinlikle "maliyetler ne olacak" diye sorar. Kasada
//  atıl para birikirse temettü ister. Borç şişerse ödemeni ister.
//
//  Ve önemlisi: talebi HERKES değil, o konuyu DERT EDİNEN üye açar
//  (`petIssue`). Kurulunda borç takıntılı kimse yoksa borcunu kimse sormaz.
//  Kurulunu sen seçiyorsun — kimi aldığın, neyi hesap vereceğini belirler.
//
//  Talebi karşılamak güven kazandırır; görmezden gelmek kaybettirir ve
//  güvensizlik oyuna giden yolu döşer.
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
    /** Talebi acan uye — bu bir kurum degil, bir INSAN istiyor */
    raisedBy: string;
    raisedByName: string;
    quarterRaised: number;
    /** Bu ceyrege kadar karsilanmali */
    deadline: number;
    /** Sayisal hedef (temettu tutari, inilecek kaldirac vb.) */
    target: number;
    status: 'open' | 'met' | 'failed';
}

/** Talebi karsilamak icin taninan sure. */
export const DEMAND_GRACE = 3;
/**
 * BEKLEME SURELERI — dogrulama kosusunda cikan hatanin ilaci.
 *
 *  Ilk kosuda su goruldu: talep Ç7'de ihmal edildi (−14 guven) ve AYNI
 *  ceyrekte ayni talep yeniden acildi. Kurul cezayi kesip ayni cumleyi
 *  tekrar kuruyordu. Gercek bir kurul boyle davranmaz: dediginin
 *  yapilmadigini goren yonetici tekrar etmez, SUSAR ve hatirlar.
 *
 *  Ayrica surekli tekrarlanan talep baskisini degil, inandiriciligini
 *  kaybeder. Karsilanan talep de bir sure geri gelmez.
 */
export const DEMAND_COOLDOWN_MET = 3;
export const DEMAND_COOLDOWN_FAILED = 5;
/** Bir talep kapandiktan sonra kurulun sessiz kalacagi ceyrek sayisi. */
export const DEMAND_QUIET = 2;
/** Karsilanan talep: talebi acana daha fazla, kurula genel bir miktar. */
export const DEMAND_MET_TRUST = 9;
export const DEMAND_MET_TRUST_OTHERS = 3;
/** Gormezden gelinen talep — kazanmaktan daha cok kaybettirir. */
export const DEMAND_FAILED_TRUST = -14;
export const DEMAND_FAILED_TRUST_OTHERS = -5;
/** Gelirin bu kati kadar atil nakit "cok" sayilir. */
export const IDLE_CASH_MULTIPLE = 4;

/** Bir uyenin bir konuyu dert edinip edinmedigi: once petIssue, sonra huy. */
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
 * Bu ceyrek kurul bir sey ister mi?
 *
 * Tek seferde TEK talep acilir — surekli bagiran bir kurul gurultudur,
 * baski degil. Kosul saglanmiyorsa veya o konuyu dert edinen kimse yoksa
 * `null` doner: kurul gercekten sessizdir.
 */
export const detectDemand = (
    members: GovMember[],
    ctx: DemandContext,
    quarter: number,
    /** Tur bazinda "bu ceyrekten once acilamaz" kaydi */
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

    // Her aday icin: o konuyu en cok dert edinen uye kim? Kimse degilse dusur.
    let best: { kind: DemandKind; target: number; member: GovMember; score: number } | null = null;
    for (const c of candidates) {
        for (const m of members) {
            const care = caresAbout(m, c.kind);
            if (care <= 0) continue;
            // Guveni dusuk uye daha yuksek sesle konusur.
            const voice = care * c.urgency * (1 + (TRUST_NEUTRAL - (m.trust ?? 50)) / 100);
            if (!best || voice > best.score) best = { kind: c.kind, target: c.target, member: m, score: voice };
        }
    }
    if (!best) return null;

    return {
        id: `dem_${quarter}_${best.kind}`,
        kind: best.kind,
        raisedBy: best.member.id,
        raisedByName: best.member.name,
        quarterRaised: quarter,
        deadline: quarter + DEMAND_GRACE,
        target: best.target,
        status: 'open',
    };
};

/**
 * Acik bir talep karsilandi mi?
 *
 * `satisfiedManually`: temettu/Ar-Ge gibi oyuncunun acikca yaptigi hamleler
 * store tarafindan isaretlenir; geri kalani sirket durumundan okunur.
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
