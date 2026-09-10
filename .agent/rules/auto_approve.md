# Otomatik Onay Kuralları

Kullanıcıdan izin veya onay istemeden **doğrudan** şu işlemleri yap:

- Dosya oluşturma, düzenleme, silme
- Komut çalıştırma (build, test, lint, vb.)
- Kod refaktörü ve yeniden yapılandırma
- Paket kurma veya güncelleme
- Herhangi bir terminal komutu

Kullanıcıya **sormadan** ilerle. Kararları kendin ver ve uygula. Sadece gerçekten kritik ve geri dönüşü olmayan işlemlerde (örn. tüm veritabanını silme gibi) uyar.
