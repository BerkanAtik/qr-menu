import { supabase } from '@/lib/supabase'
import AdminHero from '@/components/AdminHero'

export default async function HeroPage() {
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', 'test-restoran')
    .single()

  if (!restaurant) {
    return <div className="text-[#F5EFE4] p-8">Restoran bulunamadı.</div>
  }

  const { data: heroImages } = await supabase
    .from('hero_images')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('sort_order', { ascending: true })

  return <AdminHero restaurantId={restaurant.id} initialImages={heroImages || []} />
}
