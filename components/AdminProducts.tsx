'use client'

import { useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  category_id: string
  is_available: boolean
  image_url: string | null
  is_popular: boolean
}

type Category = {
  id: string
  name: string
  sort_order: number
}

const inputClass =
  'w-full bg-[#231B14] border border-[#3A2F24] rounded-lg px-4 py-3 text-base text-[#F5EFE4] placeholder:text-[#8A7C68] outline-none focus:border-[#C9A876] transition-colors'
const labelClass =
  'block font-[family-name:var(--font-mono)] text-sm uppercase tracking-wider text-[#8A7C68] mb-2'

function IconButton({
  onClick,
  active,
  danger,
  label,
  children,
}: {
  onClick: () => void
  active?: boolean
  danger?: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors shrink-0 ${
        danger
          ? 'border-[#3A2F24] text-[#B87A7E] hover:border-red-400 hover:text-red-400'
          : active
            ? 'bg-[#C9A876] border-[#C9A876] text-[#1B2318]'
            : 'border-[#3A2F24] text-[#8A7C68] hover:border-[#C9A876] hover:text-[#C9A876]'
      }`}
    >
      {children}
    </button>
  )
}

export default function AdminProducts({
  restaurantId,
  initialCategories,
  initialProducts,
}: {
  restaurantId: string
  initialCategories: Category[]
  initialProducts: Product[]
}) {
  const [categories] = useState<Category[]>(initialCategories)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category_id: categories[0]?.id || '',
    imageUrl: '',
    isPopular: false,
  })

  function resetForm() {
    setForm({
      name: '',
      description: '',
      price: '',
      category_id: categories[0]?.id || '',
      imageUrl: '',
      isPopular: false,
    })
    setShowAddForm(false)
    setEditingId(null)
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const ext = file.name.includes('.')
      ? file.name.split('.').pop()!.toLowerCase().replace(/[^a-z0-9]/g, '')
      : 'jpg'
    const path = `${restaurantId}/${Date.now()}-${crypto.randomUUID()}.${ext || 'jpg'}`
    const { error } = await supabase.storage.from('menu-images').upload(path, file)

    if (error) {
      alert('Görsel yüklenemedi: ' + error.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('menu-images').getPublicUrl(path)
    setForm((prev) => ({ ...prev, imageUrl: data.publicUrl }))
    setUploading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const { data, error } = await supabase
      .from('products')
      .insert({
        restaurant_id: restaurantId,
        category_id: form.category_id,
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price),
        is_available: true,
        image_url: form.imageUrl || null,
        is_popular: form.isPopular,
      })
      .select()
      .single()

    if (error) {
      alert('Ürün eklenemedi: ' + error.message)
      return
    }

    setProducts((prev) => [...prev, data])
    resetForm()
  }

  function startEdit(product: Product) {
    setEditingId(product.id)
    setForm({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      category_id: product.category_id,
      imageUrl: product.image_url || '',
      isPopular: product.is_popular,
    })
    setShowAddForm(false)
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return

    const { data, error } = await supabase
      .from('products')
      .update({
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price),
        category_id: form.category_id,
        image_url: form.imageUrl || null,
        is_popular: form.isPopular,
      })
      .eq('id', editingId)
      .select()
      .single()

    if (error) {
      alert('Ürün güncellenemedi: ' + error.message)
      return
    }

    setProducts((prev) => prev.map((p) => (p.id === editingId ? data : p)))
    resetForm()
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu ürünü silmek istediğine emin misin?')) return

    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) {
      alert('Silinemedi: ' + error.message)
      return
    }
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  async function togglePopular(product: Product) {
    const { data, error } = await supabase
      .from('products')
      .update({ is_popular: !product.is_popular })
      .eq('id', product.id)
      .select()
      .single()

    if (error) {
      alert('Güncellenemedi: ' + error.message)
      return
    }
    setProducts((prev) => prev.map((p) => (p.id === product.id ? data : p)))
  }

  async function toggleAvailability(product: Product) {
    const { data, error } = await supabase
      .from('products')
      .update({ is_available: !product.is_available })
      .eq('id', product.id)
      .select()
      .single()

    if (error) {
      alert('Güncellenemedi: ' + error.message)
      return
    }
    setProducts((prev) => prev.map((p) => (p.id === product.id ? data : p)))
  }

  const formOpen = showAddForm || editingId !== null

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-[family-name:var(--font-display)] italic text-3xl text-[#F5EFE4]">
          Ürünler
        </h1>
        {!formOpen && (
          <button
            onClick={() => setShowAddForm(true)}
            className="font-[family-name:var(--font-mono)] text-base px-5 py-3 bg-[#C9A876] text-[#1B2318] font-medium rounded-full hover:bg-[#d9bb8e] transition-colors"
          >
            + Yeni ürün
          </button>
        )}
      </div>

      {formOpen && (
        <form
          onSubmit={editingId ? handleUpdate : handleAdd}
          className="bg-[#1E1811] border border-[#2A2119] rounded-2xl p-6 mb-8"
        >
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F5EFE4] mb-5">
            {editingId ? 'Ürünü düzenle' : 'Yeni ürün ekle'}
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>Ürün adı</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Fiyat (₺)</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className={labelClass}>Açıklama (opsiyonel)</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="mb-5">
            <label className={labelClass}>Kategori</label>
            <select
              required
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className={inputClass}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-5">
            <label className={labelClass}>Ürün görseli (opsiyonel)</label>
            <div className="flex items-center gap-3">
              {form.imageUrl && (
                <Image
                  src={form.imageUrl}
                  alt="Ürün görseli"
                  width={64}
                  height={64}
                  className="w-16 h-16 object-cover rounded-lg border border-[#3A2F24]"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={uploading}
                className="text-sm text-[#8A7C68] file:mr-3 file:py-2 file:px-4 file:rounded-full file:border file:border-[#3A2F24] file:bg-[#231B14] file:text-[#C9A876] file:text-sm"
              />
              {uploading && <span className="text-sm text-[#8A7C68]">Yükleniyor…</span>}
            </div>
          </div>

          <label className="flex items-center gap-2.5 mb-6 text-base text-[#D8CBB8]">
            <input
              type="checkbox"
              checked={form.isPopular}
              onChange={(e) => setForm({ ...form, isPopular: e.target.checked })}
              className="accent-[#C9A876] w-4 h-4"
            />
            Popüler Lezzetler&apos;de göster
          </label>

          <div className="flex gap-3">
            <button
              type="submit"
              className="font-[family-name:var(--font-mono)] text-base px-5 py-2.5 bg-[#C9A876] text-[#1B2318] font-medium rounded-full hover:bg-[#d9bb8e] transition-colors"
            >
              {editingId ? 'Güncelle' : 'Ekle'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="font-[family-name:var(--font-mono)] text-base px-5 py-2.5 border border-[#3A2F24] text-[#8A7C68] rounded-full hover:border-[#C9A876] hover:text-[#C9A876] transition-colors"
            >
              Vazgeç
            </button>
          </div>
        </form>
      )}

      {categories.map((category) => {
        const categoryProducts = products.filter((p) => p.category_id === category.id)
        if (categoryProducts.length === 0) return null

        return (
          <div key={category.id} className="mb-10">
            <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F5EFE4] mb-4">
              {category.name}
            </h2>

            <div className="bg-[#1E1811] border border-[#2A2119] rounded-2xl divide-y divide-[#2A2119]">
              {categoryProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between px-5 py-4 gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        width={56}
                        height={56}
                        className="w-14 h-14 object-cover rounded-lg border border-[#2A2119] shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg border border-[#2A2119] bg-[#231B14] shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span
                          className={`font-semibold text-base ${
                            product.is_available ? 'text-[#F5EFE4]' : 'text-[#5A5248] line-through'
                          }`}
                        >
                          {product.name}
                        </span>
                        <span className="font-[family-name:var(--font-mono)] text-sm text-[#C9A876]">
                          {product.price.toFixed(2)} ₺
                        </span>
                        {product.is_popular && (
                          <span className="text-xs px-2 py-1 rounded-full bg-[#C9A876]/15 text-[#C9A876]">
                            Popüler
                          </span>
                        )}
                        {!product.is_available && (
                          <span className="text-xs px-2 py-1 rounded-full bg-[#3A2F24] text-[#8A7C68]">
                            Tükendi
                          </span>
                        )}
                      </div>
                      {product.description && (
                        <div className="text-sm text-[#8A7C68] mt-1">{product.description}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <IconButton
                      onClick={() => togglePopular(product)}
                      active={product.is_popular}
                      label={product.is_popular ? 'Popülerden çıkar' : 'Popüler yap'}
                    >
                      <svg viewBox="0 0 24 24" fill={product.is_popular ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
                        <path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.9 6.4 20.1l1.4-6.3-4.8-4.3 6.4-.6Z" strokeLinejoin="round" />
                      </svg>
                    </IconButton>
                    <IconButton
                      onClick={() => toggleAvailability(product)}
                      active={!product.is_available}
                      label={product.is_available ? 'Tükendi yap' : 'Tekrar aktif et'}
                    >
                      {product.is_available ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
                          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" strokeLinejoin="round" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
                          <path d="M3 3l18 18M10.6 5.2C11 5.1 11.5 5 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.5 6.6C3.5 8.4 2 12 2 12s4 7 10 7c1.4 0 2.7-.4 3.8-1" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </IconButton>
                    <IconButton onClick={() => startEdit(product)} label="Düzenle">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
                        <path d="M12 20h9" strokeLinecap="round" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinejoin="round" />
                      </svg>
                    </IconButton>
                    <IconButton onClick={() => handleDelete(product.id)} danger label="Sil">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
                        <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </IconButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
