# Notlarin sirasi ve promptlari

Siralama mantigi: **once temel, sonra her dosyaya dokunanlar, en son tek tek ekranlar.**
Palet ilk sirada cunku sonraki her prompt o renkleri harciyor. Header ikinci sirada
cunku neredeyse butun ekranlara dokunuyor - ekran ekran duzeltmelerden sonra
yapilirsa ayni headerlari iki kere yazmis oluruz.

Sirayla ver, atlama. 1 ve 2 bitmeden 4-9 arasi bosa is olur.

---

## 1. Palet genislemesi (once bu)

```
Temaya yeni anlamlar ekleyelim ama sadece temaya, hicbir ekrana dokunma.
Her rengin TEK bir cumlelik anlami olsun:

- Mavi: iyi. Artis, "affordable", "fully served", olumlu her sey.
- Gri: iyi bir sey olmuyor. Dusus, "not affordable", pasif, kapali.
- Kirmizi: bu sana pahaliya patliyor. Zarar VE duvara toslama (99% kapasite
  gibi). Dekor olarak asla kullanilmaz - eski kural bu yuzden vardi.
- Yesil: kar. Baska hicbir sey.
- Turuncu (tam ton): marka degeri. Sadece o.
- Turuncu (soluk ton): alt basliklar (Operations, Quick Actions). Ayri token,
  cunku baslikla veri ayni tonda olursa goz basligi da veri saniyor.
- Mor: RP / research point ile ilgili her sey.
- Kategori renkleri: header'in altindaki ince cizgi icin. Mesela finance sari,
  baska bir kategori yesil. SADECE o cizgide kullanilir.

theme.ts'i buna gore genislet, audit'i de yeni tokenlari taniyacak sekilde
guncelle ki sonraki promptlarda denetim bunlari yanlis kullanim sanmasin.
Kirmizinin yeni anlami audit'te de gecerli olmali, ama yalnizca sayi ve durum
gostergelerinde - dolgu veya cerceve olarak hala yasak.
Ekran degisikligi yok, sadece zemin.
```

## 2. Header standardi + kategori cizgisi

```
Oyundaki butun ekran headerlarini tek standarda cek. Standart, my company
sayfasindaki command center headeri olsun. Command center yazisini da biraz
saga al.

- Her header'in altina o kisa cizgiyi koy, rengi ekranin kategorisine gore
  (finance sari, vs - 1. promptta belirledigimiz kategori renkleri).
- Her ekrani tek tek kontrol et, cogunda baslik geri butonuna cok yakin duruyor.
- Financial report headerinda hep "Q2" yaziyor, sabit kalmis gibi. Ona da bak.
```

## 3. RP moru

```
RP ile ilgili her seyi mor yap: "RP" yazisi, puanin kendisi, faturadaki
research satirlari, rd upgrade ekranlari, laboratuvar. Nerede geciyorsa.
```

## 4. Fatura (ceyrek raporu)

```
Faturayi 1. promptta belirledigimiz mantikla renklendir:

- Continue butonunu mavi buton yap.
- Artan sayilar mavi, azalan sayilar gri.
- Brand value yazisi HER ZAMAN turuncu olsun, ama artisi mavi, dususu gri yazsin.
- "fully served" gibi olumlu durumlar mavi.
- Products bolumunu acip icindeki bir urune basinca acilan kisim cok daginik
  ve duzensiz duruyor, onu duzelt.
- En alttaki balances kismi da daginik, ona da el at.
```

## 5. Products ekrani

```
- Build to capacity butonunu mavi yap. Uzerinde sadece "Build to capacity"
  yazsin ve kapasitenin kac oldugu yazsin, baska bir sey yazmasin.
- Ekranda cok fazla uyari var (az uretim, eleman artir vs), karisik duruyor.
  Hepsini toplayip "Alerts" adinda tek bir butonun arkasina koy. Buton
  retire product'in altinda ve yarim genislikte olsun. Basinca uyarilar aciliyor.
- Uretim ve marketing barlarina da renk ekle, paletin disina cikmadan.
```

## 6. My Company ekrani

```
- "99% used" yaziyor ama iyi mi kotu mu anlasilmiyor. Sikisikken kirmizi,
  rahatlayinca mavi olsun.
- "affordable" yazisi mavi olsun, degilse gri.
- Operations, Quick Actions gibi alt basliklari turuncu yap.
- En bastaki "My Company" kismini butona cevir, basinca financial report
  ekrani acilsin.
```

## 7. Finance ekrani

```
- Injection ve private equity injection calismiyor. Ikisini de ekran yapip
  calisir hale getir.
- Request new loan butonunun ustundeki marcus ve injection butonlarini kaldir,
  o islevleri yukaridaki satirlara bagla.
- Katlanabilir bolumler basinca isik hiziyla aciliyor, daha estetik acilsin.
```

## 8. Board Members ekrani

```
Ekran cok sikisik, yazilar kenarlara sifir. Nefes aldir. Ayrica en alti
gozukmuyor, alta tab bar kadar bosluk koy.
```

## 9. Modallar

```
Sirket satin alirken cikan uyari ekranini gercek modal yap. Kuruldan gelen
uyari ekranlarini da ayni sekilde modal yap.
```

---

# Cakisan uc sey - karara baglandi

**1. Kirmizi genisledi, ama bulanmadi.** Eski kural "kirmizi sadece zarar"
idi ve sebebi kirmizinin dekora sizmasiydi. 99% kapasite dekor degil, sana
para kaybettiren bir duvar. O yuzden kirmizinin anlamini iki sey yapmak yerine
tek cumleye cektik: **kirmizi = bu sana pahaliya patliyor.** Zarar da bu,
duvara toslamak da. Dolgu veya cerceve olarak hala yasak.

Turuncuyu kapasite icin kullanmadik cunku turuncu o zaman marka + baslik +
kapasite olurdu; uc alakasiz is, ucu de bulanik.

**2. Gri tek anlamda kaldi:** iyi bir sey olmuyor. Dustu, yetmiyor, pasif -
hepsi ayni cumlenin altinda, o yuzden ikiye bolmeye gerek yok.

**3. Turuncu ikiye ayrildi.** Marka degeri tam tonu tutuyor, alt basliklar
soluk tonu aliyor. Ayni tonda birakirsak Operations basligi da bir veri gibi
okunur.

Bunlar 1. promptun icine islendi. Fikrini degistirirsen orayi degistirmen
yeterli, gerisi ondan turuyor.
