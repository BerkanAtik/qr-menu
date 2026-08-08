import { supabase } from '@/lib/supabase'
import AdminRestaurantInfo from '@/components/AdminRestaurantInfo'

export default async function BilgilerPage() {
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', 'test-restoran')
    .single()

  if (!restaurant) {
    return <div className="text-[#F5EFE4] p-8">Restoran bulunamadı.</div>
  }

  return <AdminRestaurantInfo restaurant={restaurant} />
}
