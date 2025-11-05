// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from "@/components/providers"
import { PwaProvider } from "@/components/pwa/pwa-provider"
import { HighContrastToggle } from "@/components/ui/high-contrast-toggle"

// Change this to prevent hydration issues
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'AbodeAI — AI-native design & manufacturing platform',
  description:
    'AbodeAI orchestrates generative design, photoreal rendering, and manufacturing handoff with enterprise-grade compliance and observability.',
  manifest: '/manifest.webmanifest',
  themeColor: '#2563eb',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground`} suppressHydrationWarning>
        <Providers>
          <PwaProvider>
            <div className="fixed right-4 top-4 z-50">
              <HighContrastToggle />
            </div>
            {children}
          </PwaProvider>
        </Providers>
      </body>
    </html>
  )
}
