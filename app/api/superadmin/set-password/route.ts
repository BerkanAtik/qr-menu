import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { verifyPlatformAdmin } from '@/lib/superadminAuth'

export async function POST(req: NextRequest) {
  const admin = await verifyPlatformAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { userId, newPassword } = await req.json()

  if (typeof userId !== 'string' || typeof newPassword !== 'string' || newPassword.length < 6) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }

  const { error } = await supabaseServer.auth.admin.updateUserById(userId, {
    password: newPassword,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
