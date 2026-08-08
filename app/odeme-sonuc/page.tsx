'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

function SonucIcerik() {
  const params = useSearchParams()
  const status = params.get('status')
  const success = status === 'success'

  return (
    <div className="min-h-screen bg-[#FAF7F1] flex items-center justify-center px-6">
      <div className="max-w-sm w-full bg-white rounded-sm border border-[#E5DCCF] shadow-sm p-8 text-center">
        <div
          className={`w-12 h-12 rounded-full text-white flex items-center justify-center mx-auto mb-4 text-xl ${
            success ? 'bg-[#7A2E33]' : 'bg-gray-400'
          }`}
        >
          {success ? '✓' : '✕'}
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-[#2B2420] mb-2">
          {success ? 'Ödemeniz alındı' : 'Ödeme başarısız'}
        </h1>
        <p className="text-[#7A7267] text-sm mb-6">
          {success
            ? 'Siparişiniz mutfağa iletildi, afiyet olsun.'
            : 'Ödeme tamamlanamadı, lütfen tekrar deneyin.'}
        </p>
        <Link
          href="/"
          className="inline-block font-[family-name:var(--font-mono)] text-sm px-5 py-2.5 bg-[#2B2420] text-white rounded-sm hover:bg-[#453b32] transition-colors"
        >
          Menüye dön
        </Link>
      </div>
    </div>
  )
}

export default function OdemeSonuc() {
  return (
    <Suspense>
      <SonucIcerik />
    </Suspense>
  )
}
