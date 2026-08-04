# Succesor — Renovasyon Raporu

Bu belge, CEO simülasyonunu oynanabilir ve tutarlı hale getirmek için yapılan
işi özetler. Amaç bir özellik listesi değil: **oyunun kendi kendisiyle çelişmesini
bitirmek.**

---

## Tek cümlelik özet

Oyunda birbirinden habersiz çalışan onlarca sistem vardı. Aynı sayı üç farklı
yerde üç farklı değerdi, yazılmış mekaniklerin yarısı hiç çağrılmıyordu ve en
büyük stratejik kararların (fabrika, satın alma, halka arz) oyunda karşılığı
yoktu. Hepsi tek bir zincire bağlandı.

---

## 1. Temel yapısal sorun: çoğalan gerçek kaynaklar

Aynı deseni **yedi kez** buldum. Her seferinde aynı hikâye: bir şey iki-üç yerde
tutuluyor, hiçbiri diğerini güncellemiyor, ekran biriyle motor diğeriyle
konuşuyor.

| Ne | Kaç kaynak vardı | Sonuç |
|---|---|---|
| Üretim formülü | 2 | Ekran motorun **47 katını** gösteriyordu |
| Finansal hesap | 3 | Fabrika gideri birinde $5K, birinde $30M |
| Para biçimlendirme | 18 yerel fonksiyon | `$3.000.000.000.000B` gibi çıktılar |
| Maaş sistemi | 2 | Ekrandaki rakam motorla hiç uyuşmuyordu |
| Hisse / kap tablosu | 3 | Stock Market **%100 senin** diyordu (gerçek %65) |
| Satın alma yolu | 3 | Biri **kişisel cüzdandan** harcıyordu |
| Etkinlik listesi | 3 | Farklı fiyatlar, farklı etkiler |

Hepsi tek modüle indirildi: `production.ts`, `capacity.ts`, `workforce.ts`,
`equity.ts`, `mergers.ts`, `reportTypes.ts`, `core/utils`.

---

## 2. Yazılmış ama hiç çağrılmayan mekanikler

Kod tabanında duran ama motora bağlı olmayan sistemler. Oyuncu bunların
ekranını görüyor, düğmesine basıyor — hiçbir şey olmuyordu.

| Mekanik | Durum | Şimdi |
|---|---|---|
| **Maaş gideri** | Hesaplanıyor, tahsil edilmiyordu | Gelir tablosunda, sermayeden düşüyor |
| **Kredi faizi** | Sabit %5 | Kredi skoruna bağlı %3–%15 |
| **Kredi taksitleri** | `payMonthlyInterests` hiç çağrılmıyordu | Her çeyrek ödeniyor |
| **Kredi skoru** | `refreshCreditScore` hiç çağrılmıyordu | Her çeyrek tazeleniyor |
| **Kurul tepkisi** | `evaluatePlayerAction` hiç çağrılmıyordu | Her çeyrek kurula bildiriliyor |
| **İştirak performansı** | `evaluateSubsidiaries` hiç çağrılmıyordu | Her çeyrek değerleniyor |
| **Satın alma buff'ları** | Yalnızca ölü yolun yazdığı yerden okunuyordu | Ar-Ge, maliyet, pazarlama, faize gerçekten etki ediyor |
| **Pazarlık ekranı** | Para gidiyor, karşılığı yok | Tam M&A modeline bağlı |
| **Fabrika** | Sadece bir gider satırıydı | Kapasitenin, kalitenin ve markanın tavanı |

---

## 3. Yeniden kurulan mekanikler

### Pazar payı
Talep **oyuncunun kendi üretiminden** türetiliyordu — ne kadar üretirsen o kadar
satıyordun, fazla üretmenin cezası yoktu. Artık sabit pazar + çekicilik payı:

```
pay = senin çekiciliğin / (senin + rakiplerin)
```

Beş faktör: fiyat, pazarlama, kalite, marka, ürün cazibesi. Rakipler borsadaki
gerçek şirketler; birini satın alırsan payı sana geçiyor.

### Pazarlama
Satılan birim başınaydı — satmazsan ödemiyordun, yani oyundaki **tek risksiz
kaldıraç**tı. Artık çeyreklik bütçe, satıştan bağımsız. Etkisi mutlak değil
göreli: kıyas bütçeye kıyasla ne harcadığın önemli, ve kıyas kendi cironla
birlikte büyüyor.

### Üretim tesisi
"Kaç fabrika" sorusu tamamen kalktı. Tek tesis, **20 kademe**, adım adım
yükseliyor. Kademe dört gerçek kanaldan etki ediyor: birim maliyet, fire oranı,
**marka tavanı**, **kalite tavanı**. Atölyede premium marka olamıyorsun; Ar-Ge'de
keşfettiğin seviye 9 ürünü üretemiyorsun.

Yükseltme para **ve** araştırma puanı istiyor, inşaat sürüyor ve o sırada tesis
%65 kapasiteyle çalışıyor.

### Kadro ve moral
Maaş mutlak değil **göreli**: piyasa maaşına göre bir oran belirliyorsun.
Piyasada ödersen moral 70'te dengeleniyor. Moral artık eşik değil — üretim
verimliliğini, fire oranını ve devir hızını **sürekli** çarpıyor.

İşe alım bir çeyrek sürüyor, yeni gelen yarı verimle çalışıyor, çeyrekte
kadronun ~%25'inden fazlasını alamıyorsun.

### Değerleme ve hisse
`sermaye × 1.5` idi. Artık nakit + kazanç çarpanı + ciro çarpanı − borç.
Halka açık olmak çarpanları büyütüyor ama her çeyrek yargılanıyorsun.

Fiyatın gerçekçi oynaması için dört kademeli yumuşatma: TTM → kazanç gücü →
fiyat uyum hızı → ölçek sönümlemesi. Dev şirket küçük şirket gibi oynamıyor.

### Satın alma
Tek satırlık bir işlemdi. Artık dört bacaklı ve çeyreklere yayılıyor:
prim (ilk gün yok olan değer), entegrasyon maliyeti (önce gelir), sinerji
(6 çeyrekte oturur), hedefin kârı (yavaş akar). Kazandırmıyorsa 8. çeyrekte
şerefiye siliniyor.

Finansman seçilebiliyor: nakit, borç veya **hisse takası** — sonuncusu sayesinde
kendinden büyük bir şirketi alabiliyorsun, ama sonunda birleşmiş şirketin
sahibi sen olmuyorsun.

---

## 4. Ölçek düzeltmeleri

Bazı rakamlar başka bir oyuna aitti.

| | Önce | Sonra | Neden |
|---|---|---|---|
| Çalışan başına yıllık ciro | $24K | ~$490K | Maaş bu yüzden tahsil edilemiyordu |
| Pazar (Consumer) | 150K adet | 1M adet | Verimlilikle birlikte |
| Tesis tepe kapasitesi | — | 50M standart birim | Fusion Reactor tek başına 200K istiyor |
| 2. ürün Ar-Ge maliyeti | 100.000 RP | 50.000 RP | Eskisi **25 yıl** sürüyordu |
| Araştırmacı maaşı | $500K sabit | Piyasa maaşı ×1.2 | Tek araştırmacı cironun %30'uydu |
| Etkinlik fiyatı | Sabit $2.500 | Kişi başı | Büyüdükçe bedavaya geliyordu |

---

## 5. Oyun testinde çıkan hatalar

Oynayarak bulunan, sessizce veri bozan hatalar:

- **Pazarlama bütçesi kendiliğinden artıyordu.** Eski kayıt taşıması modal her
  açıldığında yeniden çalışıyor, üretim hedefiyle çarpıyordu. Artık yükleme
  sırasında bir kez.
- **Kadro hedefe hiç ulaşmıyordu** (48 hedefte 47). Doğal kayıp + işe alım
  gecikmesi. Artık beklenen devir hızı da kapatılıyor.
- **Satın alınan rakip ekranda hâlâ rakip görünüyordu.** Motor payı devrediyordu,
  ekran bilmiyordu.
- **Ürün emekliye ayrılınca bir daha açılamıyordu.** Artık siliniyor ve
  teknoloji yeniden kilitleniyor.
- **Pro Laptop "açık ama açık değil"** durumundaydı; kaldırıldı.
- **Temettü hisse başına 10 kat fazla** gösteriyordu (10M yerine 1M'e
  bölünüyordu).

---

## 6. Arayüz

- **Çeyrek raporu** gerçek bir gelir tablosuna dönüştü; her satırda ⓘ ile
  "bu nedir, neden bu kadar" açıklaması var.
- **Katlanabilir bölümler** — bilgi azalmadan karmaşa azaldı; kapalıyken bile
  özet görünüyor.
- **Yüzdelik kontroller kalktı.** Kapasite büyüdükçe yüzde ayarı kendi kendine
  fırlıyordu. Artık mutlak sayı, büyüyen tavan, `−100 −10 −1 | +1 +10 +100`
  butonları ve küçük yüzde kısayolları.
- **"Bu ürün neden bu kadar kazanıyor"** bölümü: kategorinin dolar büyüklüğü
  (Consumer $0.6B, Robotics $6.8B — **11 kat**), kapasite tüketimi ve pay.

---

## 7. Doğrulama yöntemi

- Motoru değiştirmeden önce **Python simülasyonu**: pazarlama, kapasite
  merdiveni, maaş/moral dengesi ve hisse oynaklığı önce simüle edildi. Birkaç
  tasarım hatası koda hiç girmeden yakalandı — marka ölüm sarmalı, kapasitesiz
  pazarlama tuzağı, ölçekten bağımsız oynaklık.
- Her adımda **`tsc` temel çizgiye karşı**: 78 satırlık mevcut hata listesiyle
  karşılaştırılıp **sıfır yeni hata** doğrulandı.
- Uçtan uca **bağlantı denetimleri**: zincirin her halkasının gerçekten bağlı
  olduğu betikle kontrol edildi.

---

## 8. Açık kalanlar

Dürüst liste:

- **Hiçbiri oynanarak tam test edilmedi.** Derleniyor ve bağlantılar yerinde.
- **Rakip tepkisi yok.** Rakipler statik; hiçbir şey yapmayan oyuncu batmıyor,
  sadece tavana çarpıyor.
- **Fazla mesai** tasarlandı, arayüzü var, motorda kısmi.
- **Çoklu tesis** ertelendi (dünyaya açılmayla birlikte).
- **Eski kayıtlar** yeni dengeyle uyumsuz — yeni oyun açmak gerekiyor.
- Bankacılık için zemin hazır: borç değerlemeden düşüyor, kaldıraç tavanı var,
  faiz kredi skoruna bağlı, kaldıraçlı satın alma çalışıyor.
