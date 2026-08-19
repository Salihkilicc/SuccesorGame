import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { simulateNewMonth } from '../../event/eventEngine';
import { calculateQuarterlyFinances } from '../../features/assets/logic/EconomyEngine';
import { applyPartnerBuffs } from '../../logic/relationshipLogic';
import { FEATURES, isEnabled } from '../featureFlags';
import type { ProductQuarterLine, QuarterReport } from '../reportTypes';
import { getMarket, marketCategoryForStock } from '../market/productMarkets';
import { computeAttraction, computeShares, demandUnits, marketingBenchmark, updateBrand } from '../market/attraction';
import {
  advanceBrand, brandFromAcquisition, brandStabilityFactor,
  // applyCorporateShock was imported here and never called - see the note in
  // core/story/gameSink.ts, which is now its caller. The unused import is why
  // the audit called it reachable for weeks.
  advanceCategoryBrand, corporateBrandFrom, brandIndex, earnedFloor,
} from '../market/brand';
import { advanceCompetitors } from '../market/competitors';
import {
  BONUS_PERIOD_QUARTERS, EMPTY_ACCRUAL, accrueCeoBonus, type BonusAccrual,
} from '../market/compensation';
import { updateReachIndex } from '../market/attraction';
import {
  availableStandardUnits,
  effectiveCapacity,
  getTier,
  staffingRatio,
  unitsToStandard,
} from '../market/capacity';
import {
  OVERTIME_MAX_RATIO,
  RAMP_UP_RATIO,
  attritionRate,
  blendTenure,
  efficiencyMultiplier,
  experienceBonus,
  hiringCap,
  hiringFee,
  layoffMoraleCost,
  overtimeWageCost,
  MAX_EVENTS_PER_QUARTER,
  TEAM_EVENTS,
  eventCost,
  eventMoraleGain,
  payCutShock,
  quarterlyWage,
  researcherWage,
  scrapMultiplier,
  severancePay,
  updateMorale,
} from '../market/workforce';
import { resolveTargetUnits } from '../market/production';
import { useCorporateFinanceStore } from '../../features/finance/stores/useCorporateFinanceStore';
import { calculateStatDecay } from '../../logic/statsLogic';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEventStore } from './useEventStore';
import { useLaboratoryStore } from './useLaboratoryStore';
import { useMarketStore } from './useMarketStore';
import { usePlayerStore } from './usePlayerStore';
import { useProductStore } from './useProductStore';
import { useRelationshipStore } from './useRelationshipStore';
import { useStatsStore } from './useStatsStore';
import { blendedQuality, getPartner, quoteContractOrder } from '../market/contract';
import {
  FINANCING_SIGNALS,
  applyTax,
  checkCapacityBreach,
  leverageVolatilityMultiplier,
} from '../market/credit';
import {
  TOTAL_SHARES_DEFAULT,
  applySentiment,
  companyValuation,
  decaySentiment,
  ownershipPercent,
  priceChangePercent,
  sharePrice as equitySharePrice,
  smoothPrice,
  trailingTotal,
  updateEarningsPower,
  volatilityDamping,
} from '../market/equity';
import { useEquityStore } from '../../features/finance/stores/useEquityStore';
import { enforceSharkDeadlines, absoluteMonth } from '../../features/shareholders/hooks/useDebtEnforcer';
import { useUserStore } from './useUserStore';
import * as AchievementChecker from '../../achievements/checker';
import { zustandStorage } from '../../storage/persist';

const LOW_MORALE_REASONS = [
  "Factory strikes halted production for 3 days.",
  "Quality control sabotage detected in Batch #404.",
  "Employees staged a 'slow-down' protest.",
  "High absenteeism caused shipping delays.",
  "Key engineers resigned, causing workflow chaos.",
  "Leaked internal memos damaged brand reputation.",
  "Unmotivated support staff ignored customer orders.",
  "Warehouse theft resulted in missing inventory.",
  "Production errors increased due to lack of focus.",
  "Disgruntled staff disrupted the supply chain.",
  "Critical machinery was left unmaintained.",
  "Union representatives blocked delivery trucks.",
  "Data entry errors caused massive order cancellations.",
  "Safety protocols were ignored, causing a shutdown.",
  "Staff walkout during peak hours slashed output."
];

// UI Tarafının beklediği sonuç tipi
export type EconomyResult = {
  /**
   * Ceyregin sonucu.
   *   bankrupt -> sermaye negatife dustu
   *   removed  -> kurul seni CEO'luktan aldi (bkz. governance.ts)
   * Ikisi de simdilik oyunu bitirir. Gorevden alinmanin ayri bir devam
   * yolu (hissedar olarak kalma, geri donus mucadelesi) sonra yazilacak.
   */
  status: 'active' | 'bankrupt' | 'removed';
  reason?: string;
  data: {
    reportTotalProduction: number;
    reportTotalSales: number;
    reportTotalRevenue: number;
    reportTotalExpenses: number;
    reportNetProfit: number;
    reportTotalInventory: number; // NEW: Track total stock
    reportCurrentRP: number;
    operationalSetback: boolean;
    setbackMessage: string;
    lostRevenue: number;
    lostUnits: number;
    playerCash: number;
    companyCapital: number;
    playerNetWorth: number;
    playerIncome: number;
    playerExpenses: number;
    companyValuation: number;
    productBreakdown: {
      id: string;
      name: string;
      produced: number;
      sold: number;
      revenue: number;
      expense: number;
      profit: number;
      stock: number;
    }[];
  };
};

export type GameState = {
  _hasHydrated: boolean;
  currentMonth: number;
  age: number;
  actionsUsedThisMonth: number;
  maxActionsPerMonth: number;
  // Employee Management
  employeeMorale: number; // 0-100
  /**
   * ESKI ALAN — maas artik useStatsStore.salaryRatio uzerinden yonetilir.
   * Sadece eski kayitlarin patlamamasi icin duruyor.
   */
  salaryPolicy: 'low' | 'avg' | 'high';
  /** Fazla mesai acik mi — kapasitenin %115'ine cikar, maas 1.5x, moral -3 */
  overtimeEnabled: boolean;
  /** Ceyrek basinda fiilen odenmis olan baz maas orani */
  quarterStartSalaryRatio: number;
  /** Bir sonraki ceyrek uygulanacak maas kesintisi soku */
  pendingPayCutShock: number;
  eventsHostedThisQuarter: number;
  lastQuarterProfit: number;
  bonusDistributedThisQuarter: boolean;
  /**
   * CEO'S ANNUAL BONUS, MID-FLIGHT.
   *
   * After-tax profit piles up here quarter by quarter; on the fourth
   * quarter 2% of it moves from company capital to personal cash and the
   * counter goes back to zero. Bkz. core/market/compensation.ts
   */
  ceoBonusAccrual: BonusAccrual;
  /** The last payout, kept so the finance screen can show what landed. */
  lastCeoBonus: { amount: number; base: number; periodLabel: string } | null;
  /**
   * Son tamamlanan ceyregin tam finansal fotografi.
   * TUM rapor ekranlari bunu okur — kendi tahminlerini uretmezler.
   */
  lastQuarterReport: QuarterReport | null;
};

type GameStore = GameState & {
  setHasHydrated: (state: boolean) => void;
  setField: <K extends keyof GameState>(key: K, value: GameState[K]) => void;
  resetMonthlyState: () => void;
  advanceMonth: (months?: number) => Promise<EconomyResult>;
  resetGame: () => Promise<void>;
  // Employee Actions
  distributeBonus: () => void;
  organizeEvent: (eventId: string) => { success: boolean; message: string };
  setOvertime: (enabled: boolean) => void;
  setSalaryRatio: (ratio: number) => void;
  setSalaryPolicy: (policy: 'low' | 'avg' | 'high') => void;
};

export const initialGameState: GameState = {
  _hasHydrated: false,
  currentMonth: 1,
  age: 20, // Start Age: 20
  actionsUsedThisMonth: 0,
  maxActionsPerMonth: 999,
  // useStatsStore.initialStatsState.employeeMorale ile AYNI olmali.
  // Iki store ayri ayri moral tutuyor; farkli olurlarsa hangisinin
  // okundugu koda gore degisiyor ve tutarsiz davranis ciktisi veriyor.
  employeeMorale: 75,
  salaryPolicy: 'avg',
  overtimeEnabled: false,
  quarterStartSalaryRatio: 1.0,
  pendingPayCutShock: 0,
  eventsHostedThisQuarter: 0,
  lastQuarterProfit: 0,
  bonusDistributedThisQuarter: false,
  ceoBonusAccrual: { ...EMPTY_ACCRUAL },
  lastCeoBonus: null,
  lastQuarterReport: null,
};

// ============================================================================
//  SHELVED — ACQUISITION BUFFS ARE NO LONGER READ BY THE ENGINE
// ============================================================================
//
//  An acquisition is a financial investment. It buys revenue, profit and
//  company value, and nothing else. What it does NOT buy is a permanent
//  multiplier on your own operations.
//
//  WHAT THIS USED TO DO. `subsidiaryBuffs()` summed a hidden `acquisitionBuff`
//  off every owned company and the quarterly tick read it in three places:
//  research output, unit cost, and marketing reach. Buying a components maker
//  made YOUR factory cheaper. Buying a media firm made YOUR adverts carry
//  further. Neither had any balance-sheet existence - no cost, no accounting,
//  no way to lose it. They were magic items with an M&A skin.
//
//  WHY THAT WAS WORSE THAN IT SOUNDS. It gave two systems a claim on the same
//  decision and they disagreed about what a good deal was. The financial model
//  in core/market/mergers.ts prices a target on its earnings: pay too much and
//  the goodwill impairs. The buff priced nothing at all, so the strongest play
//  was to buy the cheapest company carrying the biggest percentage - and the
//  entire earnings model, the premium, the payback period, the impairment
//  test, all of it was noise you could ignore. One of the two systems had to
//  go, and it was never going to be the one with the arithmetic.
//
//  A SECOND LIST. The buffs were read off `useUserStore.subsidiaries` while
//  the money was read off `useCorporateFinanceStore.subsidiaries` - two lists
//  for the same acquisitions, written at different points, neither aware of
//  the other. Selling a company removed it from one of them. Whether the buff
//  survived the sale depended on which list you asked.
//
//  KEPT, NOT DELETED. The `acquisitionBuff` field still exists on the market
//  data and the shape is preserved here, because prompt 24 wants sector fit to
//  matter again - as a factor in the PRICE and the earnings, which is where a
//  real synergy shows up, rather than as a stat bonus. When that arrives it
//  should read this comment first.
//
//  Shelved rather than removed so the three call sites below stay readable:
//  each one says what it no longer does.
// ============================================================================
//
// const subsidiaryBuffs = (): {
//   rndSpeed: number; productionCost: number; marketingBoost: number; loanInterest: number;
// } => {
//   const acc = { rndSpeed: 0, productionCost: 0, marketingBoost: 0, loanInterest: 0 };
//   try {
//     const subs = require('../store/useUserStore').useUserStore.getState().subsidiaries || [];
//     subs.forEach((sub: any) => {
//       const b = sub?.acquisitionBuff;
//       if (!b) return;
//       if (b.type === 'R_AND_D_SPEED') acc.rndSpeed += b.value;
//       else if (b.type === 'PRODUCTION_COST') acc.productionCost += b.value;
//       else if (b.type === 'MARKETING_BOOST') acc.marketingBoost += b.value;
//       else if (b.type === 'LOAN_INTEREST') acc.loanInterest += b.value;
//     });
//   } catch { /* buff okunamadi */ }
//   return acc;
// };
//
//  FOURTH BUFF, NEVER READ AT ALL: `loanInterest` was accumulated above and
//  then read by nobody. Every LOAN_INTEREST target in marketData.ts - and
//  there are eleven - advertised a rate cut the engine never applied. It is
//  worth knowing that a buff can sit in a shipped game doing nothing while
//  the screen promises it, because that is what the other three were doing
//  until recently too.

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialGameState,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setField: (key, value) => set(state => ({ ...state, [key]: value })),
      resetMonthlyState: () => {
        const { resetCycleFlags } = useEventStore.getState();
        resetCycleFlags();
        set(state => ({ ...state, actionsUsedThisMonth: 0 }));

      },
      advanceMonth: async (monthsInput?: number) => {
        // Input güvenliği (Varsayılan 3 ay)
        const months = typeof monthsInput === 'number' ? monthsInput : 3;

        // 1. Mevcut İstatistikleri ve Ürünleri Çek
        const stats = useStatsStore.getState();
        const { products } = useProductStore.getState();
        const { researcherCount } = useLaboratoryStore.getState();

        // CRITICAL FIX: Default salary if not set
        const baseSalary = stats.monthlyIncome || 5000;
        const baseExpenses = stats.monthlyExpenses || 2000;

        // 2. DYNAMIC PRODUCT FINANCIALS (Per Quarter)
        // Calculate quarters passed (assuming 3 months = 1 quarter)
        const quarters = Math.floor(months / 3);

        // ------------------------------------------------------------------
        //  ONE WRITE PER STORE, NOT ONE PER PRODUCT
        // ------------------------------------------------------------------
        //  Product changes are collected here and flushed once at the end of
        //  the tick. Each set() on a persisted store stringifies the whole
        //  list, writes it to AsyncStorage and re-renders every subscriber -
        //  doing that inside a per-product loop is what made advancing a
        //  quarter take seconds once the portfolio grew.
        // ------------------------------------------------------------------
        const pendingProductUpdates: Record<string, any> = {};
        const queueProductUpdate = (id: string, patch: any) => {
          pendingProductUpdates[id] = { ...(pendingProductUpdates[id] || {}), ...patch };
        };


        // Initialize totals
        let totalRevenue = 0;
        let totalCOGS = 0;
        let totalProduction = 0;
        let totalSales = 0;
        let totalMarketingCost = 0;
        /** Urunlerin kiyas butcelerinin toplami — marka bakim esigi buradan cikar */
        let totalMarketingBenchmark = 0;
        let totalStorageCost = 0;
        let totalBeginningStock = 0;
        let totalEndingStock = 0;
        let totalLostUnits = 0;
        let totalLostRevenue = 0;
        let operationalSetback = false;
        let setbackMessage = '';

        // MORALE CHECK
        // Get morale directly, if < 50 calc penalty
        const currentMorale = get().employeeMorale;
        let penaltyRatio = 0;
        if (currentMorale < 50) {
          penaltyRatio = ((50 - currentMorale) / 50) * 0.35;
          operationalSetback = true;
          // Select random reason
          setbackMessage = LOW_MORALE_REASONS[Math.floor(Math.random() * LOW_MORALE_REASONS.length)];
        }

        // ==================================================================
        //  PAZAR PAYI ON HESABI
        // ==================================================================
        //  ONEMLI DEGISIKLIK: Talep artik URETIMDEN TURETILMIYOR.
        //
        //  Eskiden:  satis = eldeki mal x talepOrani x pazarlamaOrani
        //            -> ne kadar cok uretirsen o kadar cok satardin,
        //               yani fazla uretmenin cezasi yoktu.
        //
        //  Simdi:    pazar buyuklugu SABIT, sen ondan pay aliyorsun.
        //            satis = min(eldeki mal, pazarin senden istedigi)
        //            -> az uretirsen talep karsilanmaz (stok tukenir),
        //               cok uretirsen stokta kalir.
        //
        //  Pay hesabi core/market/attraction.ts icinde; bes faktor:
        //  fiyat, pazarlama, kalite, marka, urun cazibesi.
        // ==================================================================
        // ==================================================================
        //  TESIS VE KADRO — ceyregin BASINDA cozulur
        // ==================================================================
        //  Sira onemli: once gelen isciler katilir ve dogal kayip islenir,
        //  sonra o kadroyla uretim yapilir, en sonda yeni ise alim siraya
        //  girer. Boylece "bu ceyrek karar ver, gelecek ceyrek gelsinler"
        //  kurali kendiliginden isler.
        // ==================================================================
        const brandValueRaw = stats.brandValue ?? 0;
        // Marketing reach used to be multiplied by a subsidiary buff here.
        // Owning a media company does not make your adverts louder; buying
        // more advertising does. See the shelved block at the top of the file.
        const isBuilding = !!stats.facilityBuild;
        const tier = getTier(stats.facilityTier);
        const salaryRatio = stats.salaryRatio ?? 1;
        const overtimeOn = get().overtimeEnabled;

        // 1) Gecen ceyrek ise alinanlar bugun katiliyor.
        const arrivedHires = Math.max(0, stats.incomingHires || 0);
        let headcount = Math.max(0, (stats.employeeCount || 0) + arrivedHires);

        // 2) Dogal kayip. Dusuk moral ve dusuk maas hizlandirir.
        const attrition = Math.floor(
          headcount * attritionRate(currentMorale, salaryRatio) * Math.max(1, quarters),
        );
        headcount = Math.max(0, headcount - attrition);

        // 3) Hedef kadroya gore ise alim / cikarma.
        //    Ise alim bir ceyrek sonra gelir; cikarma ANINDA olur ama
        //    bedeli (tazminat + moral) hemen odenir.
        const targetHeadcount = Math.max(0, stats.targetHeadcount ?? headcount);
        let hiringCost = 0;
        let severanceCost = 0;
        let layoffMoraleHit = 0;
        let queuedHires = 0;
        let hiresBlocked = 0;
        let laidOff = 0;

        if (targetHeadcount > headcount) {
          // ISE ALIM TAVANI: ceyrekte kadronun ~%25'i. Marka yukseltir,
          // dusuk moral dusurur. Sinirsizken 22 kisiden 3.842'ye tek
          // ceyrekte ciklabiliyordu.
          const cap = hiringCap(headcount, brandValueRaw, currentMorale) * Math.max(1, quarters);

          // ONEMLI: gelecek ceyrek de insan kaybedecegiz. Ise alim bir
          // ceyrek gecikmeli oldugu icin sadece bugunku acigi kapatirsak
          // hedefe HIC ulasamayiz — 48 hedefte sonsuza kadar 47'de kaliriz.
          // Gercek IK planlamasi da devir hizini onceden hesaba katar.
          const expectedChurn = Math.ceil(
            targetHeadcount * attritionRate(currentMorale, salaryRatio),
          );
          const wanted = targetHeadcount - headcount + expectedChurn;
          queuedHires = Math.min(wanted, cap);
          hiresBlocked = Math.max(0, wanted - queuedHires);
          hiringCost = queuedHires * hiringFee(tier.level, salaryRatio);
        } else if (targetHeadcount < headcount) {
          laidOff = headcount - targetHeadcount;
          severanceCost = laidOff * severancePay(tier.level, salaryRatio);
          layoffMoraleHit = layoffMoraleCost(
            laidOff,
            headcount,
            (get().lastQuarterProfit || 0) > 0,
          );
          headcount = targetHeadcount;
        }

        // 4) Rampa: bu ceyrek katilanlar yari verimle calisir.
        //    Uretim hesabinda kullanilan "etkin kadro" bu.
        const effectiveHeadcount = Math.max(
          0,
          headcount - arrivedHires * (1 - RAMP_UP_RATIO),
        );

        // Kapasite bu kadroyla belirlenir. Insaat varsa retooling yuzunden
        // tesis %65 kapasiteyle calisir — yukseltmenin gercek bedeli budur.
        // ------------------------------------------------------------------
        //  KAPASITE = tesis x personel x moral x deneyim x fazla mesai
        // ------------------------------------------------------------------
        //  Moral artik esik degil CARPAN: 0 -> 0.78, 100 -> 1.08. Yani
        //  yuksek moral kapasitenin USTUNE cikarir, dusuk moral altina.
        //  Eskiden 51 ile 100 arasinda hicbir fark yoktu.
        // ------------------------------------------------------------------
        const avgTenure = stats.avgTenureQuarters ?? 0;
        const moraleEfficiency = efficiencyMultiplier(currentMorale);
        const tenureBonus = 1 + experienceBonus(avgTenure);
        const overtimeFactor = overtimeOn ? OVERTIME_MAX_RATIO : 1;

        const standardCapacity =
          availableStandardUnits(effectiveHeadcount, tier.level, isBuilding) *
          moraleEfficiency *
          tenureBonus *
          overtimeFactor *
          Math.max(1, quarters);

        // ------------------------------------------------------------------
        //  POINTS vs INDEX
        // ------------------------------------------------------------------
        //  stats.brandValue now holds BRAND POINTS (share x 43.3, so 433 at
        //  10% share). Everything written before that change - attraction,
        //  valuation multiples, hiring pull, contract partners - reads a
        //  0-100 brand. `brandValue` stays the 0-100 index so those callers
        //  keep working; the raw points travel as brandValueRaw.
        // ------------------------------------------------------------------
        const brandValue = brandIndex(brandValueRaw);
        const brandValueIndexPrev = brandValue;
        const acquiredStockIds = useCorporateFinanceStore.getState().subsidiaries.map(s => s.id);

        const activeProducts = products.filter((p: any) => p.status === 'active');

        /** urun id -> { talep adedi, pay yuzdesi, cekicilik kirilimi } */
        const marketDemandByProduct: Record<
          string,
          {
            demand: number;
            share: number;
            breakdown: ReturnType<typeof computeAttraction> | null;
            /** Bu urunun bu ceyrekki kiyas butcesi — marka bakim esigi buradan cikar */
            benchmark: number;
          }
        > = {};

        // Kategoriye gore grupla — ayni kategorideki urunler ayni pastadan yer.
        const byCategory = new Map<string, any[]>();
        activeProducts.forEach((p: any) => {
          const key = p.category || 'Consumer';
          if (!byCategory.has(key)) byCategory.set(key, []);
          byCategory.get(key)!.push(p);
        });

        // ------------------------------------------------------------------
        //  ONE BRAND, NOT ONE PER CATEGORY
        // ------------------------------------------------------------------
        //  Per-category brand was built in the engine and NEVER SURFACED in
        //  the UI - MyCompanyScreen and the market panel both only ever showed
        //  the corporate roll-up. So the player saw a single brand number,
        //  half a feature, and no way to tell the categories apart.
        //
        //  Decision: go back to one brand. Simpler to read, and the loop that
        //  matters is preserved - realised market share feeds the brand
        //  (brandFromMarketShare), so a bigger share still earns more brand.
        // ------------------------------------------------------------------

        byCategory.forEach((group, category) => {
          const market = getMarket(category);

          if (!market) {
            // Tanimsiz kategori: pazar yoksa talep de yok. Sessizce sifirlamak
            // yerine uyar — veri ile kod ayrisirsa fark edilsin.
            console.warn(`[Market] '${category}' icin pazar tanimi yok, talep 0 kabul edildi.`);
            group.forEach(p => {
              marketDemandByProduct[p.id] = { demand: 0, share: 0, breakdown: null, benchmark: 0 };
            });
            return;
          }

          // KIYAS BUTCE: kategorinin tabani ile urunun GECEN CEYREK cirosunun
          // %25'inin buyugu. Buyudukce ayni butce daha az ses getirir.
          // Kiyas ANINDA degil KADEMELI hareket eder — lansmandan sonraki
          // ceyrekte uc kat ziplamasin diye. Deger urunde saklanir ki
          // ekran da ayni sayiyi gostersin.
          const benchmarks = group.map(p =>
            marketingBenchmark(market, p.revenue || 0, p.benchmarkSmoothed),
          );
          group.forEach((p, i) => {
            queueProductUpdate(p.id, { benchmarkSmoothed: benchmarks[i] });
          });

          const breakdowns = group.map((p, i) =>
            computeAttraction(
              {
                sellingPrice: p.sellingPrice || p.suggestedPrice,
                suggestedPrice: p.suggestedPrice,
                // Pazarlama artik CEYREKLIK BUTCE (birim basina degil).
                // The budget is now the whole of it: what you spend is what
                // the market hears.
                marketingBudget: p.marketingBudget || 0,
                benchmark: benchmarks[i],
                // KALITE TAVANI: Ar-Ge'de seviye 9'u kesfetmis olabilirsin
                // ama atolyede uretemezsin. Tesis kademesi tavani koyar.
                // KALITE TAVANI iki yerden gelir: kendi tesisin ve —
                // fason kullaniyorsan — fasoncunun hatti. Hepsi ayni
                // kutuda ayni markayla satildigi icin musterinin gordugu
                // kalite HACIM AGIRLIKLI ORTALAMADIR. Ucuz fasoncuya cok
                // is verirsen urunun algilanan kalitesi duser.
                qualityLevel: (() => {
                  const own = Math.min(p.qualityLevel || 1, tier.qualityCeiling);
                  const cp = getPartner(p.contractPartnerId);
                  if (!cp) return own;
                  return blendedQuality(
                    resolveTargetUnits(p, effectiveHeadcount, tier.level, isBuilding),
                    own,
                    p.contractUnits || 0,
                    cp.qualityCeiling,
                  );
                })(),
                // KENDI kategorisinin markasi. Saglikta kazandigin itibar
                // teknolojide isine yaramaz.
                brandValue,
                marketDemand: p.marketDemand ?? 50,
              },
              market,
            ),
          );

          // ERISIM ENDEKSI: gecen ceyreklerde talebi karsilayamadiysan
          // cekiciligin kirpilir. Pay artik teslimattan dogar.
          // Bkz. core/market/attraction.ts -> updateReachIndex
          const { shares } = computeShares(
            breakdowns.map((b, i) => b.total * (group[i].reachIndex ?? 1)),
            market,
            acquiredStockIds,
            // The incumbent you told to go away, if you told one. 1 otherwise.
            require('./useTerritoryStore').useTerritoryStore.getState().pressureIn(category),
          );

          // ==============================================================
          //  RAKIPLERI BIR CEYREK ILERLET
          // ==============================================================
          //  Rakip paylari SABIT sayilardi: Pear Inc. %31 idi ve on yil
          //  sonra da %31 olacakti. Pazar canli bir yer degil duvar
          //  kagidiydi, ve pazarda dovdugun rakibin hissesi yukselmeye
          //  devam edebiliyordu.
          //
          //  Artik guclu rakip zayiftan pay alir, senin aldigin pay
          //  hepsinden ORANTILI cikar, ve her rakibin borsa cipasi kendi
          //  payiyla birlikte hareket eder. Rekabet dongusu boylece
          //  kapaniyor: pazarda dovdugun sirketi sonra ucuza alirsin.
          //  Bkz. core/market/competitors.ts
          // ==============================================================
          {
            const mkStore = useMarketStore.getState();
            const playerShareHere = shares.reduce((sum: number, v: number) => sum + v, 0);
            const liveInputs = (market.competitors || [])
              .filter((c: any) => !acquiredStockIds.includes(c.stockId))
              .map((c: any) => ({
                stockId: c.stockId,
                share: mkStore.competitorShares[c.stockId] ?? c.share,
                strength: c.strength ?? 50,
              }));
            const baselines: Record<string, number> = {};
            (market.competitors || []).forEach((c: any) => { baselines[c.stockId] = c.share; });

            const advanced = advanceCompetitors(liveInputs, playerShareHere, baselines);
            const nextShares = { ...mkStore.competitorShares };
            advanced.forEach(c => { nextShares[c.stockId] = c.share; });
            useMarketStore.setState({ competitorShares: nextShares });
          }

          group.forEach((p, i) => {
            marketDemandByProduct[p.id] = {
              // Talep ceyrek basina; birden fazla ceyrek ilerlendiyse carp.
              demand: demandUnits(market, shares[i]) * Math.max(1, quarters),
              share: shares[i],
              breakdown: breakdowns[i],
              benchmark: benchmarks[i],
            };
          });
        });

        // ==================================================================
        //  KAPASITE PAYLASTIRMA
        // ==================================================================
        //  Kapasite ORTAK. Iki urunun varsa ikisi ayni hatti paylasir.
        //  Hedeflerin toplami kapasiteyi asiyorsa hepsi ayni oranda kirpilir
        //  — oyuncuyu ayri bir "oncelik" ekranina sokmadan adil sonuc verir.
        //  Bir urune daha cok pay vermek istiyorsan digerinin hedefini
        //  kendin dusurursun; karar yine oyuncuda.
        // ==================================================================
        const allocationRequests = activeProducts.map((p: any) => ({
          id: p.id,
          targetUnits: resolveTargetUnits(p, effectiveHeadcount, tier.level, isBuilding),
          complexity: p.complexity ?? 50,
        }));

        const requestedStandard = allocationRequests.reduce(
          (sum: number, r: any) => sum + unitsToStandard(r.targetUnits * Math.max(1, quarters), r.complexity),
          0,
        );
        const allocationRatio =
          requestedStandard > 0 ? Math.min(1, standardCapacity / requestedStandard) : 1;

        const plannedById: Record<string, number> = {};
        allocationRequests.forEach((r: any) => {
          plannedById[r.id] = Math.floor(r.targetUnits * Math.max(1, quarters) * allocationRatio);
        });

        /** Bu ceyrek gercekten kullanilan standart birim — kullanim orani icin */
        let usedStandard = 0;
        /** Fasoncuya odenen toplam tutar (kurulum bedelleri dahil) */
        let contractSpend = 0;
        /** Fasondan gelen toplam saglam adet — raporda gostermek icin */
        let contractUnitsTotal = 0;

        // Unit cost used to be cut by a PRODUCTION_COST subsidiary buff here,
        // by up to half. Your cost per unit now comes only from things you can
        // point at: the product, the facility tier, and the contract partner.
        // See the shelved block at the top of the file.

        // Loop through each active product and calculate financials
        const updatedProducts: any[] = [];
        const productBreakdownList: ProductQuarterLine[] = [];
        let totalUnmetDemand = 0;
        let totalMarketDemand = 0;

        products.forEach((product: any) => {
          if (product.status === 'active') {
            // Get actual cost and price (with R&D upgrades applied)
            const unitCost = product.unitCost ?? product.baseProductionCost;
            const sellingPrice = product.sellingPrice || product.suggestedPrice;
            const previousInventory = product.inventory || 0;
            totalBeginningStock += previousInventory;

            // 1. URETIM — kapasiteden paylastirilir (core/market/capacity.ts).
            //    Uretim hedefi MUTLAK ADET: kapasiteni buyuttugunde uretim
            //    kendiliginden artmaz, hedefi bilerek yukseltmen gerekir.
            //    FIRE: her kademenin bir saglam cikma orani var. Atolyede
            //    her 10 urunun 1'i cope gider, maliyeti yine odersin.
            const attemptedUnits = plannedById[product.id] ?? 0;
            usedStandard += unitsToStandard(attemptedUnits, product.complexity ?? 50);
            // Fire de morale bagli: dikkatsiz ekip bozuk urun cikarir.
            const effectiveYield = Math.max(
              0.5,
              1 - (1 - tier.yieldRate) * scrapMultiplier(currentMorale),
            );
            const ownProduction = Math.floor(attemptedUnits * effectiveYield);
            const scrappedUnits = attemptedUnits - ownProduction;

            // ==============================================================
            //  FASON URETIM — kendi kapasiteni HIC kullanmaz
            // ==============================================================
            //  Kapasite duvarinin etrafindan dolasmanin yolu. Bedeli:
            //  birim maliyet %30-60 daha yuksek ve fasoncunun kalite
            //  tavani senin ustune bir tavan koyar. Yani buyume hizini
            //  parayla satin alirsin, marjindan odersin.
            //
            //  Not: fasonun firesi FASONCUNUN oranidir, senin moraline
            //  bagli degildir — onlarin ekibi, onlarin sorunu.
            // ==============================================================
            const partner = getPartner(product.contractPartnerId);
            const contractOrder = partner
              ? quoteContractOrder(
                  partner,
                  (product.contractUnits || 0) * Math.max(1, quarters),
                  unitCost,
                  product.complexity,
                )
              : null;

            if (partner && contractOrder && contractOrder.units > 0) {
              contractSpend += contractOrder.cost;
              contractUnitsTotal += contractOrder.goodUnits;
              // Sozlesme acilis bedeli — kalip, hat kurulumu, denetim.
              // Yalnizca BIR KEZ, ilk sipariste.
              if (!product.contractSetupPaid) {
                contractSpend += partner.setupCost;
                queueProductUpdate(product.id, { contractSetupPaid: true });
              }
            }

            const contractGood = contractOrder?.goodUnits ?? 0;
            const quarterlyProduction = ownProduction + contractGood;

            // 2. INVENTORY FIRST SALES LOGIC
            // Total Supply = Existing Inventory + Quarterly Production
            const availableGoods = previousInventory + quarterlyProduction;

            // ==============================================================
            //  3. TALEP — pazardan gelir, uretimden DEGIL
            // ==============================================================
            // PAZARLAMA BUTCESI — ceyreklik, SABIT gider.
            // Eskiden satilan birim basina odeniyordu; satmazsan bedava
            // oluyordu ve bu onu oyundaki tek risksiz kaldirac yapiyordu.
            // Artik satsan da satmasan da odenir: gercek bir bahis.
            const marketingBudget = (product.marketingBudget || 0) * Math.max(1, quarters);
            const marketInfo = marketDemandByProduct[product.id];
            totalMarketingBenchmark += (marketInfo?.benchmark ?? 0) * Math.max(1, quarters);
            const rawDemand = marketInfo?.demand ?? 0;
            const marketSharePercent = marketInfo?.share ?? 0;
            totalMarketDemand += rawDemand;

            // Moral cezasi talebi degil, TESLIMATI vurur: dagilmis bir ekip
            // gelen siparisi karsilayamaz. Kaybedilen satis ayrica raporlanir.
            let effectiveDemand = rawDemand;
            if (penaltyRatio > 0) {
              const lost = Math.floor(rawDemand * penaltyRatio);
              totalLostUnits += lost;
              totalLostRevenue += (lost * sellingPrice);
              effectiveDemand = rawDemand - lost;
            }

            // Satis = talep ile eldeki malin KUCUGU.
            // Iki taraflı risk burada dogar:
            //   eldeki mal < talep  -> stok tukendi, satis kacti
            //   eldeki mal > talep  -> stokta kaldi, depo maliyeti
            const quarterlySales = Math.max(0, Math.min(availableGoods, effectiveDemand));

            // Karsilanamayan talep: rakibe giden musteri.
            const unmetDemand = Math.max(0, effectiveDemand - availableGoods);
            totalUnmetDemand += unmetDemand;

            // 4. Update Inventory (New Inventory = Total - Sales)
            const newInventory = availableGoods - quarterlySales;
            totalEndingStock += newInventory;

            // DEBUG LOGGING


            // 5. Costs & Revenue
            // Storage costs: $5 per unit in NEW inventory
            const storageCost = newInventory * 5 * quarters;

            // Pazarlama gideri = butce. Satisla carpilmaz.
            const marketingCost = marketingBudget;

            // Revenue & COGS
            const productRevenue = sellingPrice * quarterlySales;
            // COGS DENENEN adet uzerinden — fireye giden urunun maliyeti de
            // sana ait. Kademe carpani olcek ekonomisini yansitir.
            const productCOGS =
              unitCost * attemptedUnits * tier.unitCostMultiplier;

            totalRevenue += productRevenue;
            totalCOGS += productCOGS;
            totalProduction += quarterlyProduction;
            totalSales += quarterlySales;
            totalMarketingCost += marketingCost;
            totalStorageCost += storageCost;

            // ------------------------------------------------------------
            //  ERISIM ENDEKSI — bu ceyregin teslimat karnesi
            // ------------------------------------------------------------
            //  Talebin ne kadarini karsilayabildin? Karsilayamadiysan
            //  musterinin bir kismi kalici olarak rakibe gecer ve bir
            //  sonraki ceyrek payin daha dusuk baslar. Karsiladiysan
            //  yavasca geri kazanirsin.
            // ------------------------------------------------------------
            const servedRatio = effectiveDemand > 0
              ? quarterlySales / effectiveDemand
              : 1;
            let nextReach = product.reachIndex ?? 1;
            for (let q = 0; q < Math.max(1, quarters); q++) {
              nextReach = updateReachIndex(nextReach, servedRatio);
            }

            // Update product with new inventory
            updatedProducts.push({
              ...product,
              inventory: newInventory,
              reachIndex: nextReach,
              // Bir sonraki ceyregin kiyas butcesi bu ciroya bakar.
              revenue: productRevenue,
            });

            // Add to breakdown list
            const productProfit = productRevenue - (productCOGS + marketingCost + storageCost);
            productBreakdownList.push({
              id: product.id,
              name: product.name,
              category: product.category,
              produced: quarterlyProduction, // own line + outsourced, combined
              ownUnits: ownProduction,
              contractUnits: contractGood,
              sold: quarterlySales,
              revenue: productRevenue,
              expense: (productCOGS + marketingCost + storageCost),
              profit: productProfit,
              stock: newInventory,
              // Rapor icin ek alanlar (bkz. core/reportTypes.ts)
              unitPrice: sellingPrice,
              unitCost,
              marketingBudget: marketingCost,
              scrapped: scrappedUnits,
              unsold: Math.max(0, availableGoods - quarterlySales),
              sellThrough: availableGoods > 0 ? (quarterlySales / availableGoods) * 100 : 0,
              // Pazar verileri
              marketDemandUnits: rawDemand,
              marketShare: marketSharePercent,
              unmetDemand,
            });
          } else {
            updatedProducts.push(product);
          }
        });

        // Update products in store with new inventory levels
        updatedProducts.forEach((updatedProduct) => {
          if (updatedProduct.inventory !== undefined) {
            queueProductUpdate(updatedProduct.id, {
              inventory: updatedProduct.inventory,
              revenue: updatedProduct.revenue,
              // Teslimat karnesi kalici olmali; yoksa endeks her ceyrek
              // 1'e donup butun dongu anlamsizlasirdi.
              reachIndex: updatedProduct.reachIndex,
            });
          }
        });

        // Flush every product change collected this quarter in a single write.
        if (Object.keys(pendingProductUpdates).length > 0) {
          useProductStore.getState().updateProducts(pendingProductUpdates);
        }

        // ==================================================================
        //  TESIS GIDERI — kademeye bagli, SABIT
        // ==================================================================
        //  Uretsen de uretmesen de odenir. Bos duran tesisi bu kalem yakar;
        //  kapasite kullanimi dusukken oyuncunun canini yakan sey budur.
        //
        //  ONCEDEN: fabrika basina 5.000 dolardi ve fabrika sayisi hicbir
        //  ise yaramadigi icin bu kalem anlamsizdi.
        // ==================================================================
        const factoryOverhead = tier.opexPerQuarter * Math.max(1, quarters);

        // ==================================================================
        //  MAAS — oyunun en buyuk eksigiydi
        // ==================================================================
        //  Maas HIC odenmiyordu. `recalculateFinancials` hesapliyor ama
        //  sadece gosterim alanina yaziyordu, sermayeden dusmuyordu. Uretim
        //  de tamamen calisan sayisina bagli oldugu icin sonuc suydu:
        //  bedava isci al, bedava uret. Oyundaki en guclu somuru buydu.
        // ==================================================================
        const baseWageBill =
          headcount * quarterlyWage(tier.level, salaryRatio) * Math.max(1, quarters);
        const overtimePremium = overtimeOn ? overtimeWageCost(baseWageBill) : 0;
        const wageCost = baseWageBill + overtimePremium;

        // 3. R&D LABORATORY COSTS (Updated to $500k per researcher)
        // Arastirmaci maasi da ayni sisteme bagli. Eskiden SABIT 500.000
        // dolardi ve hicbir seyle olceklenmiyordu: kademe 1'de tek bir
        // arastirmaci ceyreklik cironun %30'unu yiyordu.
        const rndSalaryCost =
          researcherCount * researcherWage(tier.level, salaryRatio) * quarters;

        // Process RP generation for each quarter
        let rndRPGenerated = 0;
        if (quarters > 0) {
          for (let i = 0; i < quarters; i++) {
            const { rpAwarded } = useLaboratoryStore.getState().processQuarter(() => { });
            // Research output used to be multiplied by an R_AND_D_SPEED buff
            // here. It now comes only from the people you hired into the lab.
            rndRPGenerated += rpAwarded;
          }

        }


        // 4. OTHER EXPENSES
        const monthlyFixedExpenses = 5000;
        const totalFixedExpenses = monthlyFixedExpenses * months;
        // ==================================================================
        //  BORÇ FAİZİ — artık gerçek kredilerden ve kredi skorundan
        // ==================================================================
        //  ONCEDEN SABIT %5 IDI: `companyDebtTotal * 0.05`. Yani
        //  `getInterestRate()` (kredi skoruna gore %3-%15 arasi degisen
        //  oran) HIC KULLANILMIYORDU, alinan bireysel krediler
        //  (`payMonthlyInterests`) hic islenmiyordu ve kredi skoru
        //  (`refreshCreditScore`) hic tazelenmiyordu.
        //
        //  Sonuc: bankacilik ekrani vardi ama oyunda hicbir karsiligi
        //  yoktu — kredi cekmek de, skoru duzeltmek de bir sey degistirmiyordu.
        // ==================================================================
        // ==================================================================
        //  BORÇ SERVİSİ — faiz VE anapara
        // ==================================================================
        //  Artik tek yerden: her kredi ayri ayri islenir, odeme faiz ve
        //  anapara olarak ayrisir, bakiye gercekten erir, vade dolunca
        //  kredi kapanir.
        //
        //  Eski `payMonthlyInterests` parayi aliyor ama bakiyeyi
        //  azaltmiyordu — sonsuza kadar odersin, borc yerinde dururdu.
        //  Bkz. core/market/credit.ts -> serviceLoanQuarter
        // ==================================================================
        const finance = useCorporateFinanceStore.getState();
        const debtService = finance.serviceDebtQuarter(Math.max(1, quarters));

        // Faiz gideri kar/zarara girer; ANAPARA girmez (bilanco hareketi).
        // Bu ayrim onemli: anaparayi gider yazmak kari iki kez dusururdu.
        const interestExpense = debtService.interest;
        const principalRepaid = debtService.principal;
        const loanPayments = 0;

        // Sozlesme ihlali sayacini ilerlet ve kademeyi al.
        const distress = finance.advanceDistress();

        // ==================================================================
        //  KAPASİTE AŞIMI VE ZORUNLU VARLIK SATIŞI
        // ==================================================================
        //  Bankalar EBITDA'ya borc verir. Insaat EBITDA'yi dusurunce
        //  borclanma kapasiten de duser — limitindeysen tam uretimin
        //  dustugu ceyrekte "borcun bir kismini geri ver" derler.
        //
        //  Bir yildir ihlaldeysen is varlik satisina kadar gider: once
        //  istirak satilir, yoksa tesis kademesi dusurulur. Oyun bitmez
        //  ama agir yara alirsin.
        // ==================================================================
        const capacityBreach = checkCapacityBreach(
          stats.companyDebtTotal || 0,
          finance.getAssessment(),
          isBuilding,
        );

        let forcedSaleProceeds = 0;
        let forcedSaleNote = '';

        // ------------------------------------------------------------------
        //  DUZELTME: kapasite asimi VARLIK SATTIRMAMALI
        // ------------------------------------------------------------------
        //  Bu kosul `distress.mustSellAssets || capacityBreach` idi ve
        //  BEN YAZDIM. capacityBreach bir NESNE donuyor, yani hep dogru
        //  sayiliyordu: borcun kazancinin ustundeyse HER CEYREK en kucuk
        //  istirakin satiliyordu.
        //
        //  Oyuncu StartApp IO'yu aldi, bir sonraki ceyrek sirket yeniden
        //  borsada satin alinabilir haldeydi. Sebep buydu — en ucuz
        //  istirak oldugu icin ilk o gidiyordu.
        //
        //  Dogrusu ikisi AYRI siddet: kapasite asimi NAKIT ister (banka
        //  borcun bir kismini geri cagirir), varlik satisi ise bir yil
        //  ihlalde kalmanin sonucudur. Gercek hayatta da boyle kademelenir.
        // ------------------------------------------------------------------
        if (capacityBreach && !distress.mustSellAssets) {
          // Yalnizca nakitten geri odeme. Varliga dokunulmaz.
          const cashNow = useStatsStore.getState().companyCapital || 0;
          const demanded = Math.min(cashNow, capacityBreach.demandedRepayment);
          const firstLoan = useCorporateFinanceStore.getState().loans[0];
          if (demanded > 0 && firstLoan) {
            useCorporateFinanceStore.getState().repayLoan(firstLoan.id, demanded, (n: number) => {
              const st = useStatsStore.getState();
              st.update({ companyCapital: (st.companyCapital || 0) - n });
            });
          }
        }

        if (distress.mustSellAssets) {
          const fin2 = useCorporateFinanceStore.getState();
          const subs = fin2.subsidiaries;

          if (subs.length > 0) {
            // En kucuk istiraki elden cikar — en az zarar veren cikis.
            const smallest = [...subs].sort((a, b) => a.valuation - b.valuation)[0];
            const before = useStatsStore.getState().companyCapital || 0;
            fin2.sellSubsidiary(smallest.id);
            forcedSaleProceeds = (useStatsStore.getState().companyCapital || 0) - before;
            forcedSaleNote = `Lenders forced the sale of ${smallest.name}.`;
          } else if (tier.level > 1) {
            // Istirak yoksa uretim kabiliyetinden feragat edilir.
            const soldTier = getTier(tier.level - 1);
            forcedSaleProceeds = (tier.upgradeCost || 0) * 0.4;
            useStatsStore.getState().update({
              facilityTier: soldTier.level,
              companyCapital: (useStatsStore.getState().companyCapital || 0) + forcedSaleProceeds,
            });
            forcedSaleNote =
              `Lenders forced you to sell production capacity. You are back to ${soldTier.name}.`;
          }

          // Gelen para dogrudan borc kapatmaya gider.
          if (forcedSaleProceeds > 0) {
            const first = useCorporateFinanceStore.getState().loans[0];
            if (first) {
              useCorporateFinanceStore.getState().repayLoan(first.id, forcedSaleProceeds, (n: number) => {
                const st = useStatsStore.getState();
                st.update({ companyCapital: (st.companyCapital || 0) - n });
              });
            }
          }
        }

        // NOT DUSUSU VE IHLAL PIYASADA FIYATLANIR.
        // Not degisimleri gercek hayatta hisseyi oynatir; ihlal duyurusu
        // ise alacaklilarin direksiyona gectigini ilan eder.
        const prevRating = stats.creditRatingPrev || '';
        const nowRating = finance.getAssessment().rating;
        const order = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'D'];
        const notches = prevRating
          ? order.indexOf(nowRating) - order.indexOf(prevRating)
          : 0;
        if (notches > 0) {
          const hit = FINANCING_SIGNALS.rating_downgrade.impactPercent * notches;
          useEquityStore.setState(st => ({
            marketMultiplier: Math.max(0.3, st.marketMultiplier * (1 + hit / 100)),
          }));
        }
        if (distress.stage === 'breach' && (stats.creditRatingPrev || '') !== '') {
          const hit = FINANCING_SIGNALS.covenant_breach.impactPercent;
          useEquityStore.setState(st => ({
            marketMultiplier: Math.max(0.3, st.marketMultiplier * (1 + hit / 100)),
          }));
        }
        // Ihlaldeyken bankalar mevcut borca ceza faizi bindirir.
        const penaltyInterest =
          (stats.companyDebtTotal || 0) * (distress.penaltyRate || 0) * (months / 12);

        finance.refreshCreditScore();

        // ==================================================================
        //  4b. WHAT A PARTNER COSTS, AND WHO PAYS IT
        // ==================================================================
        //  This was computed and THROWN AWAY. `partnerUpkeepCost` was
        //  assigned, never read, and never charged - so a partner at eight and
        //  a half thousand a month was free for the whole game. It was also
        //  reading useUserStore, which is the partner store no encounter ever
        //  wrote to, so most of the time it was computing zero anyway.
        //
        //  IT COMES OUT OF PERSONAL CASH, not the company. A chief executive
        //  whose girlfriend is billed to the shareholders is a story this game
        //  could tell on purpose, and it is not one it should tell by
        //  accident. Same pool the divorce settlement takes from.
        //
        //  Gated on FEATURES.love with everything else in this system: a
        //  shelved module must not move money.
        // ==================================================================
        const partner = FEATURES.love
          ? require('./useFamilyStore').useFamilyStore.getState().partner
          : null;
        const partnerUpkeepCost = (partner?.finances?.monthlyCost ?? 0) * months;
        if (partnerUpkeepCost > 0) {
          const stats = useStatsStore.getState();
          stats.setField('money', (stats.money || 0) - partnerUpkeepCost);
        }

        // ==================================================================
        //  WHAT YOU AGREED TO PAY SOMEBODY ELSE'S SHAREHOLDERS
        // ==================================================================
        //  A standing cut of one category's revenue, taken because the player
        //  chose not to fight an incumbent. See core/market/territory.ts.
        //
        //  CHARGED ON REVENUE, NOT PROFIT, and it sits in the expense block
        //  with everything else rather than being netted off revenue quietly -
        //  a cost the player agreed to should appear as a cost. Computed from
        //  productBreakdownList, which is built above and carries the category
        //  on each line; `revenueByCategory` further down is the same figure
        //  and arrives four hundred lines too late to be charged for.
        // ==================================================================
        let territoryRoyalty = 0;
        try {
          const revenueForRoyalty: Record<string, number> = {};
          productBreakdownList.forEach(pb => {
            const c = pb.category || 'Consumer';
            revenueForRoyalty[c] = (revenueForRoyalty[c] || 0) + (pb.revenue || 0);
          });
          territoryRoyalty =
            require('./useTerritoryStore').useTerritoryStore
              .getState().royaltyFor(revenueForRoyalty) * Math.max(1, quarters);
        } catch (e) {
          console.warn('[territory] royalty could not be charged', e);
        }

        // 5. CALCULATE NET PROFIT/LOSS
        const totalExpenses =
          territoryRoyalty +
          totalCOGS +
          contractSpend +
          totalMarketingCost +
          totalStorageCost +
          factoryOverhead +
          wageCost +
          hiringCost +
          severanceCost +
          rndSalaryCost +
          totalFixedExpenses +
          interestExpense +
          penaltyInterest +
          loanPayments;
        // ==================================================================
        //  KURUMLAR VERGİSİ VE BORÇ KALKANI
        // ==================================================================
        //  Faiz vergiden DUSER, temettu dusmez. Borcun ozkaynaktan gercekten
        //  ucuz olmasinin sebebi budur. Oyunda vergi hic yoktu; o yuzden
        //  borc yalnizca risk tasiyor, avantaji gorunmuyordu.
        //
        //  Zarar mahsubu da var: zarar eden ceyrekte vergi yok ve zarar
        //  ileriye tasinip sonraki karli ceyreklerde dusuluyor.
        //  Bkz. core/market/credit.ts -> applyTax
        // ==================================================================
        // ==================================================================
        //  WHAT THE SUBSIDIARIES EARNED — and it has to land HERE
        // ==================================================================
        //  BUG FOUND WHILE REMOVING THE BUFFS. This effect was computed two
        //  hundred lines below, added to the report's `ebit` field, and then
        //  never touched anything else: not `netProfit`, not company capital,
        //  not the tax, not the CEO bonus base. The quarterly report showed
        //  "Acquisitions +$409,500" while the bank balance moved by zero.
        //
        //  It went unnoticed because the buffs were covering for it. An
        //  acquisition felt like it paid because your own factory got cheaper
        //  and your own lab got faster - the earnings line was decoration on
        //  top of the thing that was actually doing the work. Take the buffs
        //  away and a subsidiary contributes NOTHING, which is the opposite of
        //  what this change is for.
        //
        //  Read-only here. The deals are advanced once, later, at report time.
        // ==================================================================
        const dealEffect = useCorporateFinanceStore
          .getState()
          .acquisitionsQuarterEffect(Math.max(1, quarters));

        // Their profit is profit, so it is taxed with the rest of it. The
        // integration bill and any goodwill written off are inside netEbit
        // and reduce the base, which is also correct: a deal that is going
        // badly should shelter the tax, not be quietly ignored.
        const pretaxProfit = totalRevenue - totalExpenses + dealEffect.netEbit;
        const taxResult = applyTax(
          pretaxProfit + interestExpense + penaltyInterest, // EBIT tabani
          interestExpense + penaltyInterest,
          stats.lossCarryforward || 0,
        );
        const netProfit = taxResult.netProfit;

        // ==================================================================
        //  CEO'S ANNUAL BONUS — 2% OF THE YEAR, AFTER TAX
        // ==================================================================
        //  Struck here, one line below the tax, because that is the only
        //  place the base is unambiguous: `netProfit` is what the company
        //  kept once the taxman was paid. Anything computed further down
        //  would have principal repayments and share movements mixed in.
        //
        //  It accrues every quarter and settles on the fourth. The money
        //  is not created - it leaves company capital and lands in personal
        //  cash, which is the point: this is the second way to get money
        //  out of your own company, and unlike a dividend it does not also
        //  pay every other shareholder.
        //  Bkz. core/market/compensation.ts
        // ==================================================================
        const bonus = accrueCeoBonus(
          get().ceoBonusAccrual || EMPTY_ACCRUAL,
          netProfit,
          Math.max(1, quarters),
        );

        // 6. UPDATE CAPITAL
        // Anapara geri odemesi kardan degil NAKITTEN cikar — bilanco
        // hareketidir, gider degildir. Gider yazsaydik kari iki kez
        // dusurmus olurduk.
        const newCompanyCapital =
          (stats.companyCapital || 0) + netProfit - principalRepaid - bonus.paid;

        // 7. PLAYER FINANCIALS (Using Quarterly Economy Engine)
        // Calculate quarterly finances once and apply to player cash
        const quarterlyReport = calculateQuarterlyFinances(
          useUserStore.getState(),
          useMarketStore.getState(),
          useStatsStore.getState()
        );

        // Apply Net Flow to Cash. The bonus rides in here rather than being
        // written separately, so cash is settled in ONE place - two writes
        // to `money` in the same tick is how the last one silently wins.
        const newPlayerCash = (stats.money || 0) + quarterlyReport.netFlow + bonus.paid;

        // ------------------------------------------------------------------
        //  6b. CEYREK RAPORUNU KUR
        // ------------------------------------------------------------------
        //  Motorun gercekten tahsil ettigi kalemleri disari veriyoruz.
        //  Onceden bu sayilar bu fonksiyonun icinde kaliyordu, rapor
        //  ekranlari da kendi tahminlerini uretiyordu — hicbiri tutmuyordu.
        //  Artik tek kaynak burasi. Bkz. core/reportTypes.ts
        //
        //  NOT: Calisan maasi bilerek YOK, cunku motor onu tahsil etmiyor.
        //  Uydurma bir satir eklemek yerine eksikligi gorunur birakiyoruz.
        // ------------------------------------------------------------------
        // ------------------------------------------------------------------
        //  MARKA GUNCELLEMESI
        // ------------------------------------------------------------------
        //  Pazarlama ve kaliteyle yukselir, stok tukenmesiyle duser,
        //  ilgilenilmezse asinir. Ceyrekte en fazla 3 puan oynar —
        //  itibar yavas kazanilir. Bkz. core/market/attraction.ts
        // ------------------------------------------------------------------
        const activeQualities = activeProducts.map((p: any) =>
          Math.min(p.qualityLevel || 1, tier.qualityCeiling),
        );
        const averageQuality = activeQualities.length
          ? activeQualities.reduce((a: number, b: number) => a + b, 0) / activeQualities.length
          : 1;

        // Pazarlama/kalite bacagi hala attraction.ts'te; artik markanin
        // TEK kaynagi degil, dort kaynaktan biri. Bkz. core/market/brand.ts
        const marketingBrand = updateBrand({
          currentBrand: brandValue,
          unitsSold: totalSales,
          unmetDemand: totalUnmetDemand,
          marketingSpend: totalMarketingCost,
          marketingBenchmarkTotal: totalMarketingBenchmark,
          averageQuality,
          // Uretim kabiliyetin itibarinin tavanini belirler; taban da
          // kademeden gelir ki buyurken kendi basarin seni cezalandirmasin.
          brandCeiling: tier.brandCeiling,
          brandFloor: tier.brandFloor,
          // A conviction lowers what this company can ever be worth to the
          // public. Read here rather than applied as a one-off subtraction:
          // brand mean-reverts, so a drain on the value is erased within two
          // or three quarters and measured at almost exactly nothing.
          // TWO CEILING PENALTIES, ADDED. A conviction and a drought are
          // different failures and a company can have both - and both had to
          // be ceilings rather than drains for the same measured reason: the
          // brand mean-reverts, so a subtraction from the VALUE is pulled
          // straight back out within two or three quarters.
          ceilingPenalty: (() => {
            let penalty = 0;
            try {
              const { useStoryStore: st } = require('./useStoryStore');
              const { CONVICTION_CEILING_PENALTY } = require('../story/state');
              if (st.getState().flags?.fbiGuilty) penalty += CONVICTION_CEILING_PENALTY;
            } catch { /* story store not ready */ }
            try {
              penalty += require('./useSponsorshipStore')
                .useSponsorshipStore.getState().penalty();
            } catch { /* sponsorship store not ready */ }
            return penalty;
          })(),
        });

        // ==================================================================
        //  MARKA — dört kaynaktan beslenir, tek kapıdan geçer
        // ==================================================================
        //  Once markayi YALNIZCA pazarlama butcesi insa ediyordu. Oyuncu
        //  "en onemli mekanik bu ama artisini cozemedim" dedi — hakliydi,
        //  cunku marka tek yonlu bir borudan ibaretti.
        //
        //  Artik: pazarlama + PAZAR PAYI + zaman + DEVRALMA.
        //
        //  Pazar payi bacagi geri besleme dongusunu kapatiyor: pay aldikca
        //  marka buyur, marka buyudukce pay almak kolaylasir. Oyunun
        //  bilesik buyume motoru bu — ve tesis tavani da tam bu yuzden var,
        //  yoksa dongu kendini besleyip oyunu bitirir.
        // ==================================================================
        // ------------------------------------------------------------------
        //  GERCEKLESEN PAY — SATILAN ADETTEN, uretilenden degil
        // ------------------------------------------------------------------
        //  Oyuncunun sarti buydu: "satamasam da uretimi artirinca payim
        //  artmasin, yoksa hemen tahta oturuuz." Marka artik computeShares'in
        //  verdigi potansiyel payi degil, kategoride GERCEKTEN sattigin
        //  adedin pazara oranini okuyor. Mal satmadan itibar birikmez.
        // ------------------------------------------------------------------
        const soldByCategory: Record<string, number> = {};
        const revenueByCategory: Record<string, number> = {};
        productBreakdownList.forEach(pb => {
          const c = pb.category || 'Consumer';
          soldByCategory[c] = (soldByCategory[c] || 0) + (pb.sold || 0);
          revenueByCategory[c] = (revenueByCategory[c] || 0) + (pb.revenue || 0);
        });

        // Demand we generated per category — used to score how much of the
        // appetite we actually served (that speeds brand growth).
        const demandByCategory: Record<string, number> = {};
        activeProducts.forEach((p: any) => {
          const c = p.category || 'Consumer';
          const want = marketDemandByProduct[p.id]?.demand || 0;
          demandByCategory[c] = (demandByCategory[c] || 0) + want;
        });

        const realizedShareOf = (cat: string): number => {
          const mk = getMarket(cat);
          const size = (mk?.sizeUnitsPerQuarter || 0) * Math.max(1, quarters);
          if (size <= 0) return 0;
          return Math.min(100, ((soldByCategory[cat] || 0) / size) * 100);
        };

        const totalPlayerShare = Object.keys(soldByCategory)
          .reduce((sum, c) => sum + realizedShareOf(c), 0);

        // Acquisition brand gain, per category: the reputation you BOUGHT.
        // This is the one thing that moves brand in a single step.
        const acquisitionGainByCategory: Record<string, number> = {};
        (() => {
          const subs = useCorporateFinanceStore.getState().subsidiaries;
          subs.filter(x => (x.deal?.quartersSinceClose ?? 99) <= 1).forEach(x => {
            // The subsidiary's `sector` is a stock-market label ('Technology'),
            // not a product market ('Consumer'). Using it wrote the brand gain
            // into a category that does not exist, so an acquisition raised
            // share but never brand. Resolve through the competitor lists.
            const cat = marketCategoryForStock(x.id);
            if (!cat) return;   // competes in no product market - no brand to inherit
            const gain = brandFromAcquisition(
              x.deal?.fairValue || x.valuation || 0,
              stats.companyValue || 1,
              !!x.deal?.hostile,
              brandValue,
            );
            acquisitionGainByCategory[cat] = (acquisitionGainByCategory[cat] || 0) + gain;
          });
        })();

        const acquisitionGainTotal = (() => {
          const subs = useCorporateFinanceStore.getState().subsidiaries;
          const fresh = subs.filter(x => (x.deal?.quartersSinceClose ?? 99) <= 1);
          return fresh.reduce(
            (sum, x) => sum + brandFromAcquisition(
              x.deal?.fairValue || x.valuation || 0,
              stats.companyValue || 1,
              !!x.deal?.hostile,
              brandValue,
            ),
            0,
          );
        })();

        // ------------------------------------------------------------------
        //  BRAND, PER CATEGORY, ANCHORED TO SHARE
        // ------------------------------------------------------------------
        //  Each market keeps its own reputation and each one walks towards the
        //  level its realised share supports (share x 43.3). The corporate
        //  figure q is DERIVED from these, never stored separately - so a hit
        //  to one category shows up in q on its own.
        //  See core/market/brand.ts
        // ------------------------------------------------------------------
        const prevByCategory: Record<string, number> = {
          ...(useStatsStore.getState().brandByCategory || {}),
        };

        const activeCategories = Array.from(
          new Set([...Object.keys(soldByCategory), ...Object.keys(prevByCategory)]),
        );

        // How much of the demand we created did we actually deliver?
        const servedRatioOf = (cat: string): number => {
          const want = demandByCategory[cat] || 0;
          if (want <= 0) return 1;
          return Math.min(1, (soldByCategory[cat] || 0) / want);
        };

        // Floors a category has already earned - see brand.ts earnedFloor
        const prevFloors: Record<string, number> = {
          ...(useStatsStore.getState().brandFloorByCategory || {}),
        };
        const nextFloors: Record<string, number> = { ...prevFloors };

        const nextByCategory: Record<string, number> = { ...prevByCategory };
        const marketingDeltaTotal = marketingBrand.newBrand - brandValueIndexPrev;

        activeCategories.forEach(cat => {
          const shareHere = realizedShareOf(cat);
          // Marketing effect is split across categories by their share of sales.
          const weightHere = totalPlayerShare > 0 ? shareHere / totalPlayerShare : 1 / Math.max(1, activeCategories.length);
          const r = advanceCategoryBrand({
            current: prevByCategory[cat] ?? 0,
            floor: prevFloors[cat] || 0,
            share: shareHere,
            servedRatio: servedRatioOf(cat),
            marketingDelta: marketingDeltaTotal * weightHere,
            acquisitionGain: (acquisitionGainByCategory[cat] || 0),
          });
          nextByCategory[cat] = r.newBrand;
          nextFloors[cat] = earnedFloor(prevFloors[cat], r.newBrand);
        });

        const corporateQ = corporateBrandFrom(nextByCategory, activeCategories);

        // Everything written before brand points existed reads a 0-100 index.
        const brandIdx = brandIndex(corporateQ);

        // ------------------------------------------------------------------
        //  KADRO VE INSAAT DURUMUNU YAZ
        // ------------------------------------------------------------------
        //  Insaat her ceyrek bir adim ilerler; bitince kademe yukselir ve
        //  retooling kesintisi kalkar.
        // ------------------------------------------------------------------
        let nextTierLevel = tier.level;
        let nextBuild = stats.facilityBuild;
        if (nextBuild) {
          const remaining = nextBuild.quartersRemaining - Math.max(1, quarters);
          if (remaining <= 0) {
            nextTierLevel = nextBuild.targetTier;
            nextBuild = null;
          } else {
            nextBuild = { ...nextBuild, quartersRemaining: remaining };
          }
        }

        // ------------------------------------------------------------------
        //  MORAL — bakim seviyesi modeli
        // ------------------------------------------------------------------
        //  ESKIDEN: ceyrek basina sabit -5, yuksek maas +15, dusuk -15.
        //  Yani ortalama maas kacinilmaz cokus, yuksek maas 3 ceyrekte
        //  kalici 100 demekti. Ikisi de karar degildi.
        //
        //  SIMDI: maas orani bir HEDEF belirler (piyasada odersen 70,
        //  en fazla 85) ve moral ona dogru yurur. Kalani etkinlik,
        //  ikramiye ve isten cikarmalarla oynar.
        //
        //  Rapordan ONCE hesaplaniyor ki cikan sonuc rapora yazilabilsin.
        //  Bkz. core/market/workforce.ts -> updateMorale
        // ------------------------------------------------------------------
        const moraleResult = updateMorale({
          currentMorale: currentMorale,
          salaryRatio,
          layoffCost: layoffMoraleHit,
          payCutCost: get().pendingPayCutShock || 0,
          overtime: overtimeOn,
          quarters: Math.max(1, quarters),
        });

        // Kidem: ekip yaslanir ama yeni gelenler ortalamayi SEYRELTIR.
        // Hizli buyumenin gorunmeyen bedeli budur.
        const nextTenure = blendTenure(avgTenure, headcount, arrivedHires, Math.max(1, quarters));

        useStatsStore.getState().update({
          brandValue: corporateQ,
          brandChange: corporateQ - (stats.brandValue || 0),
          brandByCategory: nextByCategory,
          brandFloorByCategory: nextFloors,
          employeeCount: headcount,
          incomingHires: queuedHires,
          facilityTier: nextTierLevel,
          facilityBuild: nextBuild,
          avgTenureQuarters: Math.round(nextTenure * 10) / 10,
        });

        // NOT: isten cikarmanin moral bedeli asagida updateMorale icinde
        // uygulanir; burada ikinci kez dusulmemeli.

        const expenseLines = {
          cogs: totalCOGS,
          marketing: totalMarketingCost,
          storage: totalStorageCost,
          // Fasoncuya odenen — sipariş bedeli + bir kerelik hat kurulumu.
          // COGS'tan AYRI tutuluyor: oyuncunun "kendi hattim mi ucuz,
          // fason mu" sorusunu cevaplayabilmesi icin gorunur olmali.
          contractManufacturing: contractSpend,
          factoryOverhead,
          wages: wageCost,
          hiring: hiringCost,
          severance: severanceCost,
          rnd: rndSalaryCost,
          fixed: totalFixedExpenses,
          interest: interestExpense + penaltyInterest,
          tax: taxResult.tax,
        };

        const grossProfit = totalRevenue - totalCOGS;
        const operatingExpenses =
          territoryRoyalty +
          contractSpend +
          totalMarketingCost +
          totalStorageCost +
          factoryOverhead +
          wageCost +
          hiringCost +
          severanceCost +
          rndSalaryCost +
          totalFixedExpenses;
        // ==================================================================
        //  İŞTİRAKLERİN KENDİ PERFORMANSI
        // ==================================================================
        //  `evaluateSubsidiaries` yazilmisti ama HIC CAGRILMIYORDU: satin
        //  aldigin sirketlerin degeri ve stratejisi donmus duruyordu.
        // ==================================================================
        useCorporateFinanceStore.getState().evaluateSubsidiaries();

        // ==================================================================
        //  DEVRALMALARIN ÇEYREKLİK ETKİSİ
        // ==================================================================
        //  Satin alma artik tek seferlik bir islem degil, CEYREKLERE YAYILAN
        //  bir surec. Once entegrasyon maliyeti gelir, sonra hedefin kari
        //  yavas yavas akar, en son sinerji oturur. Hedef kazandirmiyorsa
        //  8. ceyrekte serefiye silinir.
        //
        //  Etki EBIT uzerinden gecer, EBIT kazanc gucune, o da degerlemeye
        //  ve hisse fiyatina. Ayri bir "hisse etkisi" formulu YOK.
        //  Bkz. core/market/mergers.ts
        // ==================================================================
        // The one place the deals actually move on. `dealEffect` was read
        // before tax, far above; this only advances the clock.
        useCorporateFinanceStore
          .getState()
          .advanceAcquisitionsQuarter(Math.max(1, quarters));

        const ebit = grossProfit - operatingExpenses + dealEffect.netEbit;

        const totalAvailableGoods = totalBeginningStock + totalProduction;
        // ------------------------------------------------------------------
        //  THE PERIOD LABEL — it read "Q2 · Year 1" nearly forever
        // ------------------------------------------------------------------
        //  The year was derived from `currentMonth`, which WRAPS to 1-12 every
        //  twelve months. So it could never exceed 1, and the `+ months` term
        //  pushed month 10 over the boundary and printed Q4 as "Year 2" - the
        //  only year it ever showed, one quarter early and then back to 1.
        //
        //  Elapsed years live in `age`, which is the field that actually
        //  counts them. Read at this point in the tick it is still the age
        //  DURING the quarter being reported, which is what the label wants.
        //  The quarter index was right all along and is untouched.
        // ------------------------------------------------------------------
        const yearsElapsed = Math.max(0, get().age - initialGameState.age);
        const quarterIndex = Math.floor(((get().currentMonth - 1) % 12) / 3) + 1;

        const quarterReport: QuarterReport = {
          periodLabel: `Q${quarterIndex} · Year ${yearsElapsed + 1}`,
          months,

          revenue: totalRevenue,
          expenses: expenseLines,
          totalExpenses,
          grossProfit,
          operatingExpenses,
          ebit,
          netProfit,
          netMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
          grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,

          unitsProduced: totalProduction,
          unitsSold: totalSales,
          endingInventory: totalEndingStock,
          sellThrough: totalAvailableGoods > 0 ? (totalSales / totalAvailableGoods) * 100 : 0,

          endingCapital: newCompanyCapital,
          endingCash: newPlayerCash,
          researchPoints: useLaboratoryStore.getState().totalRP,
          researchGained: rndRPGenerated,

          operationalSetback,
          setbackMessage,
          lostUnits: totalLostUnits,
          capacityUtilization: allocationRatio,
          lostRevenue: totalLostRevenue,
          employeeMorale: moraleResult.newMorale,

          totalMarketDemand,
          totalUnmetDemand,
          brandValue: corporateQ,
          brandChange: corporateQ - (stats.brandValue || 0),
          brandMaintenance: marketingBrand.maintenance,
          brandCeiling: tier.brandCeiling,

          // --- Borclanma ---
          creditRating: finance.getAssessment().rating,
          leverage: finance.getAssessment().leverage,
          coverage: finance.getAssessment().coverage,
          principalRepaid,
          covenantBreach: distress.stage !== 'healthy' && distress.stage !== 'watch',
          distressMessage: forcedSaleNote
            ? `${distress.message} ${forcedSaleNote}`
            : capacityBreach
              ? capacityBreach.message
              : distress.message,
          forcedSaleProceeds,
          lossCarryforward: taxResult.lossCarryforward,

          // --- CEO ucreti ---
          ceoBonusPaid: bonus.paid,
          ceoBonusBase: bonus.closed ? bonus.base : undefined,
          ceoBonusAccrued: bonus.next.profitAccrued,
          ceoBonusQuartersLeft: BONUS_PERIOD_QUARTERS - bonus.next.quartersAccrued,

          // --- Devralmalar ---
          acquisitionEbit: dealEffect.netEbit,
          acquisitionEarnings: dealEffect.earnings,
          acquisitionIntegration: dealEffect.integrationCost,
          acquisitionSynergy: dealEffect.synergy,
          acquisitionImpairment: dealEffect.impairment,

          // --- Tesis ve kadro ---
          facilityTier: tier.level,
          facilityName: tier.name,
          facilityCapacity: Math.floor(tier.capacity * Math.max(1, quarters)),
          capacityUsed: Math.floor(usedStandard),
          contractUnits: contractUnitsTotal,
          utilization: standardCapacity > 0 ? (usedStandard / standardCapacity) * 100 : 0,
          isRetooling: isBuilding,
          buildTargetTier: stats.facilityBuild?.targetTier,
          buildQuartersRemaining: stats.facilityBuild
            ? Math.max(0, stats.facilityBuild.quartersRemaining - Math.max(1, quarters))
            : undefined,

          headcount,
          crewRequired: tier.crew,
          hiresArrived: arrivedHires,
          hiresQueued: queuedHires,
          layoffs: laidOff,
          attrition,
          hiresBlocked,
          moraleEfficiency,
          moraleWageTarget: moraleResult.wageTarget,
          moraleChange: moraleResult.change,
          salaryRatio,
          overtime: overtimeOn,

          products: productBreakdownList,
        };

        set(state => ({
          ...state,
          lastQuarterReport: quarterReport,
          ceoBonusAccrual: bonus.next,
          // Only overwritten when a year actually closed, so the finance
          // screen keeps showing the last real payout for the three
          // quarters in between rather than blanking out.
          lastCeoBonus: bonus.closed
            ? { amount: bonus.paid, base: bonus.base, periodLabel: quarterReport.periodLabel }
            : state.lastCeoBonus,
        }));







        // 3. Tarihi İlerlet
        const { currentMonth, age } = get();
        let newMonth = currentMonth + months;
        let newAge = age;

        while (newMonth > 12) {
          newMonth -= 12;
          newAge += 1;
          // NPC HOOK: yaşlan tüm NPC'leri (Anne, Baba, Çocuk vs.)
          // RAFA KALDIRILDI: ilişki modülü kapalıyken NPC'ler yaşlanmaz.
          if (FEATURES.love) {
            // Shelved module: love is off, so the NPC list is empty and invisible.
        // Each of these is still a set() on a persisted store, so skipping them
        // saves a stringify and a write every quarter for nothing anyone sees.
        if (isEnabled('love')) useRelationshipStore.getState().ageUpNPCs();
          }
        }

        set(state => ({
          ...state,
          currentMonth: newMonth,
          age: newAge,
          actionsUsedThisMonth: 0,
        }));


        // 4. Aylık Flagleri Sıfırla
        get().resetMonthlyState();

        // ------------------------------------------------------------------
        //  THE INBOX QUEUE
        // ------------------------------------------------------------------
        //  Run AFTER the date advances, so a conversation scheduled "next
        //  quarter" is measured against the quarter the player has just
        //  arrived in rather than the one they left. Before the advance it
        //  would land a quarter early, which is exactly the wait that makes a
        //  large company feel large.
        //
        //  Lazy require: core/story/deliver imports the message and mail
        //  stores, and a static import here would close a cycle back into
        //  this file.
        // ------------------------------------------------------------------
        try {
            // Gifts, lobbying and quarter events all move the brother's trust
            // on the BOARD. This copies the result back into the story's
            // number so a scene next quarter reads what actually happened.
            require('../story/brother').syncBrotherDial();
        } catch (e) {
            console.warn('[story] brother sync failed', e);
        }

        // The story block used to sit here. It has moved to the END of the
        // tick - see "THE STORY READS A FINISHED QUARTER" below for why.

        // 5. Store'ları Güncelle (Yeni verileri kaydet)
        // CRITICAL FIX: Use update() instead of setState() to preserve other fields
        // ==================================================================
        //  DEGERLEME, HISSE FIYATI VE DEGISIM
        // ==================================================================
        //  ONCEDEN: `companyValue = sermaye * 1.5`. Ciro, kar, borc, marka,
        //  halka acik olmak — hicbiri degerlemeye girmiyordu. Ustelik bu
        //  satir, statsStore'daki DIGER degerleme formulunun uzerine her
        //  ceyrek yaziyordu.
        //
        //  `companyDailyChange` ise yalnizca hic cagrilmayan bir fonksiyonda
        //  guncelleniyordu; bu yuzden fiyat degisse bile ekranda hep %0.00
        //  yaziyordu. Artik gercek degisim burada hesaplaniyor.
        //  Bkz. core/market/equity.ts
        // ==================================================================
        // Tembel erisim: import dongusunu onlemek icin (bkz. useStatsStore)
        const capTable = require('../../features/shareholders/stores/useShareholderStore')
          .useShareholderStore.getState();
        const capShares = capTable.totalShares || TOTAL_SHARES_DEFAULT;
        const playerShares = capTable.playerShareCount ?? 0;

        // TTM: son dort ceyregin toplami. Bu ceyregi listeye ekle.
        const revHistory = [...(stats.revenueHistory ?? []), totalRevenue].slice(-4);
        const ebitHistory = [...(stats.ebitHistory ?? []), ebit].slice(-4);

        // KAZANC GUCU: piyasa gerceklesen kari degil, beklenen kazanc
        // gucunu fiyatlar. Ham TTM iki buyuk sayinin farki oldugu icin
        // asiri gurultuludur; ciro %10 oynayinca kar %50 oynayabilir.
        // Bkz. core/market/equity.ts -> updateEarningsPower
        const earningsPower = updateEarningsPower(
          stats.earningsPower || null,
          trailingTotal(ebitHistory),
        );

        const isPublicNow = !!stats.isPublic;
        const valuation = companyValuation({
          // Tesis + laboratuvar + istirakler. Karli sirkette hicbir etkisi
          // yok (kazanc carpani zaten buyuk); yalnizca zorda olani korur.
          tangibleAssets: (() => {
            const t = getTier(useStatsStore.getState().facilityTier || 1);
            const plant = (t.upgradeCost || 0) * 1.6;
            const subs = useCorporateFinanceStore.getState().subsidiaries
              .reduce((sum, x) => sum + (x.valuation || 0), 0);
            return plant + subs;
          })(),
          cash: newCompanyCapital,
          ttmRevenue: trailingTotal(revHistory),
          ttmEbit: earningsPower,
          debt: stats.companyDebtTotal || 0,
          isPublic: isPublicNow,
          brandValue: brandIdx,
          // Pay carpani: kazanc kalitesi. Bkz. core/market/equity.ts
          marketShare: totalPlayerShare,
        }).total;

        // Piyasa duygusu carpani her ceyrek 1.0'a dogru soner. IPO coskusu
        // veya seyreltme panigi kalici degildir — once sonumleme yoktu ve
        // halka arzdan sonra fiyat sonsuza kadar sisik kaliyordu.
        const equity = useEquityStore.getState();
        const nextMultiplier = decaySentiment(equity.marketMultiplier ?? 1);
        useEquityStore.setState({ marketMultiplier: nextMultiplier });

        const fairPrice = equitySharePrice(valuation, capShares) * nextMultiplier;
        const prevPrice = stats.companySharePrice || stats.previousSharePrice || fairPrice;

        // Piyasa yeni bilgiyi aninda tam fiyatlamaz. Ozel sirket yavas
        // (deger ancak turlarda guncellenir), halka acik hizli + duygu bandi.
        //
        // OLCEK DE ONEMLI: dev sirket kucuk sirket gibi oynamaz. Cesitlenme,
        // likidite ve kurumsal sahiplik soku yutar. Bkz. volatilityDamping.
        // KALDIRAC HISSEYI DAHA OYNAK YAPAR.
        // Faaliyet kari oynadiginda sabit faiz gideri dususu buyutur —
        // finansta "kaldiracli beta". Yani borcun bedeli yalnizca faiz
        // degil, her ceyregin daha sert gecmesi.
        const assessment = finance.getAssessment();
        const leverageVol = leverageVolatilityMultiplier(assessment.leverage);
        // Sonumlemeyi kaldirac oraninda ZAYIFLATARAK oynakligi artir.
        // MARKA ISTIKRAR SAGLAR: guclu markali sirketin hissesi daha az
        // oynar, cunku yatirimci kotu ceyregi "gecici" diye okur. Finansta
        // "kalite primi" denir. leverageVol ile ters yonde calisir.
        const brandStability = brandStabilityFactor(brandIdx);
        const marketCap = valuation / (leverageVol * brandStability);
        let newSharePrice = smoothPrice(prevPrice, fairPrice, isPublicNow, marketCap);
        if (isPublicNow) newSharePrice = applySentiment(newSharePrice, Math.random(), marketCap);

        const changePercent = priceChangePercent(prevPrice, newSharePrice);

        const ownership = ownershipPercent(playerShares, capShares);

        useStatsStore.getState().update({
          companyCapital: newCompanyCapital,
          money: newPlayerCash,
          monthlyIncome: baseSalary,
          monthlyExpenses: baseExpenses,
          companyValue: valuation,
          companySharePrice: newSharePrice,
          previousSharePrice: prevPrice,
          companyDailyChange: changePercent,
          companyOwnership: ownership,
          netWorth: newPlayerCash + valuation * (ownership / 100),
          revenueHistory: revHistory,
          ebitHistory: ebitHistory,
          earningsPower,
          lossCarryforward: taxResult.lossCarryforward,
          creditRatingPrev: nowRating,
        });

        // ==================================================================
        //  KURUL TEPKİSİ
        // ==================================================================
        //  `evaluatePlayerAction` yazilmisti ama HIC CAGRILMIYORDU: kurul
        //  uyeleri oyuncunun ne yaptigina hic tepki vermiyordu, guven
        //  seviyeleri baslangictaki degerde donmus kaliyordu.
        //
        //  Artik her ceyrek, o ceyrekte yaptigin en belirgin hamle kurula
        //  bildirilir. Nakit yigmak da bir karardir ve kurul bundan
        //  hoslanmaz — gercek hayatta da hissedarlar atil sermayeden
        //  sikayet eder.
        // ==================================================================
        //  ARTIK TAHMIN YOK.
        //
        //  Once motor "en belirgin hamle neydi" diye TAHMIN edip dort
        //  secenekten birini yolluyordu. O ceyrekte tefeciden borc almis,
        //  200 kisi cikarmis ve halka acilmis olabilirsin — kurul yalnizca
        //  'ACQUISITION' duyuyordu.
        //
        //  Simdi her hamle KENDI BUYUKLUGUYLE bildiriliyor. Buyukluk
        //  sirketin olcegine gore normalize: "kac dolar" degil, "senin
        //  icin ne kadar buyuk bir hamleydi".
        try {
          const shStore = require('../../features/shareholders/stores/useShareholderStore')
            .useShareholderStore;
          const sh = shStore.getState();

          // Baglam: ayni hamle farkli durumda farkli okunur.
          const fmtMoney = require('../utils').formatMoney;
          const priceHist = useEquityStore.getState().priceHistory || [];
          const peak = priceHist.length ? Math.max(...priceHist, newSharePrice) : newSharePrice;
          const currentMonthVal = get().currentMonth;
          const absoluteQuarter = Math.ceil(currentMonthVal / 3);
          const boardCtx = {
            profitable: netProfit > 0,
            leverage: assessment.leverage === Infinity ? 99 : assessment.leverage,
            inBreach: assessment.inBreach,
            lossStreak: netProfit > 0 ? 0 : ((stats as any).lossStreak || 0) + 1,
            priceVsPeak: peak > 0 ? newSharePrice / peak : 1,
            currentMonth: currentMonthVal,
            quarter: absoluteQuarter,
          };

          const events: { kind: string; magnitude: number; label: string }[] = [];
          const scale = Math.max(1, Math.abs(totalRevenue) || 1);

          // --- Ceyregin sonucu her zaman bildirilir
          if (netProfit > 0) {
            events.push({
              kind: 'quarter_profit',
              magnitude: Math.min(1, netProfit / scale * 4),
              label: `Profitable quarter: ${fmtMoney(netProfit)}`,
            });
          } else {
            events.push({
              kind: 'quarter_loss',
              magnitude: Math.min(1, Math.abs(netProfit) / scale * 4),
              label: `Loss of ${fmtMoney(Math.abs(netProfit))}`,
            });
          }

          // --- Devralma
          if (dealEffect.netEbit !== 0) {
            events.push({
              kind: 'acquisition',
              magnitude: Math.min(1, Math.abs(dealEffect.netEbit) / scale * 3),
              label: 'An acquisition moved through the books this quarter',
            });
          }

          // --- Temettu / ikramiye
          if (get().bonusDistributedThisQuarter) {
            events.push({
              kind: 'dividend',
              magnitude: 0.6,
              label: 'Cash was paid out to shareholders',
            });
          }

          // --- Isten cikarma: kadronun yuzdesi olarak
          if (laidOff > 0 && headcount > 0) {
            events.push({
              kind: 'layoffs',
              magnitude: Math.min(1, laidOff / Math.max(1, headcount + laidOff) * 2),
              label: `${laidOff} people were let go`,
            });
          }

          // --- Tesis yatirimi
          if (nextBuild && !stats.facilityBuild) {
            events.push({
              kind: 'capex',
              magnitude: 0.7,
              label: 'A major plant investment was committed',
            });
          }

          // --- Fason kaymasi: uretimin ne kadari disarida
          if (contractUnitsTotal > 0 && totalProduction > 0) {
            const share = contractUnitsTotal / totalProduction;
            if (share > 0.15) {
              events.push({
                kind: 'outsourcing',
                magnitude: Math.min(1, share),
                label: `${(share * 100).toFixed(0)}% of production is now outsourced`,
              });
            }
          }

          // --- Sozlesme ve not
          if (assessment.inBreach) {
            events.push({ kind: 'covenant_breach', magnitude: 1, label: 'The company breached its covenants' });
          }
          if ((stats as any).creditRatingPrev && (stats as any).creditRatingPrev !== assessment.rating) {
            const order = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'D'];
            if (order.indexOf(assessment.rating) > order.indexOf((stats as any).creditRatingPrev)) {
              events.push({
                kind: 'rating_downgrade',
                magnitude: 0.8,
                label: `Credit rating fell to ${assessment.rating}`,
              });
            }
          }

          // --- Atil nakit: hicbir sey yapmamak da bir karardir
          const idleCash = (useStatsStore.getState().companyCapital || 0);
          if (events.length === 1 && idleCash > scale * 2) {
            events.push({
              kind: 'hold_cash',
              magnitude: Math.min(1, idleCash / (scale * 6)),
              label: 'Cash is piling up and nothing is being done with it',
            });
          }

          // ------------------------------------------------------------------
          //  SHARK LOANS COME DUE
          // ------------------------------------------------------------------
          //  This call is the point of the whole enforcer, and its absence is
          //  why the loan was free money: the module existed, was typed, and
          //  no file imported it. Marcus handed out cash and never collected.
          //
          //  Placed here, before the board reacts, so a default lands in the
          //  SAME quarter's board pass rather than a later one. Losing shares
          //  to your own board member is exactly the kind of thing the board
          //  should have an opinion about.
          // ------------------------------------------------------------------
          const { currentMonth: dueMonth, age: dueAge } = get();
          const sharkDefaults = enforceSharkDeadlines(
            absoluteMonth(dueAge, dueMonth),
            useEquityStore.getState().stockPrice,
          );
          for (const d of sharkDefaults) {
            events.push({
              kind: 'covenant_breach',
              magnitude: 1,
              label: `${d.lenderName} seized ${Math.round(d.seizedShareCount).toLocaleString()} shares over an unpaid loan`,
            });
          }

          sh.resetQuarterlyBoard();
          events.forEach(e => sh.applyBoardEvent(e as any, boardCtx));

          // --- Vadesi gelen sozler
          // ----------------------------------------------------------------
          //  SÖZLER — beş tür var, önce YALNIZCA BİRİ kontrol ediliyordu
          // ----------------------------------------------------------------
          //  Yani bir uye kurul koltugu ya da seyreltmeme sozu istediyse ve
          //  sen soz verdiysen, o soz bir sonraki ceyrekte OTOMATIK
          //  BOZULMUS sayiliyordu — hicbir sey yapmasan bile −25 guven.
          //  Oyuncuyu tutabilecegi bir sozu tutmadigi icin cezalandiran
          //  bir hataydi. Artik besi de gercekten olculuyor.
          // ----------------------------------------------------------------
          const keptKinds: string[] = [];
          if (get().bonusDistributedThisQuarter) keptKinds.push('dividend_next');

          const capNow = require('../../features/shareholders/stores/useShareholderStore')
            .useShareholderStore.getState();
          // Seyreltmeme sozu: toplam hisse artmadiysa tutulmustur.
          if ((stats.totalSharesPrev ?? capNow.totalShares) >= capNow.totalShares) {
            keptKinds.push('no_dilution');
          }
          // Borc azaltma sozu: bu ceyrek borc gercekten dustuyse.
          if ((useStatsStore.getState().companyDebtTotal || 0) < (stats.companyDebtTotal || 0)) {
            keptKinds.push('reduce_debt');
          }
          // Koltuk ve hisse verme sozleri ANINDA yerine getirilir (verilmis
          // ya da verilmemistir), o yuzden verildikleri anda kapanirlar —
          // burada ayrica olculmezler.
          keptKinds.push('board_seat', 'share_grant');

          sh.settlePromises(quarterIndex, keptKinds as any, boardCtx);

          useStatsStore.getState().update({ totalSharesPrev: capNow.totalShares } as any);

          // ================================================================
          //  GUVENSIZLIK OYU
          // ================================================================
          //  Uc kosul BIRDEN gerekiyor: cogunlugu kaybetmis olacaksin,
          //  kurul guveni cokmus olacak VE performans kotu olacak. Tek
          //  bir kotu ceyrek kimseyi koltugundan etmemeli — gorevden
          //  alinma uzun sure ihmal edilmis bir iliskinin sonucudur.
          // ================================================================
          // ================================================================
          //  KURULUN KENDI GUNDEMI
          // ================================================================
          //  Guvensizlik oyundan ONCE calisir: karsilanan/ihmal edilen
          //  talebin guven etkisi ayni ceyrekte hesaba katilsin diye.
          //  Kurul artik sessiz oturmuyor — senden bir sey istiyor.
          try {
            const dmdCtx = {
              ...boardCtx,
              cash: stats.money || 0,
              revenue: totalRevenue || 0,
              debt: useStatsStore.getState().companyDebtTotal || 0,
              marketShare: totalPlayerShare || 0,
              // Ar-Ge harcamasi uydurma bir alan degil: laboratuvarda
              // gercekten arastirmaci calistiriyor musun?
              rndSpend: (() => {
                try {
                  const lab = require('./useLaboratoryStore').useLaboratoryStore.getState();
                  const econ = require('../../features/laboratory/data/laboratoryData').RESEARCHER_ECONOMICS;
                  return (lab.researcherCount || 0) * (econ?.SALARY_PER_QUARTER || 0);
                } catch { return 0; }
              })(),
            };
            const dr = shStore.getState().reviewDemands(dmdCtx as any, quarterIndex);
            if (dr.raised) {
              useStatsStore.getState().update({
                boardDemandNotice: require('../i18n').t('board.demand_' + dr.raised.kind, { v1: dr.raised.raisedByName }),
              } as any);
            }
          } catch (e) { console.warn('[Board] demand review failed', e); }

          const nc = shStore.getState().runNoConfidence(boardCtx, absoluteQuarter);
          if (nc.called) {
            useStatsStore.getState().update({
              distressMessage: nc.result?.summary,
            } as any);
          }

          useStatsStore.getState().update({
            lossStreak: boardCtx.lossStreak,
          } as any);
        } catch (err) { console.warn('[Board] quarterly governance failed', err); }



        // 6. Yan Etkileri Tetikle (Eventler vs.)
        simulateNewMonth();

        AchievementChecker.checkAllAchievementsAfterStateChange();

        // ==================================================================
        //  7. MORAL — bakim seviyesi modeli
        // ==================================================================
        //  ESKIDEN: ceyrek basina sabit -5, yuksek maas +15, dusuk -15.
        //  Yani ortalama maas kacinilmaz cokus, yuksek maas 3 ceyrekte
        //  kalici 100 demekti. Ikisi de karar degildi.
        //
        //  SIMDI: maas orani bir HEDEF belirler (piyasada odersen 70,
        //  en fazla 85) ve moral ona dogru yurur. Kalani etkinlik,
        //  ikramiye ve isten cikarmalarla oynar.
        //  Bkz. core/market/workforce.ts -> updateMorale
        // ==================================================================
        if (months >= 3) {
          const newMorale = moraleResult.newMorale;

          set(state => ({
            ...state,
            employeeMorale: newMorale,
            quarterStartSalaryRatio: stats.salaryRatio ?? 1.0,
            pendingPayCutShock: 0,
            eventsHostedThisQuarter: 0,
            lastQuarterProfit: netProfit,
            bonusDistributedThisQuarter: false,
          }));

          // ==============================================================
          //  THE STORY READS A FINISHED QUARTER
          // ==============================================================
          //  This block used to run four hundred lines earlier, straight
          //  after the date advanced. The date was right and NOTHING ELSE
          //  WAS: company capital is written at the stats update below it,
          //  morale on the line above this comment. So every condition a
          //  scene asked about money or morale was answered with LAST
          //  quarter's figure while `quarter` said this one.
          //
          //  Found by the morale beat arriving a quarter late. Morale
          //  crossed the threshold in Q3 and the father turned up in Q4,
          //  because in Q3 the story was still looking at Q2's number. A
          //  one-quarter lag on everything, and nothing would ever have
          //  reported it - the scenes all still fire, just late.
          //
          //  Now it runs last. The quarter is fully resolved - money moved,
          //  morale settled, valuation written - and the story reacts to
          //  the world the player is about to see rather than the one they
          //  have just left.
          //
          //  ORDER WITHIN THE BLOCK MATTERS TOO:
          //    events        - roll, publish the headline, queue the scene
          //    tutorial      - queue the scene belonging to the live lock
          //    inbox         - drain the queue, honouring the allowance
          //  so anything queued above can be delivered in the same quarter
          //  if there is room for it. Events queue rather than push in: the
          //  allowance belongs to the story and a dice roll must not
          //  displace a beat somebody wrote.
          // ==============================================================
          // ==============================================================
          //  WHO YOU WERE SEEN SELLING TO
          // ==============================================================
          //  Before the roll, because the entry flag it raises is the gate
          //  on the letter that the roll may fire in this same quarter. The
          //  other order costs the player a quarter for nothing and would
          //  look exactly like the events being slow.
          //
          //  Off UNITS SOLD, not off owning a product: a design nobody has
          //  shipped is not a territorial fact and the incumbent has no way
          //  of knowing about it. `soldByCategory` is built above from the
          //  quarter's real deliveries.
          //
          //  Sieges tick down here too, in the same block, because both are
          //  the same subject and splitting them is how one of them ends up
          //  running in a branch the other does not.
          // ==============================================================
          try {
            const territory = require('../market/territory');
            const story = require('./useStoryStore').useStoryStore.getState();
            const entered = territory.entriesThisQuarter(
              soldByCategory,
              (flag: string) => !!story.flags[flag],
            );
            entered.forEach((flag: string) => story.raise(flag));
            require('./useTerritoryStore').useTerritoryStore
              .getState().advance(Math.max(1, quarters));
          } catch (e) {
            console.warn('[territory] entry check failed', e);
          }

          // ==============================================================
          //  A CONVICTION DOES NOT WEAR OFF
          // ==============================================================
          //  SHELVED: a per-quarter brand drain used to live here and it did
          //  nothing. Measured over four quarters, a convicted company came
          //  out at 21.5 against a clean company's 21.3 - brand mean-reverts
          //  towards a target every tick, so subtracting from the VALUE is
          //  erased within two or three quarters. Same mistake as writing a
          //  divestiture price without an anchor.
          //
          //  The penalty is now on the CEILING, applied where updateBrand is
          //  called above. Durable by construction: the company can still
          //  climb and can never climb as high as it would have.
          // ==============================================================
          // ==============================================================
          //  TWO COUNTERS AND ONE BILL
          // ==============================================================
          //  Before the roll, because the casino streak this closes is the
          //  gate on the scandal that the roll may fire in the same quarter.
          //  The other order costs the player a quarter for nothing and looks
          //  exactly like the event being slow.
          // ==============================================================
          try {
            require('./useCasinoRiskStore').useCasinoRiskStore
              .getState().closeQuarter(Math.max(1, quarters));
          } catch (e) {
            console.warn('[casino] quarter could not be closed', e);
          }

          try {
            const sponsorship = require('./useSponsorshipStore').useSponsorshipStore;
            const due = sponsorship.getState().advance(Math.max(1, quarters));
            if (due.cost > 0) {
              const st = useStatsStore.getState();
              st.update({ companyCapital: (st.companyCapital || 0) - due.cost });
            }
            if (due.brand > 0) {
              require('../story/gameSink').gameSink().brand(due.brand);
            }
          } catch (e) {
            console.warn('[sponsorship] quarter could not be advanced', e);
          }

          try {
            require('../events/runQuarter').runEvents();
          } catch (e) {
            console.warn('[events] roll failed', e);
          }

          try {
            const currentQ = Math.max(1, Math.ceil((get().currentMonth || 1) / 3));
            require('../news/newsEngine').generateQuarterlyNews(currentQ);
          } catch (e) {
            console.warn('[news] quarterly news generation failed', e);
          }

          // Beats whose moment has come - the father's death is the first.
          // Before the tutorial check, because a beat can lift every lock and
          // there is no sense queueing an explanation for one that is about
          // to stop existing.
          try {
            require('../story/deliver').runStoryBeats();
          } catch (e) {
            console.warn('[story] beat could not be queued', e);
          }

          try {
            require('../story/deliver').runTutorialScenes();
          } catch (e) {
            console.warn('[tutorial] scene could not be queued', e);
          }

          // ==============================================================
          //  THE POST ARRIVES
          // ==============================================================
          //  Before runInbox and after everything else, and both halves of
          //  that placement are deliberate.
          //
          //  AFTER the quarter's maths, because a reply is decided by a
          //  resistance score frozen when the letter was SENT - but the
          //  premium the player will be quoted if they go hostile reads the
          //  valuation this tick just wrote.
          //
          //  BEFORE runInbox only because it posts mail directly rather than
          //  through the story queue, so it cannot take an allowance slot
          //  from a beat. A reply the player has been waiting a whole
          //  quarter for should not be held back by two condolence letters.
          // ==============================================================
          try {
            require('../market/postNegotiationReplies').postDueReplies();
          } catch (e) {
            console.warn('[negotiation] replies could not be posted', e);
          }

          try {
            require('../market/postSponsorOffer')
              .postSponsorOffer(require('../story/world').currentQuarter());
          } catch (e) {
            console.warn('[sponsorship] offer could not be posted', e);
          }

          try {
            require('../story/deliver').runInbox();
          } catch (e) {
            console.warn('[story] inbox could not run', e);
          }

          // ------------------------------------------------------------------
          //  AND THEN THE PEOPLE NOBODY ANSWERED
          // ------------------------------------------------------------------
          //  AFTER runInbox, and the order is the whole of it: a scene
          //  delivered this morning has not been ignored. Chasing first would
          //  have somebody complaining about a silence they broke in the same
          //  tick. See core/story/runNeglect.ts.
          // ------------------------------------------------------------------
          try {
            require('../story/runNeglect').runNeglect();
          } catch (e) {
            console.warn('[story] neglect could not run', e);
          }

          // NPC HOOK: çeyrek sıfırla (madeLoveThisQuarter → false)
          if (FEATURES.love) {
            if (isEnabled('love')) useRelationshipStore.getState().advanceQuarterForNPCs();
          }


          // 7a. MARKET SIMULATION (NEW)
          // Simulate market for each quarter that passed
          for (let q = 0; q < quarters; q++) {
            useMarketStore.getState().simulateQuarter();
          }



          // 7b. STAT DECAY LOGIC (Paslanma Kuralı)
          // "İşleyen demir ışıldar, işlemeyen paslanır."
          const playerStore = usePlayerStore.getState();
          const currentAttributes = playerStore.attributes;
          const decay = calculateStatDecay(currentAttributes);

          // Apply Decay (Batched into a single state update)
          const updatedAttributes = { ...currentAttributes };
          let hasDecay = false;
          Object.entries(decay).forEach(([stat, value]) => {
            if (value < 0) {
              const currentVal = currentAttributes[stat as keyof typeof currentAttributes] ?? 0;
              (updatedAttributes as any)[stat] = Math.max(0, currentVal + value);
              hasDecay = true;
            }
          });
          if (hasDecay) {
            playerStore.setAll({ attributes: updatedAttributes });
          }

          // 7c. PARTNER BUFFS (Gelişmiş Partner Sistemi)
          // RAFA KALDIRILDI: ilişki modülü kapalıyken partner statlara dokunmaz.
          // Same store as the upkeep above and as every screen. There were
          // two, and this read the empty one.
          const buffPartner = FEATURES.love
            ? require('./useFamilyStore').useFamilyStore.getState().partner
            : null;
          if (buffPartner) {
            // ------------------------------------------------------------
            //  WHAT BEING SEEN WITH THEM DOES, AND WHAT THEY OFFER
            // ------------------------------------------------------------
            //  Two of the eight PartnerStats fields that nothing read. See
            //  features/love/logic/partnerEffects.ts for the reasoning; the
            //  short version is that a field which touches no number is not
            //  a field, it is a label on a card.
            //
            //  The AID is an OFFER, posted as a message, not a deposit. Money
            //  appearing because a hidden percentage came up is the exact
            //  shape this project has spent weeks removing elsewhere: the
            //  player cannot connect a number to a cause they never saw.
            // ------------------------------------------------------------
            try {
              const {
                reputationDrift, aidOffer,
              } = require('../../features/love/logic/partnerEffects');

              const drift = reputationDrift(buffPartner);
              if (drift) {
                require('./useStoryStore').useStoryStore
                  .getState().nudge('publicReputation', drift);
              }

              const offer = aidOffer(buffPartner, useStatsStore.getState().money || 0);
              if (offer) {
                require('./useMessageStore').useMessageStore.getState().sendFromCharacter(
                  { id: 'partner', name: offer.from, role: 'Partner' },
                  `I looked at the account, which I know I am not supposed to do.\n\nI can put in ${Math.round(offer.amount).toLocaleString()} and I would rather do it now than after you have had to ask. Say the word and it is done.`,
                  get().currentMonth,
                );
              }
            } catch (e) {
              console.warn('[partner] quarterly effects could not run', e);
            }

            const { changes, notification } = applyPartnerBuffs(buffPartner);

            if (notification) {

              // Show notification in report if no crisis
              if (!operationalSetback) {
                setbackMessage = notification;
              }
            }

            // Apply Stats
            if (changes.attributes) {
              Object.entries(changes.attributes).forEach(([k, v]) =>
                playerStore.updateAttribute(k as any, (playerStore.attributes[k as keyof typeof playerStore.attributes] || 0) + (v as number))
              );
            }
            if (changes.core) {
              Object.entries(changes.core).forEach(([k, v]) =>
                playerStore.updateCore(k as any, (playerStore.core[k as keyof typeof playerStore.core] || 0) + (v as number))
              );
            }
            if (changes.reputation) {
              Object.entries(changes.reputation).forEach(([k, v]) =>
                playerStore.updateReputation(k as any, (playerStore.reputation[k as keyof typeof playerStore.reputation] || 0) + (v as number))
              );
            }
            if (changes.personality) {
              playerStore.setAll({ personality: { ...playerStore.personality, ...changes.personality } });
            }
            if (changes.money) {
              useStatsStore.getState().update({ money: (useStatsStore.getState().money || 0) + changes.money });
            }

            // New Integration: Security, Skills, Hidden
            if (changes.security) {
              Object.entries(changes.security).forEach(([k, v]) => {
                playerStore.updateSecurity(k as any, (playerStore.security[k as keyof typeof playerStore.security] || 0) + (v as number));
              });
            }
            if (changes.skills) {
              if (changes.skills.martialArts) {
                playerStore.updateSkill('martialArts', {
                  progress: (playerStore.skills.martialArts.progress || 0) + (changes.skills.martialArts.progress || 0)
                });
              }
            }
            if (changes.hidden) {
              Object.entries(changes.hidden).forEach(([k, v]) => {
                playerStore.updateHidden(k as any, (playerStore.hidden[k as keyof typeof playerStore.hidden] || 0) + (v as number));
              });
            }

          }

          // 7d. EDUCATION ADVANCEMENT — behind the flag like every other
          //     shelved module. The require() pulled in the education store and
          //     advanced a degree nobody could enrol in.
          if (isEnabled('education')) {
            const { useEducationStore } = require('./useEducationStore'); // Safe import
            const eduResult = useEducationStore.getState().advanceProgress();

            if (eduResult.message) {
              // Report to UI if significant (graduation) or just progress
              if (!setbackMessage && !operationalSetback) {
                setbackMessage = eduResult.message;
              }
            }
          }

          // 7e. GYM QUARTERLY RESET — shelved module, skipped while the flag is off.
          // It was clearing fatigue on a screen nobody can open, and paying for
          // it with a persisted write every quarter.
          if (isEnabled('gym')) {
          const userStore = useUserStore.getState();
          userStore.updateGymState({
            combatStrength: 0, // Reset fatigue to 0%
          });
            console.log('[Gym] Quarterly reset: Fatigue cleared to 0%');
          }

          // 7f. BLACK MARKET QUARTERLY LOGIC — shelved module. Two persisted
          //     writes a quarter for a screen that cannot be opened.
          // Note: playerStore variable is already declared above (around line 415)
          const { blackMarket } = playerStore;

          // Reset quarterly usage
          if (isEnabled('blackMarket') && blackMarket) {
            playerStore.updateBlackMarket('quarterlyDrugUsage', 0);

            // Decay Suspicion (90% reduction)
            const currentSuspicion = blackMarket.suspicion || 0;
            const decayedSuspicion = Math.floor(currentSuspicion * 0.10);
            playerStore.updateBlackMarket('suspicion', decayedSuspicion);

            console.log(`[BlackMarket] Quarterly Reset: Usage=0, Suspicion Decay: ${currentSuspicion} -> ${decayedSuspicion}`);
          }
        }

        // 8. ANNUAL GYM MEMBERSHIP PAYMENT — shelved module. The require()
        //    alone pulled in a whole feature file every January for a
        //    membership the player cannot buy.
        if (isEnabled('gym') && newMonth === 1) { // January
          const userStore = useUserStore.getState();
          const { membership } = userStore.gymState;

          if (membership) { // Check if membership exists (not null)
            const { MEMBERSHIP_PRICING } = require('../../features/life/components/Gym/useGymSystem');
            const annualCost = MEMBERSHIP_PRICING[membership].annual;

            // Try to deduct payment
            const statsStore = useStatsStore.getState();
            if (statsStore.spendMoney(annualCost)) {
              console.log(`[Gym] Annual ${membership} membership renewed: $${annualCost.toLocaleString()}`);
            } else {
              // Insufficient funds - cancel membership
              userStore.updateGymState({ membership: null });
              console.warn(`[Gym] Membership cancelled due to insufficient funds.`);

              // Add to setback message if not already set
              if (!setbackMessage && !operationalSetback) {
                setbackMessage = `Your gym membership was cancelled due to insufficient funds.`;
              }
            }
          }
        }

        // 8b. ANNUAL FAMILY LIFECYCLE & HEIR AGING
        if (newMonth === 1) {
          try {
            require('./useFamilyStore').useFamilyStore.getState().ageUpFamily();
          } catch (e) {
            console.warn('[Family] Age-up failed', e);
          }
        }

        // 9. Sonucu UI'ın beklediği formatta döndür
        const result: EconomyResult = {
          status: (() => {
            // Kurul seni indirdiyse sirket ayakta olsa bile oyun biter.
            try {
              const removed = require('../../features/shareholders/stores/useShareholderStore')
                .useShareholderStore.getState().ceoRemoved;
              if (removed) {
                // ------------------------------------------------------
                //  THE VERDICT IS NOT THE LAST THING THE PLAYER READS
                // ------------------------------------------------------
                //  Routed through the endings system so the removal screen
                //  carries the brother's message rather than a line from the
                //  translation file. It had to go in the ENDING rather than
                //  into Messages: the overlay covers the app the moment this
                //  tick finishes, so a delivered message would be found
                //  afterwards, as an artefact, instead of read first.
                //
                //  See data/story/endings.ts - and note the timestamps.
                // ------------------------------------------------------
                try {
                  require('./useStoryStore').useStoryStore.getState().endGame('removedByBoard');
                } catch { /* story store not ready - the screen still ends it */ }
                return 'removed' as const;
              }
            } catch { /* kurul durumu okunamadi */ }
            return newCompanyCapital < 0 ? 'bankrupt' as const : 'active' as const;
          })(),
          reason: newCompanyCapital < 0 ? 'Company capital is negative' : undefined,
          data: {
            // Rapor verileri (Dynamic calculations)
            reportTotalProduction: totalProduction,
            reportTotalSales: totalSales,
            reportTotalRevenue: totalRevenue,
            reportTotalExpenses: totalExpenses,
            reportNetProfit: netProfit,
            reportTotalInventory: totalEndingStock, // NEW: Stock tracking
            reportCurrentRP: useLaboratoryStore.getState().totalRP,
            operationalSetback,
            setbackMessage,
            lostRevenue: totalLostRevenue,
            lostUnits: totalLostUnits,

            // Güncel Bakiye Verileri
            playerCash: newPlayerCash,
            companyCapital: newCompanyCapital,

            // Diğerleri (Stats store'dan veya hesaplamadan)
            // Ayni degerleme — `sermaye * 1.5` kalintisi temizlendi.
            playerNetWorth: newPlayerCash + valuation * (ownership / 100),
            playerIncome: baseSalary,
            playerExpenses: baseExpenses,
            companyValuation: valuation,
            productBreakdown: productBreakdownList
          }
        };



        return result;
      },
      distributeBonus: () => {
        const { lastQuarterProfit, employeeMorale, bonusDistributedThisQuarter } = get();
        if (bonusDistributedThisQuarter) return;

        const { companyCapital, update } = useStatsStore.getState();

        const bonusAmount = lastQuarterProfit * 0.05;

        // Checks
        if (lastQuarterProfit <= 0) return;
        if (companyCapital < bonusAmount) return;

        // Apply
        update({ companyCapital: companyCapital - bonusAmount });
        set({ employeeMorale: Math.min(100, employeeMorale + 15), bonusDistributedThisQuarter: true });

        // The teaching lock clears on the ACTION, not on the screen opening.
        // Raised here, at the point the money actually leaves, so it cannot
        // be satisfied by looking at the page.
        try {
          require('./useStoryStore').useStoryStore.getState().raise('tutorialBonusPaid');
        } catch { /* story store not ready */ }
      },

      /**
       * Etkinlik duzenler.
       *
       * ONEMLI: maliyet KISI BASI. Sabit fiyatliyken 22 kisilik sirkette
       * de 12.652 kisilik sirkette de ayni parayi oduyordun, yani
       * buyudukce moral bedavaya geliyordu.
       *
       * Ayni ceyrekteki ikinci etkinlik YARI eder — arka arkaya gala
       * vererek moral satin alinamaz.
       */
      organizeEvent: (eventId: string) => {
        const currentState = get();
        if (currentState.eventsHostedThisQuarter >= MAX_EVENTS_PER_QUARTER) {
          return { success: false, message: 'You have already used this quarter\'s events.' };
        }

        const event = TEAM_EVENTS.find(e => e.id === eventId);
        if (!event) return { success: false, message: 'Unknown event.' };

        const stats = useStatsStore.getState();
        const headcount = stats.employeeCount || 0;
        const cost = eventCost(event, headcount);

        if (stats.companyCapital < cost) {
          return { success: false, message: 'Not enough company capital.' };
        }

        const gain = eventMoraleGain(event, currentState.eventsHostedThisQuarter);
        stats.update({ companyCapital: stats.companyCapital - cost });
        set(state => ({
          ...state,
          employeeMorale: Math.min(100, state.employeeMorale + gain),
          eventsHostedThisQuarter: state.eventsHostedThisQuarter + 1,
        }));
        return { success: true, message: `${event.name}: +${gain} morale for ${headcount} people.` };
      },

      /** Fazla mesaiyi acar/kapatir. */
      setOvertime: (enabled: boolean) => set(state => ({ ...state, overtimeEnabled: enabled })),

      /**
       * Maas oranini degistirir.
       * Ceyrek basindaki fiili maasa gore ASAGI inmek ceyrek sonunda moral cezasi getirir.
       * Ayni ceyrek icinde yapilan artirip azaltmalar gereksiz ceza olusturmaz.
       */
      setSalaryRatio: (ratio: number) => {
        const stats = useStatsStore.getState();
        const baseline = get().quarterStartSalaryRatio ?? stats.salaryRatio ?? 1.0;
        const shock = payCutShock(baseline, ratio);
        stats.setSalaryRatio(ratio);
        set(state => ({ ...state, pendingPayCutShock: shock }));
      },

      setSalaryPolicy: (policy) => {
        set(state => ({ ...state, salaryPolicy: policy }));
      },

      /**
       * Artik src/core/newGame.ts icindeki startNewGame()'e devrediyor.
       *
       * Eskiden burada elle 7 AsyncStorage anahtari siliniyordu; ikisinin adi
       * yanlisti ve 20+ store'un cogu hic temizlenmiyordu, yani "yeni oyun"
       * eski veriyle basliyordu. Tek liste tek yerde durmali.
       *
       * Dinamik require kullaniliyor: newGame.ts bu store'u import ediyor,
       * statik import donguye yol acar.
       */
      resetGame: async () => {
        const { startNewGame } = require('../newGame');
        await startNewGame();

        useStatsStore.getState().setHasHydrated(true); // UI donmasin

        // NPC HOOK: yeni oyunda anne ve babayı oluştur
        if (FEATURES.love) {
          useRelationshipStore.getState().generateParents();
        }
      },

    }),
    {
      name: 'succesor_game_v2',
      storage: createJSONStorage(() => zustandStorage),
      partialize: state => ({
        currentMonth: state.currentMonth,
        age: state.age,
        employeeMorale: state.employeeMorale,
        salaryPolicy: state.salaryPolicy,
        overtimeEnabled: state.overtimeEnabled,
        pendingPayCutShock: state.pendingPayCutShock,
        eventsHostedThisQuarter: state.eventsHostedThisQuarter,
        lastQuarterProfit: state.lastQuarterProfit,
        bonusDistributedThisQuarter: state.bonusDistributedThisQuarter,
        // The bonus year is four quarters long, so it MUST survive a
        // restart - otherwise closing the app resets the counter and the
        // payout never arrives.
        ceoBonusAccrual: state.ceoBonusAccrual,
        lastCeoBonus: state.lastCeoBonus,
        // Rapor ekranlari uygulama yeniden acildiginda da son ceyregi
        // gosterebilsin diye kalici.
        lastQuarterReport: state.lastQuarterReport,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    },
  ),
);