import { supabase } from '@/lib/supabase'
import AdminServis, { type ServiceRequest } from '@/components/AdminServis'

export default async function ServisPage() {
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', 'test-restoran')
    .single()

  if (!restaurant) {
    return <div className="text-[#F5EFE4] p-8">Restoran bulunamadı.</div>
  }

  const { data: requests } = await supabase
    .from('service_requests')
    .select('*, tables(table_no)')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false })

  return (
    <AdminServis
      restaurantId={restaurant.id}
      initialRequests={(requests as unknown as ServiceRequest[]) || []}
    />
  )
}
