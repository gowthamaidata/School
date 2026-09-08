import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PrefsProvider } from '@/lib/i18n/provider'
import { SessionProvider } from '@/lib/auth/session'
import { ServiceWorker } from '@/components/service-worker'


export const metadata: Metadata = {
  title: {
    default: 'Palli — School Management for Tamil Nadu',
    template: '%s · Palli',
  },
  description:
    'Mobile-first school management for Tamil Nadu private schools. Attendance in 20 seconds, WhatsApp parent updates, fee tracking and report cards — in English and Tamil.',
  applicationName: 'Palli',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Palli',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192' }],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fdfcf8' },
    { media: '(prefers-color-scheme: dark)', color: '#181622' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Outfit is the UI + display face (geometric, friendly, excellent
            tabular figures), Noto Sans Tamil carries the Tamil UI, and
            JetBrains Mono is reserved for codes and admission numbers.
            Loaded by <link> rather than next/font so the build never depends
            on reaching Google at compile time; the stack in globals.css falls
            back to system-ui if the request fails. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap"
        />
        {/* Apply stored theme before paint so there is no light flash on a dark device. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('palli.theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased">
        <PrefsProvider>
          <SessionProvider>{children}</SessionProvider>
        </PrefsProvider>
        <ServiceWorker />
      </body>
    </html>
  )
}
