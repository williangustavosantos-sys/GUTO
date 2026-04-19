import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'GUTO - Sistema de Evolução Humana',
  description: 'O Guto é um melhor amigo digital que conduz, adapta, erra, aprende e permanece — até que você evolua.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#e8eef5',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="bg-background dark:bg-background">
      <body className={`${inter.variable} font-sans antialiased text-foreground`}>
        <main className="mx-auto w-full max-w-107.5 min-h-dvh h-dvh bg-background relative shadow-2xl sm:border-x border-black/10 dark:border-white/10 overflow-x-hidden overflow-y-auto flex flex-col">
          {children}
        </main>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
