import type { Metadata } from 'next'
import '@/styles/globals.css'
import { AdminProvider } from '@/lib/AdminContext'

export const metadata: Metadata = {
  title: 'ReviewBridge',
  description: 'Collect structured design feedback — fast.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AdminProvider>{children}</AdminProvider>
      </body>
    </html>
  )
}
