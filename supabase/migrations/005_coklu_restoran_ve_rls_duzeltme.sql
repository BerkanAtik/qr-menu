-- Çoklu restoran (SaaS) yapısına geçiş.
--
-- 004'teki RLS politikaları "giriş yapmış herkes yazabilir" şeklindeydi. Tek
-- restoranla test ederken sorun değildi, ama sisteme ikinci bir restoran
-- eklendiğinde A restoranının sahibi B restoranının ürünlerini
-- değiştirebiliyordu. Bu migration, yetkiyi kullanıcının sahibi olduğu
-- restoranla sınırlandırır.

-- ---------------------------------------------------------------------------
-- 1) Kullanıcı <-> restoran bağlantısı
-- ---------------------------------------------------------------------------

create table if not exists restaurant_users (
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, restaurant_id)
);

alter table restaurant_users enable row level security;

drop policy if exists "user reads own memberships" on restaurant_users;
create policy "user reads own memberships" on restaurant_users
  for select using (user_id = auth.uid());

-- Giriş yapmış kullanıcı bu restoranın sahibi mi?
-- security definer: fonksiyon restaurant_users'ı RLS'e takılmadan okuyabilsin.
create or replace function public.is_restaurant_admin(rid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from restaurant_users
    where user_id = auth.uid() and restaurant_id = rid
  );
$$;

-- Mevcut test kurulumu: tek restoran ve tek kullanıcı varsa otomatik bağla.
-- (Birden fazla varsa hiçbir şey yapmaz, elle bağlanması gerekir.)
insert into restaurant_users (user_id, restaurant_id)
select u.id, r.id
from auth.users u cross join restaurants r
where (select count(*) from auth.users) = 1
  and (select count(*) from restaurants) = 1
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 2) Restorana özel ayarlar (kodda sabit yazılıydı, veritabanına taşındı)
-- ---------------------------------------------------------------------------

-- Masa sayısı: QR kod üretiminde kullanılıyor, önceden kodda 12 sabitti.
alter table restaurants add column if not exists table_count int not null default 12;

-- Google puanı: menüde gösterilen rozet, önceden kodda sabitti.
-- (google_reviews_url kolonu 002'de eklenmişti, artık menüde de kullanılıyor.)
alter table restaurants add column if not exists google_rating numeric(2,1);

-- Menü adresi slug üzerinden çözüldüğü için slug benzersiz olmalı.
create unique index if not exists restaurants_slug_key on restaurants (slug);

-- ---------------------------------------------------------------------------
-- 3) RLS politikalarının restorana göre yeniden yazılması
-- ---------------------------------------------------------------------------

-- Eski "authenticated ise her şeyi yapabilir" politikaları kaldırılıyor.
drop policy if exists "admin write restaurants" on restaurants;
drop policy if exists "admin write categories" on categories;
drop policy if exists "admin write products" on products;
drop policy if exists "admin write tables" on tables;
drop policy if exists "admin write hero_images" on hero_images;
drop policy if exists "admin read service_requests" on service_requests;
drop policy if exists "admin update service_requests" on service_requests;

-- Yazma yetkisi artık yalnızca kendi restoranı için geçerli.
create policy "own restaurant update" on restaurants
  for update using (is_restaurant_admin(id)) with check (is_restaurant_admin(id));

create policy "own categories write" on categories
  for all using (is_restaurant_admin(restaurant_id))
  with check (is_restaurant_admin(restaurant_id));

create policy "own products write" on products
  for all using (is_restaurant_admin(restaurant_id))
  with check (is_restaurant_admin(restaurant_id));

create policy "own tables write" on tables
  for all using (is_restaurant_admin(restaurant_id))
  with check (is_restaurant_admin(restaurant_id));

create policy "own hero_images write" on hero_images
  for all using (is_restaurant_admin(restaurant_id))
  with check (is_restaurant_admin(restaurant_id));

-- Servis talepleri: müşteri giriş yapmadan oluşturur (004'teki insert
-- politikası duruyor), ama yalnızca ilgili restoranın sahibi görüp kapatabilir.
create policy "own service_requests read" on service_requests
  for select using (is_restaurant_admin(restaurant_id));

create policy "own service_requests update" on service_requests
  for update using (is_restaurant_admin(restaurant_id));

-- ---------------------------------------------------------------------------
-- 4) Görsel yükleme izninin restorana göre sınırlandırılması
-- ---------------------------------------------------------------------------

-- 001'deki politika "giriş yapmış herkes yükleyebilir" idi. Dosya yolunun ilk
-- klasörü restaurant_id olduğu için (ör. "<restaurant_id>/hero/foto.jpg"),
-- kullanıcının o restoranın sahibi olup olmadığını buradan kontrol ediyoruz.
drop policy if exists "Authenticated upload menu-images" on storage.objects;

create policy "own restaurant upload menu-images" on storage.objects
for insert with check (
  bucket_id = 'menu-images'
  and is_restaurant_admin(((storage.foldername(name))[1])::uuid)
);

create policy "own restaurant delete menu-images" on storage.objects
for delete using (
  bucket_id = 'menu-images'
  and is_restaurant_admin(((storage.foldername(name))[1])::uuid)
);
