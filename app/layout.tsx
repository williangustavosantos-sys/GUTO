import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/components/auth-provider"
import { RootFrame } from "@/components/root-frame"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "700", "800"],
  display: "swap",
})

export const metadata: Metadata = {
  title: 'GUTO - Sistema de Evolução Humana',
  description: 'O Guto é um melhor amigo digital que conduz, adapta, erra, aprende e permanece — até que você evolua.',
  generator: 'GUTO',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'GUTO',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
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
  // iPhone (notch/home-indicator): sem viewport-fit=cover, env(safe-area-inset-*)
  // resolve 0 e o layout do chat/nav (que depende desses insets para ancorar o
  // input e dimensionar a bottom-nav) calcula errado — input sobre mensagens,
  // balões atrás do input, nav cobrindo. Cobre a tela e habilita os safe-areas.
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`bg-background ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans text-foreground">
        <AuthProvider>
          <RootFrame>{children}</RootFrame>
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
