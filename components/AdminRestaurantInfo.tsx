'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { inputClass, labelClass } from '@/lib/adminUi'
import type { Restaurant } from '@/lib/restaurantContext'

type MetinAlani = {
  key:
    | 'wifi_password'
    | 'working_hours'
    | 'address'
    | 'google_reviews_url'
    | 'instagram_handle'
    | 'about_text'
  label: string
  multiline?: boolean
  hint?: string
}

const METIN_ALANLARI: MetinAlani[] = [
  { key: 'wifi_password', label: 'Wi-Fi şifresi' },
  { key: 'working_hours', label: 'Çalışma saatleri' },
  { key: 'address', label: 'Adres / konum' },
  {
    key: 'google_reviews_url',
    label: 'Google Yorumlar linki',
    hint: 'Boş bırakılırsa menüde Google rozeti gösterilmez.',
  },
  { key: 'instagram_handle', label: 'Instagram kullanıcı adı (@ olmadan)' },
  { key: 'about_text', label: 'Hakkımızda', multiline: true },
]

export default function AdminRestaurantInfo({ restaurant }: { restaurant: Restaurant }) {
  const [form, setForm] = useState({
    wifi_password: restaurant.wifi_password || '',
    working_hours: restaurant.working_hours || '',
    address: restaurant.address || '',
    google_reviews_url: restaurant.google_reviews_url || '',
    instagram_handle: restaurant.instagram_handle || '',
    about_text: restaurant.about_text || '',
  })
  const [tableCount, setTableCount] = useState(String(restaurant.table_count))
  const [googleRating, setGoogleRating] = useState(
    restaurant.google_rating !== null ? String(restaurant.google_rating) : ''
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    const payload: Record<string, string | number | null> = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim() || null])
    )

    // Masa sayısı QR kod üretiminde kullanılıyor, en az 1 olmalı.
    const masa = parseInt(tableCount)
    payload.table_count = Number.isNaN(masa) || masa < 1 ? 1 : masa

    const puan = parseFloat(googleRating.replace(',', '.'))
    payload.google_rating = googleRating.trim() === '' || Number.isNaN(puan) ? null : puan

    const { error } = await supabase.from('restaurants').update(payload).eq('id', restaurant.id)

    setSaving(false)

    if (error) {
      alert('Kaydedilemedi: ' + error.message)
      return
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] italic text-2xl sm:text-3xl text-[#F5EFE4] mb-3">
        Restoran Bilgileri
      </h1>
      <p className="text-base text-[#8A7C68] mb-8">
        Bu bilgiler restoranınıza ait genel bilgilerdir. Boş bırakılan alanlar müşteri tarafında
        gösterilmez.
      </p>

      <form
        onSubmit={handleSave}
        className="bg-[#1E1811] border border-[#2A2119] rounded-2xl p-4 sm:p-7 max-w-4xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mb-3">
          {METIN_ALANLARI.map((field) => (
            <div key={field.key} className={field.multiline ? 'md:col-span-2' : ''}>
              <label className={labelClass}>{field.label}</label>
              {field.multiline ? (
                <textarea
                  rows={3}
                  value={form[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className={inputClass}
                />
              ) : (
                <input
                  type="text"
                  value={form[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className={inputClass}
                />
              )}
              {field.hint && <p className="text-sm text-[#8A7C68] mt-1.5">{field.hint}</p>}
            </div>
          ))}

          <div>
            <label className={labelClass}>Google puanı</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={googleRating}
              onChange={(e) => setGoogleRating(e.target.value)}
              className={inputClass}
            />
            <p className="text-sm text-[#8A7C68] mt-1.5">
              Menüdeki Google rozetinde gösterilir. Boş bırakılabilir.
            </p>
          </div>

          <div>
            <label className={labelClass}>Masa sayısı</label>
            <input
              type="number"
              min="1"
              required
              value={tableCount}
              onChange={(e) => setTableCount(e.target.value)}
              className={inputClass}
            />
            <p className="text-sm text-[#8A7C68] mt-1.5">
              QR Kodlar sayfasında bu sayı kadar masa için kod üretilir.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-5">
          <button
            type="submit"
            disabled={saving}
            className="font-[family-name:var(--font-mono)] text-base px-5 py-3 bg-[#C9A876] text-[#1B2318] font-medium rounded-full hover:bg-[#d9bb8e] transition-colors disabled:opacity-60"
          >
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
          {saved && <span className="text-base text-emerald-400">Kaydedildi ✓</span>}
        </div>
      </form>
    </div>
  )
}
