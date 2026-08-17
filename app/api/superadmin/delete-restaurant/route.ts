import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { verifyPlatformAdmin } from '@/lib/superadminAuth'

export async function POST(req: NextRequest) {
  const admin = await verifyPlatformAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { restaurantId } = await req.json()
  if (!restaurantId) return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })

  // Bağlı tablolarda restaurant_id -> restaurants FK'si cascade olmayabilir
  // (categories/products/tables proje başlangıcında elle oluşturulmuştu, bkz.
  // migrations/README.md). Silme sırasını FK bağımlılıklarına göre elle
  // yönetiyoruz; yalnızca restoranı ve verisini kaldırıyoruz, sahibinin
  // giriş hesabına (auth.users) dokunmuyoruz.
  const adimlar: [string, string][] = [
    ['service_requests', 'restaurant_id'],
    ['products', 'restaurant_id'],
    ['categories', 'restaurant_id'],
    ['tables', 'restaurant_id'],
    ['hero_images', 'restaurant_id'],
    ['restaurant_users', 'restaurant_id'],
  ]

  for (const [tablo, kolon] of adimlar) {
    const { error } = await supabaseServer.from(tablo).delete().eq(kolon, restaurantId)
    if (error) {
      return NextResponse.json(
        { error: `${tablo} silinirken hata: ${error.message}` },
        { status: 400 }
      )
    }
  }

  const { error } = await supabaseServer.from('restaurants').delete().eq('id', restaurantId)
  if (error) {
    return NextResponse.json({ error: 'Restoran silinemedi: ' + error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
