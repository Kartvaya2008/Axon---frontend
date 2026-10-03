import type { Metadata, Viewport } from 'next';
import { Bebas_Neue, Inter, JetBrains_Mono } from 'next/font/google';
import { identity } from '@/lib/data';
import './globals.css';

// Self-hosted at build time by next/font — no render-blocking request to
// Google, no layout shift, and the display face is available before the
// particle canvas rasterises its text.
const display = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display-loaded',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans-loaded',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-loaded',
  display: 'swap',
});

export const metadata: Metadata = {
  title: `Axon — ${identity.name}`,
  description: identity.tagline,
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: `Axon — ${identity.name}`,
    description: identity.tagline,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Axon — ${identity.name}`,
    description: identity.tagline,
  },
};

export const viewport: Viewport = {
  themeColor: '#07070A',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
        {/* Fixed overlays — one paint, never re-laid out. */}
        <div className="grain" aria-hidden="true" />
        <div className="vignette" aria-hidden="true" />
      </body>
    </html>
  );
}
