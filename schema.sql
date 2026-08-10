-- ============================================================================
-- QR Menü — Veritabanı Geçmişi
-- ============================================================================
-- Bu dosya, geliştirme sürecinde Supabase SQL editöründe SIRAYLA çalıştırılan
-- tüm komutları belgeler. Amaç: veritabanına ne zaman ne eklendiğini takip
-- edebilmek. Yeni bir Supabase projesinde sıfırdan kurulum yapılacaksa bu
-- dosya baştan sona çalıştırılabilir (idempotent yazıldı: tekrar çalıştırmak
-- hata vermez).
--
-- NOT: Bu dosyada YER ALMAYAN ilk tablolar (restaurants, categories, products,
-- tables, orders, order_items, payments) proje başlangıcında Supabase
-- arayüzünden manuel oluşturulmuştu, o adımlar burada kayıtlı değil.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1) Ürün görselleri, günün özel lezzeti, hero carousel, servis talepleri
--    (Hero carousel ve "Garson Çağır" özellikleri eklenirken çalıştırıldı)
-- ----------------------------------------------------------------------------

alter table products add column if not exists image_url text;

-- Günün özel lezzeti (promo banner) için işaretleme alanı.
-- NOT: Bu özellik sonradan tamamen kaldırıldı (bkz. bölüm 5), kolon DB'de
-- duruyor ama kod hiçbir yerde kullanmıyor.
alter table products add column if not exists is_daily_special boolean not null default false;

-- Hero carousel görselleri (admin panelden yönetiliyor)
create table if not exists hero_images (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Servis (garson) çağrı talepleri
create table if not exists service_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_id uuid not null references tables(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- Ürün/hero görsellerinin yükleneceği storage bucket
insert into storage.buckets (id, name, public) values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

create policy "Public read menu-images" on storage.objects
for select using (bucket_id = 'menu-images');

create policy "Authenticated upload menu-images" on storage.objects
for insert with check (bucket_id = 'menu-images' and auth.role() = 'authenticated');


-- ----------------------------------------------------------------------------
-- 2) RLS'i geçici kapatma (yükleme hatalarını çözmek için) + restoran bilgi
--    alanları + servis talebi türü
-- ----------------------------------------------------------------------------

-- hero_images ve service_requests, Supabase panelinden oluşturulunca RLS
-- otomatik açık geliyordu ve anon key ile yazma başarısız oluyordu; o dönem
-- geçici olarak kapatıldı. (Bölüm 6'da tüm tablolar için düzgün RLS kuruldu,
-- bu iki satır artık geçersiz/üzerine yazıldı.)
alter table hero_images disable row level security;
alter table service_requests disable row level security;

-- Restoran bilgileri (o dönem hamburger menüde gösteriliyordu; menü artık
-- kaldırıldı ama alanlar admin panelde "Bilgiler" sayfasından düzenlenebilir
-- durumda duruyor)
alter table restaurants add column if not exists wifi_password text;
alter table restaurants add column if not exists working_hours text;
alter table restaurants add column if not exists address text;
alter table restaurants add column if not exists google_reviews_url text;
alter table restaurants add column if not exists instagram_handle text;
alter table restaurants add column if not exists about_text text;

-- Alerjen bilgisi alanı da eklenmişti; sonradan admin formundan kaldırıldı
-- (bkz. bölüm 5), kolon DB'de duruyor ama kullanılmıyor.
alter table restaurants add column if not exists allergen_info text;

-- Servis talebi türü: 'garson' | 'hesap' | 'su'
alter table service_requests add column if not exists type text not null default 'garson';


-- ----------------------------------------------------------------------------
-- 3) "Popüler Lezzetler" — admin panelden elle seçilen ürünler
-- ----------------------------------------------------------------------------

alter table products add column if not exists is_popular boolean not null default false;


-- ----------------------------------------------------------------------------
-- 4) (Kod tarafında yapıldı, SQL yok)
--    "Günün özel lezzeti" özelliği tamamen kaldırıldı (admin formu, müşteri
--    tarafındaki banner). is_daily_special kolonu DB'de duruyor, kullanılmıyor.
--    Aynı şekilde allergen_info kolonu da admin formundan kaldırıldı.
-- ----------------------------------------------------------------------------


-- ----------------------------------------------------------------------------
-- 5) Güvenlik: Row Level Security (RLS) tüm tablolarda aktifleştirildi
--    ("projem satışa hazır mı" sorusu sonrası)
-- ----------------------------------------------------------------------------

alter table restaurants enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table tables enable row level security;
alter table hero_images enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table service_requests enable row level security;

-- Müşteri menüsü için herkese açık okuma
create policy "public read restaurants" on restaurants for select using (true);
create policy "public read categories" on categories for select using (true);
create policy "public read products" on products for select using (true);
create policy "public read tables" on tables for select using (true);
create policy "public read hero_images" on hero_images for select using (true);

-- Bu verileri sadece giriş yapmış admin değiştirebilir
create policy "admin write restaurants" on restaurants for update using (auth.role() = 'authenticated');
create policy "admin write categories" on categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write products" on products for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write tables" on tables for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write hero_images" on hero_images for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Müşteri giriş yapmadan sipariş / servis talebi oluşturabilir
create policy "public insert orders" on orders for insert with check (true);
create policy "public insert order_items" on order_items for insert with check (true);
create policy "public insert service_requests" on service_requests for insert with check (true);

-- Sipariş / servis / ödeme verilerini sadece admin okuyup güncelleyebilir
create policy "admin read orders" on orders for select using (auth.role() = 'authenticated');
create policy "admin update orders" on orders for update using (auth.role() = 'authenticated');
create policy "admin read order_items" on order_items for select using (auth.role() = 'authenticated');
create policy "admin read service_requests" on service_requests for select using (auth.role() = 'authenticated');
create policy "admin update service_requests" on service_requests for update using (auth.role() = 'authenticated');
create policy "admin read payments" on payments for select using (auth.role() = 'authenticated');


-- ============================================================================
-- Kullanımda olmayan (ama silinmemiş) kolonlar
-- ============================================================================
-- products.is_daily_special   — "günün özel lezzeti" özelliği kaldırıldığı için artık okunmuyor
-- restaurants.allergen_info   — admin formundan kaldırıldığı için artık okunmuyor
--
-- İsterseniz şu komutlarla tamamen silinebilir (dikkat: geri alınamaz):
--   alter table products drop column is_daily_special;
--   alter table restaurants drop column allergen_info;
