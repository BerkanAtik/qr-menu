import { supabase } from '@/lib/supabase'
import { supabaseServer } from '@/lib/supabaseServer'
import AdminQR from '@/components/AdminQR'

const TOPLAM_MASA = 12

export default async function QRPage() {
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', 'test-restoran')
    .single()

  if (!restaurant) {
    return <div className="text-[#F5EFE4] p-8">Restoran bulunamadı.</div>
  }

  // 1'den 15'e kadar masaları kontrol et, eksik olanları oluştur
  const { data: existingTables } = await supabase
    .from('tables')
    .select('table_no')
    .eq('restaurant_id', restaurant.id)

  const existingNos = new Set((existingTables || []).map((t) => t.table_no))
  const missing = []
  for (let i = 1; i <= TOPLAM_MASA; i++) {
    if (!existingNos.has(i)) missing.push({ restaurant_id: restaurant.id, table_no: i })
  }

  if (missing.length > 0) {
    // Masa oluşturma RLS altında admin-only bir yazma işlemi; bu sunucu bileşeninde
    // oturum bilgisi olmadığı için service role client ile yapılır.
    await supabaseServer.from('tables').insert(missing)
  }

  return <AdminQR totalTables={TOPLAM_MASA} />
}
