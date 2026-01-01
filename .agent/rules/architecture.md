---
trigger: always_on
---

# Project Architecture Rules

Bu projede kod yazarken **HER ZAMAN** aşağıdaki mimari prensiplere uymalısın:

1.  **UI ve Logic Ayrımı (Strict Separation):**
    * **Logic (Mantık):** Tüm hesaplamalar, state yönetimi, `useEffect` ve iş kuralları (business logic) `logic` klasörü altında (veya ilgili modülün `hooks` klasöründe) **Custom Hook** olarak yazılmalıdır (örn: `useBlackjackLogic.ts`).
    * **UI (Görünüm):** Screen (`.tsx`) dosyaları sadece Hook'tan gelen veriyi ekrana basmalı, asla matematiksel işlem veya karmaşık mantık içermemelidir.

2.  **Mevcut Yapıyı Koru:**
    * Mevcut klasör yapısını bozma. Eğer bir modül `src/features/` altındaysa oradan devam et, `src/components/` altındaysa oraya sadık kal.
    * Dosyaları parçalara ayırırken "God File" (devasa dosya) oluşumunu engelle.

3.  **Örnek Desen (Reference):**
    * `BlackjackGameScreen.tsx` (UI) ve `useBlackjackLogic.ts` (Logic) ayrımını referans al. Tüm yeni geliştirmeler bu desene uymalıdır.