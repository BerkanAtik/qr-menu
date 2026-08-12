-- "Popüler Lezzetler" bölümü artık ilk N ürünü otomatik göstermiyor; admin
-- panelden elle "popüler" işaretlenen ürünler gösteriliyor.
alter table products add column if not exists is_popular boolean not null default false;
