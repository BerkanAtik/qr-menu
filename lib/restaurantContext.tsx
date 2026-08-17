'use client'

import { createContext, useContext } from 'react'

export type Restaurant = {
  id: string
  slug: string
  name: string
  wifi_password: string | null
  working_hours: string | null
  address: string | null
  google_reviews_url: string | null
  google_rating: number | null
  instagram_handle: string | null
  about_text: string | null
  table_count: number
}

// Admin panelinde hangi restoranla çalışıldığı artık kodda sabit değil;
// giriş yapan kullanıcının restoranı layout'ta bir kez çözülüp buradan
// bütün panel sayfalarına dağıtılıyor.
const RestaurantContext = createContext<Restaurant | null>(null)

export const RestaurantProvider = RestaurantContext.Provider

export function useRestaurant() {
  const restaurant = useContext(RestaurantContext)
  if (!restaurant) {
    throw new Error('useRestaurant yalnızca admin layout içinde kullanılabilir')
  }
  return restaurant
}
