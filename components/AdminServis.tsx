'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type ServiceRequest = {
  id: string
  status: string
  type: string
  created_at: string
  tables: { table_no: number } | null
}

const TYPE_LABELS: Record<string, string> = {
  garson: 'Garson çağrısı',
  hesap: 'Hesap isteniyor',
  su: 'Su isteniyor',
}

export default function AdminServis({
  restaurantId,
  initialRequests,
}: {
  restaurantId: string
  initialRequests: ServiceRequest[]
}) {
  const [requests, setRequests] = useState<ServiceRequest[]>(initialRequests)

  async function refreshRequests() {
    const { data } = await supabase
      .from('service_requests')
      .select('*, tables(table_no)')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })

    if (data) setRequests(data as unknown as ServiceRequest[])
  }

  useEffect(() => {
    // RLS altında sunucu tarafındaki ilk yükleme (oturumsuz) boş dönebilir;
    // tarayıcıdaki oturumlu client ile mount anında tazeliyoruz.
    refreshRequests()

    const channel = supabase
      .channel('service-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          refreshRequests()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId])

  async function markHandled(id: string) {
    const { error } = await supabase
      .from('service_requests')
      .update({ status: 'handled' })
      .eq('id', id)

    if (error) {
      alert('Güncellenemedi: ' + error.message)
      return
    }

    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'handled' } : r)))
  }

  const pending = requests.filter((r) => r.status === 'pending')
  const handled = requests.filter((r) => r.status === 'handled')

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] italic text-3xl text-[#F5EFE4] mb-8">
        Servis Talepleri
      </h1>

      {pending.length === 0 && (
        <p className="text-[#8A7C68] text-base mb-8">Bekleyen servis talebi yok.</p>
      )}

      <div className="space-y-3.5 mb-10">
        {pending.map((req) => (
          <div
            key={req.id}
            className="flex items-center justify-between bg-[#1E1811] border border-[#2A2119] rounded-2xl px-5 py-4"
          >
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-[family-name:var(--font-mono)] text-base text-[#F5EFE4]">
                  Masa {req.tables?.table_no ?? '-'}
                </span>
                <span className="text-sm px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300">
                  {TYPE_LABELS[req.type] || req.type}
                </span>
              </div>
              <span className="text-sm text-[#8A7C68]">
                {new Date(req.created_at).toLocaleTimeString('tr-TR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <button
              onClick={() => markHandled(req.id)}
              className="font-[family-name:var(--font-mono)] text-sm px-4 py-2 bg-[#C9A876] text-[#1B2318] font-medium rounded-full hover:bg-[#d9bb8e] transition-colors"
            >
              Tamamlandı
            </button>
          </div>
        ))}
      </div>

      {handled.length > 0 && (
        <>
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F5EFE4] mb-4">
            Geçmiş
          </h2>
          <div className="space-y-2.5">
            {handled.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between bg-[#1E1811] border border-[#2A2119] rounded-xl px-5 py-3 text-base"
              >
                <span className="text-[#D8CBB8]">
                  Masa {req.tables?.table_no ?? '-'} · {TYPE_LABELS[req.type] || req.type}
                </span>
                <span className="text-sm px-2.5 py-1 rounded-full bg-[#3A2F24] text-[#8A7C68]">
                  Tamamlandı
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
