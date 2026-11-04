import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SalApp Asatidz - Portal Presensi & Pelaporan Terpadu',
  description: 'Portal Presensi Realtime, Geofencing GPS, dan Pelaporan Progres Kegiatan Asatidz Salman',
  manifest: '/manifest.json',
  icons: {
    icon: 'https://absensi-salman.vercel.app/Absensi.png',
    apple: 'https://absensi-salman.vercel.app/Absensi.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#3525cd',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-background text-on-surface min-h-screen selection:bg-primary-fixed selection:text-on-primary-fixed">
        {children}
      </body>
    </html>
  );
}

