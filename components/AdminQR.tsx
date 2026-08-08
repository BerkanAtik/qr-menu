'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import QRCode from 'qrcode'

export default function AdminQR({
  totalTables,
}: {
  totalTables: number
}) {
  const [qrCodes, setQrCodes] = useState<{ tableNo: number; dataUrl: string; url: string }[]>([])

  useEffect(() => {
    async function generate() {
      const baseUrl = window.location.origin
      const codes = []

      for (let i = 1; i <= totalTables; i++) {
        const url = `${baseUrl}/masa/${i}`
        const dataUrl = await QRCode.toDataURL(url, {
          width: 300,
          margin: 1,
          color: { dark: '#2B2420', light: '#FFFFFF' },
        })
        codes.push({ tableNo: i, dataUrl, url })
      }

      setQrCodes(codes)
    }

    generate()
  }, [totalTables])

  function downloadQR(tableNo: number, dataUrl: string) {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `masa-${tableNo}-qr.png`
    link.click()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 print:hidden">
        <h1 className="font-[family-name:var(--font-display)] italic text-3xl text-[#F5EFE4]">
          QR Kodlar
        </h1>
        <button
          onClick={() => window.print()}
          className="font-[family-name:var(--font-mono)] text-base px-5 py-3 bg-[#C9A876] text-[#1B2318] font-medium rounded-full hover:bg-[#d9bb8e] transition-colors"
        >
          Tümünü yazdır
        </button>
      </div>

      {qrCodes.length === 0 && (
        <p className="text-[#8A7C68] text-base">QR kodlar oluşturuluyor…</p>
      )}

      <div className="grid grid-cols-3 gap-5 print:grid-cols-2 print:gap-8">
        {qrCodes.map(({ tableNo, dataUrl, url }) => (
          <div
            key={tableNo}
            className="bg-[#1E1811] print:bg-white border border-[#2A2119] print:border-gray-300 rounded-2xl print:rounded-none p-5 flex flex-col items-center text-center print:break-inside-avoid"
          >
            <span className="font-[family-name:var(--font-display)] text-xl text-[#F5EFE4] print:text-black mb-3">
              Masa {tableNo}
            </span>
            <Image
              src={dataUrl}
              alt={`Masa ${tableNo} QR kodu`}
              width={176}
              height={176}
              unoptimized
              className="w-44 h-44"
            />
            <span className="font-[family-name:var(--font-mono)] text-xs text-[#8A7C68] print:text-black mt-3 break-all">
              {url}
            </span>
            <button
              onClick={() => downloadQR(tableNo, dataUrl)}
              className="print:hidden mt-4 font-[family-name:var(--font-mono)] text-sm px-4 py-2 border border-[#3A2F24] text-[#8A7C68] rounded-full hover:border-[#C9A876] hover:text-[#C9A876] transition-colors"
            >
              İndir
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
