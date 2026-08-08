import { supabase } from '@/lib/supabase'
import AdminOrders, { type Order } from '@/components/AdminOrders'

export default async function SiparislerPage() {
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', 'test-restoran')
    .single()

  if (!restaurant) {
    return <div className="text-[#F5EFE4] p-8">Restoran bulunamadı.</div>
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('*, tables(table_no), order_items(id, quantity, unit_price, products(name))')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false })

  return (
    <AdminOrders
      restaurantId={restaurant.id}
      initialOrders={(orders as unknown as Order[]) || []}
    />
  )
}
