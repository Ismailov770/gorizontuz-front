import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AppProvider } from "@/contexts/app-context"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Gorizont Uz - Yangiliklar",
  description: "O'zbekiston va dunyodagi eng so'ngi yangiliklar",
  generator: "Next.js",
  metadataBase: new URL('https://gorizont.uz'),
  openGraph: {
    title: "Gorizont Uz - Yangiliklar",
    description: "O'zbekiston va dunyodagi eng so'ngi yangiliklar",
    siteName: "Gorizont Uz",
    locale: 'uz_UZ',
    type: 'website',
    url: 'https://gorizont.uz',
    images: [
      {
        url: 'https://gorizont.uz/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Gorizont Uz',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Gorizont Uz - Yangiliklar",
    description: "O'zbekiston va dunyodagi eng so'ngi yangiliklar",
    images: ['https://gorizont.uz/twitter-image.jpg'],
  },
  alternates: {
    canonical: '/asosiy',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <AppProvider>{children}</AppProvider>
        <Analytics />
      </body>
    </html>
  )
}
