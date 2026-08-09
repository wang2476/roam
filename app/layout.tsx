import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Outfit } from 'next/font/google'
import { TripProvider } from '@/lib/trip-context'
import { ToastProvider } from '@/components/toast'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  title: 'Ikou — Swipe now, plan later',
  description:
    'Discover local experiences across Tokyo, Kyoto, and Osaka. Swipe to save, then build a day-by-day itinerary.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#0e0d0c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${outfit.variable} bg-base`}>
      <body className="font-sans">
        <TripProvider>
          <ToastProvider>{children}</ToastProvider>
        </TripProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
