import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { verifyPlatformAdmin } from '@/lib/superadminAuth'

export async function GET(req: NextRequest) {
  const admin = await verifyPlatformAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { data: restaurants, error: rErr } = await supabaseServer
    .from('restaurants')
    .select('id, name, slug, table_count')
    .order('name', { ascending: true })

  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 })

  const { data: links, error: lErr } = await supabaseServer
    .from('restaurant_users')
    .select('user_id, restaurant_id')

  if (lErr) return NextResponse.json({ error: lErr.message }, { status: 500 })

  // Kullanıcı e-postaları auth.users içinde, herkese açık bir tabloda değil;
  // bu yüzden Admin API'den (service role) listeleyip id üzerinden eşliyoruz.
  const { data: usersPage, error: uErr } = await supabaseServer.auth.admin.listUsers({
    perPage: 1000,
  })
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 })

  const emailById = new Map(usersPage.users.map((u) => [u.id, u.email || '(e-posta yok)']))

  const sonuc = (restaurants || []).map((r) => ({
    ...r,
    kullanicilar: (links || [])
      .filter((l) => l.restaurant_id === r.id)
      .map((l) => ({ id: l.user_id, email: emailById.get(l.user_id) || '(bilinmiyor)' })),
  }))

  return NextResponse.json({ restaurants: sonuc })
}
