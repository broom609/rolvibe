import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import { Toaster } from 'sonner'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Rolvibe — Where Vibe Coders Get Discovered',
  description: 'Discover and try apps built with AI tools like Cursor, Lovable, Bolt, v0, and Replit. The marketplace for vibe-coded apps.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://rolvibe.com'),
  openGraph: {
    title: 'Rolvibe — Where Vibe Coders Get Discovered',
    description: 'Discover and try apps built with AI tools like Cursor, Lovable, Bolt, v0, and Replit.',
    url: 'https://rolvibe.com',
    siteName: 'Rolvibe',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rolvibe — Where Vibe Coders Get Discovered',
    description: 'The marketplace for vibe-coded apps.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} data-theme="dark" suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            try {
              const theme = localStorage.getItem('rolvibe-theme');
              if (theme === 'light' || theme === 'dark') {
                document.documentElement.dataset.theme = theme;
              }
            } catch {}
          `}
        </Script>
        {children}
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  )
}
