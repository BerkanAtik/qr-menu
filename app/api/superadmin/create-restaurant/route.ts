import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { verifyPlatformAdmin } from '@/lib/superadminAuth'

export async function POST(req: NextRequest) {
  const admin = await verifyPlatformAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { name, slug, email, password } = await req.json()

  if (!name || !slug || !email || !password) {
    return NextResponse.json({ error: 'Tüm alanlar zorunlu' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Şifre en az 6 karakter olmalı' }, { status: 400 })
  }

  const { data: restaurant, error: rErr } = await supabaseServer
    .from('restaurants')
    .insert({ name, slug })
    .select()
    .single()

  if (rErr) {
    const mesaj = rErr.code === '23505' ? 'Bu slug zaten kullanılıyor' : rErr.message
    return NextResponse.json({ error: 'Restoran oluşturulamadı: ' + mesaj }, { status: 400 })
  }

  const { data: userRes, error: uErr } = await supabaseServer.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (uErr || !userRes.user) {
    // Yarım kurulum bırakmamak için oluşturulan restoranı geri al.
    await supabaseServer.from('restaurants').delete().eq('id', restaurant.id)
    return NextResponse.json(
      { error: 'Kullanıcı oluşturulamadı: ' + (uErr?.message || 'bilinmeyen hata') },
      { status: 400 }
    )
  }

  const { error: linkErr } = await supabaseServer
    .from('restaurant_users')
    .insert({ user_id: userRes.user.id, restaurant_id: restaurant.id })

  if (linkErr) {
    return NextResponse.json(
      { error: 'Restoran ve kullanıcı oluştu ama bağlanamadı: ' + linkErr.message },
      { status: 400 }
    )
  }

  return NextResponse.json({ ok: true, restaurantId: restaurant.id })
}
