# Reklam ve satın alma: sırayla kurulum

Kod tarafında yapılacak bir şey yok, kural motoru yazıldı ve test edildi
(`src/core/ads/policy.ts`). Bu dosya senin yapacağın işi anlatıyor.

**Sırayı bozma.** Her adım bir öncekinin çıktısını istiyor. Ortadan
başlarsan konsol seni geri gönderiyor.

---

## Projenin değişmeyecek kimlikleri

Konsollara girerken buradan kopyala.

```
Android applicationId     com.salihkilic.successor
iOS bundle identifier     com.salihkilic.successor
Uygulama adı              Succesor            (tek s, bilerek)
minSdk / targetSdk        24 / 36
```

> `com.salih115.succesor` diye üçüncü bir string daha var, o **URL scheme**
> ve derin bağlantı onu kullanıyor. Mağazalara onu girme. Hangi dosyanın
> hangi isim için yetkili olduğu `IDENTITY.md` içinde.

---

# ADIM 0 — Yükleme anahtarı

**Bunu atlarsan Play hiçbir şeyi kabul etmiyor, ve bu planda yazmıyordu.**

`android/app/build.gradle` şu anda şunu diyor:

```gradle
release {
    // Caution! In production, you need to generate your own keystore file.
    signingConfig signingConfigs.debug
}
```

Yani release derlemesi **debug anahtarıyla** imzalanıyor. Bu React
Native'in şablonundan geliyor ve uyarısı da orada duruyor. Play debug
anahtarıyla imzalanmış bir paketi reddediyor.

Bundan daha kötüsü şu: **Play'e yüklediğin ilk anahtar kalıcı.**
Kaybedersen aynı uygulamayı bir daha güncelleyemezsin. Yeni listeleme
açmak zorunda kalırsın; yorumlar, sıralama, kurulumlar gider.

### 0.1 Anahtarı üret

```
cd ~/Succesor/android/app
keytool -genkeypair -v -storetype PKCS12 \
  -keystore succesor-upload.keystore \
  -alias succesor-upload \
  -keyalg RSA -keysize 2048 -validity 10000
```

Soracağı şifreyi bir yere yaz. Parola yöneticine koy.

### 0.2 Şifreleri repoya koyma

`~/.gradle/gradle.properties` dosyasına (projenin içine değil, ev dizinine):

```
SUCCESOR_UPLOAD_STORE_FILE=succesor-upload.keystore
SUCCESOR_UPLOAD_KEY_ALIAS=succesor-upload
SUCCESOR_UPLOAD_STORE_PASSWORD=yazdigin_sifre
SUCCESOR_UPLOAD_KEY_PASSWORD=yazdigin_sifre
```

Ev dizini, çünkü `android/gradle.properties` git'te. Şifre repoya girerse
anahtar yanmış demektir.

### 0.3 Bana haber ver

`build.gradle`'daki `signingConfigs`'i ve `.gitignore`'u ben düzenlerim.
Keystore dosyasının kendisi de gitignore'a girecek.

### 0.4 Yedekle

Keystore dosyasını ve şifreyi **repo dışında** iki ayrı yerde sakla.
Bu dosya uygulamanın kimliği; kod yeniden yazılabilir, o yazılamaz.

---

# ADIM 1 — Google Play Console

Hesabın yoksa 25 dolarlık tek seferlik kayıt ücreti var ve kimlik
doğrulaması birkaç gün sürebiliyor. Varsa doğrudan devam.

### 1.1 Uygulamayı oluştur

`All apps → Create app`

```
App name          Succesor
Default language  Türkçe
App or game       Game
Free or paid      Free        (reklam ve IAP bunu değiştirmiyor)
```

Paket adını burada yazmıyorsun; Play onu **ilk AAB'yi yüklediğinde**
paketten okuyor. Yani `com.salihkilic.successor` bir kere yüklendiğinde
kilitleniyor.

### 1.2 İlk paketi yükle

```
cd ~/Succesor/android
./gradlew bundleRelease
```

Çıktı: `android/app/build/outputs/bundle/release/app-release.aab`

`Testing → Internal testing → Create new release` altına yükle. Yayına
çıkmana gerek yok, listeleme formunu doldurmana da gerek yok; amaç Play'in
paketi tanıması.

> Play "Play App Signing"i kabul etmeni isteyecek. Kabul et. Senin
> anahtarın **upload key** olarak kalıyor, Play kendi imza anahtarını
> tutuyor, ve upload key'ini kaybedersen Google sıfırlayabiliyor. Adım
> 0'daki felaket senaryosunun tek sigortası bu.

### 1.3 Ürünü aç

`Monetize → Products → In-app products`

**Abonelikler sekmesi değil. In-app products.**

```
Product ID     ad_free
İsim           Reklamsız
Açıklama       Oyun içi reklamları kaldırır
Fiyat          sen belirle
```

`Create` dedikten sonra **Activate** etmeyi unutma; taslak durumdaki ürün
uygulamaya görünmüyor.

> Ürün açtırmıyorsa sebebi neredeyse her zaman 1.2'nin eksik olması.

### 1.4 Servis hesabı

RevenueCat'in Play'e "bu satın alma gerçek mi" diye sorabilmesi için
erişim gerekiyor.

RevenueCat panelinde bu adımın kendi sihirbazı var ve ekran ekran
söylüyor. Özeti: Google Cloud'da bir servis hesabı açılıyor, JSON anahtarı
indiriliyor, Play Console'da o hesaba finansal veri okuma yetkisi
veriliyor, JSON RevenueCat'e yükleniyor.

**O JSON gizli. Bana gönderme, repoya koyma.**

---

# ADIM 2 — App Store Connect

iOS tarafın hazırsa burada tek iş var.

`Uygulaman → Features → In-App Purchases → + → Non-Consumable`

```
Reference Name   Reklamsız
Product ID       ad_free
```

**Product ID'yi Play'dekiyle birebir aynı yaz.**

Zorunlu değil. Ama farklı olursa RevenueCat'te iki ayrı ürün tanımlayıp
ikisini aynı entitlement'a bağlaman gerekir, ve o eşleştirmeyi yanlış
yapmak ileride "iOS'ta aldı, Android'de görünmüyor" diye geri geliyor.
Aynı yazmak bu sınıfı komple siliyor.

Sonra `Users and Access → Integrations → App-Specific Shared Secret`
üret. RevenueCat bunu isteyecek. **O da gizli.**

---

# ADIM 3 — RevenueCat

### 3.1 Proje ve uygulamalar

Proje aç, içine **iki uygulama** ekle:

```
App Store    bundle id      com.salihkilic.successor    + shared secret
Play Store   package name   com.salihkilic.successor    + servis hesabı JSON
```

### 3.2 Ürünleri içeri al

`Products` sekmesi. İki mağazadaki `ad_free`'yi ekle.

**Her ikisinin de tipinin non-consumable göründüğünü doğrula.**

Bu adımın önemi şu: RevenueCat panelinde yanlışlıkla consumable
seçilirse satın alma tüketiliyor. Kullanıcı parasını ödüyor, telefonunu
değiştiriyor, restore ediyor, ve **hiçbir şey geri gelmiyor.** Bunun geri
dönüşü iade etmek ve özür dilemek.

### 3.3 Entitlement

`Entitlements → New`

```
Identifier    ad_free
```

Açtıktan sonra `Attach` ile iki ürünü de ona bağla.

> Entitlement, kodun soracağı **tek** şey. Kod "hangi ürünü aldı" diye
> sormuyor, "`ad_free` hakkı var mı" diye soruyor.
>
> Yarın fiyatı değiştirsen, ikinci bir paket açsan, bir kampanya ürünü
> eklesen, hatta bir aboneliğe çevirsen: panelde o ürünü de aynı
> entitlement'a bağlıyorsun ve **kodda hiçbir şey değişmiyor.**

### 3.4 Anahtarları al

`Project settings → API keys → Public app-specific keys`

İki tane: Android ve iOS. Bunlar public, uygulamanın içine gömülüyorlar.

---

# ADIM 4 — AdMob

### 4.1 İki uygulama kaydı

`Apps → Add app`. Android ve iOS **ayrı kayıt**.

"Uygulaman mağazada yayında mı" diye soruyor. Henüz değilse "Hayır" de,
sonra bağlayabiliyorsun.

Her birinden bir **App ID** alıyorsun:

```
ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
```

Tilde işaretine dikkat. Birim ID'lerinde eğik çizgi var, App ID'lerinde
tilde. Karıştırılan iki değer bunlar.

### 4.2 Reklam birimi

Her uygulama için bir **Interstitial** birimi aç.

```
ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ
```

Dört tetikleyicinin hepsi için **tek birim yeterli**. Dördüne dört ayrı
birim açmak sadece hangi yerin ne kazandırdığını ayrı raporlamak
istiyorsan anlamlı; kod tarafında hiçbir fark yok. Önerim: şimdilik tek,
para akmaya başlayınca bölersin.

### 4.3 Ödeme bilgisi

`Payments` altında adres ve vergi bilgisi. Tamamlanmadan **gerçek reklam
servis edilmiyor**, sadece test reklamları geliyor.

### 4.4 Kendi cihazını test cihazı yap

`Settings → Test devices`

**Bunu atlayıp kendi reklamına tıklama.** Geçersiz trafik sayılıyor ve
hesap askıya alınıyor. Yanlışlıkla bir kere tıklamak da dahil.

---

# ADIM 5 — Bana ver

```
1  AdMob Android App ID       ca-app-pub-…~…
2  AdMob iOS App ID           ca-app-pub-…~…
3  AdMob interstitial Android ca-app-pub-…/…
4  AdMob interstitial iOS     ca-app-pub-…/…
5  RevenueCat public key      Android
6  RevenueCat public key      iOS
```

Entitlement adı `ad_free` ise ayrıca söylemene gerek yok.

**Bana GÖNDERMEYECEKLERİN:** Play servis hesabı JSON'u, App Store shared
secret, keystore dosyası, keystore şifresi. Dördü de gizli ve hiçbirine
ihtiyacım yok.

---

## Ben ne yapacağım

```
signingConfigs                release'i kendi anahtarına bağla, gitignore
react-native-google-mobile-ads  kur, App ID manifest + Info.plist
react-native-purchases        kur, iki public key
AD_ID izni                    Android 13+ için manifest
adFree bayrağı                kalıcı depo, yeni oyunda SİLİNMEZ
gösterici                     policy.ts kararını SDK'ya bağlayan tek dosya
dört çağrı yeri               çeyrek, poker çıkışı, kumarhane sayacı, date
satın alma ekranı             ayarlarda, restore düğmesiyle
```

`adFree`, `runsStarted` ve oyuncunun adıyla aynı kategoriye giriyor:
**yeni oyun onu silmez.** Parasını ödediği şeyi yeniden başladı diye
kaybetmesi, bu oyunun yapabileceği en kötü hata olurdu.

---

## Hangi adım ne kadar sürer

```
0  Anahtar             15 dakika
1  Play                hesap varsa 1 saat, yoksa kimlik doğrulaması günler
2  App Store Connect   20 dakika
3  RevenueCat          1 saat, çoğu servis hesabı adımı
4  AdMob               30 dakika, ödeme doğrulaması ayrıca günler sürebilir
```

Uzun kuyruklar 1'deki kimlik doğrulaması ve 4'teki ödeme doğrulaması.
İkisini de bugün başlatıp geri kalanını beklerken yapmak mantıklı.

---

## Test ederken

AdMob'un herkese açık test ID'leri var, gerçek hesap beklemeden bugün
çalışıyorlar. İstersen kural motorunu onlarla bağlarım, sen hesapları
açarken uygulamada gerçek reklam akıyor olur.

RevenueCat tarafında Play'in lisans test hesapları ve App Store'un sandbox
kullanıcılarıyla gerçek para harcamadan satın alma denenebiliyor.
