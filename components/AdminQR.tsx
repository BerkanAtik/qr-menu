'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import QRCode from 'qrcode'
import { supabase } from '@/lib/supabase'

export type Masa = { id: string; table_no: number }

type Kod = { id: string; tableNo: number; dataUrl: string; url: string }

async function qrUret(url: string) {
  return QRCode.toDataURL(url, {
    width: 300,
    margin: 1,
    color: { dark: '#2B2420', light: '#FFFFFF' },
  })
}

export default function AdminQR({
  restaurantId,
  slug,
  tableCount,
  initialTables,
}: {
  restaurantId: string
  slug: string
  tableCount: number
  initialTables: Masa[]
}) {
  const [tables, setTables] = useState<Masa[]>(initialTables)
  const [codes, setCodes] = useState<Kod[]>([])
  const [uretiliyor, setUretiliyor] = useState(true)
  const [silinen, setSilinen] = useState<string | null>(null)
  const [yenilenen, setYenilenen] = useState<string | null>(null)
  const [yenilendiMesaji, setYenilendiMesaji] = useState<string | null>(null)
  const [topluIslem, setTopluIslem] = useState(false)

  useEffect(() => {
    let iptal = false

    async function tumunuUret() {
      setUretiliyor(true)
      const baseUrl = window.location.origin
      const sonuc: Kod[] = []

      for (const masa of [...tables].sort((a, b) => a.table_no - b.table_no)) {
        // Adres restoranın slug'ını içeriyor: menuza.com/kebapci-ali/masa/3
        const url = `${baseUrl}/${slug}/masa/${masa.table_no}`
        const dataUrl = await qrUret(url)
        sonuc.push({ id: masa.id, tableNo: masa.table_no, dataUrl, url })
      }

      if (!iptal) {
        setCodes(sonuc)
        setUretiliyor(false)
      }
    }

    tumunuUret()
    return () => {
      iptal = true
    }
     
  }, [tables, slug])

  // Gerçek masa listesini veritabanından tazeler. Silme/ekleme işlemlerinden
  // sonra ekrandaki listenin veritabanıyla birebir aynı olduğundan emin
  // olmak için kullanılıyor — RLS bir işlemi sessizce (hatasız ama 0 satır
  // etkileyerek) engellerse ekran yanlış bir görüntüde takılı kalmasın diye.
  async function veritabanindanTazele() {
    const { data, error } = await supabase
      .from('tables')
      .select('id, table_no')
      .eq('restaurant_id', restaurantId)
      .order('table_no', { ascending: true })

    if (error) {
      alert('Masa listesi okunamadı: ' + error.message)
      return
    }

    setTables(data || [])
  }

  function downloadQR(tableNo: number, dataUrl: string) {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `masa-${tableNo}-qr.png`
    link.click()
  }

  async function tekYenile(kod: Kod) {
    setYenilenen(kod.id)
    const dataUrl = await qrUret(kod.url)
    setCodes((prev) => prev.map((k) => (k.id === kod.id ? { ...k, dataUrl } : k)))
    setYenilenen(null)
    // QR içeriği masa numarasından türediği için görsel aynı kalabilir; en
    // azından tıklamanın işe yaradığını göstermek için kısa bir onay veriyoruz.
    setYenilendiMesaji(kod.id)
    setTimeout(() => setYenilendiMesaji(null), 1500)
  }

  async function tekSil(kod: Kod) {
    if (
      !confirm(
        `Masa ${kod.tableNo} silinecek. Bu masaya ait bekleyen/geçmiş servis talepleri de birlikte silinir. Emin misin?`
      )
    )
      return

    setSilinen(kod.id)
    const { data, error } = await supabase.from('tables').delete().eq('id', kod.id).select('id')
    setSilinen(null)

    if (error) {
      alert('Silinemedi: ' + error.message)
      return
    }

    // RLS izin vermediğinde Supabase hata değil, 0 satır etkilenmiş bir
    // "başarı" döndürebilir. Bu durumda ekranı DB'deki gerçek duruma göre
    // tazeleyip kullanıcıyı bilgilendiriyoruz; aksi halde masa ekranda silinmiş
    // görünüp veritabanında durmaya devam eder.
    if (!data || data.length === 0) {
      alert('Bu masa silinemedi (yetki sorunu olabilir). Liste güncel haliyle tazelendi.')
      await veritabanindanTazele()
      return
    }

    setTables((prev) => prev.filter((t) => t.id !== kod.id))
  }

  async function tekMasaEkle() {
    setTopluIslem(true)
    const sonrakiNo = tables.length > 0 ? Math.max(...tables.map((t) => t.table_no)) + 1 : 1

    const { data, error } = await supabase
      .from('tables')
      .insert({ restaurant_id: restaurantId, table_no: sonrakiNo })
      .select('id, table_no')
      .single()

    setTopluIslem(false)

    if (error) {
      alert('Masa eklenemedi: ' + error.message)
      return
    }

    setTables((prev) => [...prev, data].sort((a, b) => a.table_no - b.table_no))
  }

  async function tumunuYenile() {
    setTopluIslem(true)

    // Masa sayısı Bilgiler sayfasından güncellenmiş olabilir; prop üzerinden
    // gelen tableCount aynı oturumda bayatlamış olabileceği için burada
    // veritabanından taze değeri okuyoruz.
    const { data: restoranGuncel, error: rErr } = await supabase
      .from('restaurants')
      .select('table_count')
      .eq('id', restaurantId)
      .single()

    if (rErr || !restoranGuncel) {
      setTopluIslem(false)
      alert('Masa sayısı okunamadı: ' + (rErr?.message || 'bilinmeyen hata'))
      return
    }

    const guncelSayi = restoranGuncel.table_count

    const { data: mevcut, error: mErr } = await supabase
      .from('tables')
      .select('id, table_no')
      .eq('restaurant_id', restaurantId)

    if (mErr) {
      setTopluIslem(false)
      alert('Masa listesi okunamadı: ' + mErr.message)
      return
    }

    const mevcutNolar = new Set((mevcut || []).map((t) => t.table_no))
    const eksik = []
    for (let i = 1; i <= guncelSayi; i++) {
      if (!mevcutNolar.has(i)) eksik.push({ restaurant_id: restaurantId, table_no: i })
    }

    let tamListe = mevcut || []
    if (eksik.length > 0) {
      const { data: eklenen, error } = await supabase
        .from('tables')
        .insert(eksik)
        .select('id, table_no')
      if (error) {
        setTopluIslem(false)
        alert('Masalar oluşturulamadı: ' + error.message)
        return
      }
      tamListe = [...tamListe, ...(eklenen || [])]
    }

    setTables(tamListe.sort((a, b) => a.table_no - b.table_no))
    setTopluIslem(false)
  }

  async function tumunuSil() {
    if (
      !confirm(
        `Tüm masalar (${tables.length} adet) ve bunlara ait tüm servis talebi geçmişi kalıcı olarak silinecek. Bu işlem geri alınamaz. Emin misin?`
      )
    )
      return

    setTopluIslem(true)
    const { data, error } = await supabase
      .from('tables')
      .delete()
      .eq('restaurant_id', restaurantId)
      .select('id')
    setTopluIslem(false)

    if (error) {
      alert('Silinemedi: ' + error.message)
      return
    }

    if (!data || data.length === 0) {
      alert('Masalar silinemedi (yetki sorunu olabilir). Liste güncel haliyle tazelendi.')
      await veritabanindanTazele()
      return
    }

    setTables([])
    setCodes([])
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 print:hidden gap-3 flex-wrap">
        <h1 className="font-[family-name:var(--font-display)] italic text-2xl sm:text-3xl text-[#F5EFE4]">
          QR Kodlar
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={tekMasaEkle}
            disabled={topluIslem}
            className="font-[family-name:var(--font-mono)] text-sm px-4 py-2.5 border border-[#3A2F24] text-[#8A7C68] rounded-full hover:border-[#C9A876] hover:text-[#C9A876] transition-colors disabled:opacity-60"
          >
            + Masa ekle
          </button>
          <button
            onClick={tumunuYenile}
            disabled={topluIslem}
            className="font-[family-name:var(--font-mono)] text-sm px-4 py-2.5 border border-[#3A2F24] text-[#8A7C68] rounded-full hover:border-[#C9A876] hover:text-[#C9A876] transition-colors disabled:opacity-60"
          >
            {topluIslem ? '…' : 'Tümünü yenile'}
          </button>
          <button
            onClick={tumunuSil}
            disabled={topluIslem || tables.length === 0}
            className="font-[family-name:var(--font-mono)] text-sm px-4 py-2.5 border border-[#3A2F24] text-[#B87A7E] rounded-full hover:border-red-400 hover:text-red-400 transition-colors disabled:opacity-60"
          >
            Tümünü sil
          </button>
          <button
            onClick={() => window.print()}
            className="font-[family-name:var(--font-mono)] text-base px-5 py-2.5 bg-[#C9A876] text-[#1B2318] font-medium rounded-full hover:bg-[#d9bb8e] transition-colors"
          >
            Tümünü yazdır
          </button>
        </div>
      </div>

      {uretiliyor && codes.length === 0 && (
        <p className="text-[#8A7C68] text-base">QR kodlar oluşturuluyor…</p>
      )}
      {!uretiliyor && codes.length === 0 && (
        <div className="print:hidden bg-[#1E1811] border border-[#2A2119] rounded-2xl p-8 text-center mb-6">
          <p className="text-[#F5EFE4] text-base mb-5">Hiç masa yok.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={tumunuYenile}
              disabled={topluIslem}
              className="font-[family-name:var(--font-mono)] text-sm px-5 py-2.5 bg-[#C9A876] text-[#1B2318] font-medium rounded-full hover:bg-[#d9bb8e] transition-colors disabled:opacity-60"
            >
              {topluIslem ? '…' : `${tableCount} masayı baştan oluştur`}
            </button>
            <button
              onClick={tekMasaEkle}
              disabled={topluIslem}
              className="font-[family-name:var(--font-mono)] text-sm px-5 py-2.5 border border-[#3A2F24] text-[#D8CBB8] rounded-full hover:border-[#C9A876] hover:text-[#C9A876] transition-colors disabled:opacity-60"
            >
              Tek masa ekle
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 print:grid-cols-2 print:gap-8">
        {codes.map((kod) => (
          <div
            key={kod.id}
            className="bg-[#1E1811] print:bg-white border border-[#2A2119] print:border-gray-300 rounded-2xl print:rounded-none p-5 flex flex-col items-center text-center print:break-inside-avoid"
          >
            <span className="font-[family-name:var(--font-display)] text-xl text-[#F5EFE4] print:text-black mb-3">
              Masa {kod.tableNo}
            </span>
            <Image
              src={kod.dataUrl}
              alt={`Masa ${kod.tableNo} QR kodu`}
              width={176}
              height={176}
              unoptimized
              className="w-full max-w-44 h-auto aspect-square"
            />
            <a
              href={kod.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-[family-name:var(--font-mono)] text-xs text-[#8A7C68] hover:text-[#C9A876] print:text-black mt-3 break-all underline decoration-dotted underline-offset-2"
            >
              {kod.url}
            </a>
            <div className="print:hidden flex items-center justify-center flex-wrap gap-2 mt-4">
              <button
                onClick={() => downloadQR(kod.tableNo, kod.dataUrl)}
                className="font-[family-name:var(--font-mono)] text-sm px-3.5 py-2 border border-[#3A2F24] text-[#8A7C68] rounded-full hover:border-[#C9A876] hover:text-[#C9A876] transition-colors"
              >
                İndir
              </button>
              <button
                onClick={() => tekYenile(kod)}
                disabled={yenilenen === kod.id}
                className="font-[family-name:var(--font-mono)] text-sm px-3.5 py-2 border border-[#3A2F24] text-[#8A7C68] rounded-full hover:border-[#C9A876] hover:text-[#C9A876] transition-colors disabled:opacity-60"
              >
                {yenilenen === kod.id ? '…' : yenilendiMesaji === kod.id ? 'Yenilendi ✓' : 'Yenile'}
              </button>
              <button
                onClick={() => tekSil(kod)}
                disabled={silinen === kod.id}
                className="font-[family-name:var(--font-mono)] text-sm px-3.5 py-2 border border-[#3A2F24] text-[#B87A7E] rounded-full hover:border-red-400 hover:text-red-400 transition-colors disabled:opacity-60"
              >
                {silinen === kod.id ? '…' : 'Sil'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
