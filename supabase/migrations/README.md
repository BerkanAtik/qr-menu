# Migration geçmişi

Bu klasördeki dosyalar Supabase SQL editöründe SIRAYLA çalıştırıldı. Yeni bir
Supabase projesinde sıfırdan kurulum yapılacaksa dosyalar numara sırasına göre
çalıştırılabilir (idempotent yazıldı, tekrar çalıştırmak hata vermez).

NOT: Bu klasörde YER ALMAYAN ilk tablolar (`restaurants`, `categories`,
`products`, `tables`) proje başlangıcında Supabase arayüzünden manuel
oluşturulmuştu, o adımlar kayıtlı değil.

## Yeni bir restoran (müşteri) eklerken

005'ten sonra panel, giriş yapan kullanıcının restoranını `restaurant_users`
tablosundan buluyor. Yeni müşteri kurarken sırayla:

1. Supabase Auth'tan kullanıcı oluştur (restoran sahibinin e-postası).
2. `restaurants` tablosuna kayıt ekle — `slug` menü adresinde kullanılacak
   (ör. `kebapci-ali` → `/kebapci-ali/masa/1`), `table_count` masa sayısı.
3. `restaurant_users` tablosuna `(user_id, restaurant_id)` satırını ekle.
4. Kategorileri gir; ürünleri restoran sahibi panelden ekleyebilir.

Bu adım atlanırsa kullanıcı panele girer ama "Hesabınıza bağlı bir restoran
bulunamadı" uyarısını görür.

## Kullanımda olmayan (ama silinmemiş) kolonlar

- `products.is_daily_special` — "günün özel lezzeti" özelliği kaldırıldığı için artık okunmuyor
- `restaurants.allergen_info` — admin formundan kaldırıldığı için artık okunmuyor

İsterseniz şu komutlarla tamamen silinebilir (dikkat: geri alınamaz):

```sql
alter table products drop column is_daily_special;
alter table restaurants drop column allergen_info;
```
