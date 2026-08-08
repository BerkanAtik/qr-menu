'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Restaurant = {
  id: string
  wifi_password: string | null
  working_hours: string | null
  address: string | null
  google_reviews_url: string | null
  instagram_handle: string | null
  about_text: string | null
}

const FIELDS: { key: keyof Omit<Restaurant, 'id'>; label: string; multiline?: boolean }[] = [
  { key: 'wifi_password', label: 'Wi-Fi şifresi' },
  { key: 'working_hours', label: 'Çalışma saatleri' },
  { key: 'address', label: 'Adres / konum' },
  { key: 'google_reviews_url', label: 'Google Yorumlar linki' },
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
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim() || null])
    )

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
      <h1 className="font-[family-name:var(--font-display)] italic text-3xl text-[#F5EFE4] mb-3">
        Restoran Bilgileri
      </h1>
      <p className="text-base text-[#8A7C68] mb-8">
        Bu bilgiler restoranınıza ait genel bilgilerdir. Boş bırakılan alanlar müşteri tarafında
        gösterilmez.
      </p>

      <form
        onSubmit={handleSave}
        className="bg-[#1E1811] border border-[#2A2119] rounded-2xl p-7 max-w-4xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mb-3">
          {FIELDS.map((field) => (
            <div key={field.key} className={field.multiline ? 'md:col-span-2' : ''}>
              <label className="block font-[family-name:var(--font-mono)] text-sm uppercase tracking-wider text-[#8A7C68] mb-2">
                {field.label}
              </label>
              {field.multiline ? (
                <textarea
                  rows={3}
                  value={form[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className="w-full bg-[#231B14] border border-[#3A2F24] rounded-lg px-4 py-3 text-base text-[#F5EFE4] placeholder:text-[#8A7C68] outline-none focus:border-[#C9A876] transition-colors"
                />
              ) : (
                <input
                  type="text"
                  value={form[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className="w-full bg-[#231B14] border border-[#3A2F24] rounded-lg px-4 py-3 text-base text-[#F5EFE4] placeholder:text-[#8A7C68] outline-none focus:border-[#C9A876] transition-colors"
                />
              )}
            </div>
          ))}
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
