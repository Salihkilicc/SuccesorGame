import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { simulateNewMonth } from '../../event/eventEngine';
import { calculateQuarterlyFinances } from '../../features/assets/logic/EconomyEngine';
import { applyPartnerBuffs } from '../../logic/relationshipLogic';
import { FEATURES } from '../featureFlags';
import type { ProductQuarterLine, QuarterReport } from '../reportTypes';
import { getMarket } from '../market/productMarkets';
import { computeAttraction, computeShares, demandUnits, marketingBenchmark, updateBrand } from '../market/attraction';
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
import {
  TOTAL_SHARES_DEFAULT,
  applySentiment,
  companyValuation,
  ownershipPercent,
  priceChangePercent,
  sharePrice as equitySharePrice,
} from '../market/equity';
import { useUserStore } from './useUserStore';
import * as AchievementChecker from '../../achievements/checker';

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
  status: 'active' | 'bankrupt';
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
  /** Bir sonraki ceyrek uygulanacak maas kesintisi soku */
  pendingPayCutShock: number;
  eventsHostedThisQuarter: number;
  lastQuarterProfit: number;
  bonusDistributedThisQuarter: boolean;
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
  age: 25, // Beta Start Age
  actionsUsedThisMonth: 0,
  maxActionsPerMonth: 999,
  // useStatsStore.initialStatsState.employeeMorale ile AYNI olmali.
  // Iki store ayri ayri moral tutuyor; farkli olurlarsa hangisinin
  // okundugu koda gore degisiyor ve tutarsiz davranis ciktisi veriyor.
  employeeMorale: 75,
  salaryPolicy: 'avg',
  overtimeEnabled: false,
  pendingPayCutShock: 0,
  eventsHostedThisQuarter: 0,
  lastQuarterProfit: 0,
  bonusDistributedThisQuarter: false,
  lastQuarterReport: null,
};

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
          const wanted = targetHeadcount - headcount;
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

        const brandValue = brandValueRaw;
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
          const benchmarks = group.map(p => marketingBenchmark(market, p.revenue || 0));

          const breakdowns = group.map((p, i) =>
            computeAttraction(
              {
                sellingPrice: p.sellingPrice || p.suggestedPrice,
                suggestedPrice: p.suggestedPrice,
                // Pazarlama artik CEYREKLIK BUTCE (birim basina degil).
                marketingBudget: p.marketingBudget || 0,
                benchmark: benchmarks[i],
                // KALITE TAVANI: Ar-Ge'de seviye 9'u kesfetmis olabilirsin
                // ama atolyede uretemezsin. Tesis kademesi tavani koyar.
                qualityLevel: Math.min(p.qualityLevel || 1, tier.qualityCeiling),
                brandValue,
                marketDemand: p.marketDemand ?? 50,
              },
              market,
            ),
          );

          const { shares } = computeShares(
            breakdowns.map(b => b.total),
            market,
            acquiredStockIds,
          );

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
            const quarterlyProduction = Math.floor(attemptedUnits * effectiveYield);
            const scrappedUnits = attemptedUnits - quarterlyProduction;

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
            const productCOGS = unitCost * attemptedUnits * tier.unitCostMultiplier;

            totalRevenue += productRevenue;
            totalCOGS += productCOGS;
            totalProduction += quarterlyProduction;
            totalSales += quarterlySales;
            totalMarketingCost += marketingCost;
            totalStorageCost += storageCost;

            // Update product with new inventory
            updatedProducts.push({
              ...product,
              inventory: newInventory,
              // Bir sonraki ceyregin kiyas butcesi bu ciroya bakar.
              revenue: productRevenue,
            });

            // Add to breakdown list
            const productProfit = productRevenue - (productCOGS + marketingCost + storageCost);
            productBreakdownList.push({
              id: product.id,
              name: product.name,
              category: product.category,
              produced: quarterlyProduction, // CORRECTED: Use this product's quarterly production
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
            useProductStore.getState().updateProduct(updatedProduct.id, {
              inventory: updatedProduct.inventory,
              revenue: updatedProduct.revenue,
            });
          }
        });

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
            rndRPGenerated += rpAwarded;
          }

        }


        // 4. OTHER EXPENSES
        const monthlyFixedExpenses = 5000;
        const totalFixedExpenses = monthlyFixedExpenses * months;
        const interestExpense = (stats.companyDebtTotal || 0) * 0.05 * (months / 12);

        // 4b. PARTNER UPKEEP COST (Deep Persona System)
        const partner = useUserStore.getState().partner;
        let partnerUpkeepCost = 0;

        // Check if partner has the new Deep Persona structure
        if (partner && 'finances' in partner && 'monthlyCost' in (partner as any).finances) {
          partnerUpkeepCost = (partner as any).finances.monthlyCost * months;

        }

        // 5. CALCULATE NET PROFIT/LOSS
        const totalExpenses =
          totalCOGS +
          totalMarketingCost +
          totalStorageCost +
          factoryOverhead +
          wageCost +
          hiringCost +
          severanceCost +
          rndSalaryCost +
          totalFixedExpenses +
          interestExpense;
        const netProfit = totalRevenue - totalExpenses;

        // 6. UPDATE CAPITAL
        const newCompanyCapital = (stats.companyCapital || 0) + netProfit;

        // 7. PLAYER FINANCIALS (Using Quarterly Economy Engine)
        // Calculate quarterly finances once and apply to player cash
        const quarterlyReport = calculateQuarterlyFinances(
          useUserStore.getState(),
          useMarketStore.getState(),
          useStatsStore.getState()
        );

        // Apply Net Flow to Cash
        const newPlayerCash = (stats.money || 0) + quarterlyReport.netFlow;

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

        const brandResult = updateBrand({
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
        });

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
          brandValue: brandResult.newBrand,
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
          factoryOverhead,
          wages: wageCost,
          hiring: hiringCost,
          severance: severanceCost,
          rnd: rndSalaryCost,
          fixed: totalFixedExpenses,
          interest: interestExpense,
        };

        const grossProfit = totalRevenue - totalCOGS;
        const operatingExpenses =
          totalMarketingCost +
          totalStorageCost +
          factoryOverhead +
          wageCost +
          hiringCost +
          severanceCost +
          rndSalaryCost +
          totalFixedExpenses;
        const ebit = grossProfit - operatingExpenses;

        const totalAvailableGoods = totalBeginningStock + totalProduction;
        const yearsElapsed = Math.floor((get().currentMonth - 1 + months) / 12);
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
          lostRevenue: totalLostRevenue,
          employeeMorale: moraleResult.newMorale,

          totalMarketDemand,
          totalUnmetDemand,
          brandValue: brandResult.newBrand,
          brandChange: brandResult.change,
          brandMaintenance: brandResult.maintenance,
          brandCeiling: tier.brandCeiling,

          // --- Tesis ve kadro ---
          facilityTier: tier.level,
          facilityName: tier.name,
          facilityCapacity: Math.floor(tier.capacity * Math.max(1, quarters)),
          capacityUsed: Math.floor(usedStandard),
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

        set(state => ({ ...state, lastQuarterReport: quarterReport }));




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
            useRelationshipStore.getState().ageUpNPCs();
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

        const valuation = companyValuation({
          cash: newCompanyCapital,
          quarterRevenue: totalRevenue,
          quarterEbit: ebit,
          debt: stats.companyDebtTotal || 0,
          isPublic: !!stats.isPublic,
          brandValue: brandResult.newBrand,
        }).total;

        const rawPrice = equitySharePrice(valuation, capShares);
        // Kucuk bir piyasa duygusu bandi (±%3). Asil surukleyici performans.
        const newSharePrice = applySentiment(rawPrice);
        const prevPrice = stats.companySharePrice || stats.previousSharePrice || rawPrice;
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
        });



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
            pendingPayCutShock: 0,
            eventsHostedThisQuarter: 0,
            lastQuarterProfit: netProfit,
            bonusDistributedThisQuarter: false,
          }));

          // NPC HOOK: çeyrek sıfırla (madeLoveThisQuarter → false)
          if (FEATURES.love) {
            useRelationshipStore.getState().advanceQuarterForNPCs();
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

          // Apply Decay
          Object.entries(decay).forEach(([stat, value]) => {
            if (value < 0) {
              const currentVal = currentAttributes[stat as keyof typeof currentAttributes];
              playerStore.updateAttribute(stat as any, Math.max(0, currentVal + value));

            }
          });

          // 7c. PARTNER BUFFS (Gelişmiş Partner Sistemi)
          // RAFA KALDIRILDI: ilişki modülü kapalıyken partner statlara dokunmaz.
          const partner = FEATURES.love ? useUserStore.getState().partner : null;
          if (partner) {
            const { changes, notification } = applyPartnerBuffs(partner);

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

          // 7d. EDUCATION ADVANCEMENT (New System)
          const { useEducationStore } = require('./useEducationStore'); // Safe import
          const eduResult = useEducationStore.getState().advanceProgress();

          if (eduResult.message) {

            // Report to UI if significant (graduation) or just progress
            if (!setbackMessage && !operationalSetback) {
              setbackMessage = eduResult.message;
            }
          }

          // 7e. GYM QUARTERLY RESET (Gym 3.0 Integration)
          const userStore = useUserStore.getState();
          userStore.updateGymState({
            combatStrength: 0, // Reset fatigue to 0%
          });
          console.log('[Gym] Quarterly reset: Fatigue cleared to 0%');

          // 7f. BLACK MARKET QUARTERLY LOGIC
          // Note: playerStore variable is already declared above (around line 415)
          const { blackMarket } = playerStore;

          // Reset quarterly usage
          if (blackMarket) {
            playerStore.updateBlackMarket('quarterlyDrugUsage', 0);

            // Decay Suspicion (90% reduction)
            const currentSuspicion = blackMarket.suspicion || 0;
            const decayedSuspicion = Math.floor(currentSuspicion * 0.10);
            playerStore.updateBlackMarket('suspicion', decayedSuspicion);

            console.log(`[BlackMarket] Quarterly Reset: Usage=0, Suspicion Decay: ${currentSuspicion} -> ${decayedSuspicion}`);
          }
        }

        // 8. ANNUAL GYM MEMBERSHIP PAYMENT (Gym 3.0 Integration)
        if (newMonth === 1) { // January
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

        // 9. Sonucu UI'ın beklediği formatta döndür
        const result: EconomyResult = {
          status: newCompanyCapital < 0 ? 'bankrupt' : 'active',
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
       * YUKARI cikmak serbest; ASAGI inmek tek seferlik agir bir moral
       * cezasi getirir. Boylece maas da bir taahhut olur.
       */
      setSalaryRatio: (ratio: number) => {
        const stats = useStatsStore.getState();
        const shock = payCutShock(stats.salaryRatio ?? 1, ratio);
        stats.setSalaryRatio(ratio);
        if (shock > 0) {
          set(state => ({ ...state, pendingPayCutShock: state.pendingPayCutShock + shock }));
        }
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
      storage: createJSONStorage(() => AsyncStorage),
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