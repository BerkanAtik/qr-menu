import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { verifyPlatformAdmin } from '@/lib/superadminAuth'

export async function POST(req: NextRequest) {
  const admin = await verifyPlatformAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { restaurantId, name, slug, tableCount } = await req.json()

  if (!restaurantId || !name || !slug) {
    return NextResponse.json({ error: 'Tüm alanlar zorunlu' }, { status: 400 })
  }

  const masa = parseInt(tableCount)

  const { error } = await supabaseServer
    .from('restaurants')
    .update({ name, slug, table_count: Number.isNaN(masa) || masa < 1 ? 1 : masa })
    .eq('id', restaurantId)

  if (error) {
    const mesaj = error.code === '23505' ? 'Bu slug zaten kullanılıyor' : error.message
    return NextResponse.json({ error: 'Güncellenemedi: ' + mesaj }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
