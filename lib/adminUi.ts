// Yönetim panelindeki form alanlarının ortak Tailwind sınıfları.
// Aynı diziler birden fazla bileşende tekrarlanmasın diye tek yerde tutuluyor.

export const inputClass =
  'w-full bg-[#231B14] border border-[#3A2F24] rounded-lg px-4 py-3 text-base text-[#F5EFE4] placeholder:text-[#8A7C68] outline-none focus:border-[#C9A876] transition-colors'

// Süper admin panelindeki dar satır içi formlar için küçük varyant.
export const inputClassCompact =
  'w-full bg-[#231B14] border border-[#3A2F24] rounded-lg px-3.5 py-2.5 text-sm text-[#F5EFE4] placeholder:text-[#8A7C68] outline-none focus:border-[#C9A876] transition-colors'

export const labelClass =
  'block font-[family-name:var(--font-mono)] text-sm uppercase tracking-wider text-[#8A7C68] mb-2'
