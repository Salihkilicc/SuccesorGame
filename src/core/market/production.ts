// @orphan-ok-symbol plannedUnits - superseded by resolveTargetUnits() - production is absolute units now
// @orphan-ok-symbol utilizationForUnits - only needed by the old percentage-based production UI
// @orphan-ok-symbol allocateCapacity - the engine allocates inline so it can carry contract units too
// src/core/market/production.ts
//
// ============================================================================
//  ÜRETİM KAPASİTESİ — tek kaynak
// ============================================================================
//
//  NEDEN BU DOSYA VAR:
//  Ayni sey icin iki farkli formul vardi ve kimse fark etmemisti.
//
//    Motor  (useGameStore):     calisan * 500 / karmasiklik
//    Ekran  (useProductsLogic): calisan * 468.75      <-- karmasiklik YOK
//
//  20 calisan ve Smart Phone (karmasiklik 50) icin:
//    ekran "4.687 adet" yaziyordu, motor 100 adet uretiyordu. 47 KAT fark.
//
//  KURAL: Uretim adedi hesaplanan HER yer bu dosyayi cagirir.
//
//  ---------------------------------------------------------------------------
//  ONEMLI DEGISIKLIK — kapasite artik TESISTEN gelir
//  ---------------------------------------------------------------------------
//  Once uretim tamamen calisan sayisina bagliydi ve fabrika hicbir ise
//  yaramiyordu. Simdi:
//
//      uretim = tesis kapasitesi x personel orani x fire orani
//
//  Tesis kademesi capacity.ts'te. Bu dosya artik o modulun uzerine
//  URUN BAZINDA bir katman: standart birimi urun adedine cevirir ve
//  oyuncunun hedeflerini paylastirir.
//
//  Eski `BASE_OUTPUT_PER_EMPLOYEE` yaklasimi emekliye ayrildi ama
//  fonksiyon imzalari korundu; cagiran yerler tek tek tasindi.
// ============================================================================

import {
    STANDARD_COMPLEXITY,
    availableStandardUnits,
    standardToUnits,
    unitsToStandard,
} from './capacity';

/**
 * Tesisin tamami tek bir urune ayrilsa ceyrekte kac adet cikardi.
 *
 * Karmasiklik bolen: Smart Phone 50, Fusion Reactor 8000. Yani ayni
 * tesisten telefondan 160 kat fazla cikar. Urun secimi bu yuzden
 * gercek bir karardir.
 */
export const maxUnitsPerQuarter = (
    employeeCount: number,
    complexity: number,
    facilityTier: number = 1,
    isBuilding: boolean = false,
): number =>
    standardToUnits(
        availableStandardUnits(employeeCount, facilityTier, isBuilding),
        complexity,
    );

/**
 * Kullanim oranina gore gercek uretim.
 * @param utilizationPercent 0-100 arasi uretim seviyesi
 */
export const plannedUnits = (
    employeeCount: number,
    complexity: number,
    utilizationPercent: number,
    quarters: number = 1,
    facilityTier: number = 1,
    isBuilding: boolean = false,
): number => {
    const max = maxUnitsPerQuarter(employeeCount, complexity, facilityTier, isBuilding);
    const utilization = Math.min(100, Math.max(0, utilizationPercent ?? 0)) / 100;
    return Math.floor(max * utilization * Math.max(1, quarters));
};

/** Belirli bir adedi uretmek icin gereken kullanim orani (0-100). */
export const utilizationForUnits = (
    employeeCount: number,
    complexity: number,
    targetUnits: number,
    facilityTier: number = 1,
    isBuilding: boolean = false,
): number => {
    const max = maxUnitsPerQuarter(employeeCount, complexity, facilityTier, isBuilding);
    if (max <= 0) return 0;
    const raw = (targetUnits / max) * 100;
    return Math.min(100, Math.max(0, Math.ceil(raw)));
};

// ============================================================================
//  HEDEF ADET — uretim ayarinin bicimi
// ============================================================================
//  ONCEDEN: uretim ayari YUZDE idi (productionLevel 0-100).
//  Sorun: kapasiteni 10 katina cikardiginda %50 ayari otomatik olarak
//  10 kat daha cok uretiyordu. Yani buyume kararinin uretim tarafi
//  kendiliginden hallolyordu, oyuncunun tekrar karar vermesi gerekmiyordu.
//
//  SIMDI: ayar MUTLAK ADET. Kapasiten buyudugunde hedefin oldugu yerde
//  kalir; artirmak istiyorsan bilerek artirirsin.
// ============================================================================

export interface ProductionTargetSource {
    productionUnits?: number;
    productionLevel?: number;
    complexity?: number;
}

/** Ceyreklik uretim hedefini cozer; eski yuzdeli kayitlari da tasir. */
export const resolveTargetUnits = (
    product: ProductionTargetSource,
    employeeCount: number,
    facilityTier: number = 1,
    isBuilding: boolean = false,
): number => {
    const max = maxUnitsPerQuarter(
        employeeCount,
        product.complexity ?? STANDARD_COMPLEXITY,
        facilityTier,
        isBuilding,
    );

    // Yeni alan varsa onu kullan.
    if (typeof product.productionUnits === 'number') {
        return Math.max(0, Math.min(max, Math.floor(product.productionUnits)));
    }

    // TASIMA: eski kayitlar yuzde tutuyordu. Bir kereligine adede cevir.
    const percent = Math.min(100, Math.max(0, product.productionLevel ?? 50));
    return Math.floor((max * percent) / 100);
};

// ============================================================================
//  PAYLASTIRMA — birden fazla urun ayni tesisi kullanir
// ============================================================================
//  Kapasite ORTAK. Iki urunun varsa ikisi ayni hatti paylasir; ikisinin
//  hedefi toplam kapasiteyi asiyorsa TALEP ORANINDA kirpilir.
//
//  Neden orantili kirpma: oyuncuyu "hangi urun oncelikli" diye ayri bir
//  ekrana sokmadan adil bir sonuc verir. Oyuncu bir urune daha cok pay
//  vermek istiyorsa digerinin hedefini kendisi dusurur — karar yine onda.
// ============================================================================

export interface AllocationRequest {
    id: string;
    /** Oyuncunun istedigi adet */
    targetUnits: number;
    complexity: number;
}

export interface AllocationResult {
    /** urun id -> gercekten uretilecek adet */
    unitsById: Record<string, number>;
    /** Talep edilen toplam standart birim */
    requestedStandard: number;
    /** Kullanilabilir toplam standart birim */
    availableStandard: number;
    /** 1'den kucukse kapasite yetmedi ve kirpma yapildi */
    fulfilledRatio: number;
}

export const allocateCapacity = (
    requests: AllocationRequest[],
    employeeCount: number,
    facilityTier: number,
    isBuilding: boolean,
    quarters: number = 1,
): AllocationResult => {
    const q = Math.max(1, quarters);
    const availableStandard =
        availableStandardUnits(employeeCount, facilityTier, isBuilding) * q;

    const requestedStandard = requests.reduce(
        (sum, r) => sum + unitsToStandard(r.targetUnits * q, r.complexity),
        0,
    );

    const ratio =
        requestedStandard > 0 ? Math.min(1, availableStandard / requestedStandard) : 1;

    const unitsById: Record<string, number> = {};
    requests.forEach(r => {
        unitsById[r.id] = Math.floor(Math.max(0, r.targetUnits) * q * ratio);
    });

    return {
        unitsById,
        requestedStandard,
        availableStandard,
        fulfilledRatio: ratio,
    };
};

// ============================================================================
//  ÜRÜN YÜKSELTME MALİYETİ (RP)
// ============================================================================
//  ONCE IKI AYRI FORMUL VARDI ve ekran biriyle, kasa digeriyle konusuyordu:
//
//    Ekran (ProductModals):  sqrt(karmasiklik) x 2.150 x 1,55^seviye
//    Kasa  (useProductStore): karmasiklik x 100 x 1,5^seviye
//
//  Karmasikligi 3.481 olan Industrial Arm icin ekran 197.000 RP yaziyor,
//  kasa 522.000 RP cekiyordu. Yani oyuncu gordugu fiyatin UC KATINI
//  oduyordu ve nedenini bilmiyordu.
//
//  Eski formul karmasiklikla DOGRUSAL buyuyordu; karmasikligi 10.000.000
//  olan Fusion Reactor'da tek yukseltme 1,5 MILYAR RP ediyordu — tum tech
//  tree'nin toplamindan fazla. Karekok buyuk urunu pahali tutar ama
//  imkansiz yapmaz.
// ============================================================================

/** Bir urunun bir sonraki seviye yukseltmesinin RP maliyeti. */
export const productUpgradeRP = (complexity: number, currentLevel: number): number =>
    Math.floor(
        Math.sqrt(Math.max(1, complexity || 50)) * 2_150 * Math.pow(1.55, Math.max(1, currentLevel || 1)),
    );
