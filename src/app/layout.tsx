import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Three.js WebXR Performance Monitor',
  description: 'Real-time performance monitoring tool for WebXR applications with AndroidXR support',
  keywords: ['threejs', 'webxr', 'performance', 'debugging', 'stats', 'androidxr', 'vr', 'ar'],
  manifest: '/manifest.webxr.json',
  themeColor: '#00d4ff',
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
        <meta name="theme-color" content="#00d4ff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.webxr.json" />
        <meta name="xr-spatial-tracking" content="enabled" />
      </head>
      <body className="bg-ui-darker text-white overflow-hidden">
        {children}
      </body>
    </html>
  )
} 