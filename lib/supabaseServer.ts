import { createClient } from '@supabase/supabase-js'

// Bu client SADECE güvenilir sunucu kodunda (API route'lar, admin server component'leri)
// kullanılır — service role key RLS'i tamamen atlar. Asla 'use client' dosyasına
// import etmeyin; NEXT_PUBLIC_ önekine sahip olmadığı için tarayıcıya zaten gönderilmez,
// ama yine de yalnızca gerçekten sunucu tarafında çalışan kodda kullanılmalı.
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
