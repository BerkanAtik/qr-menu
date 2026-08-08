'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)

      if (!data.session && pathname !== '/admin/login') {
        router.push('/admin/login')
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session && pathname !== '/admin/login') {
        router.push('/admin/login')
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [pathname, router])

  if (pathname === '/admin/login') {
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
    { href: '/admin/siparisler', label: 'Siparişler' },
    { href: '/admin/servis', label: 'Servis' },
    { href: '/admin/hero', label: 'Görseller' },
    { href: '/admin/bilgiler', label: 'Bilgiler' },
    { href: '/admin/qr', label: 'QR Kodlar' },
  ]

  return (
    <div className="min-h-screen bg-[#14100C]">
      <div className="bg-[#1E1811] border-b border-[#2A2119] text-white px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <span className="font-[family-name:var(--font-display)] italic text-2xl text-[#F5EFE4]">
            Yönetim Paneli
          </span>
          <nav className="flex gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-[family-name:var(--font-mono)] text-sm px-4 py-2 rounded-full transition-colors ${
                  pathname === item.href
                    ? 'bg-[#C9A876] text-[#1B2318] font-medium'
                    : 'text-[#8A7C68] hover:text-[#C9A876]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="font-[family-name:var(--font-mono)] text-sm px-4 py-2 border border-[#3A2F24] rounded-full text-[#8A7C68] hover:border-[#C9A876] hover:text-[#C9A876] transition-colors"
        >
          Çıkış yap
        </button>
      </div>
      <div className="max-w-5xl mx-auto px-8 py-10">{children}</div>
    </div>
  )
}
