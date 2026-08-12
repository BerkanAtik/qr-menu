-- Hero carousel görselleri, "günün özel lezzeti" işareti, servis (garson) çağrı
-- talepleri ve bu görsellerin yükleneceği storage bucket.

alter table products add column if not exists image_url text;

-- Günün özel lezzeti (promo banner) için işaretleme alanı.
-- NOT: Bu özellik sonradan tamamen kaldırıldı (bkz. 004), kolon DB'de duruyor
-- ama kod hiçbir yerde kullanmıyor.
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
