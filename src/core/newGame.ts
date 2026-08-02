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

    // Bayrağı tutan diğer store'lar. Şu an App.tsx onları beklemiyor ama
    // ileride bir ekran beklerse aynı tuzağa düşmesin.
    try {
        const { useNotesStore } = require('./store/useNotesStore');
        useNotesStore.setState({ _hasHydrated: true });

        const { useCalendarStore } = require('./store/useCalendarStore');
        useCalendarStore.setState({ _hasHydrated: true });

        const { useSettingsStore } = require('./store/useSettingsStore');
        useSettingsStore.setState({ _hasHydrated: true });

        const { useRelationshipStore } = require('./store/useRelationshipStore');
        useRelationshipStore.setState({ _hasHydrated: true });
    } catch (e) {
        console.warn('[newGame] Hidrasyon bayraklari acilamadi', e);
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

    console.log('[newGame] Hazir.');
};
