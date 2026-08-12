-- hero_images ve service_requests, Supabase panelinden oluşturulunca RLS otomatik
-- açık geliyordu ve anon key ile yazma başarısız oluyordu; o dönem geçici olarak
-- kapatıldı. (004'te tüm tablolar için düzgün RLS kuruldu, bu iki satır artık
-- geçersiz/üzerine yazılmış durumda — geçmiş kayıt olarak burada duruyor.)
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
-- (bkz. 004), kolon DB'de duruyor ama kullanılmıyor.
alter table restaurants add column if not exists allergen_info text;

-- Servis talebi türü: 'garson' | 'hesap' | 'su'
alter table service_requests add column if not exists type text not null default 'garson';
