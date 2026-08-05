// src/core/newGame.ts
//
// ============================================================================
//  YENİ OYUN — tek giriş noktası
// ============================================================================
//
//  Oyunun tüm kalıcı durumunu siler ve temiz bir başlangıç kurar.
//
//  NEDEN BU DOSYA VAR: Proje 20+ ayrı zustand store'u AsyncStorage'a yazıyor.
//  Eski `useGameStore.resetGame` bunlardan sadece 7'sini siliyordu ve iki
//  anahtar adı yanlıştı ('succesor_laboratory_v1' ve 'succesor_user_v1' —
//  gerçek adlar 'succesor_laboratory' ve 'succesor_user_v3'). Sonuç: yeni oyun
//  başlatınca eski veri sızıyordu.
//
//  KURAL: Yeni bir persist'li store eklediğinde anahtarını PERSIST_KEYS'e ekle.
//  Aksi halde o store yeni oyunda eski veriyle açılır ve bunu fark etmek zor.
//
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Store'lar ---
import { useGameStore, initialGameState } from './store/useGameStore';
import { useStatsStore } from './store/useStatsStore';
import { useProductStore } from './store/useProductStore';
import { useUserStore } from './store/useUserStore';
import { usePlayerStore } from './store/usePlayerStore';
import { useEventStore } from './store/useEventStore';
import { useLaboratoryStore } from './store/useLaboratoryStore';
import { useEducationStore } from './store/useEducationStore';
import { useMarketStore } from './store/useMarketStore';
import { useAchievementStore } from './store/useAchievementStore';

/**
 * AsyncStorage'daki TÜM oyun anahtarları.
 *
 * `succesor_settings_v1` bilinçli olarak DIŞARIDA: dil, bildirim gibi
 * kullanıcı tercihleri yeni oyunda sıfırlanmamalı.
 */
export const PERSIST_KEYS: string[] = [
    // Çekirdek
    'succesor_game_v2',
    'succesor_stats_v1',
    'succesor_products_v3',
    'succesor_user_v3',
    'succesor_player_hub_v4',
    'succesor_events_v1',
    'succesor_laboratory',
    'succesor_achievements_v1',
    'succesor_calendar_v2',
    'succesor_notes_v1',

    // Finans / piyasa
    'succesor_market_v6',
    'succesor_equity_v1', // eski surum — kalintisi temizlensin
    'succesor_equity_v2',
    'subsidiary-storage',
    'shareholder-store',

    // Eğitim
    'succesor_education_v3',
    'succesor_education_system_v2',

    // Rafa kaldırılmış modüller (flag kapalı ama veri kalmasın)
    'succesor_assets_v2',
    'relationship-storage',
    'travel-storage',

    // Eski sürümlerden kalan anahtarlar — temizlenmezse migration'da karışıyor
    'succesor_game_v1',
    'succesor_user_v1',
    'succesor_user_v2',
    'succesor_products_v1',
    'succesor_products_v2',
    'succesor_laboratory_v1',
    'succesor_player_hub_v3',
    'succesor_education_v1',
    'succesor_education_v2',
];

/**
 * Bellekteki store'ları başlangıç durumuna döndürür.
 *
 * Sadece diski silmek yetmez: zustand store'ları hâlâ bellekte eski veriyle
 * duruyor ve uygulama yeniden başlatılana kadar öyle kalıyor.
 */
const resetInMemoryStores = () => {
    // reset() metodu olanlar
    useStatsStore.getState().reset();
    useProductStore.getState().reset();
    useUserStore.getState().reset();
    usePlayerStore.getState().reset();
    useEventStore.getState().reset();
    useLaboratoryStore.getState().reset();
    useEducationStore.getState().reset();
    useMarketStore.getState().reset();
    useAchievementStore.getState().resetAchievements();

    // Dinamik require: bu store'lar feature klasörlerinde ve bazıları
    // core'a geri import ediyor — statik import döngü kurar.
    try {
        const { useEquityStore } = require('../features/finance/stores/useEquityStore');
        useEquityStore.getState().reset?.();
    } catch (e) {
        console.warn('[newGame] useEquityStore sifirlanamadi', e);
    }

    try {
        const { useCorporateFinanceStore } = require('../features/finance/stores/useCorporateFinanceStore');
        useCorporateFinanceStore.getState().reset?.();
    } catch (e) {
        console.warn('[newGame] useCorporateFinanceStore sifirlanamadi', e);
    }

    try {
        const { useEducationSystem } = require('../features/life/components/Education/store/useEducationSystem');
        useEducationSystem.getState().reset?.();
    } catch (e) {
        console.warn('[newGame] useEducationSystem sifirlanamadi', e);
    }

    try {
        const { useAssetStore } = require('../features/shopping/store/useAssetStore');
        useAssetStore.getState().reset?.();
    } catch (e) {
        console.warn('[newGame] useAssetStore sifirlanamadi', e);
    }

    // Yönetim kurulu: reset()'i yok, initializeGame() başlangıç üyelerini
    // INITIAL_BOARD_MEMBERS'dan yeniden kuruyor.
    try {
        const { useShareholderStore } = require('../features/shareholders/stores/useShareholderStore');
        useShareholderStore.getState().initializeGame();
    } catch (e) {
        console.warn('[newGame] Kurul yeniden kurulamadi', e);
    }

    // GameStore'u en sona bırak: _hasHydrated true kalmalı, yoksa UI donar.
    useGameStore.setState({ ...initialGameState, _hasHydrated: true });

    // ------------------------------------------------------------------
    //  KRİTİK: hidrasyon bayraklarını geri aç.
    // ------------------------------------------------------------------
    //  App.tsx, statsStore ve gameStore hidrate olmadan `null` döndürüyor
    //  (yani beyaz ekran). Ama `initialStatsState._hasHydrated === false`
    //  olduğu için `useStatsStore.reset()` bayrağı sıfırlıyor ve persist
    //  bir daha hidrasyon çalıştırmıyor — diski zaten sildik.
    //
    //  Sonuç: bayrağı elle açmazsak yeni oyun beyaz ekranda kalıyor.
    //  (Bu tam olarak ilk denemede olan hataydı.)
    // ------------------------------------------------------------------
    useStatsStore.setState({ _hasHydrated: true });

    // ------------------------------------------------------------------
    //  BELLEĞİ SIFIRLANMAYAN STORE'LAR
    // ------------------------------------------------------------------
    //  Bu üçünün `reset()` metodu yoktu ve burada YALNIZCA hidrasyon
    //  bayrağı açılıyordu. Diskteki anahtarları siliniyordu ama
    //  BELLEKTEKİ veri duruyordu — ve zustand persist, bir sonraki
    //  yazımda o eski veriyi diske geri yazıyordu. Yani notlar, takvim
    //  ve ilişkiler yeni oyuna aynen geçiyordu.
    //
    //  `_hasHydrated: true` başlangıç durumundan SONRA veriliyor:
    //  initialState içinde `false` durduğu için sırayı ters yaparsak
    //  uygulama beyaz ekranda kalır (aşağıdaki statsStore notuna bak).
    // ------------------------------------------------------------------
    try {
        const { initialNotesState, useNotesStore } = require('./store/useNotesStore');
        useNotesStore.setState({ ...initialNotesState, _hasHydrated: true });

        const { initialCalendarState, useCalendarStore } = require('./store/useCalendarStore');
        useCalendarStore.setState({ ...initialCalendarState, _hasHydrated: true });

        const { initialRelationshipState, useRelationshipStore } = require('./store/useRelationshipStore');
        useRelationshipStore.setState({ ...initialRelationshipState, _hasHydrated: true });

        // Ayarlar BİLİNÇLİ olarak sıfırlanmaz: dil ve bildirim tercihleri
        // oyuncunun, oyunun değil.
        const { useSettingsStore } = require('./store/useSettingsStore');
        useSettingsStore.setState({ _hasHydrated: true });
    } catch (e) {
        console.warn('[newGame] Bellek sifirlanamadi', e);
    }
};

/**
 * Yeni oyun başlatır: diski siler, belleği sıfırlar, kurulu yeniden kurar.
 *
 * Çağıran taraf işlem bitince oyuncuyu Home'a yönlendirmeli.
 */
export const startNewGame = async (): Promise<void> => {
    console.log('[newGame] Yeni oyun baslatiliyor...');

    // 1) Belleği sıfırla. Önce bunu yap — persist middleware bundan sonraki
    //    yazımda temiz durumu diske geçirir.
    resetInMemoryStores();

    // 2) Diski temizle.
    //    Tek tek siliniyor: bir anahtardaki hata digerlerini engellemesin.
    //    (multiRemove kullanilmiyor — @react-native-async-storage v3
    //    tiplerinde mevcut degil.)
    let removed = 0;
    for (const key of PERSIST_KEYS) {
        try {
            await AsyncStorage.removeItem(key);
            removed += 1;
        } catch (e) {
            console.warn(`[newGame] ${key} silinemedi`, e);
        }
    }
    console.log(`[newGame] ${removed}/${PERSIST_KEYS.length} anahtar temizlendi.`);

    // 3) Denetle.
    verifyNewGame();

    console.log('[newGame] Hazir.');
};

// ============================================================================
//  YENİ OYUN DENETİMİ
// ============================================================================
//  Bu dosyanın tamamı "bir şeyi sıfırlamayı unutmak" hatası üzerine kurulu
//  ve o hata SESSİZ: oyun açılır, çalışır, sadece sayılar yanlıştır.
//  Oyuncu "çalışan sayısı önceki oyundan geldi" der ve elle hangi store
//  olduğunu bulmak saatler alır.
//
//  Bu fonksiyon sıfırlamadan sonra kritik alanları beklenen başlangıç
//  değerleriyle karşılaştırır ve sapan alanı ADIYLA yazar. Sorunu
//  çözmez — nerede olduğunu söyler, ki asıl zor olan oydu.
// ============================================================================
export const verifyNewGame = (): string[] => {
    const problems: string[] = [];
    const check = (store: string, field: string, actual: unknown, expected: unknown) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            problems.push(`${store}.${field}: beklenen ${JSON.stringify(expected)}, gelen ${JSON.stringify(actual)}`);
        }
    };

    try {
        const st = useStatsStore.getState() as any;
        // Personel — oyuncunun ilk fark ettigi sey bu.
        check('stats', 'employeeCount', st.employeeCount, 20);
        check('stats', 'targetHeadcount', st.targetHeadcount, 20);
        check('stats', 'incomingHires', st.incomingHires, 0);
        check('stats', 'employeeMorale', st.employeeMorale, 75);
        check('stats', 'facilityTier', st.facilityTier, 1);
        check('stats', 'companyDebtTotal', st.companyDebtTotal, 0);
        check('stats', 'lossStreak', st.lossStreak ?? 0, 0);
        check('stats', 'brandByCategory', st.brandByCategory ?? {}, {});

        const g = useGameStore.getState() as any;
        check('game', 'currentMonth', g.currentMonth, 1);
        check('game', 'age', g.age, 25);
        check('game', 'lastQuarterReport', g.lastQuarterReport, null);

        const lab = useLaboratoryStore.getState() as any;
        check('laboratory', 'researcherCount', lab.researcherCount, 0);
        check('laboratory', 'totalRP', lab.totalRP, 0);

        const sh = require('../features/shareholders/stores/useShareholderStore').useShareholderStore.getState();
        check('shareholder', 'ceoRemoved', sh.ceoRemoved, false);
        check('shareholder', 'memberCount', sh.members.length, 4);
        check('shareholder', 'boardDemands', sh.boardDemands.length, 0);
        check('shareholder', 'promises', sh.promises.length, 0);

        const sub = require('../features/finance/stores/useCorporateFinanceStore').useCorporateFinanceStore.getState();
        check('subsidiary', 'owned', (sub.subsidiaries ?? []).length, 0);
    } catch (e) {
        problems.push(`denetim calistirilamadi: ${String(e)}`);
    }

    if (problems.length) {
        console.warn(
            '[newGame] ONCEKI OYUNDAN VERI TASINDI:\n  ' + problems.join('\n  ') +
            '\n  -> ilgili store\'un reset()\'i eksik ya da alani initialState\'te yok.' +
            '\n  (zustand setState MERGE yapar: initialState\'te olmayan alan HAYATTA KALIR.)',
        );
    } else {
        console.log('[newGame] Denetim temiz: tum kritik alanlar baslangic degerinde.');
    }
    return problems;
};
