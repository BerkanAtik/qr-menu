import { supabase } from '@/lib/supabase'
import MenuClient from '@/components/MenuClient'

export default async function MasaMenu({
  params,
}: {
  params: Promise<{ masaNo: string }>
}) {
  const { masaNo } = await params

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', 'test-restoran')
    .single()

  if (!restaurant) {
    return <div style={{ padding: 40 }}>Restoran bulunamadı.</div>
  }

  // Masa önceden (QR üretimi sırasında) oluşturulmuş olmalı.
  // Yoksa geçersiz bir masa numarası demektir, otomatik oluşturmuyoruz.
  const { data: table } = await supabase
    .from('tables')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('table_no', parseInt(masaNo))
    .single()

  if (!table) {
    return (
      <div className="min-h-screen bg-[#FAF7F1] flex items-center justify-center px-6">
        <div className="max-w-sm w-full bg-white rounded-sm border border-[#E5DCCF] shadow-sm p-8 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-xl text-[#2B2420] mb-2">
            Masa bulunamadı
          </h1>
          <p className="text-[#7A7267] text-sm">
            Bu QR kod geçerli değil. Lütfen personelden yardım isteyin.
          </p>
        </div>
      </div>
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
      tableNo={parseInt(masaNo)}
      heroImages={heroImages || []}
    />
  )
}
