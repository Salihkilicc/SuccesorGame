# Android test rehberi

Bu listedeki her madde, **bu sprintte gerçekten değişmiş bir şeye** bakıyor.
Genel bir "her yeri gez" listesi değil; her satırın karşılığında bir commit
var, ve her satır ya geçer ya kalır, arada kalmaz.

Sırayla git. Üstteki dördü beş dakika sürer ve en çok bilgiyi onlar veriyor.

```
cd ~/Succesor
npx react-native run-android
```

Native kaynak değişti (`res/anim`, `res/values`), yani Metro yenilemesi
yetmez, tam build lazım.

---

## 1. YAZI AĞIRLIKLARI — tek bakış, en önemlisi

Ana ekranda oyuncu kartına bak. Üç ayrı ağırlık orada yan yana duruyor:

```
"uihuhi Hale"   fontWeight 800
"AGE" / "MTH"   fontWeight 700
"20"  / "4"     fontWeight 900
```

Cevaplaman gereken tek soru: **isim ile AGE yazısı farklı kalınlıkta mı?**

- **Belirgin şekilde farklıysa** → 800 çalışıyor, bu faz kapanır.
- **Aynı görünüyorsa** → Android 800'ü 700'e düşürüyor demektir ve font
  paketlemek gerekiyor. Bana "aynı" de, yeter.

Bir de "AGE" ile "20" arasına bak; onlar da aynıysa 900 de düşüyor demektir.

> Neden bu kadar önemli: 700 ile 800 bütün uygulamadaki bildirimlerin
> yüzde yetmişi. İkisi aynı görünüyorsa ekranların tipografik hiyerarşisi
> Android'de yok demektir. Bunu koda bakarak çözemem, cihaz ister.

---

## 2. TAB BAR — mavi geri geldi mi

Alt çubuğa bak.

- **Arkasındaki mor gradyan görünüyor, çubuk mavimsi ve camsı mı?**
  Evet ise düzeldi. Android, `blurType="dark"` yüzünden üstüne yüzde 64
  siyah basıyordu, artık yüzde 28 ve rengi de paletin kendi zemini.
- **Altındaki gri hale** artık iOS'takiyle aynı ağırlıkta olmalı: hafif bir
  parıltı, kendi başına bir nesne gibi duran bir bulut değil.

---

## 3. EKRAN GEÇİŞLERİ — hafif hızlandı mı

Ana ekrandan **Ürünler** ve **İnovasyon**'a gir çık, birkaç kere.

Süre 400ms'den 300ms'ye indi. Aradığın şey "daha hızlı" hissi; sarsıntı ya
da yarıda kesilme değil. Giren ve çıkan ekran **aynı hızda** kaymalı, biri
diğerinden geride kalmamalı.

---

## 4. KADRO BUTONU — dört hali de sığıyor mu

**Şirketim → Operasyonlar → Tesis paneli**, ve ayrıca **Laboratuvar**.
İkisinde de aynı buton var, ikisine de bak.

Dört hali sırayla gör:

| Ne yaparsan | Butonda ne yazmalı |
|---|---|
| Hiçbir şey değiştirmeden bak | `DEĞİŞİKLİK YOK` |
| Sayıyı değiştir | `ONAYLA` |
| Onayla, işe alım yönünde | `Q4'TE GELİYOR` |
| Onayla, azaltma yönünde | `Q4'TE GÜNCELLENDİ` |

Hepsi **tek satırda** durmalı, taşmamalı, kesilmemeli. En uzunu
`Q4'TE GÜNCELLENDİ`; o sığıyorsa hepsi sığıyor.

Butonun üstündeki satırlara da bak: `11 kişi alındı`, kadro satırı, inşaat
maliyeti satırı. Hiçbirinde İngilizce kalmamalı.

---

## 5. ŞİRKETİM — dört kart aynı boyda mı

**Şirketim** ekranındaki dört bölüm kartı: Finansman, Ürünler, Ar-Ge
Yatırımı, Hisse & Sahiplik.

**Dördü de tıpatıp aynı yükseklikte olmalı.** Daha önce "Hisse & Sahiplik"
iki satıra taştığı için o kart uzuyordu. Artık başlığa her zaman iki satır
ayrılmış durumda, sığmayan yazı küçülüyor.

Altlarındaki rakamlar da Türkçe olmalı: `Borç: ...`, `3 aktif`, `... RP`,
`%80 senin`.

---

## 6. YENİ OYUN — açılış soruları

**Ayarlar → Yeni Oyun**, ya da ana ekrandaki çekmeceden.

Önce silme uyarısı gelmeli ve **Türkçe** olmalı. Sonra açılış ekranı:

- Üstte "Başlamadan önce" / "Yeni bir şirket"
- Başlık "Sen kimsin?" / "Adını ne koyacaksın?"
- Altındaki açıklama cümlesi
- Soyadın altındaki not: "Babanın adı, ve şirketin adı..."
- Cinsiyet düğmeleri: **Erkek / Kadın**

Hiçbirinde İngilizce kalmamalı.

---

## 7. ÇEVİRİ — elli ekran gezmen gerekmiyor

Bu sprintte 292 dize çevrildi. Hepsini tek tek gezme, **en yoğun beş yere**
bak; gerisi aynı geçişte yapıldı.

1. **Şirketim → Hisse & Sahiplik** (hisse kontrol merkezi, bölünme,
   değerleme dökümü, kendi hisseni satma)
2. **Şirketim → Finansman** (kredi, geri ödeme, tefeci anlaşması, sermaye
   aktarımı)
3. **Ürünler → bir ürüne gir** (pazar paneli, fason ortaklar, kapasite
   notu, uyarılar düğmesi)
4. **Borsa → bir hisseye gir** (sembol, sektör, piyasa değeri, günlük
   değişim satırları)
5. **Çeyrek raporu** (bir çeyrek ilerlet, raporu sonuna kadar kaydır)

Bir yerde İngilizce görürsen bana **ekranın adını ve cümleyi** yaz, yeter.

> Tarama sıfır diyor, ama tarama ekranda ne olduğunu değil kaynakta ne
> olduğunu biliyor. Bir yerde `t()` doğru çağrılıp yanlış anahtar verilmiş
> olabilir; o durumda ekranda anahtarın kendisi görünür, mesela
> `equity.youOwn`. Öyle bir şey görürsen o bir hata, aynen yaz.

---

## 8. AÇILIŞ EKRANI — splash

Uygulamayı tamamen kapat, tekrar aç.

"SUCCESSOR" yazısı sığıyor mu, ezilmiş mi? Bunu son turlarda iki kez
ayarladım ve ikisinde de senin geri bildirimine göre gittim, yani hâlâ
senin gözüne bakıyorum.

---

## Bulduğunu nasıl yazarsan işime yarar

Şu üçü yeter:

```
NEREDE   ekranın adı
NE       ne görüyorsun
NE BEKLERDİN
```

"Şirketim'deki kartlar hâlâ farklı boyda" gibi tek cümle de olur. Ekran
görüntüsü varsa daha iyi, ama şart değil; bu turdaki maddelerin hepsi
kelimeyle tarif edilebilir.

---

## Bu turda DEĞİŞMEYENLER, boşuna bakma

- Oyunun ekonomisi, hikâye motoru, kumar motorları: hiçbirine dokunulmadı.
  4034 testin tamamı bunların üstünde ve hepsi yeşil.
- iOS tarafı: çevirilerin ve kart düzeltmesinin tamamı ortak kod, yani iOS
  de aynı şeyleri aldı. Orada yalnızca bundle'ı yenilemen yeterli.
- Reklamlar, satın alma, mağaza hazırlığı: henüz başlanmadı.
