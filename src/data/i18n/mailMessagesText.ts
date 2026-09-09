// src/data/i18n/mailMessagesText.ts
//
// ============================================================================
//  MAIL & MESSAGES I18N — DYNAMIC TRANSLATION REGISTRY
// ============================================================================
//
//  Handles translations for:
//   - Initial seed mail (Facilities, Ashgrove Partners, Rolodex)
//   - Initial seed threads (Dana Whitfield)
//   - Neglect lines (10 characters: father, brother, cfo, friend, coo, cto, pear, vulture, fbi, regulator)
//   - Partner strain, departure, and courtship refusal lines
//   - Negotiation replies (SkyNet, VoltMotors, Novidia, Planora, Pear, generic boards)
//   - Sponsorship letters
//   - Roles & sender titles (Founder, CFO, COO, CTO, Head of Production, etc.)
//
//  English/Turkish isolation guarantee:
//   - When locale is 'en', ALWAYS returns authentic English.
//   - When locale is 'tr', returns curated, atmospheric Turkish translations.
// ============================================================================

import { useLocaleStore } from '../../core/i18n';
import { line, subjectKey, nodeKey } from './storyText';
import { conversationById } from '../story';

// ----------------------------------------------------------------------------
//  1. ROLES & SENDER NAMES
// ----------------------------------------------------------------------------

export const ROLES_TR: Record<string, string> = {
    'Founder': 'Kurucu',
    'Chairman': 'Yönetim Kurulu Başkanı',
    'Shareholder · 15%': 'Hissedar · %15',
    'Chief Financial Officer': 'Mali İşler Direktörü',
    'Chief Operating Officer': 'Operasyon Direktörü',
    'Chief Technology Officer': 'Teknoloji Direktörü',
    'Head of Production': 'Üretim Direktörü',
    'Successor': 'Halef',
    'SuccessorCandidate': 'Halef Adayı',
    'CEO, Planora': "Planora CEO'su",
    'CEO, Pear': "Pear CEO'su",
    'Special Situations Fund': 'Özel Durumlar Fonu',
    'Chief Executive, Edison Motors': 'Edison Motors Genel Müdürü',
    'Head of Research Operations, OpenAI-ish': 'Araştırma Operasyonları Başkanı',
    'Chair, Category Standards Committee': 'Kategori Standartları Komitesi Başkanı',
    'Compliance Division': 'Uyum Birimi',
    'Federal Bureau of Investigation': 'Federal Soruşturma Bürosu',
    'No name attached': 'İsimsiz',
    'Encrypted / Anonymous': 'Şifreli / Anonim',
    'Partner': 'Eş / Partner',
    'Your child': 'Çocuğun',
    'Your family': 'Ailen',
    'Student': 'Öğrenci',
    'Toddler': 'Küçük Çocuk',
    'Infant': 'Bebek',
};

export const SENDER_NAMES_TR: Record<string, string> = {
    'Your Father': 'Baban',
    'Facilities': 'Tesis Yönetimi',
    'Field Office': 'Saha Ofisi',
    'Field Office (Federal Bureau of Investigation)': 'Saha Ofisi (Federal Soruşturma Bürosu)',
    'The Board': 'Yönetim Kurulu',
    'Nathan Vogel (CEO, Pear)': "Nathan Vogel (Pear CEO'su)",
    'Arthur Vance (CEO, Pear)': "Arthur Vance (Pear CEO'su)",
    'Marco Alvarez (CEO, Planora)': "Marco Alvarez (Planora CEO'su)",
};

// ----------------------------------------------------------------------------
//  2. MAIL SUBJECTS
// ----------------------------------------------------------------------------

export const SUBJECTS_TR: Record<string, string> = {
    // ------------------------------------------------------------------
    //  THE TWO LETTERS THAT SAY THE FILE EXISTS
    // ------------------------------------------------------------------
    //  See core/story/manipulationNotice.ts. A warning that only arrives in
    //  English is not a warning here, and these two are the only thing
    //  standing between a player and a verdict out of nowhere.
    // ------------------------------------------------------------------
    'Retention of records: trading in own securities': 'Kayitlarin saklanmasi: kendi hisselerinde islem',
    'Notice of formal enquiry': 'Resmi inceleme bildirimi',
    'Parking bay 1, reallocation': '1 numaralı park yeri, yeniden tahsis',
    'Initiating coverage, HALE': 'Kapsama alma bildirimi, HALE',
    'You have 5 new connections waiting': 'Bekleyen 5 yeni bağlantı isteğiniz var',
    'Re: our correspondence [ref. 4471-B]': 'İlgili: Yazışmamız hk. [ref. 4471-B]',
    'No rush at all': 'Hiç acele değil',
    'Second notice': 'İkinci bildirim',
    'Notice under s.14(2)': 'Madde 14(2) uyarınca tebligat',
    'Following up': 'Takip bildirimi',
    'RE: Proposal — merger of equals': 'Teklif hk. — Eşitlerin birleşmesi',
    'RE: Commercial partnership': 'Ticari ortaklık hk.',
    'RE: Notice of intent': 'Niyet bildirimi hk.',
};

// ----------------------------------------------------------------------------
//  3. TEXT DICTIONARY (Seed, Neglect, Strain, Departure, Refusal, Negotiators, Aid)
// ----------------------------------------------------------------------------

export const TEXT_TR: Record<string, string> = {
    // The pair from the Field Office. Same voice in Turkish: process, never
    // accusation, and no penalty named.
    'This office is conducting a routine review of trading in the securities of Hale Industries.\n\nYou are asked to retain, in their original form, all records relating to acquisitions of the undertaking\u2019s own stock made by you or on your behalf. This includes instructions, timings and any correspondence bearing on them.\n\nNo response is required at this stage. This notice does not imply a finding.':
        'Bu ofis, Hale Industries hisselerindeki islemlere iliskin rutin bir inceleme yurutmektedir.\n\nSirketin kendi hisselerinin sizin tarafinizdan veya sizin adiniza alinmasina iliskin tum kayitlari asli halleriyle saklamaniz istenmektedir. Talimatlar, zaman bilgileri ve konuya iliskin yazismalar buna dahildir.\n\nBu asamada yanit gerekmemektedir. Bu bildirim bir tespit anlamina gelmez.',
    'The review referred to in our earlier notice has been placed on a formal footing.\n\nThe matter under examination is whether acquisitions of the undertaking\u2019s own stock were made at prices that did not reflect its condition at the time.\n\nYou may wish to instruct counsel. Any expenditure on your defence is a matter for you personally and not for the undertaking.\n\nThe file remains open.':
        'Onceki bildirimimizde belirtilen inceleme resmi bir nitelik kazanmistir.\n\nInceleme konusu, sirketin kendi hisselerinin o gunku durumunu yansitmayan fiyatlardan alinip alinmadigidir.\n\nBir avukat gorevlendirmeyi dusunebilirsiniz. Savunmaniza iliskin her turlu harcama sirketi degil sahsinizi ilgilendirir.\n\nDosya acik kalmaktadir.',
    // --- Seed Mail ---
    'Good morning,\n\nBay 1 has been reassigned to your name with immediate effect. The fob is at reception.\n\nWe have left the old plate in the store room rather than dispose of it. Let us know either way when you have a moment.\n\nFacilities':
        'Günaydın,\n\n1 numaralı park yeri derhal geçerli olmak üzere adınıza tahsis edilmiştir. Giriş kartı danışmadadır.\n\nEski plakayı atmak yerine depoya kaldırdık. Müsait olduğunuzda ne yapmamızı istediğinizi bildiriniz.\n\nTesis Yönetimi',

    'Hi there,\n\nYou are getting noticed. Five people have asked to connect with you this week.\n\nSign in to accept them and grow your network.\n\nThe Rolodex Team':
        'Merhaba,\n\nDikkatleri üzerinize çekiyorsunuz. Bu hafta beş kişi sizinle bağlantı kurmak istedi.\n\nİstekleri kabul etmek ve ağınızı genişletmek için giriş yapın.\n\nRolodex Ekibi',

    // --- Seed Threads (Dana Whitfield) ---
    'Congratulations on the launch. I mean that.':
        'Lansman için tebrik ederim. Samimiyetimle söylüyorum.',

    'Second thing, less pleasant: the line runs on the crew you give it, not on the target you set. If those two disagree, the target loses. I would rather you heard that from me than from a quarterly report.':
        'İkinci konu, pek hoş değil: Hat, koyduğunuz hedefe göre değil verdiğiniz personele göre çalışır. Bu ikisi uyuşmazsa hedef kaybeder. Bunu bir çeyrek raporundan değil benden duymanızı yeğlerim.',

    // --- Neglect Lines ---
    'I sent you something last quarter and the plant report has been and gone since.\n\nSo either you disagreed with it, which is allowed, or it is still sitting where I left it. I know which I would put money on.':
        'Geçen çeyrek sana bir şey göndermiştim ve fabrika raporu gelip geçeli çok oldu.\n\nDemek ya katılmadın —ki buna hakkın var— ya da bıraktığım yerde öylece duruyor. Hangisine para basacağımı iyi biliyorum.',

    'no reply to the last one, which is fine, you are busy\n\nI mention it only because I will be asked at the next meeting whether I raised it with you, and I would like to be able to say that I did and leave it there':
        'son mesaja cevap gelmedi hic sorun degil yogunsun biliyorum\n\nsadece bir sonraki toplantida bunu seninle konusup konusmadigim sorulacak konusmustum diyebilmek icin yaziyorum hepsi bu',

    'The item I wrote to you about last quarter is still open on my side.\n\nI have not escalated it and I do not intend to. But I keep a note of what I have raised and when, and the note is beginning to answer a question nobody has asked yet.':
        'Geçen çeyrek size yazdığım konu benim tarafımda hâlâ açık.\n\nKonuyu tırmandırmadım, tırmandırmaya da niyetim yok. Ancak neyi ne zaman gündeme getirdiğimin notunu tutarım; ve bu not, henüz kimsenin sormadığı bir soruyu şimdiden yanıtlamaya başlıyor.',

    'mate\n\nnothing needed, just checking you are upright\n\ni know what the first year is like. i am not going to ask twice though, so if you want me to stop you only have to keep not answering':
        'dostum\n\nbir seye ihtiyac yok sadece hayatta misin diye baktim\n\nilk yilin nasil gectigini biliyorum yine de iki kere sormam yani yazmami istemiyorsan cevap vermemeye devam etmen yeterli',

    'Following up on the last one. Nothing has changed on the floor since I sent it, which is the problem I was writing about.\n\nI will assume no answer means no change and plan around that.':
        'Son mesajın takibi için yazıyorum. Gönderdiğimden bu yana sahada hiçbir şey değişmedi; ki zaten yazdığım sorun da buydu.\n\nCevap gelmemesini değişiklik olmayacağı şeklinde yorumlayıp planlarımı ona göre yapacağım.',

    'I have carried on as though you had said yes, which I accept is not the same as you having said yes.\n\nIt is further along than it was. At some point one of us has to decide whether that is a good thing.':
        'Evet demişsiniz gibi yola devam ettim; gerçi bunun evet demiş olmanızla aynı şey olmadığını kabul ediyorum.\n\nEskisine göre epey ilerledi. Bir noktada ikimizden birinin bunun iyi bir şey olup olmadığına karar vermesi gerekecek.',

    'Nathan has asked me to close the file on this one, since it has been open a quarter without a response from your side.\n\nHe notes that the terms were time sensitive and that this is not a criticism. He would like it recorded that the offer was made.\n\nSent on behalf of N. Vogel.':
        'Tarafınızdan bir çeyrektir herhangi bir yanıt gelmeksizin açık kaldığı için Nathan bu dosyanın kapatılmasını rica etti.\n\nŞartların süreye bağlı olduğunu ve bunun bir eleştiri olmadığını belirtmektedir. Teklifin iletilmiş olduğunun kayıtlara geçmesini istemektedir.\n\nN. Vogel adına iletilmiştir.',

    'No reply, which we took as a no, which is completely fine.\n\nWe do want to flag that our numbers move with your position rather than with the calendar, so the offer you did not answer is not the offer you would get today. It is not a threat, it is just arithmetic, and it has been running the whole time.\n\nWe will be here.':
        'Cevap gelmedi; bunu hayır olarak kabul ettik ki bizim için hiçbir mahzuru yok.\n\nAncak rakamlarımızın takvimle değil sizin durumunuzla hareket ettiğini belirtmek isteriz; yani cevapsız bıraktığınız teklif, bugün alacağınız teklifle aynı değildir. Bu bir tehdit değil, yalnızca aritmetiktir ve geçen süre boyunca durmaksızın çalışmıştır.\n\nBiz buralardayız.',

    'This office wrote to you on the date shown above and has received no response.\n\nA non-response is not a refusal and is not treated as one. It is recorded.\n\nThis notice is issued for completeness and requires no action.':
        'Makamımız yukarıda belirtilen tarihte tarafınıza yazmış olup herhangi bir yanıt alamamıştır.\n\nCevap verilmemesi bir ret anlamına gelmez ve bu şekilde değerlendirilmez. Kayda geçirilmiştir.\n\nBu bildirim dosyanın tekemmülü amacıyla tanzim edilmiş olup herhangi bir işlem gerektirmemektedir.',

    'Under section 14(2) the undertaking was invited to make representations. No representations have been received.\n\nWhere no representations are received the Directorate proceeds on the material before it. The material before it is the complaint.\n\nThe file remains open until 31 March.':
        'Madde 14(2) uyarınca teşebbüs beyanda bulunmaya davet edilmiştir. Herhangi bir beyan alınmamıştır.\n\nBeyan alınmadığı hallerde Müdürlük eldeki mevcut belgeler üzerinden işlem yapar. Eldeki mevcut belge şikayetin kendisidir.\n\nDosya 31 Mart tarihine kadar açık kalacaktır.',

    // --- Partner Strain Lines ---
    'The plant ran late again this quarter, so you did.\n\nI am not asking you to stop. I am telling you that I noticed, once, and then I will not mention it again.':
        'Bu çeyrek fabrika yine geç saatlere kaldı, dolayısıyla sen de kaldın.\n\nBırakmanı istemiyorum. Sadece fark ettiğimi söylüyorum, bir kez; sonra bir daha konusunu açmayacağım.',

    'You have been at the tables two quarters running now.\n\nI have no speech about it. I would just rather hear about it from you than work it out from the evenings.':
        'İki çeyrektir üst üste masalardasın.\n\nBunun üzerine nutuk çekecek değilim. Sadece akşamları olanlardan anlamak yerine senden duymayı yeğlerdim.',

    'I wrote to you and you have not answered, which is fine on its own.\n\nIt is the third time it has been fine on its own.':
        'Sana yazdım ve cevap vermedin; tek başına bakıldığında sorun değil.\n\nAma bu, tek başına sorun olmadığı üçüncü sefer.',

    'Overtime again.\n\nI am not going to make it a thing. I will say that I know exactly how many quarters this makes, and that you probably do not.':
        'Yine fazla mesai.\n\nBunu büyütmeyeceğim. Sadece bunun kaçıncı çeyrek olduğunu çok iyi bildiğimi söyleyeceğim; muhtemelen senin bilmediğin bir şey bu.',

    'The casino, twice in a row.\n\nI am not your accountant and I have not added it up. I could, is all.':
        'Kumarhane, iki kez üst üste.\n\nMuhasebecin değilim, toplamını da çıkarmadım. Ama çıkarabilirdim, hepsi bu.',

    'No reply.\n\nThat is now a pattern rather than a busy week, and I have stopped assuming it is the week.':
        'Cevap yok.\n\nBu artık yoğun bir haftadan ziyade bir alışkanlık kalıbı haline geldi; ve ben de artık suçun haftada olduğunu varsaymayı bıraktım.',

    'You were at that plant every night this quarter and I know because I was here.\n\nI did not sign up to be the thing you get to after the line stops. Fix it or tell me you are not going to.':
        'Bu çeyrek her gece o fabrikadaydın ve bunu biliyorum çünkü ben buradaydım.\n\nHat durduktan sonra sıra gelen şey olmak için hayatımı birleştirmedim seninle. Düzelt ya da düzeltmeyeceğini söyle.',

    'Two quarters at the tables.\n\nDo not tell me it is business. I have met the people you do business with and none of them are at that table at four in the morning.':
        'İki çeyrektir masalardasın.\n\nBana bunun iş olduğunu söyleme. İş yaptığın insanlarla tanıştım ve hiçbirisi sabahın dördünde o masada oturmuyor.',

    'You have not answered me. Not once.\n\nI am going to keep writing for a while, because that is who I am, and then one day I am going to stop and you will not notice for a month.':
        'Bana cevap vermedin. Bir kere bile.\n\nBir süre daha yazmaya devam edeceğim çünkü huyum bu; sonra bir gün tamamen duracağım ve sen bunu bir ay boyunca fark bile etmeyeceksin.',

    // --- Departure Lines ---
    'I am going to go.\n\nThere is no scene in this and there is nothing you did in the last week. It has been a year of quarters and I have watched every one of them win.\n\nI hope the company is worth it. I think it might be, for you, and that is most of what I am going on.':
        'Ben gidiyorum.\n\nBunda bir olay çıkarma amacı yok, geçen hafta yaptığın özel bir şey de yok. Çeyreklerle dolu bir yıl geçti ve her birinin bana galip gelişini izledim.\n\nUmarım şirket buna değiyordur. Senin için değebileceğini düşünüyorum ve yola çıkarken tek dayanağım da bu.',

    'I am done, and I am not going to be quiet about it.\n\nSomebody rang me last month asking what you are like and I said something kind. They are going to ring again and I have decided what I am saying this time.\n\nYou had a year of chances and you spent them all on a factory.':
        'Benden bu kadar ve bu konuda sessiz kalacak değilim.\n\nGeçen ay biri arayıp nasıl biri olduğunu sordu ve ben iyi bir şeyler söyledim. Tekrar arayacaklar ve bu kez ne diyeceğime karar verdim.\n\nÖnünde koca bir yıl dolusu şans vardı ve hepsini bir fabrikaya harcadın.',

    // --- Courtship Refusal Lines ---
    'It was good to meet you, and I mean that.\n\nI have thought about it and I do not think so. There is nothing you did. I would rather say it now than be vague at you for a month.':
        'Tanıştığımıza sevindim, bunu tüm samimiyetimle söylüyorum.\n\nÜzerinde düşündüm ve olamayacağına karar verdim. Sizinle ilgili bir sorun yok. Bir ay boyunca sizi oyalamaktansa bunu şimdi açıkça söylemeyi yeğlerim.',

    'I have been trying to word this since Tuesday and there is no good version, so: no.\n\nYou were easy to talk to and I am not going to pretend that settles it. I hope the rest of your week is better than this message.':
        'Salı gününden beri bunu nasıl kelimelere dökeceğimi düşünüyorum ve uygun bir yolu yok, o yüzden: Hayır.\n\nSizinle sohbet etmek çok keyifliydi ama bunun her şeyi çözdüğünü iddia edemem. Umarım haftanın geri kalanı bu mesajdan çok daha güzel geçer.',

    'Thank you for asking. It is not nothing, being asked.\n\nI am going to say no, and I want to be clear that it is about my life rather than about you. That is true even though it is also what people say when it is not.':
        'Teklifiniz için teşekkürler; davet edilmek az şey değil.\n\nCevabım hayır olacak ve bunun sizinle değil tamamen kendi hayatımla ilgili olduğunu açıkça belirtmek isterim. Genelde gerçeği yansıtmadığında da böyle söylenir ama benim durumumda gerçekten öyle.',

    'No, and I am sorry to put it that plainly.\n\nI thought about softening it and decided you would rather have the sentence than the paragraph around it.':
        'Hayır; bu kadar dobra söylediğim için kusura bakmayın.\n\nCümleyi yumuşatmayı düşündüm ama etrafına bir paragraf laf dolandırmaktansa doğrudan cümleyi duymayı yeğleyeceğinize karar verdim.',

    'Thank you for the evening.\n\nI am going to be direct, because I think you would prefer it: no. I hope that is easier to hear once than to work out slowly.':
        'Akşam için teşekkürler.\n\nDoğrudan konuşacağım, çünkü sizin de bunu tercih edeceğinizi düşünüyorum: Hayır. Umarım bunu tek seferde duymak, zamanla anlamaya çalışmaktan daha kolay gelir.',

    'Answering properly rather than leaving it.\n\nIt is a no. I have thought about what the next six months would look like and I did not like my own answer.':
        'Cevapsız bırakmaktansa dürüstçe yanıtlamak istedim.\n\nCevabım hayır. Önümüzdeki altı ayın nasıl görüneceğini düşündüm ve vardığım cevaptan hoşlanmadım.',

    'You will want this quickly so here it is: no.\n\nI have made a habit of saying so on the day I decide. It costs me the awkward message and it saves us both a fortnight.':
        'Bunu bir an önce öğrenmek istersiniz, işte söylüyorum: Hayır.\n\nKarar verdiğim gün söylemeyi alışkanlık haline getirdim. Bana garip bir mesaj yazma zahmeti verir ama ikimize de iki hafta kazandırır.',

    'I have given this the time it deserved and the answer is still no.\n\nThere is nothing to argue with and I would rather you did not try, because you would be good at it and I would still be right.':
        'Buna hak ettiği zamanı ayırdım ve cevap yine de hayır.\n\nTartışılacak bir tarafı yok ve tartışmaya girmemenizi rica ederim; çünkü muhtemelen çok iyi ikna edersiniz ama günün sonunda ben yine haklı çıkarım.',

    'Look, you seem fine.\n\nI asked about you afterwards, which is a thing people do, and I have decided against it. I am not going to explain that and you would not enjoy it if I did.':
        'Bakın, gayet iyi birine benziyorsunuz.\n\nSonrasında hakkınızda biraz bilgi topladım —ki herkes bunu yapar— ve olumsuz karar verdim. Bunu açıklayacak değilim, açıklasam da hoşunuza gitmezdi.',

    'No.\n\nI could dress that up. You are a grown man and I have watched you take worse news than this before lunch.':
        'Hayır.\n\nBunu süsleyip püsleyebilirdim. Ama siz koskoca bir insansınız ve öğle yemeğinden önce bundan çok daha kötü haberleri göğüslediğinizi gördüm.',

    'I thought about it for slightly less time than you are going to spend reading this. No.\n\nDo not send flowers. I mean that as advice rather than as a rule.':
        'Bunu, sizin bu mesajı okurken harcayacağınız süreden biraz daha az düşündüm. Hayır.\n\nÇiçek falan göndermeyin. Bunu bir kuraldan ziyade bir tavsiye olarak söylüyorum.',

    'Somebody at that table told me something about you afterwards and I have not stopped thinking about it, which is not the compliment it sounds like.\n\nSo, no.':
        'O masadaki biri daha sonra bana sizinle ilgili bir şey söyledi ve o andan beri bunu düşünmeden duramıyorum —ki kulağa geldiği gibi bir iltifat sayılmaz.\n\nDolayısıyla, hayır.',

    // --- Negotiator Lines ---
    'I read it twice, which is more than I usually manage.\n\nI am not going to pretend the runway is longer than it is. You know what we spend and you know what we have sold, which is nothing, and I am aware those two facts have a date on them.':
        'İki kez okudum; normalde okuduğumdan daha fazla.\n\nPistin olduğundan daha uzunmuş gibi davranacak değilim. Ne harcadığımızı biliyorsunuz, ne sattığımızı da biliyorsunuz —ki hiçbir şey satmadık; ve bu iki gerçeğin üzerinde bir son kullanma tarihi olduğunun farkındayım.',

    'One condition, and it is not money.\n\nI take a seat. Not for me, so that there is somebody in the room in three years when a quarter goes badly and the lab is the obvious thing to cut. I have watched this happen from the outside twice. I would like to be inside for it.':
        'Tek bir şartım var ve para değil.\n\nKurulda bir koltuk alırım. Kendim için değil; üç yıl sonra bir çeyrek kötü gittiğinde ve kesilecek ilk aşikar şey laboratuvar olduğunda o odada biri olsun diye. Bunun dışarıdan iki kez gerçekleştiğini gördüm. Bu kez içeride olmak isterim.',

    'No. Not at that price and not at any other one, I have had this letter from better-funded people than you and the answer has been the same each time.':
        'Hayır. Ne o fiyata ne de başka bir fiyata. Bu mektubu sizden çok daha zengin insanlardan da aldım ve cevap her seferinde aynı oldu.',

    'Then we are agreed, and I will be difficult about research for as long as you keep me.\n\nI did not build it to be owned. I built it to be finished.':
        'O halde anlaştık; ve beni tuttuğunuz sürece araştırma konusunda başınızı ağrıtacağım.\n\nBen bunu başkalarının mülkü olsun diye kurmadım. Tamamlansın diye kurdum.',

    'Understood, and I would rather have a clear no than a slow one.\n\nDo not write again. I mean that without any heat, I will not be able to give you a different answer later, so there is no point either of us spending the postage.':
        'Anlaşıldı; oyalanmış bir hayırdansa açık bir hayırı yeğlerim.\n\nBir daha yazmayın. Bunu hiç öfkelenmeden söylüyorum; daha sonra da farklı bir cevap veremeyeceğim, bu yüzden ikimizin de posta masrafı yapmasına gerek yok.',

    'Thank you for writing plainly. Most of them do not.\n\nForty years without a bad quarter. I am not sentimental about ownership but I am about that record, and I would like to know it survives the paperwork.':
        'Açıkça yazdığınız için teşekkürler. Çoğu insan öyle yapmaz.\n\nKötü bir çeyrek geçirmeksizin kırk yıl. Mülkiyet konusunda duygusal değilim ama bu sicil konusunda öyleyim; ve evrak işlerinden sonra da hayatta kaldığını bilmek isterim.',

    'Ten points over the market, and I will tell you exactly why so you can argue with the reason rather than the number.\n\nThe business earns steadily and it will earn steadily under you. You are not rescuing anybody. Nobody pays a rescue price for a company that does not need rescuing.':
        'Piyasanın on puan üzeri; ve nedenini tam olarak açıklayacağım ki rakam yerine sebeple tartışabilesiniz.\n\nİşletme düzenli kazanıyor ve sizin yönetiminizde de düzenli kazanmaya devam edecek. Kimseyi kurtarmıyorsunuz. Kurtarılmaya ihtiyacı olmayan bir şirket için kimse kurtarma fiyatı ödemez.',

    'No, and it is not about the price.\n\nYou are asking me to hand a working thing to somebody who has not yet shown me a quarter I would want to sign.':
        'Hayır; ve mesele fiyat değil.\n\nBenden çalışan bir işletmeyi, altına imzamı atmak isteyeceğim tek bir çeyreği bile henüz bana gösterememiş birine teslim etmemi istiyorsunuz.',

    'Good. Then it is done and I will not haggle further, which you may find unusual.':
        'Güzel. O zaman bu iş bitti ve daha fazla pazarlık etmeyeceğim; ki bunu muhtemelen alışılmadık bulacaksınız.',

    'Then we are not far apart. Five points, and I will not come back a third time.\n\nI would rather close at a number I am slightly unhappy with than spend another quarter on letters.':
        'O halde birbirimizden çok uzak değiliz. Beş puan, ve üçüncü bir kez geri gelmem.\n\nYazışmalarla bir çeyrek daha harcamaktansa biraz mutsuz olduğum bir rakamda anlaşmayı yeğlerim.',

    'Well, finally.\n\nI have been waiting for one of these for about two years and I had begun to worry it would be someone boring. Let us not do the part where we pretend either of us is reluctant.':
        'Nihayet.\n\nYaklaşık iki yıldır böyle bir teklif bekliyordum ve artık sıkıcı birinden gelecek diye endişelenmeye başlamıştım. İkimizden birinin isteksizmiş gibi davrandığı kısmı hiç oynamayalım.',

    'Fifteen over, give or take, and you should know that I picked the number by looking at how much you seem to want it rather than at what the company is worth.\n\nI am telling you that because you were going to work it out and I would rather be the one who said it.':
        'Aşağı yukarı on beş puan üzeri; ve bilmelisiniz ki bu rakamı şirketin değerine bakarak değil sizin bunu ne kadar çok istediğinize bakarak belirledim.\n\nBunu size söylüyorum çünkü zaten anlayacaktınız; ve söyleyen tarafın ben olmasını yeğlerim.',

    'Not today. Ask me in a bad quarter, mine or yours, either works.':
        'Bugün olmaz. Kötü bir çeyrekte tekrar sorun; benimki ya da sizinki, ikisi de uyar.',

    'You said yes very quickly.\n\nThat was a mistake and I am going to be honest about making you pay for it: the number has moved. Five more. Same company, same day, different information.':
        'Çok çabuk evet dediniz.\n\nBu bir hataydı ve bunun bedelini size ödeteceğim konusunda dürüst olacağım: Rakam değişti. Beş puan daha. Aynı şirket, aynı gün, farklı bilgi.',

    'Fine. The original, then. I would rather have the deal than the argument.\n\nGood price. Congratulations to us both, one of us more than the other.':
        'Pekala. O halde ilk rakam olsun. Tartışmaktansa anlaşmayı bağlamayı yeğlerim.\n\nİyi fiyat. İkimize de tebrikler; gerçi birimize diğerinden biraz daha fazla.',

    'ha\n\nok so i read this on the train and had to read it again at the office because i thought i had made it up\n\nyes obviously yes. do you want me to sign something or is this the kind of thing where lawyers do it':
        'haha\n\ntamamdir trende okudum sonra ofiste bir daha okudum uydurdum sandim bir an\n\nevet tabii ki evet bir sey imzalamami istiyor musun yoksa avukatlarin hallettigi turden bir sey mi bu',

    'i dont want anything. what would i ask for\n\nyou gave me two hundred grand when nobody would take my calls. i am not going to sit here and negotiate points with you like we met at a conference':
        'hicbir sey istemiyorum ne isteyebilirim ki zaten\n\nkimse telefonlarima bakmazken bana iki yuz bin dolar vermistin bir konferansta yeni tanismisiz gibi karsina gecip puan pazarligi yapacak halim yok ya',

    'no worries at all, seriously. was a nice thing to be asked':
        'hic sorun degil gercekten teklif edilmesi bile cok guzeldi',

    'ok\n\nim going to go and tell my wife and then i am going to feel strange about it for a while, but ok. thank you for asking me properly. you did not have to do that':
        'tamamdir\n\ngidip esime soyleyeyim sonra bir sure kendimi garip hissedecegim ama tamam. bana usulunce teklif ettigin icin tesekkurler bunu yapmak zorunda degildin',

    'all good! let me know if it comes back around\n\nsee you soon':
        'her sey yolunda! konu tekrar gundeme gelirse haber verirsin\n\nyakinda gorusmek uzere',

    'Ref: CORP/UNSOL/2211-4\n\nWe acknowledge receipt of your correspondence.\n\nPear does not evaluate unsolicited proposals regarding its own share capital and does not maintain a process for doing so. No response beyond this acknowledgement should be expected, and none will follow.\n\nThis matter is now closed on our side.\n\nSent on behalf of Nathan Vogel':
        'Ref: KUR/TALEP-DISI/2211-4\n\nYazışmanızın teslim alındığı bildirilmektedir.\n\nPear, kendi hisse sermayesine ilişkin talep edilmemiş teklifleri değerlendirmeye almaz ve bu yönde bir süreç yürütmez. Bu alındı bildiriminin ötesinde bir yanıt beklenmemelidir ve verilmeyecektir.\n\nBu konu tarafımızda kapanmıştır.\n\nNathan Vogel adına iletilmiştir',

    'The board has considered your letter and is willing to continue the conversation.':
        'Yönetim kurulu mektubunuzu değerlendirmiştir ve görüşmeyi sürdürmeye isteklidir.',

    'The board is willing to recommend the offer to shareholders, subject to the condition set out below.':
        'Yönetim kurulu, aşağıda belirtilen şarta bağlı olarak teklifi hissedarlara tavsiye etmeye isteklidir.',

    'The board has considered your letter and does not intend to pursue it. We do not expect to revisit this decision.':
        'Yönetim kurulu mektubunuzu değerlendirmiş olup süreci devam ettirme niyetinde değildir. Bu kararın yeniden değerlendirilmesi beklenmemelidir.',

    'The condition is acceptable. The board will recommend the offer.':
        'Şart kabul edilmiştir. Yönetim kurulu teklifi tavsiye edecektir.',

    'Then there is nothing further to discuss at this time.':
        'O halde şu aşamada görüşülecek başka bir husus bulunmamaktadır.',

    'CONDITION: a seat on your board.':
        'ŞART: Yönetim kurulunuzda bir koltuk.',

    'You will forgive me for noticing that your name is currently on nothing at all. That is unusual for a company your size and people do remark on it.':
        'Adınızın şu anda hiçbir şeyin üzerinde yer almadığını fark ettiğim için beni bağışlayınız. Şirketinizin büyüklüğünde bir firma için bu alışılmadık bir durum ve insanlar bunu konuşuyor.',
};

// Build reverse dictionary (TR -> EN) so if text is stored in Turkish and locale is EN,
// we can translate it cleanly back to English.
const REVERSE_TEXT_EN: Record<string, string> = {};
for (const [enText, trText] of Object.entries(TEXT_TR)) {
    REVERSE_TEXT_EN[trText] = enText;
}

const REVERSE_ROLES_EN: Record<string, string> = {};
for (const [enRole, trRole] of Object.entries(ROLES_TR)) {
    REVERSE_ROLES_EN[trRole] = enRole;
}

const REVERSE_NAMES_EN: Record<string, string> = {};
for (const [enName, trName] of Object.entries(SENDER_NAMES_TR)) {
    REVERSE_NAMES_EN[trName] = enName;
}

const REVERSE_SUBJECTS_EN: Record<string, string> = {};
for (const [enSubj, trSubj] of Object.entries(SUBJECTS_TR)) {
    REVERSE_SUBJECTS_EN[trSubj] = enSubj;
}

// ----------------------------------------------------------------------------
//  4. TRANSLATION HELPERS
// ----------------------------------------------------------------------------

/**
 * Translate a message or email body snippet.
 */
export const translateMessageText = (text: string): string => {
    if (!text) return '';
    const locale = useLocaleStore.getState().locale;

    if (locale === 'en') {
        return REVERSE_TEXT_EN[text] ?? text;
    }

    // Direct match in our dictionary
    if (TEXT_TR[text]) return TEXT_TR[text];

    // Check dynamic pattern: Partner aid offer
    // "I looked at the account, which I know I am not supposed to do.\n\nI can put in $... and I would rather do it now..."
    if (text.startsWith('I looked at the account, which I know I am not supposed to do.')) {
        return text.replace(
            /I looked at the account, which I know I am not supposed to do\.\n\nI can put in ([^\s]+) and I would rather do it now than after you have had to ask\. Say the word and it is done\./,
            'Hesaba baktım; biliyorum bakmamam gerekirdi.\n\n$1 koyabilirim ve bunu sen istemek zorunda kalmadan önce şimdi yapmayı yeğlerim. Bir kelimene bakar.'
        );
    }

    // Check dynamic pattern: Hostile tender line
    // "— A tender directly to their shareholders would clear at 3.0x market."
    if (text.includes('A tender directly to their shareholders would clear at')) {
        return text.replace(
            /— A tender directly to their shareholders would clear at ([0-9.]+x) market\./,
            '— Doğrudan hissedarlara yapılacak bir devralma teklifi piyasa değerinin $1 katı seviyesinde sonuçlanır.'
        );
    }

    // Check dynamic pattern: Sponsorship terms
    // "TERMS: $... per quarter for ... quarters."
    if (text.includes('TERMS:') && text.includes('per quarter for')) {
        return text.replace(
            /TERMS: ([^\s]+) per quarter for (\d+) quarters\./,
            'ŞARTLAR: $2 çeyrek boyunca çeyrek başına $1.'
        );
    }

    // Check dynamic pattern: Condition standing
    // "CONDITION: your public standing at ... or better on the day of signing."
    if (text.startsWith('CONDITION: your public standing at')) {
        return text.replace(
            /CONDITION: your public standing at (\d+) or better on the day of signing\./,
            'ŞART: İmza gününde kamu itibarınızın en az $1 olması.'
        );
    }

    // Check dynamic pattern: Condition price
    // "CONDITION: ...% above the customary premium."
    if (text.startsWith('CONDITION:') && text.includes('above the customary premium.')) {
        return text.replace(
            /CONDITION: (\d+)% above the customary premium\./,
            'ŞART: Alışılagelmiş primin %$1 üzerinde ödeme.'
        );
    }

    return text;
};

/**
 * Translate a mail subject line.
 */
export const translateMailSubject = (subject: string, conversationId?: string): string => {
    if (!subject) return '';
    const locale = useLocaleStore.getState().locale;

    if (locale === 'en') {
        return REVERSE_SUBJECTS_EN[subject] ?? subject;
    }

    // If it is a story conversation mail, resolve via storyText subjectKey
    if (conversationId) {
        return line(subjectKey(conversationId), subject);
    }

    if (SUBJECTS_TR[subject]) return SUBJECTS_TR[subject];

    // Dynamic offer acquisition: "RE: Offer to acquire ..."
    if (subject.startsWith('RE: Offer to acquire ')) {
        const target = subject.replace('RE: Offer to acquire ', '');
        return `${target} şirketini devralma teklifi hk.`;
    }

    // Dynamic sponsorship: "Sponsorship — ..."
    if (subject.startsWith('Sponsorship — ')) {
        const name = subject.replace('Sponsorship — ', '');
        return `Sponsorluk — ${name}`;
    }

    return subject;
};

/**
 * Translate a thread's role label.
 */
export const translateRole = (role: string): string => {
    if (!role) return '';
    const locale = useLocaleStore.getState().locale;

    if (locale === 'en') {
        return REVERSE_ROLES_EN[role] ?? role;
    }

    return ROLES_TR[role] ?? role;
};

/**
 * Translate a sender name on an envelope or thread.
 */
export const translateSenderName = (name: string): string => {
    if (!name) return '';
    const locale = useLocaleStore.getState().locale;

    if (locale === 'en') {
        return REVERSE_NAMES_EN[name] ?? name;
    }

    return SENDER_NAMES_TR[name] ?? name;
};

/**
 * Translate an entire mail's body, handling story conversation resolution,
 * seed mail, negotiator letters, or sponsorship letters.
 */
export const translateMailBody = (body: string, conversationId?: string): string => {
    if (!body) return '';
    const locale = useLocaleStore.getState().locale;

    if (locale === 'en') {
        return REVERSE_TEXT_EN[body] ?? body;
    }

    // If it's a conversation mail that hasn't been played yet, resolve the opening line
    if (conversationId) {
        const c = conversationById(conversationId);
        if (c) {
            const startNode = c.nodes.find(n => n.id === c.start);
            if (startNode) {
                // If body matches start node text
                if (body === startNode.text) {
                    return line(nodeKey(conversationId, startNode.id), body);
                }
            }
        }
    }

    // Check if body is in our dictionary
    if (TEXT_TR[body]) return TEXT_TR[body];

    // If it is multi-line (e.g. negotiation body with demand line), translate paragraphs
    const paragraphs = body.split('\n\n');
    if (paragraphs.length > 1) {
        return paragraphs.map(p => translateMessageText(p)).join('\n\n');
    }

    return translateMessageText(body);
};
