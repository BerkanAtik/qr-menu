'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  category_id: string
  image_url: string | null
  is_popular: boolean
}

type Category = {
  id: string
  name: string
  sort_order: number
}

type HeroImage = {
  id: string
  image_url: string
}

type RestaurantInfo = {
  wifiPassword: string | null
  workingHours: string | null
  address: string | null
  googleReviewsUrl: string | null
  instagramHandle: string | null
  aboutText: string | null
  allergenInfo: string | null
}

type CartItem = {
  product: Product
  quantity: number
}

// Şimdilik statik örnek işletme (Petrol Ofisi). Gerçek restoran eklenince
// admin panelindeki "Bilgiler > Google Yorumlar linki" alanına taşınabilir.
// !12e1 parametresi Google Maps'te doğrudan "yorum yaz" ekranını açar.
const GOOGLE_RATING = '4.7'
const GOOGLE_REVIEW_URL =
  'https://www.google.com/maps/place//data=!4m3!3m2!1s0x152a6fe30b0afcd9:0xe155bf8e6e5266c3!12e1'

function normalize(text: string) {
  return text.toLocaleLowerCase('tr-TR')
}

// Kategori adının başındaki emojiyi ayırır (ör. "🥐 Kahvaltılar" -> { emoji: "🥐", label: "Kahvaltılar" })
const LEADING_EMOJI = /^(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)\s*/u

function splitCategoryName(name: string) {
  const match = name.match(LEADING_EMOJI)
  if (!match) return { emoji: null, label: name }
  return { emoji: match[1], label: name.slice(match[0].length) }
}

function CategoryIcon({ name }: { name: string }) {
  const n = normalize(name)
  const cls = 'w-6 h-6'

  if (n.includes('başlang') || n.includes('baslang')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls}>
        <path d="M4 15a8 8 0 0 1 16 0" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 15h20M2 18h20" strokeLinecap="round" />
        <path d="M12 6V4" strokeLinecap="round" />
      </svg>
    )
  }
  if (n.includes('ana yem') || n.includes('ana ye')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls}>
        <path d="M4 11a8 8 0 0 0 16 0Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 11h20" strokeLinecap="round" />
        <path d="M12 11V4" strokeLinecap="round" />
      </svg>
    )
  }
  if (n.includes('içecek') || n.includes('icecek')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls}>
        <path d="M6 3h12l-2 9a4 4 0 0 1-8 0Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 15v6M8 21h8" strokeLinecap="round" />
      </svg>
    )
  }
  if (n.includes('tatlı') || n.includes('tatli')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls}>
        <path d="M4 21l3-9 5-6 5 6 3 9Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 21h16" strokeLinecap="round" />
      </svg>
    )
  }
  if (n.includes('çocuk') || n.includes('cocuk')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 14.5c1 1 2.2 1.5 3.5 1.5s2.5-.5 3.5-1.5" strokeLinecap="round" />
        <path d="M9 9h.01M15 9h.01" strokeLinecap="round" />
      </svg>
    )
  }
  if (n.includes('special')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls}>
        <path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.9 6.4 20.1l1.4-6.3-4.8-4.3 6.4-.6Z" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls}>
      <path d="M6 2v8a2 2 0 0 0 2 2v10M6 2v6M9 2v6M6 8h3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 2c-1.5 0-3 1.5-3 4v5c0 1 .5 2 2 2v9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function MenuClient({
  restaurantId,
  restaurantName,
  categories,
  products,
  tableId,
  tableNo,
  heroImages,
  // restaurantInfo şu an kullanılmıyor (hamburger menü/çekmece kaldırıldı, restoran bilgileri henüz yok) — prop sözleşmesi kalsın, ileride drawer geri gelirse hazır olsun
}: {
  restaurantId: string
  restaurantName: string
  categories: Category[]
  products: Product[]
  tableId: string
  tableNo: number
  heroImages: HeroImage[]
  restaurantInfo: RestaurantInfo
}) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [heroIndex, setHeroIndex] = useState(0)
  const [callingService, setCallingService] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [pulsing, setPulsing] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const catalogRef = useRef<HTMLDivElement | null>(null)
  const categoryScrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (heroImages.length <= 1) return
    const interval = setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroImages.length)
    }, 4500)
    return () => clearInterval(interval)
  }, [heroImages.length])

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  function removeFromCart(productId: string) {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === productId)
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      }
      return prev.filter((item) => item.product.id !== productId)
    })
  }

  const total = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  function scrollToCategory(id: string) {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function scrollCategoryPills(direction: 'left' | 'right') {
    const el = categoryScrollRef.current
    if (!el) return
    const amount = Math.max(220, el.clientWidth * 0.6)
    el.scrollBy({ left: direction === 'right' ? amount : -amount, behavior: 'smooth' })
  }

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }

  async function callService(type: 'garson' | 'hesap' | 'su' = 'garson') {
    if (callingService || confirmed) return
    setCallingService(true)

    const { error } = await supabase.from('service_requests').insert({
      restaurant_id: restaurantId,
      table_id: tableId,
      status: 'pending',
      type,
    })

    setCallingService(false)

    if (error) {
      showToast('Talep gönderilemedi')
      return
    }

    // 3 saniyelik onay: butonda altın halkalar + "Garson Çağrıldı" durumu,
    // telefonda kısa titreşim (PC'de donanım yok, sessizce yok sayılır)
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([25, 40, 25])
    }
    setPulsing(true)
    setConfirmed(true)
    setTimeout(() => {
      setPulsing(false)
      setConfirmed(false)
    }, 3000)

    showToast('Talebiniz iletildi')
  }

  async function submitOrder() {
    if (cart.length === 0) return
    setSubmitting(true)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: restaurantId,
        table_id: tableId,
        status: 'pending',
        total: total,
      })
      .select('id')
      .single()

    if (orderError || !order) {
      alert('Sipariş oluşturulamadı: ' + orderError?.message)
      setSubmitting(false)
      return
    }

    const orderItems = cart.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.product.price,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      alert('Sipariş kalemleri eklenemedi: ' + itemsError.message)
      setSubmitting(false)
      return
    }

    // Sipariş kaydedildi, şimdi iyzico ödeme sayfasını başlat
    const res = await fetch('/api/payment/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        buyerName: restaurantName,
        buyerEmail: 'misafir@example.com',
      }),
    })

    const data = await res.json()

    if (data.error || !data.paymentPageUrl) {
      alert('Ödeme başlatılamadı: ' + (data.error || 'Bilinmeyen hata'))
      setSubmitting(false)
      return
    }

    // Müşteriyi iyzico'nun ödeme sayfasına yönlendir
    window.location.assign(data.paymentPageUrl)
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-[#FAF7F1] flex items-center justify-center px-6">
        <div className="max-w-sm w-full bg-white rounded-sm border border-[#E5DCCF] shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#7A2E33] text-white flex items-center justify-center mx-auto mb-4 text-xl">
            ✓
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-[#2B2420] mb-2">
            Siparişiniz alındı
          </h1>
          <p className="text-[#7A7267] text-sm mb-6">
            Mutfağa iletildi, hazırlanmaya başlandı.
          </p>
          <button
            onClick={() => setOrderSuccess(false)}
            className="font-[family-name:var(--font-mono)] text-sm px-5 py-2.5 bg-[#2B2420] text-white rounded-sm hover:bg-[#453b32] transition-colors"
          >
            Yeni sipariş ver
          </button>
        </div>
      </div>
    )
  }

  const popularProducts = products.filter((p) => p.is_popular)
  const searchResults = searchQuery.trim()
    ? products.filter((p) => normalize(p.name).includes(normalize(searchQuery)))
    : null
  const listView = searchResults

  return (
    <div className="min-h-screen bg-[#14100C] pb-28">
      <div className="max-w-md md:max-w-3xl lg:max-w-[1440px] mx-auto lg:px-10 xl:px-16">
      {/* Header — yan rozetler eşit genişlikte sütunlarda, ortadaki blok tam merkezde */}
      <div className="px-5 pt-6 pb-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <a
          href={GOOGLE_REVIEW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="justify-self-start min-w-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#231B14] border border-[#3A2F24] text-[#C9A876] hover:border-[#C9A876] transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
            <path d="M12 2.5l2.9 6 6.6.6-5 4.4 1.5 6.5-6-3.6-6 3.6 1.5-6.5-5-4.4 6.6-.6Z" />
          </svg>
          <span className="font-[family-name:var(--font-mono)] text-xs whitespace-nowrap">
            {GOOGLE_RATING}
            <span className="hidden sm:inline"> Google&apos;da Puanla</span>
          </span>
        </a>
        <div className="justify-self-center flex flex-col items-center">
          <div className="w-9 h-9 text-[#C9A876] mb-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M7 21V13.5C4.5 12.6 3 10.5 3 8a4 4 0 0 1 4-4c.5 0 1 .1 1.4.3A4 4 0 0 1 12 2a4 4 0 0 1 3.6 2.3c.4-.2.9-.3 1.4-.3a4 4 0 0 1 4 4c0 2.5-1.5 4.6-4 5.5V21Z" strokeLinejoin="round" />
              <path d="M7 17h10" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="font-[family-name:var(--font-display)] italic text-xl text-[#F5EFE4] text-center leading-tight">
            {restaurantName}
          </h1>
          <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] uppercase text-[#8A7C68] mt-1">
            Dijital Menü
          </p>
        </div>
        <div className="justify-self-end min-w-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#231B14] border border-[#3A2F24] text-[#C9A876]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0">
            <path d="M4 17V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8M2 17h20M6 17v2M18 17v2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-[family-name:var(--font-mono)] text-xs whitespace-nowrap">
            Masa: {tableNo}
          </span>
        </div>
      </div>

      {/* Hero carousel */}
      {heroImages.length > 0 && (
        <div className="px-5 mb-6">
          <div className="relative rounded-2xl overflow-hidden">
            <Image
              src={heroImages[heroIndex].image_url}
              alt=""
              width={1600}
              height={700}
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 768px, 1440px"
              className="w-full h-auto block"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-5 lg:p-10">
              <p className="font-[family-name:var(--font-display)] italic text-[#C9A876] mb-1 lg:text-lg">
                Hoş Geldiniz!
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl lg:text-5xl text-white leading-tight mb-2 max-w-[75%] lg:max-w-xl">
                Lezzet Dolu Bir Deneyime Hazır Mısınız?
              </h2>
              {heroImages.length > 1 && (
                <div className="flex gap-1.5 mt-2">
                  {heroImages.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setHeroIndex(idx)}
                      aria-label={`${idx + 1}. görsel`}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === heroIndex ? 'w-5 bg-[#C9A876]' : 'w-1.5 bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="px-5 mb-5">
        <div className="flex items-center gap-2 bg-[#1E1811] border border-[#3A2F24] rounded-full px-4 py-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-[#8A7C68] shrink-0">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Yemek veya içecek ara…"
            className="bg-transparent outline-none text-sm text-[#F5EFE4] placeholder:text-[#8A7C68] w-full"
          />
        </div>
      </div>

      {listView ? (
        <div className="px-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-[#8A7C68]">{listView.length} sonuç</p>
          </div>
          {listView.length === 0 && (
            <p className="text-[#8A7C68] text-sm">Sonuç bulunamadı.</p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 md:gap-x-8 gap-y-1">
            {listView.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                cartItem={cart.find((item) => item.product.id === product.id)}
                onAdd={() => addToCart(product)}
                onRemove={() => removeFromCart(product.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Category pills */}
          <div className="sticky top-0 z-10 bg-[#14100C]/95 backdrop-blur border-b border-[#2A2119] flex items-center gap-2 px-4 py-4">
            <button
              onClick={() => scrollCategoryPills('left')}
              aria-label="Sola kaydır"
              className="hidden md:flex shrink-0 w-9 h-9 rounded-full bg-[#231B14] border border-[#3A2F24] items-center justify-center text-[#C9A876] hover:border-[#C9A876] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div
              ref={categoryScrollRef}
              className="flex-1 min-w-0 flex gap-3 overflow-x-auto scroll-smooth no-scrollbar"
            >
              {categories.map((category) => {
                const { emoji, label } = splitCategoryName(category.name)
                return (
                  <button
                    key={category.id}
                    onClick={() => scrollToCategory(category.id)}
                    className="shrink-0 flex flex-col items-center justify-center gap-2 min-w-[6.5rem] px-4 py-4 rounded-xl border border-[#3A2F24] text-[#C9A876] hover:border-[#C9A876] transition-colors"
                  >
                    {emoji ? (
                      <span className="text-3xl leading-none">{emoji}</span>
                    ) : (
                      <CategoryIcon name={category.name} />
                    )}
                    <span className="font-[family-name:var(--font-mono)] text-xs text-[#D8CBB8] text-center leading-tight break-words">
                      {label}
                    </span>
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => scrollCategoryPills('right')}
              aria-label="Sağa kaydır"
              className="hidden md:flex shrink-0 w-9 h-9 rounded-full bg-[#231B14] border border-[#3A2F24] items-center justify-center text-[#C9A876] hover:border-[#C9A876] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Popular items */}
          {popularProducts.length > 0 && (
            <div className="pt-6 mb-6">
              <div className="px-5 mb-3">
                <h2 className="font-[family-name:var(--font-display)] text-lg text-[#F5EFE4]">
                  Popüler Lezzetler
                </h2>
              </div>
              <div className="flex gap-4 overflow-x-auto px-5 pb-1 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:overflow-visible">
                {popularProducts.map((product) => (
                  <PopularCard
                    key={product.id}
                    product={product}
                    cartItem={cart.find((item) => item.product.id === product.id)}
                    onAdd={() => addToCart(product)}
                    onRemove={() => removeFromCart(product.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Full catalog */}
          <div ref={catalogRef} className="px-5">
            {categories.map((category) => {
              const categoryProducts = products.filter(
                (p) => p.category_id === category.id
              )
              if (categoryProducts.length === 0) return null

              return (
                <div
                  key={category.id}
                  ref={(el) => { sectionRefs.current[category.id] = el }}
                  className="mb-9 scroll-mt-40"
                >
                  <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F5EFE4] mb-1">
                    {category.name}
                  </h2>
                  <div className="h-px w-10 bg-[#C9A876] mb-3" />

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 md:gap-x-8 gap-y-1">
                    {categoryProducts.map((product) => (
                      <ProductRow
                        key={product.id}
                        product={product}
                        cartItem={cart.find((item) => item.product.id === product.id)}
                        onAdd={() => addToCart(product)}
                        onRemove={() => removeFromCart(product.id)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
      </div>

      {/* Cart bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-0 right-0 z-20 px-4">
          <div className="max-w-md mx-auto bg-[#1E1811] border border-[#3A2F24] rounded-full pl-2 pr-2.5 py-2 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C9A876] text-[#1B2318] flex items-center justify-center relative shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                  <path d="M6 6h15l-1.5 9h-12L6 6Zm0 0-1-3H2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="20" r="1" />
                  <circle cx="18" cy="20" r="1" />
                </svg>
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-[#7A2E33] text-white text-[10px] flex items-center justify-center">
                  {itemCount}
                </span>
              </div>
              <div>
                <div className="font-[family-name:var(--font-mono)] text-[10px] text-[#8A7C68] uppercase tracking-wider">
                  Sepetiniz · {itemCount} ürün
                </div>
                <div className="font-[family-name:var(--font-mono)] text-[#F5EFE4] text-sm">
                  {total.toFixed(2)} ₺
                </div>
              </div>
            </div>
            <button
              onClick={submitOrder}
              disabled={submitting}
              className="font-[family-name:var(--font-mono)] text-sm px-5 py-2.5 bg-[#C9A876] text-[#1B2318] rounded-full hover:bg-[#d9bb8e] transition-colors disabled:opacity-60 font-medium"
            >
              {submitting ? 'Gönderiliyor…' : 'Siparişi Ver'}
            </button>
          </div>
        </div>
      )}

      {/* Ekran ortasında bildirim */}
      {toast && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-6 pointer-events-none">
          <div className="animate-toast-in flex items-center gap-3.5 bg-[#1E1811]/95 backdrop-blur-sm border border-[#C9A876]/40 rounded-2xl px-7 py-5 shadow-2xl">
            <span className="w-10 h-10 rounded-full bg-[#C9A876] text-[#1B2318] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="w-5 h-5">
                <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="font-[family-name:var(--font-display)] text-lg md:text-xl font-semibold text-[#F5EFE4] whitespace-nowrap">
              {toast}
            </span>
          </div>
        </div>
      )}

      {/* Sabit garson çağırma butonu — her sayfada, her zaman sağ altta */}
      <div
        className={`fixed right-5 z-30 ${cart.length > 0 ? 'bottom-24 md:bottom-6' : 'bottom-6'}`}
      >
        {/* Dışa yayılan altın halkalar */}
        {pulsing && (
          <span className="absolute inset-0 pointer-events-none">
            <span className="absolute inset-0 rounded-full bg-[#C9A876] animate-garson-ring" />
            <span className="absolute inset-0 rounded-full bg-[#C9A876] animate-garson-ring [animation-delay:0.5s]" />
            <span className="absolute inset-0 rounded-full bg-[#C9A876] animate-garson-ring [animation-delay:1s]" />
          </span>
        )}

        <button
          onClick={() => callService('garson')}
          disabled={callingService || confirmed}
          className={`relative flex items-center gap-2.5 pl-4.5 pr-5.5 py-4 rounded-full font-[family-name:var(--font-display)] text-base md:text-lg font-semibold tracking-wide shadow-xl transition-colors duration-300 disabled:cursor-default ${
            confirmed
              ? 'bg-[#E9C98F] text-[#1B2318]'
              : 'bg-[#C9A876] text-[#1B2318] hover:bg-[#d9bb8e]'
          } ${pulsing ? 'animate-garson-glow' : ''} ${
            callingService && !confirmed ? 'opacity-70' : ''
          }`}
        >
          {confirmed ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              className="w-6 h-6 md:w-7 md:h-7 animate-garson-check"
            >
              <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-6 h-6 md:w-7 md:h-7">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round" />
            </svg>
          )}
          {confirmed ? 'Garson Çağrıldı' : callingService ? 'Gönderiliyor…' : 'Garson Çağır'}
        </button>
      </div>
    </div>
  )
}

function PopularCard({
  product,
  cartItem,
  onAdd,
  onRemove,
}: {
  product: Product
  cartItem: CartItem | undefined
  onAdd: () => void
  onRemove: () => void
}) {
  return (
    <div className="shrink-0 w-44 md:w-full bg-[#1E1811] border border-[#2A2119] rounded-xl overflow-hidden">
      <div className="relative w-full h-36">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill sizes="220px" className="object-cover" />
        ) : (
          <div className="w-full h-full bg-[#241D16]" />
        )}
      </div>
      <div className="p-4">
        <div className="text-[#F5EFE4] text-base font-medium leading-tight mb-1 line-clamp-2">
          {product.name}
        </div>
        {product.description && (
          <div className="text-[#8A7C68] text-sm mb-2.5 line-clamp-1">{product.description}</div>
        )}
        <div className="flex items-center justify-between">
          <span className="font-[family-name:var(--font-mono)] text-[#C9A876] text-sm">
            {product.price.toFixed(2)} ₺
          </span>
          <div className="flex items-center gap-2">
            {cartItem && (
              <>
                <button
                  onClick={onRemove}
                  aria-label="Azalt"
                  className="w-7 h-7 rounded-full border border-[#3A2F24] text-[#D8CBB8] flex items-center justify-center text-sm"
                >
                  −
                </button>
                <span className="font-[family-name:var(--font-mono)] text-sm text-[#F5EFE4] w-3 text-center">
                  {cartItem.quantity}
                </span>
              </>
            )}
            <button
              onClick={onAdd}
              aria-label="Sepete ekle"
              className="w-7 h-7 rounded-full bg-[#C9A876] text-[#1B2318] flex items-center justify-center text-sm"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductRow({
  product,
  cartItem,
  onAdd,
  onRemove,
}: {
  product: Product
  cartItem: CartItem | undefined
  onAdd: () => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-start gap-3.5 py-5 border-b border-[#2A2119] last:border-0">
      {product.image_url ? (
        <Image
          src={product.image_url}
          alt={product.name}
          width={88}
          height={88}
          className="w-20 h-20 md:w-[5.5rem] md:h-[5.5rem] object-cover rounded-lg shrink-0"
        />
      ) : (
        <div className="w-20 h-20 md:w-[5.5rem] md:h-[5.5rem] rounded-lg bg-[#1E1811] border border-[#2A2119] shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[#F5EFE4] font-semibold text-base leading-tight">{product.name}</div>
        {product.description && (
          <div className="text-[#8A7C68] text-sm mt-1 line-clamp-2">{product.description}</div>
        )}
        <div className="font-[family-name:var(--font-mono)] text-[#C9A876] text-sm mt-2">
          {product.price.toFixed(2)} ₺
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5 shrink-0 pt-1">
        <button
          onClick={onAdd}
          className="w-8 h-8 rounded-full bg-[#C9A876] text-[#1B2318] flex items-center justify-center hover:bg-[#d9bb8e] transition-colors text-base"
          aria-label="Sepete ekle"
        >
          +
        </button>
        {cartItem && (
          <>
            <span className="font-[family-name:var(--font-mono)] text-sm text-[#F5EFE4]">
              {cartItem.quantity}
            </span>
            <button
              onClick={onRemove}
              className="w-8 h-8 rounded-full border border-[#3A2F24] text-[#D8CBB8] flex items-center justify-center hover:border-[#C9A876] transition-colors text-base"
              aria-label="Azalt"
            >
              −
            </button>
          </>
        )}
      </div>
    </div>
  )
}
