import type { Metadata } from "next"
import { Inter, DM_Mono } from "next/font/google"
import "./globals.css"
import { ClerkProvider } from '@clerk/nextjs'
import { TRPCReactProvider } from '@/lib/trpc/client'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ["latin"] })
const dmMono = DM_Mono({ 
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-dm-mono',
})

export const metadata: Metadata = {
  title: "Weavy - LLM Workflow Builder",
  description: "Build powerful LLM workflows with a visual interface",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <body className={`${inter.className} ${dmMono.variable}`} suppressHydrationWarning>
          <TRPCReactProvider>
            {children}
            <Toaster />
          </TRPCReactProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
