// src/data/i18n/endingTranslations.ts
//
// ============================================================================
//  STORY ENDING & RECORD LOCALIZATION REGISTRY
// ============================================================================
//
//  Provides curated, literary Turkish translations for all 10 story endings
//  and record scorecard rows.
//
//  Strict Language Isolation:
//   - When locale === 'en', guarantees 100% original English text.
//   - When locale === 'tr', returns atmospheric Turkish endings and translated
//     record metrics.
// ============================================================================

import { useLocaleStore } from '../../core/i18n';
import type { Ending } from '../story/endings';
import type { RecordRow } from '../../core/story/record';

export const ENDINGS_TR: Record<string, { title: string; body: string }> = {
    soldToPear: {
        title: 'TEKLİFİ KABUL ETTİN',
        body:
            'Para bir Salı günü hesaba geçti. Adil bir fiyattı; Vogel asla değerinin altında '
            + 'teklif vermez, çünkü eksik ödemek uzayan bir müzakereye davetiye çıkarır.\n\n'
            + 'Fabrika on bir ay daha çalıştı ve kapandı. Hale adı entegrasyon raporunda yalnızca bir kez, '
            + 'bir dipnotta ve doğru yazılmış olarak geçiyor. Yirmi altı yaşındasın ve hayatının geri kalanında '
            + 'asla çalışmak zorunda kalmayacaksın; ki bu kulağa geldiğinden çok daha uzun bir zamandır.\n\n'
            + 'Bu işte iyi olup olamayacağını hiç kimse öğrenemedi.',
    },

    lostTheFloor: {
        title: 'ARTIK YETERİNCE SAHİBİ DEĞİLSİN',
        body:
            'Pay defteri yedide yayımlanıyor. Sekizde şirket sekreteri sana yazmış oluyor, '
            + 'kibarca, düzenlemelerle ilgili.\n\n'
            + 'Oylama olmadı. Oylanacak bir şey yoktu. Artık diğerleri gibi bir ortaksın, '
            + 'hatta dördünden daha küçüğü, ve koltuk o sütundaki insanlar kime diyorsa onun.\n\n'
            + 'Kimse senden almadı. Yıllar içinde, parça parça, her biri o gün mantıklı gelen '
            + 'bir sebeple sen sattın.',
    },

    removedByBoard: {
        title: 'YÖNETİM KURULU SENİ GÖREVDEN ALDI',
        body:
            'Oylama 11:40\'ta kabul edildi. Telefonun 11:31\'de çalıyor.\n\n'
            + '"Hiçbir şeyi dert etme canım. Babamın şirketine ben göz kulak olurum. Bu kısımdan '
            + 'zaten hiçbir zaman zevk almayacaktın, bunu her zaman bildiğini düşünmüşümdür. '
            + 'Uykunu alınca öğle yemeğine gel. J x"\n\n'
            + 'Dokuz dakika. O dokuz dakikayı uzun bir süre düşüneceksin.',
    },

    convictedOfManipulation: {
        title: 'İYİLEŞMENİN KENDİSİ KANITTI',
        body:
            'O sırada kimse seni durdurmadı. Satın alma onaylandı, pay defteri güncellendi '
            + 've iki yıl boyunca kendi çöküşünün en dip noktasından satın aldığın bir şirketi yönettin.\n\n'
            + 'Sonra toparlandı. Hızla, eksiksizce ve herkesin gözü önünde. Bu kadar hızlı geri dönen '
            + 'bir şirket, hisse fiyatının söylediği kadar batık olamazdı; ve bunu önceden bilebilecek '
            + 'tek kişi onu satın alan kişiydi.\n\n'
            + 'Dosyanın hazırlanması on bir ay, mahkemede okunması kırk dakika sürdü. Orada otururken '
            + 'fark ettiğin şey, iddiaların hiçbirine itiraz edilemediğidir. İddianamedeki her rakam sana aitti.',
    },

    barredForManipulation: {
        title: 'KOLTUKTAN MEN EDİLDİN',
        body:
            'Uzlaşma bir Perşembe günü karara bağlandı ve Cuma günü duyuruldu; bu tür şeyler hep böyle duyurulur.\n\n'
            + 'Suç kabulü yok, mahkumiyet yok ve saymak istemeyeceğin kadar uzun sürecek bir yöneticilik yasağı.\n\n'
            + 'Bunun ikinci yarısını iyi oku, çünkü önemli olan kısım orası. Yasak şirkete değil, SANA getirildi. '
            + 'Kimse hisselerini almıyor ve kimse evine el koymuyor. Bir daha asla yapamayacağın tek şey, '
            + 'babanın oturduğu o koltuğa oturmaktır.\n\n'
            + 'Böylece hisseler ailenin adına devredilir ve koltuk çocuğuna kalır. İmzayı attıkları gün '
            + 'o masada olacaksın ve imzayı atan sen olmayacaksın. Ceza tam olarak bu.',
    },

    wentBankrupt: {
        title: 'PARA TÜKENDİ',
        body:
            'Maaşlar yatmadı. Bunu bir Cuma günü saat 06:40\'ta bankadan öğrendin; bu da haberi alan '
            + 'ilk kişi olmadığın anlamına geliyordu.\n\n'
            + 'Kayyumlar bir hafta içinde atandı. Kibarlar ve hızlılar; ikinci günün sabahında işe aldığın '
            + 'biri, elinde pano olan bir adama arşivleme sistemini anlatıyordu.\n\n'
            + 'Bina iyi fiyata satıldı. Şirketin sahip olduğu en değerli şey her zaman oydu; henüz '
            + 'vakit varken birilerinin yüksek sesle söylemesi gereken bir cümleydi bu.',
    },

    boughtPear: {
        title: 'PEAR\'I SATIN ALDIN',
        body:
            'Para bir Salı günü hesaba geçti. Adil bir fiyat değildi ama ikiniz de imzayı attınız.\n\n'
            + 'Vogel Cuma gününe kadar binadan ayrılmış olacak. Entegrasyon raporunda adı bir dipnotta, '
            + 'doğru yazılmış olarak yalnızca bir kez geçiyor ve ekibinden biri onun gerçekten o Vogel olup '
            + 'olmadığını soruyor.\n\n'
            + 'Hayatın boyunca kafana taktığın tek sorunun cevabını artık aldın. Bütün bir ömrüne mal oldu '
            + 've elde tutmanın, onu arzulamaktan çok daha küçük bir his olduğu ortaya çıktı.',
    },

    diedInOffice: {
        title: 'HAYATA VEDA ETTİN',
        body:
            'Bina içinde değildi; herkes bunun bir lütuf olduğunda hemfikir ve bir saat içinde '
            + 'ikisi bunu birebir aynı kelimelerle dile getiriyor.\n\n'
            + 'Yönetim kurulu planlandığı gibi Salı günü toplanıyor. Koltuk sadece o tek toplantı için '
            + 'boş bırakılıyor; bu senin hatırına sergilenen son tiyatrodur ve bir sonraki toplantıda doldurulur.\n\n'
            + 'Mirasın bölüştürülüyor. Korkmuş ve bunu bu kadar erken beklemeyen biri, önüne konan '
            + 'ilk kâğıdı imzalıyor.',
    },

    diedWithoutAnHeir: {
        title: 'HAYATA VEDA ETTİN',
        body:
            'Yönetim kurulu Salı günü toplanıyor. Bunun için belirlenmiş bir prosedür var, '
            + 'harfiyen uygulanıyor ve on bir dakika sürüyor.\n\n'
            + 'Şirket içinden bir geçici yönetici atanıyor; gazetelerin istikrar dediği sonuç bu. Yetkin biri. '
            + 'Onu işe aldığında da yetkindi ve onunla rakamlar dışında tek bir sohbetin bile olmamıştı.\n\n'
            + 'Tabelayı değiştirmek masraflı olduğu ve hiç kimse bu konuyu ilk açan kişi olmak istemediği için '
            + 'Hale adı binada dört yıl daha kalıyor.',
    },

    diedWithHeirTooYoung: {
        title: 'HAYATA VEDA ETTİN',
        body:
            'Yönetim kurulu Salı günü toplanıyor ve gündem şirketi kimin yöneteceği değil. '
            + 'Gündem, o vakte kadar şirketi kimin idare edeceği.\n\n'
            + 'Çocuğun okulda. Bir odada, bir sürahi suyun yanında biri bu düzenlemeyi ona bir kez, '
            + 'dikkatle anlatıyor ve bunu ileride tam olarak anlayacağı söyleniyor. Anlayacak.\n\n'
            + 'Geçici yönetici yetkin ve yıllar, yılların geçtiği hızda geçip gidiyor. O isimde bir çocuk '
            + 'olduğu ve bunu herkes bildiği için, bu süre boyunca isim binada asılı kalıyor.',
    },

    soldWhatYouInherited: {
        title: 'SATIP ÇIKTIN',
        body:
            'Para bir Salı günü hesaba geçti; avukatlar bunun olağan olduğunu söylüyor ve bu, '
            + 'ailenin tek seferde sahip olduğu en büyük meblağ.\n\n'
            + 'İsim ikinci yılda binadan indiriliyor. Vogel öyle olacağını söylemişti ve öyle de oluyor; '
            + 'bir Perşembe günü, dört adam ve bir sabahın çoğunu alıyor.\n\n'
            + 'Yerel gazetede harfleri üst üste dizmiş vinçteki ekibin bir fotoğrafı var. '
            + 'Sen o karede olmayacaksın. Sana haber verilmedi ve kimsenin bunu akıl etmesi için bir neden de yoktu.',
    },
};

const RECORD_LABELS_TR: Record<string, string> = {
    'In the chair for': 'Koltukta geçirilen süre',
    'You were': 'Yaşın',
    'The company was worth': 'Şirketin değeri',
    'You were worth': 'Kişisel servetin',
    'On the payroll': 'Bordrolu çalışan',
    'Products on sale': 'Satıştaki ürünler',
    'Companies bought': 'Satın alınan şirketler',
    'Family': 'Aile',
    'Your successor took': 'Varisine kalan pay',
    'The family holds': 'Ailenin elindeki pay',
};

export const translateEnding = (ending: Ending): Ending => {
    if (!ending) return ending;
    const locale = useLocaleStore.getState().locale;
    if (locale === 'en') return ending;

    const tr = ENDINGS_TR[ending.id];
    if (!tr) return ending;

    return {
        ...ending,
        title: tr.title,
        body: tr.body,
    };
};

/**
 * Translates time, family, and stake values for the Record scorecard.
 */
export const translateRecordValue = (value: string): string => {
    if (!value) return value;
    const locale = useLocaleStore.getState().locale;
    if (locale === 'en') return value;

    // Time: "1 quarter" / "N quarters" / "1 year" / "N years" / "X years, Y quarters"
    if (value === '1 quarter') return '1 çeyrek';
    if (/^\d+\s+quarters$/.test(value)) {
        return value.replace('quarters', 'çeyrek');
    }
    if (value === '1 year') return '1 yıl';
    if (/^\d+\s+years$/.test(value)) {
        return value.replace('years', 'yıl');
    }
    if (/^\d+\s+year(s)?,\s+\d+\s+quarter(s)?$/.test(value)) {
        return value
            .replace('years', 'yıl')
            .replace('year', 'yıl')
            .replace('quarters', 'çeyrek')
            .replace('quarter', 'çeyrek');
    }

    // Family: "None" / "1 child, one of them named" / "N children, one of them named" / "none of them named"
    if (value === 'None') return 'Yok';
    if (/^\d+\s+child,\s+one of them named$/.test(value)) {
        return value.replace(/(\d+)\s+child,\s+one of them named/, '$1 çocuk, veliaht seçildi');
    }
    if (/^\d+\s+children,\s+one of them named$/.test(value)) {
        return value.replace(/(\d+)\s+children,\s+one of them named/, '$1 çocuk, veliaht seçildi');
    }
    if (/^\d+\s+children,\s+none of them named$/.test(value)) {
        return value.replace(/(\d+)\s+children,\s+none of them named/, '$1 çocuk, veliaht seçilmedi');
    }

    // Stake: "Nothing" / "N% of the company"
    if (value === 'Nothing') return 'Hiçbir şey';
    if (/^\d+%\s+of the company$/.test(value)) {
        return value.replace(/(\d+)%\s+of the company/, 'Şirketin %$1\'i');
    }

    return value;
};

export const translateRecordRow = (row: RecordRow): RecordRow => {
    const locale = useLocaleStore.getState().locale;
    if (locale === 'en') return row;

    return {
        label: RECORD_LABELS_TR[row.label] ?? row.label,
        value: translateRecordValue(row.value),
    };
};
