# Kapmenü — QR Kodlu Dijital Menü Sistemi

Restoranlar için çok kiracılı (multi-tenant) QR menü platformu. Müşteri masadaki
QR kodu okutup menüyü görür ve garson çağırır; restoran sahibi kendi panelinden
menüsünü yönetir.

Dijital sipariş, sepet veya ödeme **yoktur** — sipariş sözlü olarak garsona
verilir.

## Adres yapısı

| Adres | İçerik |
| --- | --- |
| `/` | Tanıtım ve paket/fiyat sayfası |
| `/admin` | Restoran sahibi paneli (ürün, görsel, bilgi, QR, servis) |
| `/superadmin` | Platform sahibi paneli (restoran açma, şifre sıfırlama) |
| `/[slug]/masa/[masaNo]` | Bir restoranın müşteri menüsü |

## Teknolojiler

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- Supabase (PostgreSQL, Auth, Storage, Realtime)
- `qrcode` — masaya özel QR üretimi

## Kurulum

```bash
npm install
```

Proje kökünde `.env.local` dosyası oluşturun:

```
NEXT_PUBLIC_SUPABASE_URL=https://<proje>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```

`SUPABASE_SERVICE_ROLE_KEY` RLS'i tamamen atlar; yalnızca sunucuda
(`app/api/superadmin/*`) kullanılır ve asla istemciye gönderilmez.

Veritabanını hazırlamak için `supabase/migrations/` altındaki SQL dosyalarını
numara sırasına göre Supabase SQL editöründe çalıştırın.

```bash
npm run dev     # geliştirme sunucusu
npm run build   # üretim derlemesi
npm run lint    # ESLint
```

## Güvenlik

Tüm tablolarda Row Level Security açıktır:

- Menü verileri (restoran, kategori, ürün, masa, görsel) herkese açık okunur.
- Yazma yetkisi yalnızca o restorana bağlı kullanıcıdadır —
  `is_restaurant_admin(restaurant_id)` fonksiyonu üzerinden kontrol edilir.
- Servis talebini müşteri oturumsuz oluşturabilir; okuma ve kapatma yalnızca
  restoran sahibine açıktır.
- Storage'da dosya yolunun ilk klasörü `restaurant_id` olmalıdır; yükleme ve
  silme izni buna bakar.
- Süper admin uçları `platform_admins` tablosundaki kayda göre doğrulanır.

Ayrıntılı proje notları için `CLAUDE.md`, veritabanı geçmişi için
`supabase/migrations/README.md` dosyalarına bakın.
