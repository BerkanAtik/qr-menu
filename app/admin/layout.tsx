'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { RestaurantProvider, type Restaurant } from '@/lib/restaurantContext'
import type { Session } from '@supabase/supabase-js'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [restaurantLoading, setRestaurantLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Login sayfası oturum şartı olmadan kendi başına çalışır; panel çerçevesi
  // ve giriş yönlendirmesi bunu kapsamaz.
  const cerceveDisi = pathname === '/admin/login'

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)

      if (!data.session && !cerceveDisi) {
        router.push('/admin/login')
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session && !cerceveDisi) {
        router.push('/admin/login')
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [cerceveDisi, router])

  // Panelin hangi restoranla çalıştığı artık kodda sabit bir slug değil;
  // giriş yapan kullanıcının bağlı olduğu restoran burada bir kez bulunup
  // context üzerinden bütün panel sayfalarına dağıtılıyor.
  useEffect(() => {
    if (!session) return

    let iptal = false

    supabase
      .from('restaurant_users')
      .select('restaurants(*)')
      .eq('user_id', session.user.id)
      .limit(1)
      .single()
      .then(({ data }) => {
        if (iptal) return
        const bulunan = (data as { restaurants: Restaurant } | null)?.restaurants
        setRestaurant(bulunan ?? null)
        setRestaurantLoading(false)
      })

    return () => {
      iptal = true
    }
  }, [session])

  if (cerceveDisi) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#14100C] flex items-center justify-center">
        <p className="text-[#8A7C68] text-sm">Yükleniyor…</p>
      </div>
    )
  }

  if (!session) {
    return null
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const navItems = [
    { href: '/admin', label: 'Ürünler' },
    { href: '/admin/servis', label: 'Servis' },
    { href: '/admin/hero', label: 'Görseller' },
    { href: '/admin/bilgiler', label: 'Bilgiler' },
    { href: '/admin/qr', label: 'QR Kodlar' },
  ]

  return (
    <div className="min-h-screen bg-[#14100C]">
      <div className="bg-[#1E1811] border-b border-[#2A2119] text-white px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center justify-between gap-3 lg:gap-10">
          <div className="flex flex-col min-w-0">
            <span className="font-[family-name:var(--font-display)] italic text-xl sm:text-2xl text-[#F5EFE4]">
              Yönetim Paneli
            </span>
            {restaurant && (
              <span className="font-[family-name:var(--font-mono)] text-xs text-[#F5EFE4] mt-0.5 truncate">
                {restaurant.name}
              </span>
            )}
          </div>
          {/* Sekmeler masaüstünde başlığın yanında; dar ekranda alta iniyor */}
          <nav className="hidden lg:flex gap-2 flex-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-[family-name:var(--font-mono)] text-sm px-4 py-2 rounded-full transition-colors whitespace-nowrap ${
                  pathname === item.href
                    ? 'bg-[#C9A876] text-[#1B2318] font-medium'
                    : 'text-[#8A7C68] hover:text-[#C9A876]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            onClick={handleLogout}
            className="shrink-0 font-[family-name:var(--font-mono)] text-sm px-3 sm:px-4 py-2 border border-[#3A2F24] rounded-full text-[#8A7C68] hover:border-[#C9A876] hover:text-[#C9A876] transition-colors"
          >
            Çıkış
          </button>
        </div>
        {/* Dar ekranlarda sekmeler: yatay kaydırılabilir şerit */}
        <nav className="lg:hidden flex gap-2 mt-4 -mx-4 px-4 sm:-mx-6 sm:px-6 overflow-x-auto no-scrollbar">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 font-[family-name:var(--font-mono)] text-sm px-4 py-2 rounded-full transition-colors whitespace-nowrap ${
                pathname === item.href
                  ? 'bg-[#C9A876] text-[#1B2318] font-medium'
                  : 'text-[#8A7C68] border border-[#3A2F24]'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {restaurantLoading ? (
          <p className="text-[#8A7C68] text-sm">Yükleniyor…</p>
        ) : restaurant === null ? (
          <p className="text-[#8A7C68] text-base">
            Hesabınıza bağlı bir restoran bulunamadı. Lütfen sistem yöneticisiyle
            iletişime geçin.
          </p>
        ) : (
          <RestaurantProvider value={restaurant}>{children}</RestaurantProvider>
        )}
      </div>
    </div>
  )
}
