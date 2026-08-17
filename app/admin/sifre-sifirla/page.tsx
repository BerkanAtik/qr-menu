'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function SifreSifirlaPage() {
  // Mail'deki linke tıklanınca Supabase JS, adresteki token'ı otomatik
  // okuyup geçici bir "recovery" oturumu açar (detectSessionInUrl varsayılan
  // olarak açık). Bu oturum sadece şifre güncellemek için kullanılabilir.
  const [hazir, setHazir] = useState(false)
  const [gecersiz, setGecersiz] = useState(false)
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [tamam, setTamam] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setHazir(true)
      } else {
        setGecersiz(true)
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı.')
      return
    }
    if (password !== password2) {
      setError('Şifreler birbiriyle eşleşmiyor.')
      return
    }

    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)

    if (error) {
      setError('Şifre güncellenemedi: ' + error.message)
      return
    }

    setTamam(true)
    setTimeout(() => router.push('/admin'), 1500)
  }

  if (gecersiz) {
    return (
      <div className="min-h-screen bg-[#14100C] flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="max-w-md w-full bg-[#1E1811] rounded-2xl border border-[#2A2119] shadow-xl p-6 sm:p-10 text-center">
          <h1 className="font-[family-name:var(--font-display)] italic text-2xl text-[#F5EFE4] mb-3">
            Link geçersiz veya süresi dolmuş
          </h1>
          <p className="text-[#8A7C68] text-base mb-6">
            Şifre sıfırlama linkleri kısa süre sonra geçersiz olur ve yalnızca bir kez
            kullanılabilir. Giriş sayfasından yeni bir link isteyin.
          </p>
          <Link
            href="/admin/login"
            className="inline-block font-[family-name:var(--font-mono)] text-base px-5 py-3 bg-[#C9A876] text-[#1B2318] font-medium rounded-full hover:bg-[#d9bb8e] transition-colors"
          >
            Giriş sayfasına dön
          </Link>
        </div>
      </div>
    )
  }

  if (!hazir) {
    return (
      <div className="min-h-screen bg-[#14100C] flex items-center justify-center">
        <p className="text-[#8A7C68] text-sm">Yükleniyor…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#14100C] flex items-center justify-center px-4 sm:px-6 py-10">
      <form
        onSubmit={handleSubmit}
        className="max-w-md w-full bg-[#1E1811] rounded-2xl border border-[#2A2119] shadow-xl p-6 sm:p-10"
      >
        <h1 className="font-[family-name:var(--font-display)] italic text-2xl text-[#F5EFE4] mb-2">
          Yeni şifre belirle
        </h1>
        <p className="text-[#8A7C68] text-base mb-7">Hesabın için yeni bir şifre gir.</p>

        <label className="block font-[family-name:var(--font-mono)] text-sm uppercase tracking-wider text-[#8A7C68] mb-2">
          Yeni şifre
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full bg-[#231B14] border border-[#3A2F24] rounded-lg px-4 py-3.5 mb-5 text-base text-[#F5EFE4] outline-none focus:border-[#C9A876] transition-colors"
        />

        <label className="block font-[family-name:var(--font-mono)] text-sm uppercase tracking-wider text-[#8A7C68] mb-2">
          Yeni şifre (tekrar)
        </label>
        <input
          type="password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          required
          minLength={6}
          className="w-full bg-[#231B14] border border-[#3A2F24] rounded-lg px-4 py-3.5 mb-5 text-base text-[#F5EFE4] outline-none focus:border-[#C9A876] transition-colors"
        />

        {error && <p className="text-base text-red-400 mb-5">{error}</p>}
        {tamam && (
          <p className="text-base text-emerald-400 mb-5">Şifre güncellendi, yönlendiriliyor…</p>
        )}

        <button
          type="submit"
          disabled={saving || tamam}
          className="w-full font-[family-name:var(--font-mono)] text-base px-5 py-3.5 bg-[#C9A876] text-[#1B2318] font-medium rounded-full hover:bg-[#d9bb8e] transition-colors disabled:opacity-60"
        >
          {saving ? 'Kaydediliyor…' : 'Şifreyi güncelle'}
        </button>
      </form>
    </div>
  )
}
