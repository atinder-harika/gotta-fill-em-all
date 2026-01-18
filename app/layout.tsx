import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Press_Start_2P } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ClerkProvider } from "@clerk/nextjs"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const _pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
})

export const metadata: Metadata = {
  title: "Gotta Fill 'Em All!",
  description: "Gamified accessibility extension for filling government forms",
  generator: "v0.app",
  icons: {
    icon: "/icon128.png",
    shortcut: "/icon128.png",
    apple: "/icon128.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1a1a2e",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`font-sans antialiased ${_pressStart2P.variable}`}>
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
