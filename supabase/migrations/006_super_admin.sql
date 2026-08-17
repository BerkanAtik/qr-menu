-- Süper admin (platform sahibi) yetkisi.
--
-- restaurant_users her kullanıcıyı TEK bir restorana bağlıyordu. Platform
-- sahibinin (Berkan) tüm restoranları yönetebilmesi, herkesin şifresini
-- değiştirebilmesi ve yeni restoran/kullanıcı açabilmesi için ayrı ve daha
-- güçlü bir yetki katmanı gerekiyor. Bu tablo o katmanı tanımlıyor.
--
-- Süper admin işlemleri (şifre değiştirme, kullanıcı oluşturma) service role
-- key gerektirdiği için tarayıcıdan doğrudan yapılamıyor; app/api/superadmin/
-- altındaki sunucu route'ları üzerinden yürütülüyor. Bu tablo sadece
-- "bu route'u çağırma hakkın var mı" kontrolü için kullanılıyor.

create table if not exists platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table platform_admins enable row level security;

drop policy if exists "self read platform_admins" on platform_admins;
create policy "self read platform_admins" on platform_admins
  for select using (user_id = auth.uid());

create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from platform_admins where user_id = auth.uid()
  );
$$;

-- Mevcut hesabı platform admin yap. E-postayı kendi hesabınla değiştirmen
-- gerekirse burayı güncelleyip tekrar çalıştırman yeterli (idempotent).
insert into platform_admins (user_id)
select id from auth.users where email = 'berkanatik2004@gmail.com'
on conflict (user_id) do nothing;
