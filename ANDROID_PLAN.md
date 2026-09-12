# Android portu, adım adım

Bu plan ölçümle yazıldı, tahminle değil. Sayıların hepsi 11 Eylül 2026'da
`src/` üzerinde yapılan taramadan geliyor.

**Değişmeyecek olan:** oyunun mantığı. 3998 testin tamamı saf modüller ve
store'lar üzerinde, hiçbiri native'e dokunmuyor. Ekonomi, hikaye motoru, dört
kumar motoru, portre kayıt defteri, çeviri katmanı: hiçbiri platform bilmiyor.
Reanimated ve gesture-handler da yok, 58 `useNativeDriver` düz `Animated` API'si
üzerinde ve o iki platformda da çalışıyor.

**Değişecek olan:** arayüz. İş oradaki geçişte.

---

## FAZ 0 — Önce iki karar

Kod yazmadan önce, çünkü ikisi de sonradan değiştirilemiyor.

### 0.1 applicationId

Şu anda ortada iki farklı kimlik var ve ikisi de canlı:

```
app.json           com.salih115.succesor      (URL scheme de bu)
Xcode projesi      com.salihkilic.successor   (App Store'a giden bu)
```

Yazımları da farklı: uygulama adı `Succesor` tek s, bundle id `successor` çift s.

Android'de `applicationId` **yayınlandıktan sonra değiştirilemez**. Google Play'e
yüklediğin ilk paket adı kalıcıdır. O yüzden bu karar burada, şimdi verilmeli.

Önerim: iOS'ta gerçekten yayınlanan kimliği kullan, yani `com.salihkilic.successor`.
Tutarlı olur ve RevenueCat tarafında iki mağazayı eşleştirmek kolaylaşır.

`app.json` içindeki yanlış kimlik ayrıca düzeltilmeli, çünkü şu an kimsenin
okumadığı bir yerde yanlış bir değer duruyor. Bu evin klasik hatası:
**hiçbir şeyin okumadığı doğru veri**, burada tersi.

### 0.2 minSdkVersion

RN 0.81 varsayılanı yeterli. Düşürmeye çalışma, kazandığın kullanıcı sayısı
kaybettiğin API'ye değmez.

---

## FAZ 1 — Android projesini üretmek

React Native CLI'da var olan bir projeye platform ekleyen bir komut **yok**.
Tek yol, aynı sürümde temiz bir proje üretip `android/` klasörünü taşımak.

```bash
cd /tmp
npx @react-native-community/cli@latest init SuccesorAndroid --version 0.81.5 --skip-install
cp -R /tmp/SuccesorAndroid/android /Users/salihkilic/Succesor/android
rm -rf /tmp/SuccesorAndroid
```

Sonra elle düzeltilecek üç yer:

1. **`android/app/build.gradle`** → `applicationId` FAZ 0.1'de verilen karar
2. **`android/app/src/main/res/values/strings.xml`** → `app_name` = `Succesor`
3. **`android/app/src/main/java/.../MainActivity.kt`** → `getMainComponentName()`
   **`"Succesor"`** dönmeli

Üçüncüsü en kritik ve en sessiz hata: `index.js` içinde
`AppRegistry.registerComponent('Succesor', ...)` yazıyor. MainActivity başka bir
isim döndürürse uygulama boş beyaz ekranla açılır ve hata mesajı sebebi
söylemez.

**Bitiş ölçütü:** `npx react-native run-android` ile uygulama açılıyor, boş ekran
görünse bile çöküyor değil.

---

## FAZ 2 — Native eklentileri bağlamak

22 bağımlılığın hepsi çapraz platform, tarandı. `react-native-tab-view` saf JS,
onun android klasörü olmaması normal. Autolinking çoğunu kendi halleder, elle
iş isteyen dördü var.

### 2.1 Yazı tipi ikonları

`react-native-vector-icons`, iOS'ta `Info.plist` içindeki `UIAppFonts` ile 19 font
yüklüyor. Android'de bunun karşılığı `android/app/build.gradle` içine eklenen
`fonts.gradle` satırı. Eklenmezse bütün ikonlar **boş kare** çıkar, uygulama
çökmez, ve sebebi ekrana bakarak anlaşılmaz.

### 2.2 Açılış ekranı

`react-native-bootsplash` iOS'ta `BootSplash.storyboard` kullanıyor.
Android için ayrı bir üretim adımı var; `assets/bootsplash/manifest.json`
zaten duruyor (arka plan `#000000`, logo 250x116), yeniden üretmek yeterli.

### 2.3 İzinler

`Info.plist` içinde `NSLocationWhenInUseUsageDescription` var, yani konum
kullanılıyor. Android'de `AndroidManifest.xml` içine `ACCESS_FINE_LOCATION`
ve/veya `ACCESS_COARSE_LOCATION` gerekiyor, artı çalışma anında izin isteme.

### 2.4 Uygulama ikonu

`tools/app_icon.py` şu an sadece iOS setini yazıyor. Android'in `mipmap-*`
klasörleri ve bir de **adaptive icon** istiyor: ön plan ve arka plan iki ayrı
katman, ve sistem maskeyi kendi uyguluyor. Portrenin kenarları kırpılabilir,
o yüzden ön plan katmanına güvenlik boşluğu bırakmak gerek.

Araç zaten palet ve kırpmayı biliyor, ona bir `--android` bayrağı eklemek
doğru yol. İkinci bir script yazmak iki palet yaratmanın başlangıcı olur.

**Bitiş ölçütü:** uygulama açılıyor, ana ekran çiziliyor, ikonlar kare değil.

---

## FAZ 3 — Ölçülen görsel farklar

Bunlar çökme değil, görünüm. Ama bu oyunda görünüm önemsiz değil.
Sayılar gerçek taramadan.

### 3.1 Gölgeler — en büyüğü

```
65 dosyada 452 satır  shadowColor / shadowOffset / shadowOpacity / shadowRadius
bunlardan sadece 4'ünde  elevation
```

Android `shadow*` proplarını **tamamen yok sayıyor**. Yani 61 dosya Android'de
dümdüz render olacak ve kart tabanlı tasarımın bütün derinliği gidecek.

Tek tek gezmek yanlış olur. Tema zaten tek yerde; oraya gölgeyi iki platforma
birden çeviren tek bir yardımcı koymak ve 65 dosyayı ona bağlamak doğru şekil.

Ardından bunu koruyan bir test: **`shadowColor` kullanıp `elevation`
kullanmayan dosya kalmasın.** Bu proje bu şekli seviyor ve işe yarıyor.

### 3.2 Yazı ağırlıkları

```
783 yerde  fontWeight: '100'|'200'|'300'|'500'|'600'|'800'|'900'
```

Android'in varsayılan Roboto'su bu ağırlıkların hepsini taşımıyor, RN en
yakınına yuvarlıyor. Pratikte 600, 800 ve 900 hep bold'a düşüyor. Bu projede
700 ile 800 arasındaki fark bilinçli kullanılmış; Android'de o hiyerarşi iki
ağırlığa iner.

Çözüm: değişken ağırlıklı bir font ailesini paketlemek ve `fontFamily` ile
açıkça istemek. Şu an 29 yerde `fontFamily` var, yani zemin kısmen hazır.

### 3.3 Alert

```
170  Alert.alert
 36  style: 'destructive' veya 'cancel'
```

İkisi de iOS'a özel, Android'de sessizce yok sayılıyor. Yani yıkıcı eylemler
kırmızı görünmeyecek. Proje zaten `ConfirmPanel` diye kendi panelini yazmış ve
61 Alert'i ona çevirmiş; kalan 170'i çevirmek aynı işin devamı ve Android bunu
zorunlu hale getiriyor.

Hepsini bir anda çevirme. Önce `style: 'destructive'` olan 36'sı, çünkü
kaybolan tek bilgi orada.

### 3.4 letterSpacing

458 yer. İki platformda ölçüm farkı var, en görünür olduğu yer bu projedeki
büyük harfli küçük etiketler. Cihazda bakılacak, toplu düzeltilecek bir şey
değil.

### 3.5 Blur

Tek kullanım ama en kötü yerde: `CrystalNavBar`, yani her ekranda.
`@react-native-community/blur` Android'de sınırlı ve tırtıklı. Düz yarı saydam
bir zemin fallback'i gerekiyor.

### 3.6 Modal ve tutorial'ın iOS varsayımı

61 dosyada Modal var, 7 yerde `presentationStyle`/`pageSheet` gibi iOS'a özel
proplar.

Daha önemlisi: tutorial'ın ürün dersini iki adıma bölme kararı tamamen bir iOS
davranışına dayanıyor. `sequence.ts` içinde yazıyor: "iOS'ta Modal React
ağacının üstünde kendi penceresinde açılır, o yüzden tek kilit hem kartı hem
içindeki kontrolü aydınlatamaz". Android'de Modal bir Dialog, aynı şey değil.

Yani `q1-open-product` ve `q1-marketing` ayrımının Android'de hâlâ gerekli olup
olmadığı **cihazda bakılacak** bir soru. İki ihtimal de var: ya aynı kalır, ya
Android'de tek kilit yetiyor olur. Tahminle karar verilmemeli.

---

## FAZ 4 — Cihazda test listesi

Buradan sonrası elde telefonla. Sıra önemli: önce açılıyor mu, sonra oynanıyor
mu, sonra güzel mi.

### Açılış
- [ ] Uygulama açılıyor, beyaz ekranda kalmıyor
- [ ] Açılış ekranı (bootsplash) doğru, siyah zemin ve logo
- [ ] Ana ekran çiziliyor, ikonlar boş kare değil
- [ ] Geri tuşu (Android'in donanım/jest geri hareketi) mantıklı davranıyor

### Oyun döngüsü
- [ ] Yeni oyun başlıyor, tutorial soruluyor
- [ ] Play seçilince kilitler geliyor
- [ ] Ürün sayfası açılıyor, üretim kartı ve pazarlama kartı görünüyor
- [ ] **Modal içindeki tutorial kilidi görünüyor mu** (FAZ 3.6)
- [ ] Çeyrek ilerliyor, rapor açılıyor ve kapanıyor
- [ ] ArGe'ye girince Priya'nın kartı çıkıyor
- [ ] Mesaj ve mail geliyor, önizleme ile içerik aynı
- [ ] Kayıt tutuyor: uygulamayı kapat aç, oyun yerinde

### Kumarhane
- [ ] Dört oyun da açılıyor
- [ ] Rulet çarkı dönüyor (react-native-svg)
- [ ] Slot makinesi tırtıklı değil
- [ ] Poker masasında portreler yükleniyor

### Görünüm
- [ ] Kartların gölgesi var mı (FAZ 3.1 yapıldıysa)
- [ ] Başlık ağırlıkları birbirinden ayrılıyor mu (FAZ 3.2)
- [ ] Nav bar okunuyor mu (FAZ 3.5)
- [ ] Büyük harfli etiketler taşmıyor mu (FAZ 3.4)
- [ ] Farklı ekran oranlarında (18:9, 20:9, katlanabilir) kırılma var mı

### Metin
- [ ] Türkçe karakterler doğru (ş, ğ, İ, ı, ö, ü, ç)
- [ ] Uzun Türkçe metinler kutulardan taşmıyor

---

## FAZ 5 — Mağaza hazırlığı

Kodla ilgisi yok ama yayını bunlar engeller.

- [ ] Google Play Console hesabı ve yeni uygulama kaydı
- [ ] İmzalama anahtarı üretildi ve **yedeklendi** (kaybedilirse güncelleme
      yayınlanamaz)
- [ ] Data safety formu
- [ ] İçerik derecelendirme anketi
- [ ] Hedef API seviyesi Play'in o anki alt sınırını karşılıyor
- [ ] Mağaza görselleri: ekran görüntüleri, özellik grafiği, 512x512 ikon

Reklam eklendiğinde ayrıca:
- [ ] Policy and programmes > App content > Manage altında
      **"Yes, my app contains ads"**
- [ ] Data safety formu güncellendi

---

## Sıra ve neden bu sıra

```
FAZ 0  kararlar            değiştirilemez oldukları için önce
FAZ 1  proje ayağa kalksın açılmayan uygulamada hiçbir şey test edilemez
FAZ 2  eklentiler          oyun oynanabilir hale gelsin
FAZ 4  ilk test turu       nerede durduğunu gör, sonra düzelt
FAZ 3  görsel geçiş        neyin gerçekten bozuk olduğunu gördükten sonra
FAZ 4  ikinci test turu
FAZ 5  mağaza
```

FAZ 3'ün FAZ 4'ten sonra gelmesi bilinçli. 65 dosyayı gölge için gezmek, oyunun
Android'de açıldığını görmeden yapılacak bir iş değil. Önce aç, bak, sonra
düzelt.

**Reklam ve IAP en sona.** İkisi de iki platforma birden takılacak, ve Android
çalışmadan takılırsa entegrasyon iki kere yapılır.
