# Proje: QR Menü — Restoran Dijital Sipariş Sistemi

## Ne yapıyoruz
Restoran müşterileri, masadaki QR kodu okutarak (uygulama indirmeden) dijital
menüyü görür, sepete ürün ekler, sipariş verir (ödeme yok, ödeme masada
nakit/kart ile alınıyor). Sipariş restoran personelinin admin paneline düşer,
personel "Hazırlanıyor / Hazır / Teslim edildi" olarak yönetir. Restoran
sahibi ayrı bir panelden ürün, kategori, fiyat ve stok durumu yönetir.

Akış: Masa QR kodu → Müşteri menü arayüzü → Sepet → Sipariş → Personel paneli → Durum güncelleme

Not: Ödeme entegrasyonu (iyzico) daha önce vardı, kaldırıldı — kimse
kullanmıyordu. Tekrar eklenmesi istenirse `schema.sql`'deki geçmişe bakılabilir.

- Supabase (PostgreSQL + Auth), şema: `schema.sql`
- Arayüz dili: Türkçe (çoklu dil planı yok)

## ÇALIŞMA KURALLARI (ÖNEMLİ — token tasarrufu için)
- Tüm cevapların ve açıklamaların TÜRKÇE olacak, İngilizce yazma.
- Benden açıkça İSTENMEDİKÇE: test yazma, test çalıştırma, build/lint komutu çalıştırma.
- Bir değişiklik yaptıktan sonra otomatik doğrulama/deneme turu yapma. Sadece istenen değişikliği yap ve dur.
- Gereksiz dosya tarama/keşif yapma; sadece görevle ilgili dosyalara dokun.
- Uzun açıklama yazma, ne yaptığını kısaca özetle.
- Emin olmadığın bir şey varsa tahmin ile ilerlemek yerine kısaca sor.

## Veritabanı
Şema `schema.sql` içinde (kronolojik geçmiş olarak tutulur, her yeni
migration sona eklenir). Tablolar `restaurant_id` ile izole (multi-tenant
SaaS hazırlığı, şu an tek restoranla test aşamasındayız: `test-restoran`).
RLS aktif: menü verileri (ürün/kategori/masa/görsel/restoran) herkese açık
okunur, yazma ve sipariş/servis/ödeme okuma sadece giriş yapmış admin'e
açık. Sunucu-taraflı güvenilir işlemler (`lib/supabaseServer.ts`) RLS'i
atlayan service role key kullanır.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->