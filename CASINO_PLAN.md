# Kumarhane: yeniden tasarım taslağı

Bu belge kod değil, yol haritası. Her başlık ayrı bir prompt olacak kadar bağımsız.

---

## 0. Önce ölçtüm: durum ne

### Matematik aslında sağlam, his bozuk

| Oyun | Ödeme oranı (RTP) | Kaç elde bir kazandırıyor | Kazanınca ne veriyor |
|---|---|---|---|
| Blackjack | ~%99 | ~%43 | 2x, blackjack 2.5x |
| Rulet kırmızı/siyah | %97,3 | **%48,6** | **2x** |
| Rulet düzine | %97,3 | %32,4 | 3x |
| Rulet tek sayı | %94,6 | %2,7 | 35x |
| Slot "ticker" | %94,0 | **%34** | ikinci ödül **x1,5** |
| Slot "boardroom" | %94,0 | %35 | ikinci ödül x1,4 |
| Slot "dynasty" | %94,0 | %25 | ikinci ödül x1,2 |

**"Rulet kazandırıyor, slotlar kazandırmıyor" hissi doğru ama sebebi RTP değil.**
Aradaki fark sadece 3,3 puan. Gerçek sebep şu: slot 100 elin 34'ünde ödüyor ama
ödediğinin çoğu **x1,2 ile x1,5 arası**. 1000 basıp 1200 almak teknik olarak
kazanmaktır, duygusal olarak hiçbir şeydir. Rulette kırmızıya basıp **paranı
ikiye katlamak** aynı sıklıkta oluyor ve her seferinde olay gibi geliyor.

Yani slotun sorunu cömertliği değil, **dağılımı**: çok sık, çok küçük.

### İkinci ölçüm: rulet gerçekten tahmin edilebilir mi

Hayır, RNG düzgün: `Math.floor(Math.random() * 37)`, tek sıfırlı Avrupa çarkı.
"Predictable" hissi büyük ihtimalle kırmızı/siyahın %48,6 ile neredeyse yazı
tura olmasından ve **hiçbir gösteri olmamasından** geliyor. 3 saniye bekliyorsun,
bir sayı beliriyor. Beklerken hiçbir şey olmuyor, o yüzden beklemek boş geliyor.

### Üçüncü ölçüm: bu en önemlisi

`package.json`'da animasyon adına **sadece `react-native-linear-gradient`** var.

- `react-native-reanimated` — **yok**
- `react-native-svg` — **yok**
- `@shopify/react-native-skia` — **yok**
- `react-native-gesture-handler` — **yok**
- ses / titreşim kütüphanesi — **yok**

Her şey RN'in kendi `Animated` API'siyle yapılmış. Bu, bütün planın şeklini
belirliyor ve ilk kararımız bu olmalı.

---

## 1. Tek büyük karar: hangi araçlarla çizeceğiz

Üç yol var.

**A. Hiçbir şey ekleme, `Animated` ile yap.**
Dönen çark, yörüngede dönen bilye, uçan kart, titreyen makara — hepsi
`transform: rotate/translate` ve `opacity`. Bunlar `useNativeDriver: true` ile
UI thread'de çalışır, 60 fps verir. Kısıt: **şekil çizemezsin.** Çarkın 37 renkli
dilimi View ile yapılırsa çirkin ve pahalı olur.

**B. Sadece `react-native-svg` ekle. (Önerim)**
Yaygın, hafif, kurulumu iOS'ta sorunsuz. Çarkın dilimlerini, masanın oval
keçesini, kart yüzlerini düzgün çizer. Animasyonu yine `Animated` yapar.
Bu ikisi bir araya gelince istediğin her şey çıkar.

**C. Skia ekle.**
En güçlüsü, patlama/parçacık/shader işleri için biçilmiş kaftan. Ama büyük bir
bağımlılık, build süresini ve APK/IPA boyutunu artırır, ve elimizdeki iş için
fazla. Bence şimdilik hayır.

> **Kararı sen ver, ama benim önerim B.** Tek `react-native-svg` ile
> profesyonel görünen bir çark, oval bir masa ve gerçek kart yüzleri çıkar.
> Skia'yı ileride "patlama" efektleri gerçekten yetmezse ekleriz.

---

## 2. İkinci büyük karar: matematiği gösteriden ayır

Şu an her oyunun mantığı ve zamanlaması aynı hook'un içinde. `useSlotsLogic`
hem sonucu üretiyor hem `setTimeout(2000)` ile bekletiyor. Bu yüzden:

- animasyonu değiştirmek matematiği bozma riski taşıyor
- sonucu test etmek için 2 saniye beklemek gerekiyor
- "daha hızlı olsun" demek kodun her yerine dokunmak demek

**Kural: motor sonucu ANINDA üretir, ekran onu yavaşça anlatır.**

```
core/casino/<oyun>.ts     saf, senkron, rastgeleliği enjekte edilmiş
                          -> tek fonksiyon: girdi -> sonuç
features/casino/...       sonucu alır, animasyonla gösterir
```

Bu ayrım olmadan geri kalan her şey daha zor. **İlk prompt bu olmalı.**

---

## 3. Oyun oyun plan

### 3.1 Rulet — çark ve yörüngedeki bilye

Senin iki fikrinden **ikincisi** daha iyi: çarkı küçült, masayı oval yap,
bilye çarkın etrafında dönsün.

Nasıl çalışır:

- Çark bir View, `rotate` ile döner. 37 cep SVG dilimi.
- Bilye ayrı bir View, **ters yönde** ve daha hızlı döner. Gerçek rulette de
  böyledir ve tek başına bu detay her şeyi gerçekçi yapar.
- Sonuç en başta belli olur. Animasyon o sonuca **varmak zorunda**: bitiş açısı
  `hedefCep * (360/37)` olarak hesaplanır, üstüne birkaç tam tur eklenir.
- Yavaşlama `Easing.out(Easing.cubic)`. Bilye son yarım turda çarkın hızına
  kilitlenir ve cebe "düşer" (küçük bir zıplama, 2-3 kare).
- Toplam **2,2 saniye**. Şu anki 3 saniyeden kısa ama içi dolu olduğu için uzun
  hissettirmez.

Ek olarak: son 12 sayı şeridi (gerçek kumarhanelerde vardır), ve kazanan cebin
1 saniye altın parlaması.

### 3.2 Slot — baştan yazalım, haklısın

Üç şey değişecek.

**Hız.** Şu an `spinDuration = 2000` + makara gecikmesi `colIdx * 300` + sonuç
penceresi. Yeni hedef: **normal el 900 ms**. Makaralar 0/220/440 ms'de durur.

**Beklenti (anticipation) katmanı.** Araştırmanın tek net bulgusu bu: makaralar
sırayla durur ve **her sonraki makara bir öncekinden yavaş** döner. İlk iki
makara tutarsa üçüncü belirgin biçimde yavaşlar, sallanır, sesi değişir. Bu,
kazanma ihtimalini değiştirmez, sadece o 400 ms'yi olay yapar. Kumarhane
sektörünün en eski hilesi ve tamamen dürüst bir hile: sonuç zaten belli.

**Dağılım.** RTP %94 kalsın ama şekli değişsin:

| | şimdi | öneri |
|---|---|---|
| ikinci ödül | x1,2-1,5, 4 elde bir | **kaldır ya da x2'ye çıkar, 8 elde bir** |
| üçlü | x3-x100 | aynı |
| yeni: iki katlı | — | **art arda kazanç çarpanı x2, x3** |

Aynı %94, ama para daha az sıklıkta ve daha büyük parçalar hâlinde geliyor.
x1,2 ödemek oyuncuya kazandığını hissettirmiyor, sadece bahsini geri veriyor.

**"Patlama" anları.** Senin bahsettiğin şey: üçlü gelince makaralar sarsılır,
semboller büyür, ekran kenarından altın parçacıklar (10-15 küçük View,
`Animated` ile yukarı ve dışarı, sonra sönümlenir). Ucuz ve etkili.

### 3.3 Blackjack — ortada masa

- Oval keçe masa (SVG), üstünde krupiye alanı, altında oyuncu alanı.
- Kartlar **desteden uçarak** gelir: destenin konumundan hedefe `translate`,
  180 derece `rotateY` ile yüzü açılır. Kart başına 260 ms, 120 ms arayla.
- Krupiyenin kapalı kartı sonda çevrilir. Bütün gerilim orada.
- El toplamı kartın yanında canlı sayar.
- Split ve double eklenebilir ama **ikinci turda**; önce masa ve dağıtım.

### 3.4 Poker — asıl iş burada

Senin istediğin şey en zoru ve en değerlisi: masada insanlar olsun.

**Masa.** 6 kişilik oval masa. Sen alttasın, 5 rakip etrafında. Her rakip:
yuvarlak avatar, isim, chip yığını, ve ne yaptığını söyleyen küçük bir balon
("call 2M", "raise 8M", "fold").

**Rakipler kim.** Senin fikrin doğru ve zaten elimizde veri var:

- **VIP (Noir) masası:** sadece CEO'lar. Rakip şirketlerin CEO'ları,
  `PRODUCT_MARKETS` içindeki competitor listesinden isim ve güç alınır.
  Güçlü rakip = iyi oyuncu. Bu, kumarhaneyi oyunun geri kalanına bağlar.
- **Şehir masaları:** çoğunlukla rastgele insanlar, ama **düşük ihtimalle
  bir CEO ya da kendi kurul üyelerinden biri** masaya oturur. Kurul üyenle
  poker oynamak ve onu soymak, ertesi çeyrek sadakatini etkilesin.

**Botlar.** Araştırmanın söylediği standart şema, ve bize fazlasıyla yeter:
iki eksen, dört kişilik.

```
            pasif              agresif
sıkı      Kaya               Cerrah      (az el oynar, oynadığını sertçe oynar)
gevşek    Kalabalık          Manyak      (her ele girer, sürekli yükseltir)
```

Her bota rastgele bir kişilik + rastgele bir "hata payı" verilir. Zorluk
seviyesi bu hata payıdır: acemi bot elini yanlış değerlendirir, usta bot
neredeyse doğru oynar. **GTO çözmeye gerek yok**, kişilik + el gücü + hata payı
üçlüsü "gerçek insanla oynuyorum" hissi için fazlasıyla yeterli.

Botlar sırayla ve **gecikmeli** oynar (400-900 ms, rastgele). Bu gecikme
"online" hissinin tamamıdır. Hepsi aynı anda oynarsa bilgisayar olduğu anlaşılır.

**Avatarlar.** Şimdilik: renkli daire + baş harfler + kişiliğe göre kenar rengi.
Fotoğrafları sonra ürettiğinde (ComfyUI ile yaptığın portreler) aynı dairenin
içine düşecek, tek satır değişecek. Yapı şimdiden buna göre kurulmalı.

### 3.5 Ortak: ses ve titreşim

`react-native-haptic-feedback` çok küçük bir paket ve kazanma anlarında
telefonun titremesi, animasyondan daha fazla iş yapıyor. Sesi şimdilik atlarım.

---

## 4. Denge

Toplam kazandırma oranını **düşürmeyi önermiyorum**. Sorun oran değil, oranın
dağılımı. Ama üç ayar öneriyorum:

1. **Slotun ikinci ödülü** yukarı, sıklığı aşağı (yukarıda anlatıldı).
2. **Rulet tek sayı** %94,6 ile en cömert olmayan bahis ama en heyecanlısı.
   Olduğu gibi kalsın; problem değil.
3. **Blackjack ~%99 ile oyunun en kârlı masası.** Doğru oynayan bir oyuncu
   için neredeyse bedava para. Krupiye kurallarını sıkılaştırmak gerekebilir
   (17'de durma, kart sayma karşıtı deste karması). Bu **ölçülerek** yapılmalı,
   tahminle değil.

---

## 5. Sıra: hangi prompt neyi yapsın

Her satır bir oturum. Bağımlılık sırasına göre.

| # | İş | Neden bu sırada |
|---|---|---|
| 1 | **Motoru gösteriden ayır.** Dört oyunun mantığını `core/casino/` altına saf fonksiyonlara taşı, testlerini yaz. Ekranlar aynı kalsın. | Bundan sonraki her şey buna dayanıyor. Görsel hiçbir şey değişmez ama zemin sağlamlaşır. |
| 2 | **`react-native-svg` ekle, rulet çarkını ve bilyeyi yaz.** | İlk görünür kazanım. Tek oyun, kapalı iş. |
| 3 | **Slotu baştan yaz.** Hız, beklenti katmanı, patlama, yeni dağılım. | En çok oynanan makine, en büyük his farkı. |
| 4 | **Blackjack masası ve kart dağıtımı.** | Poker'in kart animasyonunu buradan miras alacak. |
| 5 | **Poker masası ve rakipler.** Avatarlar, oturma düzeni, sıra ve gecikme. | Kart animasyonu 4'ten hazır gelir. |
| 6 | **Poker botları.** Dört kişilik, rastgele hata payı, karar ağacı. | Masa çalışırken beyni takmak kolay. |
| 7 | **Rakip havuzu.** CEO'lar, kurul üyeleri, rastgele insanlar; VIP masası ve şehir masası farkı. | Botlar çalışınca kimliği giydirmek son adım. |
| 8 | **Denge geçişi.** Hepsini simüle et, RTP'leri ölç, blackjack'i düzelt. | En sonda, çünkü her şey oturmadan ölçmek anlamsız. |
| 9 | **Haptik ve son cila.** | Süs. |

**1 ve 2'yi bir arada yapmayalım.** Ayırma işi sıkıcı ama her şeyi taşıyor;
onu yaparken bir de çark yazmaya kalkarsak ikisi de yarım kalır.

---

## 6. Sana sorularım

1. **`react-native-svg` ekleyelim mi?** (Önerim: evet. Skia'ya şimdilik hayır.)
2. **Poker kaç kişilik olsun?** 6 standart. 4 daha hızlı ve telefonda daha
   rahat sığar. Ben 6 derim, VIP masasında 6 CEO oturması iyi görünür.
3. **Blackjack'i %99'dan indirelim mi?** İndirirsek oyuncu fark eder ve
   şikayet eder; bırakırsak "en akıllı oyun blackjack" olur, ki bu aslında
   gerçek hayatta da doğru. Bence bırakalım, sadece bahis tavanı zaten
   servetin yüzdesi olduğu için kendini sınırlıyor.
4. **Sıralamayı onaylıyor musun?** Özellikle 1. maddeyi atlamak isteyip
   istemediğini bilmem lazım; atlarsak hızlı başlarız ama her animasyon
   değişikliğinde matematiği bozma riski taşırız.
