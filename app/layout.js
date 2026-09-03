// app/layout.js — layout akar: font lokal (Domine + Fira Sans), metadata dasar.
import './globals.css';
import { domine, firaSans } from './font';

export const metadata = {
  // Dasar URL absolut untuk gambar open-graph; di produksi dari NEXT_PUBLIC_APP_URL.
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'WARKOP NUSANTARA',
    template: '%s · WARKOP NUSANTARA',
  },
  description:
    'Wadah Aspirasi Rakyat, Kontrol, Observasi dan Pengawasan Nusantara. Berani Karena Benar.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    siteName: 'WARKOP NUSANTARA',
    locale: 'id_ID',
    type: 'website',
    images: ['/og-default.png'],
  },
};

export default function LayoutAkar({ children }) {
  return (
    <html lang="id" className={`${domine.variable} ${firaSans.variable}`}>
      {/* Kelas body persis dari <body> di beranda_warkop_nusantara/code.html */}
      {/* Tahap 9 (aturan 5): min-h-screen desain = 100vh -> min-h-dvh (tinggi viewport dinamis; preseden h-dvh di KerangkaStaf/SidebarStaf). KEPUTUSAN BARU. */}
      <body className="bg-background text-on-background min-h-dvh flex flex-col font-body-md text-body-md selection:bg-secondary-fixed selection:text-on-secondary-fixed">
        {children}
      </body>
    </html>
  );
}
