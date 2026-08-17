'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRestaurant } from '@/lib/restaurantContext'
import AdminHero, { type HeroImage } from '@/components/AdminHero'

export default function HeroPage() {
  const restaurant = useRestaurant()
  const [images, setImages] = useState<HeroImage[] | null>(null)

  useEffect(() => {
    let iptal = false

    supabase
      .from('hero_images')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (iptal) return
        setImages((data as HeroImage[]) || [])
      })

    return () => {
      iptal = true
    }
  }, [restaurant.id])

  if (!images) {
    return <p className="text-[#8A7C68] text-sm">Yükleniyor…</p>
  }

  return <AdminHero restaurantId={restaurant.id} initialImages={images} />
}
