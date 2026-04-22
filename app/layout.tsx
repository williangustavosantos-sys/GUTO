import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

export const metadata: Metadata = {
  title: 'GUTO - Sistema de Evolução Humana',
  description: 'O Guto é um melhor amigo digital que conduz, adapta, erra, aprende e permanece — até que você evolua.',
  generator: 'GUTO',
  icons: {
    shortcut: '/favicon-guto.ico?v=3',
    icon: [
      {
        url: '/favicon-guto.ico?v=3',
        sizes: 'any',
      },
      {
        url: '/icon-light-32x32.png?v=3',
        media: '(prefers-color-scheme: light)',
        type: 'image/png',
        sizes: '32x32',
      },
      {
        url: '/icon-dark-32x32.png?v=3',
        media: '(prefers-color-scheme: dark)',
        type: 'image/png',
        sizes: '32x32',
      },
      {
        url: '/icon-guto.svg?v=3',
        type: 'image/svg+xml',
      },
    ],
    apple: [
      {
        url: '/apple-touch-icon.png?v=3',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        url: '/apple-icon.png?v=3',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
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
    <html lang="pt-BR" className="bg-background">
      <body className="font-sans text-foreground">
        <main className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-white">
          {children}
        </main>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
