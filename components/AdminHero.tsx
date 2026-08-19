'use client'

import { useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

export type HeroImage = {
  id: string
  image_url: string
  sort_order: number
}

export default function AdminHero({
  restaurantId,
  initialImages,
}: {
  restaurantId: string
  initialImages: HeroImage[]
}) {
  const [images, setImages] = useState<HeroImage[]>(initialImages)
  const [uploading, setUploading] = useState(false)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const ext = file.name.includes('.')
      ? file.name.split('.').pop()!.toLowerCase().replace(/[^a-z0-9]/g, '')
      : 'jpg'
    // Yolun İLK klasörü restaurant_id olmak zorunda: storage politikası
    // (005) bu klasörü uuid'ye çevirip is_restaurant_admin ile kontrol ediyor.
    // "hero/<restaurant_id>/..." sırası yüklemeyi tamamen engelliyordu.
    const path = `${restaurantId}/hero/${Date.now()}-${crypto.randomUUID()}.${ext || 'jpg'}`
    const { error: uploadError } = await supabase.storage.from('menu-images').upload(path, file)

    if (uploadError) {
      alert('Görsel yüklenemedi: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: publicUrlData } = supabase.storage.from('menu-images').getPublicUrl(path)
    const nextOrder = images.length > 0 ? Math.max(...images.map((i) => i.sort_order)) + 1 : 0

    const { data, error } = await supabase
      .from('hero_images')
      .insert({
        restaurant_id: restaurantId,
        image_url: publicUrlData.publicUrl,
        sort_order: nextOrder,
      })
      .select()
      .single()

    setUploading(false)

    if (error) {
      alert('Görsel kaydedilemedi: ' + error.message)
      return
    }

    setImages((prev) => [...prev, data])
    e.target.value = ''
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu görseli silmek istediğine emin misin?')) return

    const { error } = await supabase.from('hero_images').delete().eq('id', id)
    if (error) {
      alert('Silinemedi: ' + error.message)
      return
    }
    setImages((prev) => prev.filter((i) => i.id !== id))
  }

  async function moveImage(id: string, direction: 'up' | 'down') {
    const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order)
    const index = sorted.findIndex((i) => i.id === id)
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= sorted.length) return

    const a = sorted[index]
    const b = sorted[swapIndex]

    await Promise.all([
      supabase.from('hero_images').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('hero_images').update({ sort_order: a.sort_order }).eq('id', b.id),
    ])

    setImages((prev) =>
      prev.map((img) => {
        if (img.id === a.id) return { ...img, sort_order: b.sort_order }
        if (img.id === b.id) return { ...img, sort_order: a.sort_order }
        return img
      })
    )
  }

  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-[family-name:var(--font-display)] italic text-2xl sm:text-3xl text-[#F5EFE4]">
          Görseller
        </h1>
      </div>

      <p className="text-base text-[#8A7C68] mb-5">
        Menü sayfasının üstündeki karusel için fotoğraf ekleyin. Sırayı oklarla değiştirebilirsiniz.
      </p>

      <div className="mb-8">
        <label className="inline-block font-[family-name:var(--font-mono)] text-base px-5 py-3 bg-[#C9A876] text-[#1B2318] font-medium rounded-full hover:bg-[#d9bb8e] transition-colors cursor-pointer">
          {uploading ? 'Yükleniyor…' : '+ Görsel ekle'}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {sortedImages.length === 0 && (
        <p className="text-[#8A7C68] text-base">Henüz görsel eklenmedi.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {sortedImages.map((image, idx) => (
          <div
            key={image.id}
            className="bg-[#1E1811] border border-[#2A2119] rounded-2xl overflow-hidden"
          >
            <div className="relative w-full h-44">
              <Image
                src={image.image_url}
                alt="Hero görseli"
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 260px"
                className="object-cover"
              />
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex gap-1.5">
                <button
                  onClick={() => moveImage(image.id, 'up')}
                  disabled={idx === 0}
                  className="text-sm px-2.5 py-1.5 border border-[#3A2F24] rounded-full text-[#8A7C68] hover:border-[#C9A876] hover:text-[#C9A876] transition-colors disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveImage(image.id, 'down')}
                  disabled={idx === sortedImages.length - 1}
                  className="text-sm px-2.5 py-1.5 border border-[#3A2F24] rounded-full text-[#8A7C68] hover:border-[#C9A876] hover:text-[#C9A876] transition-colors disabled:opacity-30"
                >
                  ↓
                </button>
              </div>
              <button
                onClick={() => handleDelete(image.id)}
                className="text-sm px-2.5 py-1.5 border border-[#3A2F24] rounded-full text-red-400 hover:border-red-400 transition-colors"
              >
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
