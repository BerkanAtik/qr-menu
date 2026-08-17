'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRestaurant } from '@/lib/restaurantContext'
import AdminQR, { type Masa } from '@/components/AdminQR'

export default function QRPage() {
  const restaurant = useRestaurant()
  const [tables, setTables] = useState<Masa[] | null>(null)
  const [hata, setHata] = useState<string | null>(null)

  // Sadece var olan masaları okur, eksikleri OTOMATİK tamamlamaz — bunu
  // önceden yapıyorduk ama bu, "Tümünü sil" ile silinen masaların sayfa her
  // yenilendiğinde sessizce geri gelmesine sebep oluyordu. Masa oluşturma
  // artık tamamen AdminQR içindeki "Tek masa ekle" / "Tümünü yenile"
  // butonlarıyla, kullanıcının elinde.
  useEffect(() => {
    let iptal = false

    async function masalariGetir() {
      const { data, error } = await supabase
        .from('tables')
        .select('id, table_no')
        .eq('restaurant_id', restaurant.id)
        .order('table_no', { ascending: true })

      if (error) {
        if (!iptal) setHata('Masalar okunamadı: ' + error.message)
        return
      }

      if (!iptal) setTables(data || [])
    }

    masalariGetir()
    return () => {
      iptal = true
    }
  }, [restaurant.id])

  if (hata) {
    return <p className="text-red-400 text-base">{hata}</p>
  }

  if (!tables) {
    return <p className="text-[#8A7C68] text-sm">Masalar yükleniyor…</p>
  }

  return (
    <AdminQR
      restaurantId={restaurant.id}
      slug={restaurant.slug}
      tableCount={restaurant.table_count}
      initialTables={tables}
    />
  )
}
