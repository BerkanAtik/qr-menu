'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { inputClassCompact as inputClass } from '@/lib/adminUi'
import type { Session } from '@supabase/supabase-js'

type Kullanici = { id: string; email: string }
type Restoran = {
  id: string
  name: string
  slug: string
  table_count: number
  kullanicilar: Kullanici[]
}

export default function SuperAdminPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [checking, setChecking] = useState(true)
  const [yetkisiz, setYetkisiz] = useState(false)
  const [restaurants, setRestaurants] = useState<Restoran[] | null>(null)
  const [hata, setHata] = useState('')
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push('/admin/login')
        return
      }
      setSession(data.session)
      setChecking(false)
    })
  }, [router])

  async function listeyiYenile(token: string) {
    const res = await fetch('/api/superadmin/restaurants', {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.status === 403) {
      setYetkisiz(true)
      return
    }

    const data = await res.json()
    if (!res.ok) {
      setHata(data.error || 'Bir hata oluştu')
      return
    }

    setRestaurants(data.restaurants)
  }

  useEffect(() => {
    if (!session) return
    const token = session.access_token
    // Async sarmalayıcı: setState çağrıları effect gövdesinde değil, ağ
    // isteği tamamlandıktan sonra çalışsın.
    void (async () => {
      await listeyiYenile(token)
    })()
     
  }, [session])

  if (checking) {
    return (
      <div className="min-h-screen bg-[#14100C] flex items-center justify-center">
        <p className="text-[#8A7C68] text-sm">Yükleniyor…</p>
      </div>
    )
  }

  if (yetkisiz) {
    return (
      <div className="min-h-screen bg-[#14100C] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-[#1E1811] rounded-2xl border border-[#2A2119] p-8 text-center">
          <h1 className="font-[family-name:var(--font-display)] italic text-xl text-[#F5EFE4] mb-2">
            Bu sayfaya erişimin yok
          </h1>
          <p className="text-[#8A7C68] text-sm">
            Hesabın platform admin listesinde değil. Erişim gerekiyorsa
            <code className="mx-1 text-[#C9A876]">platform_admins</code>
            tablosuna eklenmen gerekir.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#14100C] text-[#F5EFE4]">
      <div className="bg-[#1E1811] border-b border-[#2A2119] px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex items-center justify-between gap-3 flex-wrap">
        <span className="font-[family-name:var(--font-display)] italic text-xl sm:text-2xl">
          Süper Admin
        </span>
        <Link
          href="/admin"
          className="shrink-0 font-[family-name:var(--font-mono)] text-sm px-4 py-2 border border-[#3A2F24] rounded-full text-[#8A7C68] hover:border-[#C9A876] hover:text-[#C9A876] transition-colors"
        >
          Restoran paneline dön
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {hata && <p className="text-red-400 text-sm mb-6">{hata}</p>}

        <YeniRestoranFormu
          token={session!.access_token}
          onOlusturuldu={() => listeyiYenile(session!.access_token)}
        />

        <h2 className="font-[family-name:var(--font-display)] text-xl mb-4 mt-10">Restoranlar</h2>

        {restaurants === null && <p className="text-[#8A7C68] text-sm">Yükleniyor…</p>}
        {restaurants?.length === 0 && (
          <p className="text-[#8A7C68] text-sm">Henüz restoran yok.</p>
        )}

        <div className="space-y-4">
          {restaurants?.map((r) => (
            <RestoranSatiri
              key={r.id}
              restoran={r}
              token={session!.access_token}
              onDegisti={() => listeyiYenile(session!.access_token)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function RestoranSatiri({
  restoran,
  token,
  onDegisti,
}: {
  restoran: Restoran
  token: string
  onDegisti: () => void
}) {
  const [duzenleAcik, setDuzenleAcik] = useState(false)
  const [form, setForm] = useState({
    name: restoran.name,
    slug: restoran.slug,
    tableCount: String(restoran.table_count),
  })
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [siliniyor, setSiliniyor] = useState(false)
  const [mesaj, setMesaj] = useState<{ tur: 'ok' | 'hata'; metin: string } | null>(null)

  async function kaydet(e: React.FormEvent) {
    e.preventDefault()
    setKaydediliyor(true)
    setMesaj(null)

    const res = await fetch('/api/superadmin/update-restaurant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        restaurantId: restoran.id,
        name: form.name,
        slug: form.slug,
        tableCount: form.tableCount,
      }),
    })
    const data = await res.json()

    setKaydediliyor(false)

    if (!res.ok) {
      setMesaj({ tur: 'hata', metin: data.error || 'Güncellenemedi' })
      return
    }

    setDuzenleAcik(false)
    onDegisti()
  }

  async function sil() {
    if (
      !confirm(
        `"${restoran.name}" silinecek — tüm ürün, kategori, masa ve servis talebi verisiyle birlikte. Bu işlem geri alınamaz. Emin misin?`
      )
    )
      return

    setSiliniyor(true)
    setMesaj(null)

    const res = await fetch('/api/superadmin/delete-restaurant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ restaurantId: restoran.id }),
    })
    const data = await res.json()

    if (!res.ok) {
      setSiliniyor(false)
      setMesaj({ tur: 'hata', metin: data.error || 'Silinemedi' })
      return
    }

    onDegisti()
  }

  return (
    <div className="bg-[#1E1811] border border-[#2A2119] rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
        <div className="min-w-0">
          <h3 className="font-[family-name:var(--font-display)] text-lg break-words">
            {restoran.name}
          </h3>
          <span className="font-[family-name:var(--font-mono)] text-xs text-[#8A7C68] break-all">
            /{restoran.slug} · {restoran.table_count} masa
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setDuzenleAcik((v) => !v)}
            className="font-[family-name:var(--font-mono)] text-xs px-3 py-1.5 border border-[#3A2F24] rounded-full text-[#8A7C68] hover:border-[#C9A876] hover:text-[#C9A876] transition-colors"
          >
            {duzenleAcik ? 'Vazgeç' : 'Düzenle'}
          </button>
          <button
            onClick={sil}
            disabled={siliniyor}
            className="font-[family-name:var(--font-mono)] text-xs px-3 py-1.5 border border-[#3A2F24] rounded-full text-[#B87A7E] hover:border-red-400 hover:text-red-400 transition-colors disabled:opacity-60"
          >
            {siliniyor ? '…' : 'Kaldır'}
          </button>
        </div>
      </div>

      {duzenleAcik && (
        <form onSubmit={kaydet} className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4">
          <input
            type="text"
            placeholder="Restoran adı"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
          />
          <input
            type="text"
            placeholder="Slug"
            required
            pattern="[a-z0-9\-]+"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className={inputClass}
          />
          <input
            type="number"
            min="1"
            placeholder="Masa sayısı"
            required
            value={form.tableCount}
            onChange={(e) => setForm({ ...form, tableCount: e.target.value })}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={kaydediliyor}
            className="md:col-span-3 font-[family-name:var(--font-mono)] text-xs px-4 py-2.5 bg-[#C9A876] text-[#1B2318] font-medium rounded-full hover:bg-[#d9bb8e] transition-colors disabled:opacity-60"
          >
            {kaydediliyor ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </form>
      )}

      {mesaj && (
        <p className={`text-xs mt-3 ${mesaj.tur === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
          {mesaj.metin}
        </p>
      )}

      {restoran.kullanicilar.length === 0 ? (
        <p className="text-[#8A7C68] text-sm mt-4">Bu restorana bağlı kullanıcı yok.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {restoran.kullanicilar.map((k) => (
            <KullaniciSatiri key={k.id} kullanici={k} token={token} />
          ))}
        </div>
      )}
    </div>
  )
}

function KullaniciSatiri({ kullanici, token }: { kullanici: Kullanici; token: string }) {
  const [acik, setAcik] = useState(false)
  const [sifre, setSifre] = useState('')
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [mesaj, setMesaj] = useState<{ tur: 'ok' | 'hata'; metin: string } | null>(null)

  async function kaydet() {
    if (sifre.length < 6) {
      setMesaj({ tur: 'hata', metin: 'Şifre en az 6 karakter olmalı.' })
      return
    }

    setKaydediliyor(true)
    setMesaj(null)

    const res = await fetch('/api/superadmin/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: kullanici.id, newPassword: sifre }),
    })
    const data = await res.json()

    setKaydediliyor(false)

    if (!res.ok) {
      setMesaj({ tur: 'hata', metin: data.error || 'Değiştirilemedi' })
      return
    }

    setMesaj({ tur: 'ok', metin: 'Şifre değiştirildi.' })
    setSifre('')
    setTimeout(() => setAcik(false), 1500)
  }

  return (
    <div className="bg-[#231B14] border border-[#2A2119] rounded-lg px-4 py-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-sm text-[#D8CBB8] min-w-0 break-all">{kullanici.email}</span>
        <button
          onClick={() => setAcik((v) => !v)}
          className="font-[family-name:var(--font-mono)] text-xs px-3 py-1.5 border border-[#3A2F24] rounded-full text-[#8A7C68] hover:border-[#C9A876] hover:text-[#C9A876] transition-colors shrink-0"
        >
          {acik ? 'Vazgeç' : 'Şifre değiştir'}
        </button>
      </div>

      {acik && (
        <div className="flex items-center gap-2 mt-3">
          <input
            type="text"
            placeholder="Yeni şifre"
            value={sifre}
            onChange={(e) => setSifre(e.target.value)}
            className={inputClass}
          />
          <button
            onClick={kaydet}
            disabled={kaydediliyor}
            className="shrink-0 font-[family-name:var(--font-mono)] text-xs px-4 py-2.5 bg-[#C9A876] text-[#1B2318] font-medium rounded-full hover:bg-[#d9bb8e] transition-colors disabled:opacity-60"
          >
            {kaydediliyor ? '…' : 'Kaydet'}
          </button>
        </div>
      )}

      {mesaj && (
        <p className={`text-xs mt-2 ${mesaj.tur === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
          {mesaj.metin}
        </p>
      )}
    </div>
  )
}

function YeniRestoranFormu({
  token,
  onOlusturuldu,
}: {
  token: string
  onOlusturuldu: () => void
}) {
  const [form, setForm] = useState({ name: '', slug: '', email: '', password: '' })
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [mesaj, setMesaj] = useState<{ tur: 'ok' | 'hata'; metin: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setKaydediliyor(true)
    setMesaj(null)

    const res = await fetch('/api/superadmin/create-restaurant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    setKaydediliyor(false)

    if (!res.ok) {
      setMesaj({ tur: 'hata', metin: data.error || 'Oluşturulamadı' })
      return
    }

    setMesaj({ tur: 'ok', metin: 'Restoran ve kullanıcı oluşturuldu.' })
    setForm({ name: '', slug: '', email: '', password: '' })
    onOlusturuldu()
  }

  return (
    <div className="bg-[#1E1811] border border-[#2A2119] rounded-2xl p-4 sm:p-6">
      <h2 className="font-[family-name:var(--font-display)] text-xl mb-4">Yeni restoran ekle</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Restoran adı"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={inputClass}
        />
        <input
          type="text"
          placeholder="Slug (ör. kebapci-ali)"
          required
          pattern="[a-z0-9\-]+"
          title="Sadece küçük harf, rakam ve tire"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          className={inputClass}
        />
        <input
          type="email"
          placeholder="Sahibinin e-postası"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={inputClass}
        />
        <input
          type="text"
          placeholder="Şifre"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={kaydediliyor}
          className="md:col-span-2 font-[family-name:var(--font-mono)] text-sm px-5 py-2.5 bg-[#C9A876] text-[#1B2318] font-medium rounded-full hover:bg-[#d9bb8e] transition-colors disabled:opacity-60"
        >
          {kaydediliyor ? 'Oluşturuluyor…' : 'Oluştur'}
        </button>
      </form>
      {mesaj && (
        <p className={`text-sm mt-3 ${mesaj.tur === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
          {mesaj.metin}
        </p>
      )}
    </div>
  )
}
