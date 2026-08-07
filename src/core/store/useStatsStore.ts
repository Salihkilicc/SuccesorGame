import { create } from 'zustand';
import { BRAND_INDEX_SCALE } from '../market/brand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProductStore } from './useProductStore';
import { BUILD_CANCEL_REFUND, getNextTier, getTier } from '../market/capacity';
import { clampSalaryRatio, quarterlyWage } from '../market/workforce';
import { useLaboratoryStore } from './useLaboratoryStore';
import {
  companyValuation,
  ownershipPercent,
  priceChangePercent,
  sharePrice as equitySharePrice,
  trailingTotal,
} from '../market/equity';

export type StatKey =
  | 'money'
  | 'netWorth'
  | 'monthlyIncome'
  | 'monthlyExpenses'
  | 'netWorth'
  | 'monthlyIncome'
  | 'monthlyExpenses'
  | 'companyDebt'
  | 'companyDebtTotal'
  | 'companyOwnership'
  | 'companyValue'
  | 'companySharePrice'
  | 'companyDailyChange'
  | 'previousSharePrice'
  | 'earningsPower'
  | 'lossCarryforward'
  | 'companyRevenueMonthly'
  | 'companyExpensesMonthly'
  | 'companyCapital'
  | 'casinoReputation'
  | 'factoryCount'
  | 'employeeCount'
  | 'employeeMorale'
  | 'productionCapacity'
  | 'productionLevel'
  | 'researchPoints'
  | 'brandValue'
  | 'facilityTier'
  | 'targetHeadcount'
  | 'incomingHires'
  | 'avgTenureQuarters'
  | 'salaryRatio'
  | 'stockSplitCount';

export interface Shareholder {
  id: string;
  name: string;
  type: 'player' | 'family' | 'investor';
  percentage: number;
  relationship?: number; // 0-100, only for non-player
  avatar?: string;
  bio?: string;
}

export interface TechLevels {
  hardware: number;
  software: number;
  future: number;
}

export interface SubsidiaryState {
  id: string;
  name: string;
  marketCap: number;
  baseProfit: number; // Original profit when acquired
  currentProfit: number; // Current monthly profit (can be negative)
  isLossMaking: boolean; // True if currently failing
  initialPurchasePrice: number; // Price paid when acquiring the company
}

// --- State Definitions ---

export type Acquisitions = string[];

/**
 * Devam eden tesis insaati. Yoksa null.
 * Bkz. core/market/capacity.ts — insaat sirasinda kapasite %65'e duser.
 */
export interface FacilityBuild {
  /** Hedeflenen kademe numarasi */
  targetTier: number;
  /** Kac ceyrek kaldi */
  quartersRemaining: number;
  /** Odenen tutar — iptal halinde bir kismi geri doner */
  paidCost: number;
}

export type StatsState = Record<StatKey, number> & {
  /** Kategori bazli markalar (kategori adi -> 0..100).
   *  Sayisal union'a giremez, bilincli olarak ayri duruyor.
   *  Bkz. core/market/brand.ts -> corporateBrand */
  brandByCategory: Record<string, number>;
  /** Kategorinin bir kez kazandigi ve bir daha altina dusmedigi marka tabani */
  brandFloorByCategory?: Record<string, number>;
  /** The board's open demand this quarter, already formatted for display. */
  boardDemandNotice?: string;
  _hasHydrated: boolean;
  /** Gecen ceyregin kredi notu — not dususunu yakalamak icin */
  creditRatingPrev?: string;
  /** Ust uste zararli ceyrek sayisi — guvensizlik oyu bunu okur */
  lossStreak?: number;
  /** Gecen ceyregin hisse adedi — seyreltmeme sozu bununla olculur */
  totalSharesPrev?: number;
  facilityBuild: FacilityBuild | null;
  /**
   * Son dort ceyregin hasilati — degerleme TTM ile yapilir.
   * Tek ceyregi 4'le carpmak sacma oynaklik uretiyordu (bir kotu
   * ceyrek hisseyi %66 eritiyordu).
   */
  revenueHistory: number[];
  /** Son dort ceyregin faaliyet kari */
  ebitHistory: number[];
  shareholders: Shareholder[];
  /**
   * MAAS ORANI — piyasa maasina gore odedigin.
   * 1.00 = piyasa. Altinda moral erir, ustunde birikir (tavan 85).
   * Bkz. core/market/workforce.ts
   *
   * ESKI `salaryTier` alaninin yerini aldi: o alan motorla senkron
   * degildi ve ekranda yanlis gider gosteriyordu.
   */
  salaryRatio: number;
  techLevels: TechLevels;
  acquisitions: Acquisitions;
  subsidiaryStates: Record<string, SubsidiaryState>; // Track subsidiary performance
  isPublic: boolean;
};

type StatsStore = StatsState & {
  setHasHydrated: (state: boolean) => void;
  update: (partial: Partial<StatsState>) => void;
  setField: <K extends StatKey>(key: K, value: number) => void;

  // Money Transaction Methods (Single Source of Truth)
  spendMoney: (amount: number) => boolean; // Returns true if successful, false if insufficient funds
  subtractMoney: (amount: number) => void; // Force subtract (no return check)
  earnMoney: (amount: number) => void;
  setMoney: (amount: number) => void; // For forced updates (e.g., load game, cheats)

  setCompanyValue: (value: number) => void;
  setCompanySharePrice: (value: number) => void;
  setCompanyDailyChange: (value: number) => void;
  setCompanyDebt: (value: number) => void;
  setCompanyDebtTotal: (value: number) => void;
  setCompanyOwnership: (value: number) => void;
  setCompanyRevenueMonthly: (value: number) => void;
  setCompanyExpensesMonthly: (value: number) => void;
  setCompanyCapital: (value: number) => void;
  setCasinoReputation: (value: number) => void;
  setResearchPoints: (value: number) => void;
  setShareholders: (list: Shareholder[]) => void;
  /** Maas oranini belirler (0.75-1.35). 1.00 = piyasa. */
  setSalaryRatio: (ratio: number) => void;
  setTechLevel: (category: keyof TechLevels, level: number) => void;
  /**
   * EMEKLIYE AYRILDI — cagirmayin.
   *
   * Bu yol devralmayi yalnizca `acquisitions[]` ve `subsidiaryStates`
   * icine yaziyordu. Motor ORAYA BAKMIYOR: pazar payi gecmiyor, hedefin
   * kari EBIT'e girmiyor, entegrasyon/sinerji islemiyordu. Yani bu
   * fonksiyonla alinan sirket oyunda hicbir sey yapmiyordu.
   *
   * Tek kapi: useCorporateFinanceStore.executeAcquisition
   * Alan yalnizca eski kayitlar bozulmasin diye duruyor.
   */
  addAcquisition: (id: string, companyData: { name: string; marketCap: number; profit: number }) => void;
  setIsPublic: (value: boolean) => void;
  performIPO: () => void;
  performStockSplit: () => void;
  updateShareholderRelationship: (id: string, delta: number) => void;
  performDilution: (percentage: number) => void;
  performBuyback: (percentage: number) => void;
  payDividend: (percentage: number) => void;
  processCompanyMonthlyTick: () => void;

  /** Bir sonraki kademeye yukseltme baslatir. Parasi yetmezse false doner. */
  startFacilityUpgrade: () => { success: boolean; message: string };
  /** Devam eden insaati iptal eder; odenen tutarin bir kismi geri doner. */
  cancelFacilityUpgrade: () => void;
  /** Hedef kadroyu belirler. Ise alim/cikarma ceyrek sonunda islenir. */
  setTargetHeadcount: (value: number) => void;
  /**
   * EMEKLIYE AYRILDI — cagirmayin.
   *
   * Bu yol yalnizca nakit ve borc rakamini artiriyordu: kredi kaydi yok,
   * amortisman yok, taksit yok, vade yok, sozlesme yok. Yani hangi
   * ekrandan borclandigina gore tamamen farkli bir sistem aliyordun.
   *
   * Tek kapi: useCorporateFinanceStore.takeLoan
   */
  borrowCapital: (amount: number, interestRate: number) => void;
  /** EMEKLIYE AYRILDI — yerine useCorporateFinanceStore.repayLoan */
  repayCapital: (amount: number) => void;
  reset: () => void;
};

/**
 * Kap tablosuna TEMBEL erisim.
 *
 * `useShareholderStore` bu dosyayi import ettigi icin ust seviye bir
 * import dongu yaratiyor ve TypeScript store tiplerini `never` olarak
 * cikariyordu. require ile dongu yalnizca calisma zamaninda cozulur.
 */
const getShareholderState = (): { totalShares: number; playerShareCount: number } => {
  try {
    const mod = require('../../features/shareholders/stores/useShareholderStore');
    const st = mod.useShareholderStore.getState();
    return { totalShares: st.totalShares, playerShareCount: st.playerShareCount };
  } catch {
    return { totalShares: 10_000_000, playerShareCount: 6_500_000 };
  }
};

// --- Financial Constants ---

const BASE_SHARES = 10_000_000;

// ============================================================================
//  BAŞLANGIÇ DURUMU
// ============================================================================
//  Tasarım kararı: küçük ama işleyen bir şirket. 1 fabrika, 20 çalışan,
//  1 aktif ürün. Sermaye ~2M — hata affetmez ama boğmaz.
//
//  Uydurma geçmiş YOK: companyRevenueMonthly / companyExpensesMonthly sıfır.
//  Eskiden 500K/400K yazıyordu, oyuncu hiç bir şey yapmadan kârlı görünüyordu.
//
//  Sahiplik %65: kurulda 4 üye var (Marcus %12, Elena %10, Victor %8,
//  Sarah %5 = %35). Eskiden burada 100 yazıyordu, kurul ekranıyla çelişiyordu.
//  Kaynak: features/shareholders/stores/useShareholderStore.ts
// ============================================================================

const START_COMPANY_CAPITAL = 2_000_000;
const START_PLAYER_CASH = 50_000;
const START_FACTORIES = 1;
// Tier 1 asks for a crew of 22. Starting at 20 meant opening the game
// understaffed, running the plant at 91% before a single decision was made.
export const START_EMPLOYEES = 22;
/** Kurul üyelerinin toplam payı %35 → oyuncuya %65 kalıyor. */
const START_PLAYER_OWNERSHIP = 65;

export const initialStatsState: StatsState = {
  _hasHydrated: false,
  money: START_PLAYER_CASH,
  netWorth: START_PLAYER_CASH, // Şirket değeri recalculateFinancials'ta eklenecek
  monthlyIncome: 8_000, // Kurucu maaşı — mütevazı
  monthlyExpenses: 3_000,

  companyDebt: 0,
  companyDebtTotal: 0,
  companyOwnership: START_PLAYER_OWNERSHIP,

  // Değerleme = sermaye * 1.5 (advanceMonth'un kullandığı formül)
  companyValue: START_COMPANY_CAPITAL * 1.5,
  companySharePrice: (START_COMPANY_CAPITAL * 1.5) / 10_000_000, // 10M hisse → $0.30
  companyDailyChange: 0,
  /** Gecen ceyregin hisse fiyati — degisim yuzdesi buradan hesaplanir */
  previousSharePrice: (START_COMPANY_CAPITAL * 1.5) / 10_000_000,
  casinoReputation: 0,

  // Geçmiş yok: ilk çeyrek raporu oyuncunun kendi kararlarını göstersin.
  companyRevenueMonthly: 0,
  companyExpensesMonthly: 0,
  companyCapital: START_COMPANY_CAPITAL,

  factoryCount: START_FACTORIES, // ESKI ALAN — tesis kademesi devraldi, taşıma icin duruyor

  // ------------------------------------------------------------------
  //  TESIS VE KADRO
  // ------------------------------------------------------------------
  //  Kademe 1 = Workshop: 4.500 standart birim kapasite, 22 kisilik ekip.
  //  20 calisanla basliyorsun, yani ekip EKSIK — ilk kararlardan biri
  //  bu acigi kapatmak. Bkz. core/market/capacity.ts
  // ------------------------------------------------------------------
  facilityTier: 1,
  facilityBuild: null,
  revenueHistory: [],
  ebitHistory: [],
  /** Yumusatilmis TTM EBIT — piyasanin fiyatladigi "kazanc gucu" */
  earningsPower: 0,
  /** Ileriye tasinan zarar — sonraki karli ceyreklerde matrahtan duser */
  lossCarryforward: 0,
  creditRatingPrev: '',
  lossStreak: 0,
  totalSharesPrev: 0,
  targetHeadcount: START_EMPLOYEES,
  incomingHires: 0,
  /** Ortalama kidem (ceyrek). Deneyim primi buradan gelir. */
  avgTenureQuarters: 0,

  employeeCount: START_EMPLOYEES,
  employeeMorale: 75,
  salaryRatio: 1.0,

  // ESKI ALAN — gercek kapasite artik kademeden turetiliyor
  // (core/market/capacity.ts). Sadece eski ekranlar patlamasin diye duruyor.
  productionCapacity: 4_500,
  productionLevel: 0, // Global alan; ürün bazlı üretim Product.productionLevel'da
  researchPoints: 0, // Ar-Ge sıfırdan başlar

  // ------------------------------------------------------------------
  //  BRAND VALUE (0-100)
  // ------------------------------------------------------------------
  //  Yavas biriken itibar. Surekli pazarlama ve kaliteyle yukselir;
  //  stok tukenmesi, fahis fiyat ve dusuk kaliteyle duser.
  //  Pazar payi hesabinda carpan olarak kullanilacak — su an sadece
  //  gosteriliyor. Bkz. core/market/productMarkets.ts
  //
  //  Bilinmeyen bir kurucunun sirketisin: 8 ile basliyorsun.
  // ------------------------------------------------------------------
  // ----------------------------------------------------------------------
  //  START WHERE THE FACTORY CAN HOLD
  // ----------------------------------------------------------------------
  //  Brand is measured in POINTS (share x 43.3) and settles at whatever the
  //  realised share supports. This began at 26, which is 0.6% share - the
  //  level a TIER 2 plant sustains. The game starts on tier 1, whose full
  //  crew reaches 0.405% and therefore holds a brand of 18.
  //
  //  So a player doing everything right - full crew, every unit sold, no
  //  demand missed - still watched brand fall 26 -> 22.5 -> 20.2 -> 18.7,
  //  and the tail of that decay is the "it only moves 0.2" they reported.
  //  Starting above equilibrium means the opening hours of the game are a
  //  slow loss no decision can prevent.
  //
  //  At 18 the same player holds steady, and the first facility upgrade
  //  lifts the ceiling to 29 - so the number goes UP when they do the right
  //  thing, which is what it was always supposed to signal.
  // ----------------------------------------------------------------------
  brandValue: 18,
  /** Kategori bazli markalar. Bkz. core/market/brand.ts */
  brandByCategory: {} as Record<string, number>,

  stockSplitCount: 0,
  isPublic: false,

  techLevels: {
    hardware: 1,
    software: 1,
    future: 0, // Future tech locked at start
  },

  acquisitions: [],
  subsidiaryStates: {},

  shareholders: [
    { id: 'player', name: 'Player', type: 'player', percentage: START_PLAYER_OWNERSHIP, avatar: 'P' },
  ],
};

// --- Helper: Recalculate Financials ---
const recalculateFinancials = (currentState: StatsStore) => {
  const {
    employeeCount,
    companyDebtTotal,
    companyCapital,
    isPublic,
    techLevels,
    stockSplitCount
  } = currentState;

  // 1. Calculate Expenses
  // TEK KAYNAK: gercek maas core/market/workforce.ts'ten gelir.
  // Eskiden burada ayri bir SALARY_TIERS tablosu vardi ve
  // `salaryTier` alani motorla hic senkron degildi — ekranda yanlis
  // rakam gosteriyordu.
  const salaryCost =
    (employeeCount * quarterlyWage(currentState.facilityTier, currentState.salaryRatio)) / 3;
  // Tesis gideri artik kademeden gelir, "fabrika sayisi"ndan degil.
  let factoryCost = getTier(currentState.facilityTier).opexPerQuarter / 3;

  // ChipMaster Bonus: Reduces production costs
  if (Array.isArray(currentState.acquisitions) && currentState.acquisitions.includes('chipMaster')) {
    factoryCost *= 0.9;
  }

  // Faiz orani kredi skorundan gelir — motorla AYNI kaynak.
  // Once burada da sabit %5 vardi ve ekranda gosterilen gider motorun
  // gercekten tahsil ettiginden farkli cikiyordu.
  let annualRate = 0.05;
  try {
    annualRate = require('../../features/finance/stores/useCorporateFinanceStore')
      .useCorporateFinanceStore.getState().getInterestRate();
  } catch { /* varsayilan oran */ }
  const debtInterest = (companyDebtTotal * annualRate) / 12;
  const totalExpenses = salaryCost + factoryCost + debtInterest;

  // 2. Calculate Revenue (from Product Store)
  const productState = useProductStore.getState();
  const activeProducts = productState.products.filter(p => p.status === 'active');
  const totalRevenue = activeProducts.reduce((sum, p) => sum + (p.revenue || 0), 0);

  // 3. DEGERLEME — TEK FORMUL (core/market/equity.ts)
  //
  //  ONCEDEN IKI TANE VARDI:
  //    motor:      sermaye x 1.5
  //    burasi:     aylikCiro x 12 x carpan + sermaye
  //  Motor her ceyrek bunun uzerine yaziyordu, yani buradaki hic
  //  gecerli olmuyordu. Artik ikisi de ayni fonksiyonu cagiriyor.
  //  TTM (son dort ceyrek). Gecmis henuz yoksa mevcut aylik rakamdan
  //  yila tamamlanir — ilk ceyreklerde de makul bir deger cikar.
  const revHist = currentState.revenueHistory ?? [];
  const ebitHist = currentState.ebitHistory ?? [];
  const ttmRevenue = revHist.length ? trailingTotal(revHist) : totalRevenue * 12;
  //  Kazanc gucu: motorun sakladigi yumusatilmis deger. Henuz yoksa
  //  ham TTM'e duser.
  const rawTtmEbit = ebitHist.length
    ? trailingTotal(ebitHist)
    : (totalRevenue - totalExpenses) * 12;
  const ttmEbit = currentState.earningsPower || rawTtmEbit;

  const valuationBreakdown = companyValuation({
    cash: companyCapital,
    ttmRevenue,
    ttmEbit,
    debt: companyDebtTotal,
    isPublic,
    brandValue: currentState.brandValue ?? 0,
  });
  const valuation = valuationBreakdown.total;

  // 4. HISSE FIYATI — bolen TEK yerden: kap tablosundaki hisse sayisi.
  //    Eskiden equityStore 1M'e, burasi 10M'e boluyordu; iki ekranda
  //    on kat farkli fiyat gorunuyordu.
  // TEMBEL ERISIM: useShareholderStore bu dosyayi da import ediyor.
  // Ust seviye import donguye girip TypeScript'in tip cikarimini
  // bozuyordu (`never[]`). require ile dongu calisma zamaninda cozuluyor.
  const capTable = getShareholderState();
  // BOLUNME ARTIK BURADA CARPILMIYOR. `performStockSplit` kap tablosunun
  // KENDISINI 10 katina cikariyor, yani `stockSplitCount` ile bir daha
  // carpmak ayni bolunmeyi IKI KEZ saymak olurdu. Sayac yalnizca gecmis
  // kaydi olarak duruyor.
  const currentTotalShares = capTable.totalShares || BASE_SHARES;
  const price = Math.max(0.01, equitySharePrice(valuation, currentTotalShares));

  // Return partial state update
  // 5. SAHIPLIK — kap tablosundan turetilir, elle tutulmaz.
  //    Ekranda %100 gorunmesinin sebebi tam olarak buydu: uc ayri yerde
  //    tutuluyor, hicbiri digerini guncellemiyordu.
  const derivedOwnership = ownershipPercent(
    capTable.playerShareCount ?? 0,
    capTable.totalShares || BASE_SHARES,
  );

  return {
    companyOwnership: derivedOwnership,
    companyExpensesMonthly: totalExpenses,
    companyRevenueMonthly: totalRevenue,
    companyValue: valuation,
    companySharePrice: price
  };
};

export const useStatsStore = create<StatsStore>()(
  persist(
    (set, get) => ({
      ...initialStatsState,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      update: partial => set(state => ({ ...state, ...partial })),
      setField: (key, value) => set(state => ({ ...state, [key]: value })),

      // Money Transaction Methods
      spendMoney: (amount) => {
        const current = get().money;
        if (current >= amount) {
          set({ money: current - amount });
          console.log(`[StatsStore] Spent $${amount.toLocaleString()}. Remaining: $${(current - amount).toLocaleString()}`);
          return true; // Transaction successful
        }
        console.warn(`[StatsStore] Insufficient funds. Tried to spend $${amount.toLocaleString()}, but only have $${current.toLocaleString()}`);
        return false; // Insufficient funds
      },

      subtractMoney: (amount) => {
        const current = get().money;
        set({ money: current - amount });
        console.log(`[StatsStore] Values subtracted: $${amount.toLocaleString()}`);
      },

      earnMoney: (amount) => {
        const current = get().money;
        set({ money: current + amount });
        console.log(`[StatsStore] Earned $${amount.toLocaleString()}. New balance: $${(current + amount).toLocaleString()}`);
      },

      setMoney: (amount) => {
        set({ money: amount });
        console.log(`[StatsStore] Money set to $${amount.toLocaleString()}`);
      },

      setCompanyValue: value => set(state => ({ ...state, companyValue: value })),
      setCompanySharePrice: value =>
        set(state => ({ ...state, companySharePrice: value })),
      setCompanyDailyChange: value =>
        set(state => ({ ...state, companyDailyChange: value })),
      setCompanyDebt: value => set(state => ({ ...state, companyDebt: value })),
      setCompanyDebtTotal: value =>
        set(state => ({ ...state, companyDebtTotal: value })),
      setCompanyOwnership: value =>
        set(state => ({ ...state, companyOwnership: value })),
      setCompanyRevenueMonthly: value =>
        set(state => ({ ...state, companyRevenueMonthly: value })),
      setCompanyExpensesMonthly: value =>
        set(state => ({ ...state, companyExpensesMonthly: value })),

      // Hook into setCompanyCapital to trigger updates? 
      // Doing it explicitly in actions is safer to avoid loops.
      setCompanyCapital: value => set(state => {
        const nextState = { ...state, companyCapital: value } as StatsStore;
        // Recalculate usually happens on month tick, but cash changes affect valuation immediately
        const financials = recalculateFinancials(nextState);
        return { ...nextState, ...financials };
      }),

      setCasinoReputation: value =>
        set(state => ({ ...state, casinoReputation: value })),
      setResearchPoints: value => set(state => ({ ...state, researchPoints: value })),
      setShareholders: list => set(state => ({ ...state, shareholders: list })),

      setSalaryRatio: ratio => set(state => {
        const nextState = { ...state, salaryRatio: clampSalaryRatio(ratio) } as StatsStore;
        const financials = recalculateFinancials(nextState);
        return { ...nextState, ...financials };
      }),

      setTechLevel: (category, level) =>
        set(state => {
          const nextState = {
            ...state,
            techLevels: { ...state.techLevels, [category]: level },
          } as StatsStore;
          const financials = recalculateFinancials(nextState);
          return { ...nextState, ...financials };
        }),

      addAcquisition: (id, companyData) =>
        set(state => {
          console.warn(
            '[StatsStore] addAcquisition is retired — the engine does not read this. ' +
            'Use useCorporateFinanceStore.executeAcquisition instead.'
          );
          const purchasePrice = companyData.marketCap * 1.15; // Assume 15% premium

          const subsidiaryState: SubsidiaryState = {
            id,
            name: companyData.name,
            marketCap: companyData.marketCap,
            baseProfit: companyData.profit,
            currentProfit: companyData.profit,
            isLossMaking: false,
            initialPurchasePrice: purchasePrice,
          };

          // Ensure acquisitions is an array (handle legacy state)
          const currentAcquisitions = Array.isArray(state.acquisitions) ? state.acquisitions : [];

          return {
            ...state,
            acquisitions: [...currentAcquisitions, id],
            subsidiaryStates: {
              ...state.subsidiaryStates,
              [id]: subsidiaryState,
            },
          };
        }),

      setIsPublic: (value) => set(state => {
        const nextState = { ...state, isPublic: value } as StatsStore;
        const financials = recalculateFinancials(nextState);
        return { ...nextState, ...financials };
      }),

      performIPO: () =>
        set(state => {
          if (state.isPublic) return state; // Already public

          // 1. Valuation increases by 40% (Liquidity Premium)
          const valuationIncrease = state.companyValue * 0.4;
          const newValuation = state.companyValue + valuationIncrease;

          // 2. Add 15% of NEW Valuation to Company Cash
          const cashInjection = newValuation * 0.15;

          const nextState = {
            ...state,
            isPublic: true,
            companyValue: newValuation,
            companyCapital: state.companyCapital + cashInjection,
          } as StatsStore;

          // Perform full recalculation to sync everything
          const financials = recalculateFinancials(nextState);

          return { ...nextState, ...financials };
        }),

      /**
       * HISSE BOLUNMESI (10'a 1).
       *
       * ONCE SADECE YARIM CALISIYORDU: yalnizca `stockSplitCount` artiyordu
       * ve bu sayac SADECE bu dosyadaki `recalculateFinancials` icinde
       * kullaniliyordu. Gercek kap tablosu (useShareholderStore.totalShares
       * ve uyelerin adetleri) hic degismiyordu.
       *
       * Sonuc: ayni sirket icin IKI FARKLI hisse adedi. Stock ekrani birini,
       * temettu/geri alim digerini kullaniyordu — yani bolunme "tam olarak
       * calismiyor" gorunuyordu. Dogru gorulmus.
       *
       * SIMDI: bolunme kap tablosunda gercekten yapilir. Herkesin adedi
       * 10 katina cikar, fiyat 10'a bolunur, kimsenin YUZDESI degismez.
       * Bolunmenin tanimi zaten budur: pastanin dilim sayisi artar, pasta
       * ayni kalir. Degeri degistirmez, hisseyi ulasilabilir kilar.
       */
      performStockSplit: () =>
        set(state => {
          if (state.companySharePrice <= 1000) return state;

          const RATIO = 10;
          const sh = require('../../features/shareholders/stores/useShareholderStore').useShareholderStore;
          const cap = sh.getState();
          sh.setState({
            totalShares: (cap.totalShares || 10_000_000) * RATIO,
            playerShareCount: (cap.playerShareCount || 0) * RATIO,
            members: (cap.members || []).map((m: any) => ({
              ...m,
              shareCount: (m.shareCount || 0) * RATIO,
            })),
          });

          const nextState = {
            ...state,
            stockSplitCount: state.stockSplitCount + 1,
            companySharePrice: state.companySharePrice / RATIO,
          } as StatsStore;

          const financials = recalculateFinancials(nextState);
          return { ...nextState, ...financials };
        }),

      updateShareholderRelationship: (id, delta) =>
        set(state => ({
          ...state,
          shareholders: state.shareholders.map(sh =>
            sh.id === id && sh.type !== 'player'
              ? { ...sh, relationship: Math.max(0, Math.min(100, (sh.relationship || 50) + delta)) }
              : sh
          ),
        })),
      performDilution: (percentage) =>
        set(state => {
          const capitalRaised = state.companyValue * (percentage / 100);
          const newOwnership = state.companyOwnership * (1 - percentage / 100);

          // Share Price drops by 3% (Supply increase)
          const newSharePrice = state.companySharePrice * 0.97;

          return {
            ...state,
            companyCapital: state.companyCapital + capitalRaised,
            companyOwnership: newOwnership,
            companySharePrice: newSharePrice,
            shareholders: state.shareholders.map(s => {
              if (s.type === 'player') return { ...s, percentage: newOwnership };
              return s;
            }),
          };
        }),
      performBuyback: (percentage) =>
        set(state => {
          const cost = state.companyValue * (percentage / 100);
          if (state.companyCapital < cost) return state;

          const multiplier = 1 / (1 - (percentage / 100));
          const preciseNewOwnership = Math.min(100, state.companyOwnership * multiplier);

          // Share Price increases by 4% (Demand increase)
          const newSharePrice = state.companySharePrice * 1.04;

          return {
            ...state,
            companyCapital: state.companyCapital - cost,
            companyOwnership: preciseNewOwnership,
            companySharePrice: newSharePrice,
            shareholders: state.shareholders.map(s => {
              if (s.type === 'player') return { ...s, percentage: preciseNewOwnership };
              return s;
            }),
          };
        }),
      payDividend: (percentage) =>
        set(state => {
          const dividendPool = state.companyCapital * (percentage / 100);
          const playerOwnership = state.companyOwnership / 100;
          const playerDividend = dividendPool * playerOwnership;

          // Share Price increases by 2% (Happy investors)
          const newSharePrice = state.companySharePrice * 1.02;

          return {
            ...state,
            companyCapital: state.companyCapital - dividendPool,
            money: state.money + playerDividend,
            companySharePrice: newSharePrice,
          };
        }),

      processCompanyMonthlyTick: () =>
        set(state => {
          // 1. Process Product Sales (Updates Product Store Revenue)
          // We pass current store state as context for the sales logic
          useProductStore.getState().processMonthlySales({
            morale: state.employeeMorale,
            techLevels: state.techLevels,
            acquisitions: state.acquisitions
          });

          // 2. Simulate Subsidiary Performance (RNG Logic)
          const updatedSubsidiaries: Record<string, SubsidiaryState> = {};
          let subsidiaryNetProfit = 0;

          Object.values(state.subsidiaryStates).forEach(sub => {
            const roll = Math.random() * 100;
            let newSub = { ...sub };

            if (!sub.isLossMaking) {
              // Healthy Company: 7% chance to fail
              if (roll < 7) {
                newSub.isLossMaking = true;
                newSub.currentProfit = -sub.marketCap * 0.02; // 2% of market cap as loss
              }
            } else {
              // Failing Company: 25% chance to recover
              if (roll < 25) {
                newSub.isLossMaking = false;
                newSub.currentProfit = sub.baseProfit; // Restore to original profit
              }
            }

            updatedSubsidiaries[sub.id] = newSub;
            subsidiaryNetProfit += newSub.currentProfit;
          });

          // 3. Recalculate Financials (Reads updated Revenue from Product Store + Subsidiary Profit)
          const financials = recalculateFinancials(state as StatsStore);

          // Add subsidiary profit to revenue (or subtract if loss)
          const adjustedRevenue = financials.companyRevenueMonthly + Math.max(0, subsidiaryNetProfit);
          const adjustedExpenses = financials.companyExpensesMonthly + Math.max(0, -subsidiaryNetProfit);

          const updatedFinancials = {
            ...financials,
            companyRevenueMonthly: adjustedRevenue,
            companyExpensesMonthly: adjustedExpenses,
          };

          // 4. Feedback Loop
          const profit = updatedFinancials.companyRevenueMonthly - updatedFinancials.companyExpensesMonthly;
          let moraleDelta = 0;

          if (profit > 0) moraleDelta += 1;
          else moraleDelta -= 2;

          // NOT: bu fonksiyon (processCompanyMonthlyTick) HIC CAGRILMIYOR.
          // Moralin tek kaynagi motorun ceyrek dongusudur; oradaki hesap
          // core/market/workforce.ts -> updateMorale icindedir.
          if (state.salaryRatio < 0.95) moraleDelta -= 2;
          if (state.salaryRatio > 1.10) moraleDelta += 2;

          const nextMorale = Math.max(0, Math.min(100, state.employeeMorale + moraleDelta));

          let updates: Partial<StatsState> = {
            ...updatedFinancials,
            employeeMorale: nextMorale,
            subsidiaryStates: updatedSubsidiaries,
          };

          // 5. Stock price volatility if public
          if (state.isPublic) {
            const profitMargin = updatedFinancials.companyRevenueMonthly > 0
              ? profit / updatedFinancials.companyRevenueMonthly
              : -0.1;

            // Base change on performance (-10% to +10%)
            let priceChangePercent = profitMargin * 10;

            // Add random news factor (-5% to +5%)
            const newsFactor = (Math.random() - 0.5) * 10;
            priceChangePercent += newsFactor;

            // Apply change to Share Price & Value
            const newPrice = updatedFinancials.companySharePrice * (1 + priceChangePercent / 100);
            const newValue = updatedFinancials.companyValue * (1 + priceChangePercent / 100);

            updates = {
              ...updates,
              companySharePrice: newPrice,
              companyValue: newValue,
              companyDailyChange: priceChangePercent,
            };
          }

          return { ...state, ...updates };
        }),

      borrowCapital: (amount, interestRate) =>
        set(state => {
          console.warn(
            '[StatsStore] borrowCapital is retired — no amortisation, no covenant. ' +
            'Use useCorporateFinanceStore.takeLoan instead.'
          );
          // Interest is handled in recalculateFinancials based on TotalDebt
          // But here we need to update Capital and Debt first
          const nextState = {
            ...state,
            companyCapital: state.companyCapital + amount,
            companyDebtTotal: state.companyDebtTotal + amount,
            companyDebt: state.companyDebt + amount,
          } as StatsStore;

          const financials = recalculateFinancials(nextState);
          return { ...nextState, ...financials };
        }),

      repayCapital: (amount) =>
        set(state => {
          if (state.companyDebtTotal <= 0) return state;

          const nextState = {
            ...state,
            companyCapital: state.companyCapital - amount,
            companyDebtTotal: state.companyDebtTotal - amount,
            companyDebt: state.companyDebt - amount,
          } as StatsStore;

          const financials = recalculateFinancials(nextState);
          return { ...nextState, ...financials };
        }),

      // ------------------------------------------------------------------
      //  TESIS
      // ------------------------------------------------------------------
      startFacilityUpgrade: () => {
        const state = get();
        if (state.facilityBuild) {
          return { success: false, message: 'A build is already in progress.' };
        }
        const next = getNextTier(state.facilityTier);
        if (!next) {
          return { success: false, message: 'You are already at the top tier.' };
        }
        if (state.companyCapital < next.upgradeCost) {
          return { success: false, message: 'Not enough company capital.' };
        }

        // RP SARTI: para tek basina yetmez. Uretim kabiliyeti Ar-Ge'ye
        // bagli — laboratuvara yatirim yapmadan fabrika buyutulemez.
        const lab = useLaboratoryStore.getState();
        if (next.upgradeRP > 0 && lab.totalRP < next.upgradeRP) {
          return {
            success: false,
            message: `Needs ${next.upgradeRP.toLocaleString()} Research Points. You have ${Math.floor(lab.totalRP).toLocaleString()}.`,
          };
        }
        if (next.upgradeRP > 0) lab.spendRP(next.upgradeRP);

        set(current => {
          const nextState = {
            ...current,
            companyCapital: current.companyCapital - next.upgradeCost,
            facilityBuild: {
              targetTier: next.level,
              quartersRemaining: next.buildQuarters,
              paidCost: next.upgradeCost,
            },
          } as StatsStore;
          return { ...nextState, ...recalculateFinancials(nextState) };
        });

        return {
          success: true,
          message: `${next.name} started. Ready in ${next.buildQuarters} quarter(s).`,
        };
      },

      cancelFacilityUpgrade: () =>
        set(state => {
          if (!state.facilityBuild) return state;
          // Iptalin bedeli agir: odedigin paranin cogu geri gelmez.
          // Taahhut gercek olsun diye boyle.
          const refund = Math.floor(state.facilityBuild.paidCost * BUILD_CANCEL_REFUND);
          const nextState = {
            ...state,
            companyCapital: state.companyCapital + refund,
            facilityBuild: null,
          } as StatsStore;
          return { ...nextState, ...recalculateFinancials(nextState) };
        }),

      setTargetHeadcount: (value: number) =>
        set(state => ({ ...state, targetHeadcount: Math.max(0, Math.floor(value || 0)) })),

      reset: () => set(() => ({ ...initialStatsState })),
    }),
    {
      name: 'succesor_stats_v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        money: state.money,
        netWorth: state.netWorth,
        monthlyIncome: state.monthlyIncome,
        monthlyExpenses: state.monthlyExpenses,
        companyValue: state.companyValue,
        previousSharePrice: state.previousSharePrice,
        companyDebt: state.companyDebt,
        companyDebtTotal: state.companyDebtTotal,
        companyOwnership: state.companyOwnership,
        companySharePrice: state.companySharePrice,
        companyRevenueMonthly: state.companyRevenueMonthly,
        companyExpensesMonthly: state.companyExpensesMonthly,
        companyCapital: state.companyCapital,
        shareholders: state.shareholders,
        casinoReputation: state.casinoReputation,
        brandValue: state.brandValue,
        brandByCategory: state.brandByCategory,
        factoryCount: state.factoryCount,
        facilityTier: state.facilityTier,
        facilityBuild: state.facilityBuild,
        revenueHistory: state.revenueHistory,
        ebitHistory: state.ebitHistory,
        earningsPower: state.earningsPower,
        lossCarryforward: state.lossCarryforward,
        creditRatingPrev: state.creditRatingPrev,
        lossStreak: state.lossStreak,
        totalSharesPrev: state.totalSharesPrev,
        targetHeadcount: state.targetHeadcount,
        incomingHires: state.incomingHires,
        avgTenureQuarters: state.avgTenureQuarters,
        employeeCount: state.employeeCount,
        employeeMorale: state.employeeMorale,
        salaryRatio: state.salaryRatio,
        productionCapacity: state.productionCapacity,
        productionLevel: state.productionLevel,
        techLevels: state.techLevels,
        acquisitions: state.acquisitions,
        isPublic: state.isPublic,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // --------------------------------------------------------------
          //  BRAND SCALE MIGRATION — 0-100 index -> points
          // --------------------------------------------------------------
          //  brandValue used to be a 0-100 index. It now holds points
          //  (market share x 43.3), where 433 points = 10% share. Without
          //  this conversion an existing save keeps its old number and the
          //  game reads it as points, so a brand of 15 collapses to the
          //  equivalent of 3.5 on the old scale - the player opens the game
          //  and their reputation has silently fallen by 4.33x.
          //
          //  Detected by the absence of brandByCategory, which only exists
          //  in the points era. The per-category map is seeded from the
          //  converted figure so the category screens are not blank until
          //  the first quarter closes.
          // --------------------------------------------------------------
          // A category already past the milestone in an existing save keeps it:
          // seed the floor on load rather than waiting for the next quarter to
          // notice, so nothing can slip under it in between.
          if (state.brandByCategory && !state.brandFloorByCategory) {
            const floors: Record<string, number> = {};
            Object.entries(state.brandByCategory).forEach(([cat, v]) => {
              if ((v as number) >= 200) floors[cat] = 200;
            });
            state.brandFloorByCategory = floors;
          }

          if (!state.brandByCategory || Object.keys(state.brandByCategory).length === 0) {
            const asPoints = Math.round((state.brandValue ?? 8) * BRAND_INDEX_SCALE);
            state.brandValue = asPoints;
            state.brandByCategory = { Consumer: asPoints };
          }
          // TASIMA: tesis kademesi eklenmeden onceki kayitlarda bu alanlar
          // yok. `undefined` kalirsa kapasite hesabi NaN uretir ve uretim
          // sessizce sifirlanir — bu yuzden burada dolduruluyor.
          if (typeof state.facilityTier !== 'number' || state.facilityTier < 1) {
            state.facilityTier = 1;
          }
          if (state.facilityBuild === undefined) state.facilityBuild = null;
          if (!Array.isArray(state.revenueHistory)) state.revenueHistory = [];
          if (!Array.isArray(state.ebitHistory)) state.ebitHistory = [];
          if (typeof state.earningsPower !== 'number') state.earningsPower = 0;
          if (typeof state.lossCarryforward !== 'number') state.lossCarryforward = 0;
          if (typeof state.targetHeadcount !== 'number') {
            state.targetHeadcount = state.employeeCount || 0;
          }
          if (typeof state.incomingHires !== 'number') state.incomingHires = 0;
          if (typeof state.avgTenureQuarters !== 'number') state.avgTenureQuarters = 0;
          // Eski kayitlarda salaryTier vardi; oranin karsiligina cevir.
          if (typeof state.salaryRatio !== 'number') {
            const legacy = (state as any).salaryTier;
            state.salaryRatio = legacy === 'low' ? 0.85 : legacy === 'above_average' ? 1.2 : 1.0;
          }

          state.setHasHydrated(true);
        }
      },
    },
  ),
);
