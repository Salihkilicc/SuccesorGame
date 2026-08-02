# Mekanik Denetimi — CEO Simülasyonu

Kod okundu, tahmin yok. Her iddianın yanında dosya ve satır var.

---

## Özet

İyi haber: gerçek bir ekonomi motoru var ve sandığımdan iyi. Kötü haber: motor `useGameStore.advanceMonth` içine gömülü ~200 satır, ve etrafındaki yarım düzine mekanik ona **bağlı değil**. Oyuncuya gösterilen sayılarla parayı gerçekten hareket ettiren sayılar farklı.

Yani sorun "mekanik az" değil. Sorun **bağlanmamış mekanik fazla**.

Üç kategori:

| | Sayı | Ne yapmalı |
|---|---|---|
| Sağlam, derinleştirilecek | 6 | Koru, üstüne inşa et |
| Yazılmış ama bağlanmamış | 11 | Bağla veya sil — ikisi de kısa iş |
| Eksik ve kritik | 5 | Fiyat esnekliği en acili |

---

## 1. Sağlam olanlar — koru ve derinleştir

### 1.1 Çeyreklik ürün motoru
`useGameStore.ts:160-290`

Üretim → stok → satış → COGS → hasılat zinciri düzgün kurulmuş. Üç detay özellikle iyi:

**COGS üretime yazılıyor, satışa değil** (`satır 252`: `unitCost * quarterlyProduction`). Yani fazla üretirsen nakit yanar, satamadığın mal kâra dönüşmez. Bu tam olarak MBA'de anlatılan şey ve zaten kodda.

**Stok devrediyor + depolama maliyeti** (`satır 240`: `newInventory * 5 * quarters`). Fazla üretim iki kez cezalanıyor: bir kez nakit bağlıyor, bir kez depo kirası ödüyor. Doğru içgüdü.

**Pazarlamada azalan verim** (`satır 213-219`). Doyma noktası `fiyat × 0.30`, verim `min(1, harcama / doyma)`. Organik taban %15. Yani pazarlamaya sınırsız para dökmek işe yaramıyor. Gerçek bir eğri.

**Karmaşıklık bölen olarak** (`satır 194`: `employeeCount × 500 / complexity`). Ürün yelpazesi 12 ile 8000 arası karmaşıklık taşıyor — bu ürün seçimini gerçek bir tercih yapıyor.

### 1.2 Oyuncu nakdi ile şirket sermayesi ayrı
`useGameStore.ts:344` vs `satır 322`

`playerCash` ve `companyCapital` bağımsız havuzlar. Bir CEO simülasyonunda bu doğru ayrım — şirket zengin, sen fakir olabilirsin. Sakın birleştirme.

### 1.3 Moral → satış cezası
`useGameStore.ts:154-161, 224-231`

Moral 50'nin altına düşünce `((50 - moral) / 50) × 0.35` oranında satış kaybı, üstüne rastgele bir anlatı sebebi (`LOW_MORALE_REASONS`). Sıfır moralde -%35.

Bu oyundaki **en tam kapalı döngü**: kaldıraç var (maaş politikası, etkinlik, ikramiye), sonuç var (satış kaybı), geri bildirim var (rapordaki mesaj). Diğer mekanikler için model bu olmalı.

### 1.4 Hissedar / yönetim kurulu sistemi
`features/shareholders/stores/useShareholderStore.ts` — 1333 satır

Projedeki en değerli CEO içeriği. İçinde: kişilik özellikleri, güven skoru, kurul havası, müzakere şansı hesabı, prim üzerinden hisse alımı, tefeci kredileri, teminat hacizleri, network'ten yönetici atama.

Bu kadar iş yapılmış ama **sonucu yok** (bkz. 2.6 ve 2.9). Bağlanınca oyunun en güçlü mekaniği olur ve yeni tasarım gerektirmez.

### 1.5 Ar-Ge ve teknoloji ağacı
`features/products/logic/productUpgrades.ts`, `core/store/useLaboratoryStore.ts`

Araştırmacı başına çeyrekte **500.000 dolar** maliyet (`useGameStore.ts:296`), karşılığında RP birikimi, RP ile üretim maliyeti düşürme / fiyat artırma. Yükseltme maliyeti `SCALING_FACTOR` ile katlanıyor.

Oyundaki **tek gerçek gecikmeli sonuç mekaniği**: bugün para yakıyorsun, faydayı çeyrekler sonra görüyorsun. Diğer her şey anında etki ediyor. Bu yüzden değerli.

### 1.6 Education
`features/life/components/Education/` — maaş çarpanı + dönemsel harç

Rafta bırakmadık, doğru karardı. CEO'ya bağlanacak tek "kişisel gelişim" ekseni.

---

## 2. Yazılmış ama bağlanmamış — bağla ya da sil

Bunlar en sinsi grup. Kod var, UI var, oyuncu bir şey yaptığını sanıyor, hiçbir şey olmuyor.

### 2.1 Fabrikalar tamamen bedava yük
`useGameStore.ts:188-189`

```
const baseCapacityPerFactory = 1000000;   // hesaplanıyor
const factoryCount = stats.factoryCount || 5;  // hesaplanıyor
```

İkisi de **üretim formülünde hiç kullanılmıyor**. Kapasite sadece `employeeCount`'a bağlı (`satır 194`). Fabrika alınca sadece genel gider artıyor (`satır 293`).

Yani: **fabrika almak saf zarar.** Oyuncu parayı veriyor, karşılığında hiçbir şey almıyor. En kötü mekanik türü — yanlış öğretiyor.

### 2.2 İşçi maaşları parayı hareket ettiren hesapta yok
`useGameStore.ts:326`

```
totalExpenses = COGS + pazarlama + depolama + fabrikaGideri + arGeMaaş + sabit(5k/ay) + faiz
```

**Maaş kalemi yok.** İşe alım üretimi artırıyor (`satır 194`) ama hiçbir maliyeti yok. Optimal strateji: sonsuz işe al.

`useStatsStore.ts:179` maaşı hesaplıyor (`employeeCount × 3000/5000/8000`) ama o hesap sadece ekranda görünen `monthlyExpenses`'a gidiyor, sermayeden düşmüyor.

### 2.3 İki rakip finans modeli, çelişen sayılar

| Kalem | `useStatsStore.recalculateFinancials` | `useGameStore.advanceMonth` |
|---|---|---|
| Fabrika | 50.000 $/ay → **150.000 $/çeyrek** | **5.000 $/çeyrek** |
| Maaş | Sayılıyor | Yok |
| Hasılat | `p.revenue` alanından | Satıştan hesaplanıyor |

Fabrika maliyetinde **30 kat** fark var. Oyuncu birini görüyor, diğerini ödüyor. Bu tek başına oyunu öğretilemez yapıyor — rapordaki sayı gerçeği anlatmıyorsa oyuncu nedensellik kuramaz.

### 2.4 İki maaş politikası sistemi
`useStatsStore.ts:65` (`salaryTier`: low/average/above_average) ve `useGameStore.ts:81` (`salaryPolicy`: low/avg/high)

İkisi de morale ayrı ayrı etki ediyor (`useStatsStore.ts:494` ve `useGameStore.ts:401`). Aynı kararın iki kopyası, senkron olmaları garanti değil.

### 2.5 Ölü ekonomi motoru
`src/logic/EconomyEngine.ts` — 141 satır

`simulateEconomy` fonksiyonunu **hiçbir yer import etmiyor.** İçinde iflas kontrolü, sabit gider, faiz, standing-order üretim mantığı var — bir kısmı `advanceMonth`'takinden temiz. Ya oraya taşı ya sil, ama iki motor tutma.

### 2.6 Kurul hiçbir karara tepki vermiyor
`useShareholderStore.ts:282`

`evaluatePlayerAction('DIVIDEND' | 'DILUTION' | 'ACQUISITION' | 'HOLD_CASH')` yazılmış, güven skorlarını güncelliyor, düşmanlık eşiği hesaplıyor — ve **hiçbir yerden çağrılmıyor.** Temettü dağıt, hisse seyrelt, şirket satın al: kurulun umurunda değil.

Bu, 1333 satırlık sistemi etkisiz kılan tek satırlık eksik.

### 2.7 Oylama animasyonu hiç görünmüyor
`components/MyCompany/Shares/VotingOverlay.tsx`

Üye üye oy açıklayan, yeşil/kırmızı flaşlayan, karara varan tam bir animasyon yazılmış. **Hiçbir ekran bu bileşeni render etmiyor.** Yetim kod.

### 2.8 Kredi notu dekoratif
`features/finance/stores/useCorporateFinanceStore.ts:144-151`

`getInterestRate()` kredi notuna göre %3–%15 arası oran döndürüyor. Sadece `BorrowModal.tsx:29`'da **gösterim için** kullanılıyor.

Gerçekte ödenen faiz: `useGameStore.ts:313` → sabit `0.05`. Kredi notunu yükseltmek hiçbir şeye yaramıyor.

### 2.9 CEO kovulamıyor

`isHostile` (güven < 20) her yerde takip ediliyor. Kurulun tamamı sana düşman olabilir. **Sonuç: hiçbir şey.** Kovulma, oy, vekalet savaşı yok.

Bir CEO simülasyonunda en büyük risk işini kaybetmek. O risk oyunda yok.

### 2.10 İflas tek ve zayıf koşula bağlı
`useGameStore.ts:565`

`companyCapital < 0` → iflas. Sadece çeyrek sonunda, sadece tek sayı. Nakit krizi yok, maaş ödeyememe yok, kredi sözleşmesi ihlali yok, tedarikçiye borç yok.

### 2.11 Şirket kârı oyuncuya ulaşmıyor
`features/assets/logic/EconomyEngine.ts:66`

```
const businessProfit = 0;  // Placeholder
```

Kişisel gelir hesabında şirket kârı **sıfır** olarak geçiyor. Şirketi büyütmek oyuncunun kişisel servetini doğrudan etkilemiyor (sadece hisse değeri üzerinden dolaylı).

---

## 3. Eksik olanlar — değer sırasına göre

### 3.1 Fiyat esnekliği — EN ACİL

`sellingPrice` şu anda:
- hasılatı çarpıyor (`satır 251`)
- pazarlama doyma noktasını yükseltiyor (`satır 213`)

**Talep hacmini düşürmüyor.** `demandRate` ürünün sabit `marketDemand` alanından geliyor, fiyattan bağımsız.

Sonuç: fiyatı yükseltmek neredeyse bedava kâr. Pazarlama harcaması sıfırsa fiyatın hiçbir olumsuz etkisi yok.

Bu, iş hayatındaki **merkezi tercihin** oyunda hiç olmaması demek: fiyat mı hacim mi? Marj mı pazar payı mı? Eklenecek tek şey buysa bu olmalı.

### 3.2 Rakip yok

Şirket simülasyonunda hiç rakip yok. Fiyat indirince kimse karşılık vermiyor, pazar payı diye bir şey yok. `marketDemand` dışarıdan verilen sabit.

### 3.3 Gecikme yok

İşe alım, fabrika, maaş politikası — hepsi anında etki ediyor. Sadece Ar-Ge'de gecikme var (1.5).

Gerçek CEO'luğun zorluğu kararın sonucunu aylar sonra görmek. Anında geri bildirim öğretmez, optimize ettirir.

### 3.4 Nakit ile kâr ayrı kısıt değil

Tek havuz: `companyCapital`. Alacak, borç, ödeme vadesi yok. "Kârlıyken batmak" senaryosu — en dramatik ve en öğretici olan — kurulamıyor.

Kısmen var aslında: COGS üretime yazılıyor + depolama maliyeti (1.1) nakit tuzağı oluşturuyor. Temel doğru, üstü eksik.

### 3.5 Eksik bilgi yok

Oyuncu `marketDemand`'i, `complexity`'yi, doyma noktasını görüyor. Belirsizlik altında karar yok, hesap var. Optimal oyun bir kez çözülür, sonra tekrar oynanmaz.

---

## 4. Ne yapmalı — sıra önemli

### Aşama 1: Bedava kazanımlar (yeni tasarım yok, sadece bağlama)

Bunlar bir hafta sürer ve oyunu tutarlı hale getirir. Yeni mekanik eklemeden önce mevcut olanların yalan söylemesini durdur.

1. **Tek finans modeli.** `advanceMonth`'taki hesap tek gerçek olsun. `recalculateFinancials` ondan beslensin. Fabrika maliyetini tek sayıya indir.
2. **Maaşı gider hesabına ekle.** `totalExpenses`'a `employeeCount × SALARY_TIERS[tier] × months`.
3. **Fabrikaya işlev ver.** Üretim formülü `min(employeeCount × 500 / complexity, factoryCount × FACTORY_CAPACITY)` olsun. Fabrika kapasite tavanı, işçi ise o tavanı kullanma oranı.
4. **`evaluatePlayerAction`'ı çağır.** Temettü, seyreltme, satın alma eylemlerine bağla. Bir satır × 4 yer.
5. **Kovulma ekle.** Kurul güveni ortalaması eşiğin altına inince `VotingOverlay`'i göster, oy sonucu kötüyse oyun biter. Zaten yazılı iki parçayı birleştirmek.
6. **Faizi kredi notuna bağla.** `satır 313`'teki sabit `0.05` yerine `getInterestRate()`.
7. **İki maaş sistemini birleştir**, birini sil.
8. **`src/logic/EconomyEngine.ts`'i sil** ya da içindeki iflas mantığını taşı.
9. **`businessProfit`'i gerçek kârdan besle.**

### Aşama 2: Merkezi tercihi ekle

10. **Fiyat esnekliği.** Her ürüne bir esneklik katsayısı, `demandRate`'i referans fiyattan sapmaya göre düzelt. Basit bir başlangıç:
    `effectiveDemand = marketDemand × (referencePrice / sellingPrice) ^ elasticity`
    Lüks ürünlerde esneklik düşük, emtiada yüksek. Bu tek değişiklik oyunun karar uzayını ikiye katlar.

### Aşama 3: Zamanı devreye sok

11. **Gecikme kuyruğu.** İşe alım 1 çeyrek sonra kapasiteye dönüşsün, fabrika 2 çeyrek, maaş politikası morale 1 çeyrek gecikmeyle etki etsin. Küçük bir "bekleyen etkiler" listesi + her çeyrek işleme.
12. **Rakip tepkisi.** Tek soyut rakip yeter: fiyat indirirsen o da indirir, pazarlama artırırsan pazar payı kaparsın ama o da karşılık verir.

### Aşama 4: Öğretme yüzeyi

13. **`MonthlyReportModal` / `QuarterlyReportModal`** sadece sayı değil **neden** göstersin. "Hasılat düştü çünkü: stok tükendi (-%12), moral düşük (-%8), fiyat artışı talebi kırdı (-%15)". Oyuncu nedenselliği burada öğrenir. Motor derinleştikçe bu ekran en değerli parça olur.

---

## 5. Rafa kaldırılan modüller hakkında not

`featureFlags.ts` ile kapatılan modüller içinde CEO'ya geri dönebilecek iki parça var:

- **`features/love`** → stakeholder management olarak. Zaten `useShareholderStore` içinde network'ten yönetici atama var; ilişki sistemi buraya bağlanabilir.
- **`features/life/components/BlackMarket`** → kurumsal etik / uyum riski olarak. Rüşvet, kartel, denetim riski. MBA'de gerçekten anlatılan bir konu.

Diğerleri (casino, gym, spa, travel, night out, shopping) motor bitene kadar rafta kalsın.

---

## 6. Tek cümlelik teşhis

Oyunun ekonomi çekirdeği iyi kurulmuş ama çevresindeki mekaniklerin yarısı ona bağlı değil; önce yalan söyleyen sayıları düzelt, sonra fiyat esnekliğini ekle, sonra gecikmeyi.
