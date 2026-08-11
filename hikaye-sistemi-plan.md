# Hikaye sistemi — prompt sırası

**Hikayeyi ben yazıyorum.** Sen çerçeve veriyorsun, cümleleri, tonu, dallanmayı
ve tepkileri ben kuruyorum. Bu dosyadaki her "HİKAYE" promptu bir içerik
siparişi — ne kadar üreteceğimi yanına yazdım.

Sıra iki bölüm: önce **makine** (10 prompt), sonra **hikaye** (20 prompt).
Makine bitmeden hikayeye başlamak, her sohbetin kendi mini-motorunu yazması
demek.

---

## KADRANLAR — bunu bir kez okumanı istiyorum

"Her şey her şeyi tetiklesin" iki şekilde kurulabilir.

**Yanlış:** tepkiyi tek tek seçimlere bağlamak. 200 seçim = yazılamaz sayıda
kombinasyon. Altı ay sonra kimse dokunamaz.

**Doğru:** seçimler bir avuç **kadranı** oynatır, tepkiler kadranları okur.

| Kadran | Ne ölçer | 0 ucu | 100 ucu |
|---|---|---|---|
| `pearHostility` | Pear ile ilişki | boyun eğdin | açık savaş |
| `friendLoyalty` | çömez CEO | seni sildi | canını verir |
| `brotherTrust` | kardeş | darbe hazırlıyor | yanında |
| `cfoTrust` | emektar CFO | istifa eşiğinde | sırdaşın |
| `publicReputation` | kamuoyu | rezil | efsane |

Artı geri dönüşü olmayan olaylar için gerçek bayrak: `babaOldu`,
`peareSatildi`, `kostebekAcildi`, `fbiTemiz` / `fbiSucli`, `casinoSkandali`.

Oyuncu için sonuç aynı: her şey her şeyi etkiliyormuş gibi hisseder. Fark,
içeriğin sonlu ve yazılabilir kalması.

---

# BÖLÜM 1 — MAKİNE (10 prompt)

### 1. Kadranlar ve bayraklar
```
Hikayenin hafızasını kur: kadranlar (pearHostility, friendLoyalty,
brotherTrust, cfoTrust, publicReputation — hepsi 0-100) ve geri dönüşsüz
olaylar için bayraklar. Kalıcı, yeni oyunda sıfırlanır.

Yanına iki kapalı sözlük yaz:
- ETKİLER: bir seçeneğin arkasına bağlanabilecek şeylerin tam listesi —
  para, marka, kadran oynat, bayrak koy, mesaj/mail gönder, haber düşür.
  Serbest fonksiyon YOK; isimli etkiler. Serbest bırakırsak her hikaye
  kendi kodunu yazar.
- KOŞULLAR: bir şeyin açılması için gereken şartlar — bayrak var mı,
  kadran şu değerin üstünde mi, çeyrek şundan büyük mü, para yeter mi.

Birim testleri yaz. Ekran değişmesin.
```

### 2. Diyalog motoru
```
Kartlar ve dallanma. Kurallar:

- Bir sohbet = düğüm grafı, ve graf KOD DEĞİL VERİ. Ayrı data dosyalarında.
- Düğüm: kim konuşuyor, ne diyor, en fazla 2 seçenek.
- Seçenek: metin + hedef düğüm (boş = sohbet biter) + 1. promptun
  etkilerinden istediği kadarı.
- Tek bir runner bileşen grafı oynatsın. Mail ve Messages aynı runner'ı
  kullansın; fark sadece sunum.

Denetime (npm run audit) graf doğrulama geçişi ekle:
- kırık hedef (olmayan düğüme bağlanan seçenek)
- ulaşılamayan düğüm (yazılmış ama girilemeyen replik)
- çıkışsız düğüm (oyuncuyu kilitleyen kart)
Spagettiyi engelleyen şey bu geçiş; iyi niyet değil.
```

### 3. Kadro ve kanal kuralı
```
Karakterleri tek bir kadro dosyasına koy: baba, kardeş, emektar CFO,
agresif COO, vizyoner CTO, çömez CEO, Pear CEO, akbaba fon, bilinmeyen
numara, FBI, hacker.

Her karakter: isim, rol, hangi kanaldan yazar (mail / mesaj / ikisi), ton.
Kanal kuralı VERİ olsun ki bir karakter yanlış kanaldan yazamasın —
Pear sadece mail, kardeş ve dost sadece mesaj, CFO ikisi de.
```

### 4. Zamanlama: kim ne zaman yazar
```
Bir "gelen kutusu zamanlayıcısı": bir sohbet hemen değil, N çeyrek sonra
düşebilsin. Dev şirket alımının 1 çeyrek beklemesi de, babanın ölümünden
sonra taziyelerin sırayla gelmesi de buna dayanacak.

Aynı çeyrekte 6 mesaj birden düşmesin — bir kuyruk olsun, sıraya soksun.
```

### 5. Hisse dağılımı: %35 sen, %15 kardeş, %50 kurul
```
Oyuncu şu an %65 ile başlıyor, kurul dekordan ibaret. %35'e geç, kardeşi
"Snake" kişiliğiyle gerçek bir hissedar olarak kurula ekle.

Bu bir denge değişikliği: kontrol eşiği, halka arz, seyreltme, güvensizlik
oyu ve değerleme hepsi %65'e göre ayarlıydı. Değiştirdikten sonra tek tek
kontrol et ve neyin bozulduğunu bana söyle.
```

### 6. Bildirimler
```
Alt bardaki Stats'ı Messages ile değiştir. Okunmamış mesaj/mail için iOS
tarzı kırmızı rozet, içinde sayı. 3. promptun kanal kuralını uygula.
```

### 7. Öğretici kilit sistemi
```
Ekranı kilitleyip tek bir butonu parlatabilen bir katman.

HER KİLİDİN KAÇIŞ YOLU OLMALI. Parasız oyuncuya "prim dağıt" dedirtip
kilitlersek oyun donar; kilit değil tuzak olur. İkinci oynayışta
atlanabilir olsun.
```

### 8. `acquisitionBuff`'ı kaldır
```
Satın almalar sihirli güçlendirme değil finansal yatırım olacak: sadece
gelir, kâr ve şirket değeri.

Motorda bedeli var: `subsidiaryBuffs()` şu an çeyrek tikinde üç yerde
okunuyor — Ar-Ge hızı, üretim maliyeti, pazarlama. Kaldırdıktan sonra bir
çeyreği simüle et ve sayıların nasıl değiştiğini göster.
```

### 9. Satılan şirket piyasada yaşasın + CEO kurula gelsin
```
- Şirketi sattığında varsayılana dönmesin; satış anındaki değeriyle
  bağımsız aktör olarak borsaya ve habere geri dönsün.
- Satın alınan şirketin CEO'su kurula kişilikle katılsın:
  SkyNet → Visionary, VoltMotors → Conservative (düşmanca alındıysa güveni
  düşük başlar), Streamify → Shark.
```

### 10. Olay motoru + haber sistemini bağla
```
Olaylar da veri: tetikleyici koşul, olasılık, 2. promptun graf formatında
bir sohbet.

Aynı promptta `applyCorporateShock`'ı bir çağırana bağla — yazılmış, test
edilmiş, haftalardır hiçbir yerden çağrılmıyor. Haberler bu olayların
çıktısı olacak.
```

---

# BÖLÜM 2 — HİKAYE (20 prompt)

Buradan sonrası içerik. Her promptun yanında ne kadar yazacağımı belirttim.

## Faz A — Baba ve ilk yıl

### 11. Q1: üretim ve ürünler  *(~40 düğüm)*
```
Babanın Q1 öğreticisini yaz. Üretimi başlattırır, ürünlerin nasıl
düzenlendiğini anlatır, sonra detaysız fatura gelir.

Ton: kibirli, buyurgan, "kimseye güvenme". Öğretiyor ama aynı zamanda
kendi paranoyasını da aşılıyor. Oyuncu daha o an bu adamın haklı mı
takıntılı mı olduğundan emin olamamalı.
```

### 12. Moral olayı  *(~25 düğüm)*
```
Moral 70'in altına inerse oyun durur, baba team morale menüsünü parlatır,
prim dağıttırır.

NOT: 70, piyasa maaşının morali doğal olarak parkettiği yer (MORALE_ANCHOR).
Yani bu olay neredeyse herkeste tetiklenecek — "moral hiç düşmezse yaşanmaz"
değil, "çoğu oyuncu görecek" olacak. Bilerek böyle.
```

### 13. Q3: pazarlama ve marka  *(~35 düğüm)*
```
Rakiplerin pazar payı çaldığından şikayet eder, pazarlama menüsünü
parlatır, marka değerini anlatır. Burada babanın "zamanın gerisinde
kalmışlığı" ilk kez sızmalı — anlattığı şey doğru ama biraz eski.
```

### 14. Babanın ölümü ve Pear teklifi  *(~60 düğüm, gizli final dahil)*
```
Q4 sonu. Baba ölür, tüm kilitler kalkar.

Pear CEO'sundan mail: soğuk bir taziye ve arkasından alım teklifi.
Asistanına yazdırılmış hissi vermeli — seni muhatap bile almıyor.
"Evet" = gizli erken final, oyun biter, komik ve acı bir kapanış.
"Hayır" = asıl oyun başlar, pearHostility yükselir.
```

### 15. Ölümün dalgası  *(~50 düğüm, 4 karakter)*
```
Aynı olaydan dört ayrı tepki, sırayla düşer (4. promptun kuyruğu):

- Çömez CEO, mesaj: "geçmiş olsun dostum" — samimi, beceriksizce içten
- Emektar CFO, mail sonra mesaj: taziye + "artık konuşmamız gereken şeyler
  var" — babanın sırlarını bilen adamın ilk imaları
- Kardeş, mesaj: yüzüne gülen, alttan alta sitem eden ilk temas
- Kurul, mail: resmi başsağlığı ve hemen ardından ilk talep

Her biri Pear'a verdiğin cevabı BİLİYOR olmalı — sattıysan zaten oyun
bitti, satmadıysan bu dört mesajın tonu ona göre değişsin.
```

## Faz B — Kadro

### 16. Emektar CFO yayı  *(~70 düğüm)*
```
Temettü krizi (notlarındaki sahne), kasa uyarıları, kurul lobisi haberleri,
babanın gizlediği bir şeyin yavaş yavaş açılması.

cfoTrust kadranını hem okuyan hem oynatan bir yay olsun: ona kulak
verirsen açılır, sürekli reddedersen kapanır ve sonunda istifa eşiğine
gelir.
```

### 17. Kardeş yayı — birinci perde  *(~60 düğüm)*
```
Pasif-agresif mesajlar, temettü baskısı, "babam sana çok güveniyordu"
iğnelemeleri. Yüzüne gülüp arkandan kuyu kazan Succession karakteri.

brotherTrust düştükçe mesajların tonu sertleşsin, yükseldikçe gerçekten
kardeşin gibi konuşsun — ama hiçbir zaman tamamen güvenilir olmasın.
```

### 18. Kardeş yayı — darbe  *(~40 düğüm)*
```
Güvensizlik oyunu kaybedersen, "Kovuldun" ekranından HEMEN ÖNCE kardeşten
mesaj: "Merak etme canım, babamın şirketini ben toparlayacağım."

Ayrıca kurulda ona karşı oy kullandığı anlar, Pear ile gizli görüşmesi,
ve CFO'nun bunu sana haber verdiği sahne.
```

### 19. Çömez CEO yayı — dostluk  *(~60 düğüm)*
```
200.000$ istediği sahne, sonrasında büyümesi, sana getirdiği piyasa
dedikoduları. friendLoyalty yükseldikçe daha kritik şeyler getirsin.

Yardım edersen ileride şirketini ucuza alabilme veya Pear'ın açığını
öğrenme kapısı açılsın. Reddedersen o kapılar sessizce kapansın —
oyuncuya "kapı kapandı" denmesin, sadece bir daha hiç yazmasın.
```

### 20. Köstebek ağı  *(~45 düğüm)*
```
`pearHostility` yüksekse ve friendLoyalty yeterliyse açılan gizli yay:
dostun Pear'ın sistemlerine sızabilecek birinin numarasını verir.

Bilinmeyen numaradan mesajlar. Kabul edersen kurumsal casusluk yayına
bağlanır — ve FBI yayının tetiklenme ihtimali artar.
```

### 21. Pear yayı — tırmanış  *(~70 düğüm)*
```
Teklifi reddettikten sonra pearHostility tırmandıkça gelen resmi mailler:
patent tehdidi, tedarikçi baskısı, fiyat savaşı.

Ve final: sen onun pazar payını aldığında veya düşmanca devralma
başlattığında, gece yarısı MESAJ atar. Oyunun o "adamı delirttim" anı.
```

### 22. C-level: COO ve CTO  *(~50 düğüm)*
```
Agresif COO: üretim durdu, işçiler isyanda, fabrika krizi mesajları.
Vizyoner CTO: yeni ürün fırsatları, Ar-Ge yatırımı baskısı, rakip
teknoloji uyarıları.

İkisi de acil durumda mesaj, çeyrek sonunda resmi mail.
```

## Faz C — Piyasa

### 23. Diplomasi ile dev şirket alımı  *(sistem + ~50 düğüm)*
```
Mail'den compose: hedef şirket seç, konu seç, teklif gönder. Cevap 1 çeyrek
sonra gelir, 2 seçenekli pazarlık başlar. Koltuk, itibar barajı veya fiyat
primi isteyebilirler; her zaman talep şart değil.

Düşmanca satın alma açık kalsın ama fiyatını artır — şu an primi %35, az.
Yeni bir sayı öner ve gerekçelendir.

Beş farklı CEO için beş farklı pazarlık kişiliği yaz.
```

### 24. Alan ihlali  *(~40 düğüm)*
```
Yeni bir ürün kategorisine girdiğinde o pazarın devi posta koyar.
Notlarındaki VoltManagement sahnesi + dört kategori için dört varyant.
Alttan alma / savaş ilanı ikilemi, ikisinin de gerçek bedeli olsun.
```

### 25. Dalga etkisi  *(~40 düğüm)*
```
Bir şirket satın aldığında, o şirketi almak isteyen başkası sana bulaşır.
Kıskanç rakip ve akbaba senaryoları + altı şirket için varyantlar.
```

### 26. Portföy: satış teklifleri  *(~45 düğüm)*
```
Pear'ın taktiksel alım teklifi, akbaba fonun darboğazını kullanması,
dostunun "yabancıya gitmesin" ricası. Üçü de notlarındaki gibi.

Nakit sıkışıklığında akbabanın devreye girmesi otomatik olsun — oyuncu
zor durumdayken gelsin ki gerçekten acıtsın.
```

## Faz D — Krizler

### 27. Kriz paketi  *(12 olay, ~120 düğüm)*
```
Siber saldırı, PR krizi, veri sızıntısı, ürün geri çağırma, tedarik zinciri
çöküşü, sendika grevi ve benzerleri. On iki olay yaz.

Zorluk: dediğin gibi başarı şansı düşük, çoğu markaya zarar versin.
Oyuncu bunları "atlatılacak" değil "en az hasarla çıkılacak" şeyler
olarak görsün.
```

### 28. Kurumsal casusluk ve fidye  *(~50 düğüm)*
```
Notlarındaki senaryo: CTO'dan panik mesajı, hackerlardan fidye talebi,
%70 başarı / %30 ihanet. Üç varyant yaz — farklı fidye, farklı taşeron,
biri Pear'a bağlansın.
```

### 29. FBI — üç vaka  *(~150 düğüm)*
```
Üç ayrı soruşturma, her biri 3-4 adımlık derin graf. Çelişkili cevap veya
rüşvet girişimi suçlu bulunmayla biter: ağır ceza + hisse çöküşü.

Vakalar birbirinden farklı olsun: biri mali usulsüzlük, biri içeriden
öğrenenin ticareti, biri casusluk yayına bağlı. `fbiSucli` bayrağı
sonraki her şeyi zehirlesin.
```

### 30. Casino skandalı + sponsorluk  *(~60 düğüm)*
```
- Üst üste 3 çeyrek kumarhane = %30 skandal. Ziyaret sayacı bu promptta.
- Sponsorluk: üç seviye, mail ile teklif, devasa olanlar sadece belli bir
  şirket değerinden sonra. 12 çeyrek sponsorsuz kalırsan marka erir.
  Her seviye için 10 farklı teklif yaz ki tekrar etmesin.
```

---

# SON SÖZ

30 prompt. İlk 10'u makine, kalan 20'si hikaye — kabaca **1000+ diyalog
düğümü**, hepsini ben yazıyorum.

Bir promptta bir "an"ı hakkıyla yazabiliyorum. Yüz sohbeti tek promptta
yazarsam hepsi vasat olur, ve vasat diyalog olmayan diyalogdan kötüdür.

Sıra esnek: 11-15 (baba ve ilk yıl) bittikten sonra Faz B, C, D'yi
istediğin sırayla alabilirsin. Ama 1-10 önce gelmeli.
