// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from "@/components/providers"

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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
