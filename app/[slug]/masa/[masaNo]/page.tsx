import { supabase } from '@/lib/supabase'
import MenuClient from '@/components/MenuClient'

function Uyari({ baslik, mesaj }: { baslik: string; mesaj: string }) {
  return (
    <div className="min-h-screen bg-[#14100C] flex items-center justify-center px-6">
      <div className="max-w-sm w-full bg-[#1E1811] rounded-2xl border border-[#2A2119] shadow-sm p-8 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-xl text-[#F5EFE4] mb-2">
          {baslik}
        </h1>
        <p className="text-[#8A7C68] text-sm">{mesaj}</p>
      </div>
    </div>
  )
}

export default async function MasaMenu({
  params,
}: {
  params: Promise<{ slug: string; masaNo: string }>
}) {
  const { slug, masaNo } = await params

  // Hangi restoranın menüsü olduğu artık kodda sabit değil, QR kodun
  // adresindeki slug'dan geliyor.
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!restaurant) {
    return (
      <Uyari
        baslik="Restoran bulunamadı"
        mesaj="Bu QR kod geçerli değil. Lütfen personelden yardım isteyin."
      />
    )
  }

  // Masa önceden (QR üretimi sırasında) oluşturulmuş olmalı.
  // Yoksa geçersiz bir masa numarası demektir, otomatik oluşturmuyoruz.
  const masaSayisi = parseInt(masaNo)
  const { data: table } = Number.isNaN(masaSayisi)
    ? { data: null }
    : await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('table_no', masaSayisi)
        .single()

  if (!table) {
    return (
      <Uyari
        baslik="Masa bulunamadı"
        mesaj="Bu QR kod geçerli değil. Lütfen personelden yardım isteyin."
      />
    )
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('sort_order', { ascending: true })

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('is_available', true)

  const { data: heroImages } = await supabase
    .from('hero_images')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('sort_order', { ascending: true })

  return (
    <MenuClient
      restaurantId={restaurant.id}
      restaurantName={restaurant.name}
      categories={categories || []}
      products={products || []}
      tableId={table.id}
      tableNo={masaSayisi}
      heroImages={heroImages || []}
      googleRating={restaurant.google_rating}
      googleReviewsUrl={restaurant.google_reviews_url}
    />
  )
}
