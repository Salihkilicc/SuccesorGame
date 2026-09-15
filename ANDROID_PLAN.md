# Android portu, adım adım

**DURUM (12 Eylül 2026):** FAZ 0, 1 ve 2 bitti ve commit'lendi. Sıradaki adım
FAZ 4'ün ilk turu ve o senin elinde: `npx react-native run-android`.
Aşağıdaki "Makinende bir kere" bölümü ondan önce yapılacaklar.

---

## Makinende bir kere kurulacaklar

Projenin gerçekten istediği sürümler, `android/build.gradle` içinden okundu,
tahmin değil:

```
compileSdk / targetSdk   36
minSdk                   24        (Android 7.0, 2016)
buildTools               36.0.0
NDK                      27.1.12297006
Kotlin                   2.1.20
```

1. **Android Studio** kur. Kurulum sırasında SDK Manager'dan **API 36** ve
   **Build Tools 36.0.0** işaretli olsun. NDK'yı da SDK Manager > SDK Tools
   altından, "Show Package Details" ile **27.1.12297006** sürümünü seç.

2. **JDK 17**. React Native 0.81 bunu istiyor. Android Studio kendi JDK'sını
   getiriyor, terminalden derleyeceksen ayrıca gerekli:
   ```
   java -version        # 17 görmelisin
   ```

3. **Ortam değişkenleri**, `~/.zshrc` içine:
   ```
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```
   Sonra yeni bir terminal aç.

4. **Bir cihaz.** Ya Android Studio > Device Manager'dan bir emülatör, ya da
   USB hata ayıklama açık gerçek bir telefon. Gerçek telefon tercihim: gölge,
   font ve blur farklarının hiçbiri emülatörde dürüst görünmüyor.
   ```
   adb devices          # cihazı listede görmelisin
   ```

5. **Çalıştır:**
   ```
   cd ~/Succesor
   npx react-native run-android
   ```

İlk derleme uzun sürer, Gradle her şeyi indirir. Sonrakiler hızlı.

### Takılırsan

Hatayı olduğu gibi yapıştır. Bu aşamada en sık görülen üçü:

- `SDK location not found` → adım 3 yapılmamış ya da terminal yenilenmemiş
- `Could not find ... NDK` → SDK Manager'dan tam sürüm numarası seçilmemiş
- `Unsupported class file major version` → JDK 17 değil

---

Bu plan ölçümle yazıldı, tahminle değil. Sayıların hepsi 11 Eylül 2026'da
`src/` üzerinde yapılan taramadan geliyor.

**Değişmeyecek olan:** oyunun mantığı. 3998 testin tamamı saf modüller ve
store'lar üzerinde, hiçbiri native'e dokunmuyor. Ekonomi, hikaye motoru, dört
kumar motoru, portre kayıt defteri, çeviri katmanı: hiçbiri platform bilmiyor.
Reanimated ve gesture-handler da yok, 58 `useNativeDriver` düz `Animated` API'si
üzerinde ve o iki platformda da çalışıyor.

**Değişecek olan:** arayüz. İş oradaki geçişte.

---

## FAZ 0 — Önce iki karar  ✅ BİTTİ

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

**KARAR: `com.salihkilic.successor`.** iOS'ta gerçekten yayınlanan kimlik bu.

Araştırınca üçüncü bir değer daha çıktı ve tablo planda yazdığımdan kötüydü:
`Info.plist` içindeki URL scheme de `com.salih115.succesor` ve **o canlı**,
derin bağlantı onu kullanıyor. Yani üç string var ve ikisi bilerek farklı.
Hepsi `IDENTITY.md` dosyasında, hangi dosyanın hangi isim için yetkili
olduğuyla birlikte.

`app.json` düzeltildi. Orada yıllardır yanlış bir kimlik duruyordu ve hiçbir
şey itiraz etmiyordu, çünkü `ios.bundleIdentifier` bir Expo alışkanlığı ve
bare RN onu okumuyor. Bu evin klasik hatası "hiçbir şeyin okumadığı doğru
veri"ydi; bu onun aynadaki hali ve daha kötüsü.

### 0.2 minSdkVersion

RN 0.81 varsayılanı yeterli. Düşürmeye çalışma, kazandığın kullanıcı sayısı
kaybettiğin API'ye değmez.

---

## FAZ 1 — Android projesini üretmek  ✅ BİTTİ

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

## FAZ 2 — Native eklentileri bağlamak  ✅ BİTTİ

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
katman, ve sistem maskeyi kendi uyguluyor.

Buradaki varsayım yanlış çıktı ve ölçümle bulundu. "Güvenlik boşluğu bırakmak
gerek" diye yazmıştım; en sert maske olan tam daireye karşı ölçünce öznenin
sadece %7'si kayboluyor ve **hepsi sol alttaki omuz köşesi**. Yüz ve saç
sınıra hiç yaklaşmıyor. Küçültülmüş sürüm yan yana konunca görünür şekilde
daha kötü: kafa üçte ikiye iniyor ve yapıştırılan karenin kenarı dikiş
bırakıyor.

Yani ön plan tam tuval. `tools/app_icon.py --android` 23 dosya üretiyor ve
arka plan katmanının rengini görselin kendi köşesinden okuyor, iki katman
ayrışamasın diye.

**Bitiş ölçütü:** uygulama açılıyor, ana ekran çiziliyor, ikonlar kare değil.

---

## FAZ 3 — Ölçülen görsel farklar

Bunlar çökme değil, görünüm. Ama bu oyunda görünüm önemsiz değil.
Sayılar gerçek taramadan.

### 3.1 Gölgeler — DÜZELTME: bu ölçüm yanlıştı

**Bu bölüm önce şunu iddia ediyordu ve iddia tersti:**

> 65 dosyada 452 satır shadow, bunlardan sadece 4'ünde elevation
> Yani 61 dosya Android'de dümdüz render olacak.

Komut şuydu:

```
for f in $(grep -rl "shadowColor" ...); do grep -q "elevation" "$f" || echo "$f"; done | wc -l
```

Bu komut elevation **içermeyen** dosyaları sayıyor ve 4 döndürdü. Ben onu
"sadece 4'ünde var" diye okudum. Doğrusu:

```
shadowColor iceren dosya          65
  elevation ICERMEYEN              4
  elevation ICEREN                61
```

Blok seviyesinde: **112 gölge bloğunun 96'sında zaten elevation var.**
Yani Android derinliği büyük ölçüde hazırdı ve 65 dosyayı gezmeye gerek yok.

Ders, ve bu projede üçüncü kez: **sayının kendisi değil, sayının neyi
saydığı.** "Az" görünen bir sonuç iyi haber olabilir ve kontrol edilmeden
bir faza dönüştürülmemeli.

### 3.1b Gerçekten eksik olanlar

Kalan gerçek iş çok daha küçük ve ölçüldü:

- **4 dosyada** hiç elevation yok
- **19 blokta** elevation var ama aynı blokta `backgroundColor` yok

### 3.1c DÜZELTME: elevation hakkında iki şey daha yanlış yazmıştım

Yukarıdaki ikinci madde ve onu izleyen paragraf şunu iddia ediyordu:

> Android elevation saydam bir View üzerinde hiçbir şey çizmez.
> RN `shadowColor` değerini Android'in elevation'ına iletmiyor.
> Koyu zeminde siyah gölge görünmez.

İkisi de yanlış. `BaseViewManager.java`, on satırda söylüyor:

```java
@ReactProp(name = ViewProps.SHADOW_COLOR, defaultInt = Color.BLACK, customType = "Color")
public void setShadowColor(@NonNull T view, int shadowColor) {
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
    view.setOutlineAmbientShadowColor(shadowColor);
    view.setOutlineSpotShadowColor(shadowColor);
  }
}
```

- **Android 9'dan itibaren `shadowColor` iletiliyor.** Gölge siyah değil,
  ne yazdıysak o renk.
- **Gölge zeminden değil OUTLINE'dan çiziliyor.** `borderRadius` bir
  outline üretiyor, dolgu olsun olmasın. Yani saydam arka planlı bir
  View da gölge çiziyor.

Bu iddianın bedeli hemen görüldü: `CrystalNavBar`'ın `blurContainer`
bloğu `shadowColor: '#CFD0D2'` ve `elevation: 15` taşıyor, arka planı da
`transparent`. Ben "Android burada hiçbir şey çizmiyor" dedim, cihaz
"tab bar'ın altında gri bir parlaklık var" diye geri döndü. Doğru olan
cihazdı.

İki platform arasındaki gerçek fark şu ve 19 bloğun hepsini ilgilendirir:

```
YAYILMA   iOS shadowRadius kadar bulanıklaştırır.
          Android elevation kadar yayar. Aynı sayı değiller.

ALFA      iOS shadowOpacity ile çarpar.
          Android'de böyle bir prop yok; rengin kendi alfasını kullanır.
          Opak bir hex Android'e tam güçte varır.
```

Yani iOS için yazılmış bir gölge Android'e hem daha geniş hem daha
parlak varıyor. 19 bloğun işi "elevation ekle" değil, "aynı ağırlığa
getir".

### 3.2 Yazı ağırlıkları — DÜZELTME: mekanizma iddiası yanlıştı

**Bu bölüm önce şunu söylüyordu:**

> Android'in varsayılan Roboto'su bu ağırlıkların hepsini taşımıyor, RN en
> yakınına yuvarlıyor. Pratikte 600, 800 ve 900 hep bold'a düşüyor.

RN'in kendi kaynağı, `ReactFontManager.kt`, tersini söylüyor:

```kotlin
public fun apply(typeface: Typeface?): Typeface =
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
      Typeface.create(typeface, nearestStyle)     // NORMAL ya da BOLD
    } else {
      Typeface.create(typeface, weight, italic)   // gerçek sayısal ağırlık
    }
```

`nearestStyle` gerçekten de 700'ün altını NORMAL, üstünü BOLD yapıyor. Ama
o dal **yalnızca API 28'in altında** çalışıyor. Android 9 ve sonrasında
sayısal ağırlık doğrudan Android'e gidiyor.

`minSdkVersion = 24`, yani çökme API 24 ile 27 arasında gerçek: Android
7.0, 7.1, 8.0, 8.1. 2026'da bu cihazlar tek haneli bir yüzde. Emülatör API
36, yani **emülatörde bu hata hiç görünmez.**

#### Geriye kalan gerçek soru

API 28 üstünde sayı Android'e gidiyor, ama sistem Roboto ailesinde her
ağırlığın bir yüzü yok. Android en yakınını seçiyor. Kullandığımız dağılım:

```
550  fontWeight: '700'
387  fontWeight: '800'
219  fontWeight: '600'
126  fontWeight: '900'
 31  fontWeight: '500'
 19  fontWeight: '300'
  4  fontWeight: '400'
  1  fontWeight: '200'
103  fontWeight: 'bold'   (= 700)
```

700 ve 800 birlikte 937 bildirim, yani ekranın çoğu. Roboto'da 700 var,
800 yok. Android 800 için 700 ya da 900'ü seçiyor; 700'ü seçerse bu iki
ağırlık aynı görünür ve hiyerarşi yok olur.

**Bunu okuyarak karara bağlayamam, cihaz ister.** Gölge ölçümünde tam bu
hatayı yaptım: plan bir mekanizma iddia etti, ben ölçmeden üzerine iş
yazdım, ve iddia tersti.

#### Cihazda tek bakışta karar

Ana ekrandaki oyuncu kartı, üç ağırlığı yan yana taşıyor:

```
name          800     "uihuhi Hale"
ageChipLabel  700     "AGE"  /  "MTH"
ageChipValue  900     "20"   /  "4"
```

- **AGE ile 20 farklı kalınlıkta görünüyorsa** 900 çalışıyor demektir.
- **İsim ile AGE aynı kalınlıkta görünüyorsa** 800, 700'e düşüyor demektir
  ve font paketlemek gerekir.
- **İsim, AGE'den belirgin kalınsa** sorun yok ve bu fazın işi biter.

Font paketlemek 1337 bildirime ve iOS'un görünümüne dokunur. Doğrulanmamış
bir önerme için yapılacak iş değil.

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

### 3.4 letterSpacing — cihazda bakıldı, şikâyet gelmedi

458 yer, sayı doğru. Ama bu fazın kapanma ölçütü baştan "cihazda bakılacak"
idi ve bakıldı: uygulama Android'de elli küsur ekran boyunca gezildi,
ekran görüntüleri geldi, harf aralığıyla ilgili tek bir rapor gelmedi.

Bir şeyin yanlış göründüğünü kimse söylemiyorsa 458 yere dokunmak
düzeltme değil, risk. **Kapalı.** Geri açan şey bir rapor olur, sayı değil.

### 3.5 Blur

Tek kullanım ama en kötü yerde: `CrystalNavBar`, yani her ekranda.
`@react-native-community/blur` Android'de sınırlı ve tırtıklı. Düz yarı saydam
bir zemin fallback'i gerekiyor.

### 3.6 Modal ve tutorial'ın iOS varsayımı

#### iOS'a özel proplar: ölçüldü, sorun değil

7 yerde `presentationStyle` var. Android bu prop'u yok sayıyor, yani o
modallar sayfa yaprağı yerine tam ekran açılıyor. Bunun bir de tehlikeli
hali var ve o yok: RN, `transparent` ile `presentationStyle` birlikte
verilirse uyarı basıp davranışı bozuyor. **Yedisinde de `transparent` yok.**

Üstelik yedinin beşi kapalı bayrakların ya da rafa kaldırılmış LuxoNet'in
içinde. Erişilebilir olan tek bir tane: `FamilyMemberDetailModal`, ve o da
Android'de tam ekran açılıyor. Kozmetik.

#### Asıl mesele: modal penceresi durum çubuğunun altına inmiyordu

Plan bunu görmemişti ve cihazdan rapor geldi: çeyrek raporunun üstünde
keskin kenarlı gri bir dikdörtgen, arkasında uygulamanın moru.

Android'de `Modal` **kendi penceresini** açıyor, ve o pencere söylenmediği
sürece durum çubuğunun altına inmiyor. Karartma orada bitiyor, üstünde
uygulamanın kendisi kalıyor. Keskin kenar, pencere sınırı.

Bunu söyleyen prop `statusBarTranslucent` ve **64 modalın 6'sında** vardı.
Şimdi hepsinde, `navigationBarTranslucent` ile birlikte. 57 modal.

#### Tutorial'ın iki adımlı ürün dersi

Hâlâ cihazda bakılacak bir soru, ve şu ana kadar Android'de tutorial'ın
bozulduğuna dair rapor gelmedi. Açık bırakıldı, tahminle kapatılmadı.

Daha önemlisi: tutorial'ın ürün dersini iki adıma bölme kararı tamamen bir iOS
davranışına dayanıyor. `sequence.ts` içinde yazıyor: "iOS'ta Modal React
ağacının üstünde kendi penceresinde açılır, o yüzden tek kilit hem kartı hem
içindeki kontrolü aydınlatamaz". Android'de Modal bir Dialog, aynı şey değil.

Yani `q1-open-product` ve `q1-marketing` ayrımının Android'de hâlâ gerekli olup
olmadığı **cihazda bakılacak** bir soru. İki ihtimal de var: ya aynı kalır, ya
Android'de tek kilit yetiyor olur. Tahminle karar verilmemeli.

---

## FAZ 4 — Cihazda test

### Android'de test etmek Xcode'dan nasıl farklı

Bildiğin şeye bağlayarak: Xcode'da Simulator ne ise Android'de **emulator**
odur. İki fark var ve ikisi de işini kolaylaştırıyor.

Birincisi, Android Studio'yu açmana gerek yok. Xcode'da Run tuşuna basmak
zorundasın; burada her şey terminalden oluyor. Android Studio sadece SDK'yı
ve emülatörü kurmak için lazım, sonra bir daha açmayabilirsin.

İkincisi, iki terminal çalışıyor. Biri **Metro**, JavaScript'i servis eden
sunucu. Diğeri derlemeyi başlatan. `run-android` Metro'yu kendi açıyor.

### Emülatör oluşturmak

Android Studio > sağ üstte **Device Manager** (telefon ikonu) > **Add a new
device** > **Create Virtual Device**.

- Cihaz olarak **Pixel 7** ya da **Pixel 8** seç. Gerçek dünyada yaygın bir
  ekran oranı, ve oyun 20:9'da nasıl duruyor onu görmen lazım.
- Sistem imajı olarak **API 36** indir.
- Bitir, listede görünsün, yanındaki ▶ tuşuyla başlat.

Emülatör açık kalsın. Şimdi terminale dön.

### Çalıştırmak

```
cd ~/Succesor
npx react-native run-android
```

İlk sefer uzun. Gradle bütün bağımlılıkları indiriyor, on dakikayı geçebilir.
Sonraki derlemeler çok daha hızlı.

Başarılıysa iki şey olur: emülatörde uygulama açılır, ve terminalde Metro
çalışmaya devam eder. **Metro'yu kapatma**, JavaScript'i o servis ediyor.

### Kod değiştirince

Metro açıkken kaydettiğin her değişiklik anında yansıyor, tekrar derlemene
gerek yok. Sadece `android/` altındaki native dosyalara dokunursan yeniden
`run-android` gerekiyor.

Elle yenilemek istersen emülatörde **R tuşuna iki kere** bas.

### Geliştirici menüsü

Emülatörde **Cmd + M** (gerçek telefonda telefonu salla). Açılan menüde:

- **Reload** yeniden yükler
- **Toggle Inspector** bir elemana dokununca hangi bileşen olduğunu ve
  ölçülerini gösterir. Layout kayması ararken en işe yarar olan bu.

### Hata nerede okunur

Üç yer var ve hangisine bakacağın hatanın türüne göre değişiyor:

1. **Kırmızı ekran.** JavaScript hatası. Sebebi ekranda yazıyor, okuyabilirsin.
2. **Metro terminali.** `console.log` çıktıları ve JavaScript uyarıları.
   Bu oyun çok log basıyor, hikaye ve tutorial olayları oradan görünür.
3. **`adb logcat`.** Native taraf. Uygulama hiç açılmadan çöküyorsa ya da
   beyaz ekranda kalıyorsa cevap SADECE burada olur, diğer ikisi sessiz kalır.
   Gürültüsü çok, filtrele:
   ```
   adb logcat *:E ReactNative:V ReactNativeJS:V
   ```

### Beyaz ekranda kalırsa

Bu portun en sinsi hatası ve tam olarak bunun için test yazdık. Önce testi
çalıştır, çünkü cevabı saniyede verir:

```
npx jest src/core/androidBoot.test.ts
```

Yeşilse isim eşleşmesi doğru demektir, sorun başka yerde: `adb logcat`'e bak.

### Emülatör mü gerçek telefon mu

İkisi de lazım ve sırayla:

**Önce emülatör**, çünkü hızlı ve "açılıyor mu, oynanıyor mu" sorusunu
cevaplamak için yeterli.

**Sonra gerçek telefon**, çünkü FAZ 3'te düzelteceğimiz üç şeyin hiçbiri
emülatörde dürüst görünmüyor: gölgeler, yazı ağırlıkları ve blur. Emülatör
bunları masaüstü GPU'sunda taklit ediyor ve sonuç gerçek cihazdan farklı
çıkıyor. Gölgelerin gerçekten kaybolup kaybolmadığına telefonda karar
vereceğiz.

Gerçek telefonda: Ayarlar > Telefon hakkında > **Derleme numarasına yedi kez
dokun** (geliştirici modu açılır), sonra Ayarlar > Geliştirici seçenekleri >
**USB hata ayıklama** aç. USB ile bağla, `adb devices` listede görmeli, sonra
aynı `run-android` komutu.

### Ne arayacaksın

Aşağıdaki liste sırayla: önce açılıyor mu, sonra oynanıyor mu, sonra güzel mi.
Üçüncüye ancak ilk ikisi geçtikten sonra bak.

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
