import Image from 'next/image'
import Link from 'next/link'

const SITE_ADI = 'Kapmenü'
// İkon + yazı tek görselde birleşik logo (header'da bu kullanılıyor, ayrıca
// yazı basılmıyor). Sadece ikon hâli favicon için app/icon.png'de duruyor.
const NAV_LOGO_URL =
  'https://kijklfrbghnuiolnvglb.supabase.co/storage/v1/object/public/menu-images/logo/analogo.png'
// Sitenin tamamının ortak arka planı — sabit (fixed) tek katman, tüm
// section'lar bunun üzerinde şeffaf/yarı saydam duruyor.
const BACKGROUND_URL =
  'https://kijklfrbghnuiolnvglb.supabase.co/storage/v1/object/public/menu-images/background/background-image.png'

// Fiyatları buradan değiştir. KDV dahil, yıllık.
const PAKETLER = [
  {
    ad: 'Başlangıç',
    fiyat: '4.900',
    aciklama: 'Menüsünü dijitale taşımak isteyen küçük işletmeler için.',
    oneCikan: false,
    ozellikler: [
      { metin: 'QR kodlu dijital menü', yakinda: false },
      { metin: 'Sınırsız kategori ve ürün', yakinda: false },
      { metin: 'Ürün fotoğrafları', yakinda: false },
      { metin: 'Anında fiyat ve menü güncelleme', yakinda: false },
      { metin: 'Tükenen ürünü tek tuşla gizleme', yakinda: false },
      { metin: 'Masaya özel QR kod üretimi ve baskı', yakinda: false },
      { metin: 'Yönetim paneli', yakinda: false },
      { metin: 'E-posta destek', yakinda: false },
    ],
  },
  {
    ad: 'Profesyonel',
    fiyat: '7.900',
    aciklama: 'Masa servisi veren restoran ve kafeler için en çok tercih edilen paket.',
    oneCikan: true,
    ozellikler: [
      { metin: 'Başlangıç paketindeki her şey', yakinda: false },
      { metin: 'Garson çağırma ve anlık personel bildirimi', yakinda: false },
      { metin: 'Popüler Lezzetler vitrini', yakinda: false },
      { metin: 'Menü üstü tanıtım görselleri', yakinda: false },
      { metin: 'Google yorum bağlantısı ve puan rozeti', yakinda: false },
      { metin: 'Kurulum desteği: menü girişi bizden', yakinda: false },
      { metin: 'Ürün alerjen bilgisi', yakinda: true },
      { metin: 'Müşteri anketi', yakinda: true },
    ],
  },
  {
    ad: 'Kurumsal',
    fiyat: '10.900',
    aciklama: 'Turist yoğunluğu olan ve paket servis yapan işletmeler için.',
    oneCikan: false,
    ozellikler: [
      { metin: 'Profesyonel paketteki her şey', yakinda: false },
      { metin: 'Öncelikli destek', yakinda: false },
      { metin: 'Yabancı dil desteği (İngilizce / Arapça)', yakinda: true },
      { metin: 'Masada sipariş', yakinda: true },
      { metin: 'Paket servis siparişi', yakinda: true },
      { metin: 'Mobil uygulamada yer alma', yakinda: true },
    ],
  },
]

const OZELLIKLER = [
  {
    baslik: 'Uygulama gerekmez',
    metin:
      'Müşteri masadaki QR kodu telefonuyla okutur, menü anında açılır. İndirme, kayıt veya giriş yok.',
  },
  {
    baslik: 'Menüyü kendiniz yönetin',
    metin:
      'Ürün ekleyin, fiyat değiştirin, fotoğraf yükleyin. Tükenen ürünü tek tuşla menüden kaldırın; değişiklik anında yayına girer.',
  },
  {
    baslik: 'Garson çağırma',
    metin:
      'Müşteri butona bastığında talep, masa numarasıyla birlikte personelin paneline anında düşer.',
  },
  {
    baslik: 'Masaya özel QR kodlar',
    metin:
      'Her masa için ayrı QR kod panelden üretilir; indirip yazdırabilir, doğrudan masaya yapıştırabilirsiniz.',
  },
]

const ADIMLAR = [
  'Menünüzü panele bir kez giriyoruz: kategoriler, ürünler, fiyatlar ve fotoğraflar.',
  'Masalarınız için QR kodları panelden üretip yazdırıyorsunuz.',
  'Müşteri kodu okutuyor, menüyü geziyor; ihtiyacı olduğunda garson çağırıyor.',
  'Fiyat veya ürün değiştiğinde panelden güncelliyorsunuz, yeni baskı gerekmiyor.',
]

const EPOSTA = 'berkanatik2004@gmail.com'
const TELEFON = '+90 531 672 67 61'
const WHATSAPP_NO = '905316726761'

const ILETISIM = `mailto:${EPOSTA}?subject=${encodeURIComponent(SITE_ADI + ' hakkında bilgi')}`

// Restoran sahipleri e-postadan çok WhatsApp'tan dönüş yapıyor, teklif
// butonlarını buraya yönlendiriyoruz.
function whatsappLinki(mesaj: string) {
  return `https://wa.me/${WHATSAPP_NO}?text=${encodeURIComponent(mesaj)}`
}

function Tik({ soluk }: { soluk: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      className={`w-4 h-4 shrink-0 mt-1 ${soluk ? 'text-[#5A5248]' : 'text-[#C9A876]'}`}
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen text-[#F5EFE4]">
      {/* Sitenin tamamının ortak arka planı: viewport'a sabitli tek katman.
          background-attachment:fixed yerine gerçek fixed konumlandırma
          kullanıyoruz çünkü ilki mobil Safari'de güvenilir çalışmıyor. */}
      <div
        className="fixed inset-0 -z-10 bg-[#14100C] bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(20,16,12,0.55), rgba(20,16,12,0.55)), url('${BACKGROUND_URL}')`,
        }}
      />

      {/* Header'ın arkasındaki bulanıklaştırma katmanı — tam olarak header'ın
          kendi yüksekliği kadar (yaklaşık 96px), altına hiç taşmıyor, fade
          yok. Tıklamaları engellemesin diye pointer-events-none ve header'ın
          (z-50) altında (z-40). */}
      <div
        className="fixed inset-x-0 top-0 z-40 h-24 pointer-events-none backdrop-blur-md"
      />

      <div className="sticky top-0 z-50">
      <header className="max-w-[1280px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-8 min-w-0">
          <a href="#" className="flex items-center min-w-0">
            <Image
              src={NAV_LOGO_URL}
              alt={SITE_ADI}
              width={300}
              height={100}
              priority
              className="h-11 sm:h-16 md:h-[84px] w-auto max-w-full object-contain"
            />
          </a>
          <nav className="hidden md:flex items-center gap-1">
            <a
              href="#"
              className="font-[family-name:var(--font-mono)] text-base px-3.5 py-2 rounded-full text-white hover:text-[#C9A876] transition-colors"
            >
              Ana Sayfa
            </a>
            <a
              href="#ozellikler"
              className="font-[family-name:var(--font-mono)] text-base px-3.5 py-2 rounded-full text-white hover:text-[#C9A876] transition-colors"
            >
              Özellikler
            </a>
            <a
              href="#surec"
              className="font-[family-name:var(--font-mono)] text-base px-3.5 py-2 rounded-full text-white hover:text-[#C9A876] transition-colors"
            >
              Süreç
            </a>
            <a
              href="#paketler"
              className="font-[family-name:var(--font-mono)] text-base px-3.5 py-2 rounded-full text-white hover:text-[#C9A876] transition-colors"
            >
              Fiyatlar
            </a>
          </nav>
        </div>
        <Link
          href="/admin/login"
          className="shrink-0 whitespace-nowrap font-[family-name:var(--font-mono)] text-sm sm:text-base px-3 sm:px-4 py-2 border border-[#3A2F24] rounded-full text-white hover:border-[#C9A876] hover:text-[#C9A876] transition-colors"
        >
          Restoran girişi
        </Link>
      </header>
      </div>

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6">
        {/* Hero: fotoğraf yok — QR temalı nokta deseni + altın parıltı, tamamen CSS */}
        <section className="relative overflow-hidden py-16 sm:py-20 md:py-32 -mx-4 sm:-mx-6 px-4 sm:px-6">
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#C9A876 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          />
          <div className="absolute -top-24 right-[-4rem] w-[28rem] h-[28rem] rounded-full bg-[#C9A876]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-24 w-[22rem] h-[22rem] rounded-full bg-[#C9A876]/5 blur-3xl pointer-events-none" />
          {/* Arka plan fotoğrafı tüm sitede tek katman olduğu için burada ekstra
              koyulaştırma: yazının olduğu bölge en koyu, kenarlara doğru açılıyor. */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 60% 65% at 50% 42%, rgba(10,8,6,0.7), transparent 70%)',
            }}
          />

          <div className="relative text-center max-w-2xl mx-auto">
            <p className="font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] uppercase text-[#C9A876] mb-4">
              Restoranlar için dijital menü
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl leading-tight mb-5">
              Menünüz artık masada, cepte ve her zaman güncel
            </h1>
            <p className="text-[#F5EFE4] text-base md:text-lg max-w-xl mx-auto mb-9">
              Basılı menü bastırmayı bırakın. Fiyatı değiştirin, ürünü kaldırın, fotoğrafı
              güncelleyin — müşteri bir sonraki saniyede güncel menüyü görsün.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="#paketler"
                className="font-[family-name:var(--font-mono)] text-base px-6 py-3.5 bg-[#C9A876] text-[#1B2318] font-medium rounded-full hover:bg-[#d9bb8e] transition-colors"
              >
                Paketleri incele
              </a>
              <a
                href={whatsappLinki(`Merhaba, ${SITE_ADI} hakkında bilgi almak istiyorum.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-[family-name:var(--font-mono)] text-base px-6 py-3.5 border border-[#3A2F24] rounded-full text-[#D8CBB8] hover:border-[#C9A876] hover:text-[#C9A876] transition-colors"
              >
                WhatsApp&apos;tan yazın
              </a>
            </div>
          </div>
        </section>

        <section id="ozellikler" className="grid grid-cols-1 md:grid-cols-2 gap-5 py-16 scroll-mt-20">
          {OZELLIKLER.map((ozellik) => (
            <div
              key={ozellik.baslik}
              className="bg-[#1E1811] border border-[#2A2119] rounded-2xl p-5 sm:p-7"
            >
              <h2 className="font-[family-name:var(--font-display)] text-xl mb-2.5">
                {ozellik.baslik}
              </h2>
              <p className="text-[#F5EFE4] text-base leading-relaxed">{ozellik.metin}</p>
            </div>
          ))}
        </section>

        <section id="paketler" className="pb-16 scroll-mt-6">
          <div className="text-center mb-10">
            <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl mb-3">
              Paketler
            </h2>
            <p className="text-[#F5EFE4] text-base">
              Tüm fiyatlara KDV dahildir. Yıllık kullanım bedelidir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {PAKETLER.map((paket) => (
              <div
                key={paket.ad}
                className={`relative h-full flex flex-col bg-[#1E1811] rounded-2xl p-5 sm:p-7 border ${
                  paket.oneCikan ? 'border-[#C9A876]' : 'border-[#2A2119]'
                }`}
              >
                {paket.oneCikan && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap font-[family-name:var(--font-mono)] text-[10px] tracking-wider uppercase px-3 py-1 rounded-full bg-[#C9A876] text-[#1B2318]">
                    En çok tercih edilen
                  </span>
                )}

                <h3 className="font-[family-name:var(--font-display)] text-xl mb-1.5">
                  {paket.ad}
                </h3>
                <p className="text-[#F5EFE4] text-sm leading-relaxed mb-5 min-h-[2.5rem]">
                  {paket.aciklama}
                </p>

                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="font-[family-name:var(--font-display)] text-3xl text-[#C9A876]">
                    {paket.fiyat}
                  </span>
                  <span className="font-[family-name:var(--font-mono)] text-sm text-[#8A7C68]">
                    ₺/yıl
                  </span>
                </div>

                <ul className="space-y-3 mb-7">
                  {paket.ozellikler.map((ozellik) => (
                    <li key={ozellik.metin} className="flex gap-2.5">
                      <Tik soluk={ozellik.yakinda} />
                      <span
                        className={`text-sm leading-relaxed ${
                          ozellik.yakinda ? 'text-[#8A7C68]' : 'text-[#D8CBB8]'
                        }`}
                      >
                        {ozellik.metin}
                        {ozellik.yakinda && (
                          <span className="ml-2 font-[family-name:var(--font-mono)] text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full border border-[#3A2F24] text-[#8A7C68] whitespace-nowrap">
                            Yakında
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href={whatsappLinki(
                    `Merhaba, ${SITE_ADI} ${paket.ad} paketi hakkında bilgi almak istiyorum.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-auto block text-center font-[family-name:var(--font-mono)] text-base px-5 py-3 rounded-full transition-colors ${
                    paket.oneCikan
                      ? 'bg-[#C9A876] text-[#1B2318] font-medium hover:bg-[#d9bb8e]'
                      : 'border border-[#3A2F24] text-[#D8CBB8] hover:border-[#C9A876] hover:text-[#C9A876]'
                  }`}
                >
                  Teklif al
                </a>
              </div>
            ))}
          </div>

          <p className="text-[#F5EFE4] text-sm text-center mt-7">
            &quot;Yakında&quot; işaretli özellikler geliştirme aşamasındadır, yayına alındığında
            paketinize ek ücret olmadan eklenir.
          </p>
        </section>

        <section id="surec" className="pb-20 scroll-mt-20">
          <div className="bg-[#1E1811] border border-[#2A2119] rounded-2xl p-5 sm:p-8 md:p-10">
            <h2 className="font-[family-name:var(--font-display)] text-2xl mb-6">Nasıl çalışır?</h2>
            <ol className="space-y-5">
              {ADIMLAR.map((adim, i) => (
                <li key={adim} className="flex gap-4">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-[#C9A876] text-[#1B2318] font-[family-name:var(--font-mono)] text-sm flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-[#D8CBB8] text-base leading-relaxed pt-1">{adim}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="py-9">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <p className="font-[family-name:var(--font-mono)] text-xs text-[#C9A876]">
            {SITE_ADI} — restoranlar için dijital menü sistemi
          </p>
          <div className="flex flex-col sm:flex-row gap-x-6 gap-y-2 font-[family-name:var(--font-mono)] text-xs">
            <a
              href={whatsappLinki(`Merhaba, ${SITE_ADI} hakkında bilgi almak istiyorum.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C9A876] hover:text-[#d9bb8e] transition-colors"
            >
              WhatsApp: {TELEFON}
            </a>
            <a
              href={ILETISIM}
              className="text-[#C9A876] hover:text-[#d9bb8e] transition-colors"
            >
              {EPOSTA}
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
