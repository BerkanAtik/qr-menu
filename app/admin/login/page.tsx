'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email veya şifre hatalı.')
      setLoading(false)
      return
    }

    router.push('/admin')
  }

  return (
    <div className="min-h-screen bg-[#14100C] flex items-center justify-center px-4 sm:px-6 py-10">
      <form
        onSubmit={handleLogin}
        className="max-w-md w-full bg-[#1E1811] rounded-2xl border border-[#2A2119] shadow-xl p-6 sm:p-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-11 h-11 text-[#C9A876] mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M7 21V13.5C4.5 12.6 3 10.5 3 8a4 4 0 0 1 4-4c.5 0 1 .1 1.4.3A4 4 0 0 1 12 2a4 4 0 0 1 3.6 2.3c.4-.2.9-.3 1.4-.3a4 4 0 0 1 4 4c0 2.5-1.5 4.6-4 5.5V21Z" strokeLinejoin="round" />
              <path d="M7 17h10" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="font-[family-name:var(--font-display)] italic text-3xl text-[#F5EFE4] mb-2">
            Yönetim Paneli
          </h1>
          <p className="text-[#8A7C68] text-base">Restoran hesabınla giriş yap</p>
        </div>

        <label className="block font-[family-name:var(--font-mono)] text-sm uppercase tracking-wider text-[#8A7C68] mb-2">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-[#231B14] border border-[#3A2F24] rounded-lg px-4 py-3.5 mb-5 text-base text-[#F5EFE4] placeholder:text-[#8A7C68] outline-none focus:border-[#C9A876] transition-colors"
        />

        <label className="block font-[family-name:var(--font-mono)] text-sm uppercase tracking-wider text-[#8A7C68] mb-2">
          Şifre
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full bg-[#231B14] border border-[#3A2F24] rounded-lg px-4 py-3.5 mb-5 text-base text-[#F5EFE4] placeholder:text-[#8A7C68] outline-none focus:border-[#C9A876] transition-colors"
        />

        {error && <p className="text-base text-red-400 mb-5">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full font-[family-name:var(--font-mono)] text-base px-5 py-3.5 bg-[#C9A876] text-[#1B2318] font-medium rounded-full hover:bg-[#d9bb8e] transition-colors disabled:opacity-60"
        >
          {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
        </button>
      </form>
    </div>
  )
}
