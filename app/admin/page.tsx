import { supabase } from '@/lib/supabase'
import AdminProducts from '@/components/AdminProducts'

export default async function AdminHome() {
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', 'test-restoran')
    .single()

  if (!restaurant) {
    return <div className="text-[#F5EFE4] p-8">Restoran bulunamadı.</div>
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

  return (
    <AdminProducts
      restaurantId={restaurant.id}
      initialCategories={categories || []}
      initialProducts={products || []}
    />
  )
}
