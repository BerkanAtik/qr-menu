'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type OrderItem = {
  id: string
  quantity: number
  unit_price: number
  products: { name: string } | null
}

export type Order = {
  id: string
  status: string
  total: number
  created_at: string
  tables: { table_no: number } | null
  order_items: OrderItem[]
}

// Müşteri ödeme akışı bir siparişi 'pending' ile oluşturup ödeme onaylanınca 'preparing'e çeker;
// admin tarafında ikisi de aynı "Hazırlanıyor" aşaması olarak gösterilir, ayrı bir onay adımı yok.
const STATUS_LABELS: Record<string, string> = {
  pending: 'Hazırlanıyor',
  preparing: 'Hazırlanıyor',
  ready: 'Hazır',
  delivered: 'Teslim edildi',
  cancelled: 'İptal edildi',
}

const STATUS_FLOW: Record<string, string | null> = {
  pending: 'ready',
  preparing: 'ready',
  ready: 'delivered',
  delivered: null,
  cancelled: null,
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-blue-500/15 text-blue-300',
  preparing: 'bg-blue-500/15 text-blue-300',
  ready: 'bg-emerald-500/15 text-emerald-300',
  delivered: 'bg-[#3A2F24] text-[#8A7C68]',
  cancelled: 'bg-red-500/15 text-red-300',
}

export default function AdminOrders({
  restaurantId,
  initialOrders,
}: {
  restaurantId: string
  initialOrders: Order[]
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)

  async function refreshOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*, tables(table_no), order_items(id, quantity, unit_price, products(name))')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })

    if (data) setOrders(data as unknown as Order[])
  }

  useEffect(() => {
    // RLS altında sunucu tarafındaki ilk yükleme (oturumsuz) boş dönebilir;
    // tarayıcıdaki oturumlu client ile mount anında tazeliyoruz.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- oturumlu ilk veri çekimi
    refreshOrders()

    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          // Herhangi bir değişiklik olduğunda listeyi yeniden çek
          refreshOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId])

  async function updateStatus(orderId: string, newStatus: string) {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (error) {
      alert('Durum güncellenemedi: ' + error.message)
      return
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    )
  }

  const activeOrders = orders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled'
  )
  const pastOrders = orders.filter(
    (o) => o.status === 'delivered' || o.status === 'cancelled'
  )

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] italic text-3xl text-[#F5EFE4] mb-8">
        Siparişler
      </h1>

      {activeOrders.length === 0 && (
        <p className="text-[#8A7C68] text-base mb-8">Şu an bekleyen sipariş yok.</p>
      )}

      <div className="space-y-4 mb-10">
        {activeOrders.map((order) => (
          <div key={order.id} className="bg-[#1E1811] border border-[#2A2119] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="font-[family-name:var(--font-mono)] text-base text-[#F5EFE4]">
                  Masa {order.tables?.table_no ?? '-'}
                </span>
                <span className="text-sm text-[#8A7C68] ml-3">
                  {new Date(order.created_at).toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <span
                className={`text-sm px-3 py-1.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}
              >
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </div>

            <div className="text-base text-[#D8CBB8] mb-4 space-y-1">
              {order.order_items?.map((item) => (
                <div key={item.id}>
                  {item.quantity}x {item.products?.name || 'Ürün'}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="font-[family-name:var(--font-mono)] text-lg text-[#C9A876] font-medium">
                {order.total.toFixed(2)} ₺
              </span>

              {STATUS_FLOW[order.status] && (
                <button
                  onClick={() => updateStatus(order.id, STATUS_FLOW[order.status]!)}
                  className="font-[family-name:var(--font-mono)] text-sm px-4 py-2 bg-[#C9A876] text-[#1B2318] font-medium rounded-full hover:bg-[#d9bb8e] transition-colors"
                >
                  {STATUS_LABELS[STATUS_FLOW[order.status]!]} yap
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {pastOrders.length > 0 && (
        <>
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F5EFE4] mb-4">
            Geçmiş
          </h2>
          <div className="space-y-2.5">
            {pastOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between bg-[#1E1811] border border-[#2A2119] rounded-xl px-5 py-3 text-base"
              >
                <span className="text-[#D8CBB8]">
                  Masa {order.tables?.table_no ?? '-'} · {order.total.toFixed(2)} ₺
                </span>
                <span
                  className={`text-sm px-3 py-1 rounded-full ${STATUS_COLORS[order.status]}`}
                >
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
