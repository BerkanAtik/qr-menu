# Migration geçmişi

Bu klasördeki dosyalar Supabase SQL editöründe SIRAYLA çalıştırıldı. Yeni bir
Supabase projesinde sıfırdan kurulum yapılacaksa dosyalar numara sırasına göre
çalıştırılabilir (idempotent yazıldı, tekrar çalıştırmak hata vermez).

NOT: Bu klasörde YER ALMAYAN ilk tablolar (`restaurants`, `categories`,
`products`, `tables`) proje başlangıcında Supabase arayüzünden manuel
oluşturulmuştu, o adımlar kayıtlı değil.

## Kullanımda olmayan (ama silinmemiş) kolonlar

- `products.is_daily_special` — "günün özel lezzeti" özelliği kaldırıldığı için artık okunmuyor
- `restaurants.allergen_info` — admin formundan kaldırıldığı için artık okunmuyor

İsterseniz şu komutlarla tamamen silinebilir (dikkat: geri alınamaz):

```sql
alter table products drop column is_daily_special;
alter table restaurants drop column allergen_info;
```
