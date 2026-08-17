'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRestaurant } from '@/lib/restaurantContext'
import AdminProducts, { type Category, type Product } from '@/components/AdminProducts'

export default function AdminHome() {
  const restaurant = useRestaurant()
  const [veri, setVeri] = useState<{ categories: Category[]; products: Product[] } | null>(null)

  useEffect(() => {
    let iptal = false

    async function yukle() {
      const [{ data: categories }, { data: products }] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .order('sort_order', { ascending: true }),
        supabase.from('products').select('*').eq('restaurant_id', restaurant.id),
      ])

      if (iptal) return
      setVeri({ categories: categories || [], products: products || [] })
    }

    yukle()
    return () => {
      iptal = true
    }
  }, [restaurant.id])

  if (!veri) {
    return <p className="text-[#8A7C68] text-sm">Yükleniyor…</p>
  }

  return (
    <AdminProducts
      restaurantId={restaurant.id}
      initialCategories={veri.categories}
      initialProducts={veri.products}
    />
  )
}
