import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Three.js WebXR Debugger',
  description: 'Advanced performance monitoring and debugging tool for Three.js WebXR applications',
  keywords: ['threejs', 'webxr', 'performance', 'debugging', 'stats'],
  manifest: '/manifest.json',
  themeColor: '#0ea5e9',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-ui-darker text-white overflow-hidden">
        {children}
      </body>
    </html>
  )
} 