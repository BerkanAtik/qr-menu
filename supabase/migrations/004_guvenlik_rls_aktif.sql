-- Güvenlik: Row Level Security (RLS) tüm tablolarda aktifleştirildi.
-- ("Projem satışa hazır mı" sorusu sonrası — o ana kadar RLS kapalıydı,
-- anon key'i bilen herkes her tabloyu okuyup yazabiliyordu.)

alter table restaurants enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table tables enable row level security;
alter table hero_images enable row level security;
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

-- Müşteri giriş yapmadan servis talebi oluşturabilir
-- NOT: İlk çalıştırmada bu politika bir isim çakışması yüzünden etkisiz
-- kalmıştı ("Garson Çağır" özelliği çalışmıyordu); drop+create ile düzeltildi.
drop policy if exists "public insert service_requests" on service_requests;
create policy "public insert service_requests" on service_requests for insert with check (true);

-- Servis taleplerini sadece admin okuyup güncelleyebilir
create policy "admin read service_requests" on service_requests for select using (auth.role() = 'authenticated');
create policy "admin update service_requests" on service_requests for update using (auth.role() = 'authenticated');
