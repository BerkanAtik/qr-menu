'use client'

import { useRestaurant } from '@/lib/restaurantContext'
import AdminRestaurantInfo from '@/components/AdminRestaurantInfo'

export default function BilgilerPage() {
  const restaurant = useRestaurant()

  return <AdminRestaurantInfo restaurant={restaurant} />
}
