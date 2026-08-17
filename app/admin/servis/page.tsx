'use client'

import { useRestaurant } from '@/lib/restaurantContext'
import AdminServis from '@/components/AdminServis'

export default function ServisPage() {
  const restaurant = useRestaurant()

  return <AdminServis restaurantId={restaurant.id} />
}
