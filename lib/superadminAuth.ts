import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseServer } from '@/lib/supabaseServer'

// /api/superadmin/* route'ları bu fonksiyonla açılıyor. İstek, giriş yapmış
// kullanıcının access token'ını "Authorization: Bearer <token>" başlığında
// taşır; token doğrulanıp kullanıcının platform_admins tablosunda olup
// olmadığına bakılır. İkisi de sağlanmazsa null döner ve route 403 verir.
export async function verifyPlatformAdmin(req: NextRequest) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '').trim()
  if (!token) return null

  const caller = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Token'ı doğrudan getUser'a veriyoruz; client'a header olarak eklemek
  // auth.getUser()'ın kendi (boş) oturum durumunu kullanmasına engel olmuyor.
  const { data, error } = await caller.auth.getUser(token)
  if (error || !data.user) return null

  // Service role ile sorgulanıyor çünkü platform_admins RLS'i yalnızca
  // "kendi satırını okuyabilir" izni veriyor; burada asıl kontrol zaten bu.
  const { data: adminRow } = await supabaseServer
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', data.user.id)
    .maybeSingle()

  if (!adminRow) return null

  return { userId: data.user.id, email: data.user.email ?? null }
}
