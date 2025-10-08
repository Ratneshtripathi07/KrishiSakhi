import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Krishi Sakhi',
  description: 'AI-powered personal crop companion for farmers (Kerala focus)',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#16a34a',
};

import Header from '@/components/Header';
import { I18nProvider } from '@/lib/i18n';
import SWRegister from '@/components/pwa/SWRegister';
import { DataSaverProvider } from '@/lib/dataSaver';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import { ThemeProvider } from '@/lib/theme';
import BottomNav from '@/components/BottomNav';
import FloatingMicFab from '@/components/FloatingMicFab';
import HideOnRoutes from '@/components/HideOnRoutes';
import ChunkReload from '@/components/pwa/ChunkReload';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#16a34a" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-[#F1F5F9] text-[#212121] dark:bg-[#121212] dark:text-[#FAFAFA]">
        {/* Wrap app in I18nProvider to enable translations */}
        {/* eslint-disable-next-line @next/next/no-head-element */}
        <I18nProvider>
          <ThemeProvider>
            <DataSaverProvider>
              <Header />
<main className="mx-auto max-w-3xl px-4 py-6 pb-6 md:pb-0">{children}</main>
              <HideOnRoutes prefixes={["/admin"]}>
                <FloatingMicFab />
              </HideOnRoutes>
              <BottomNav />
              {/* Register service worker for PWA */}
              <SWRegister />
              {/* Install prompt banner */}
              <InstallPrompt />
              {/* Reload the page once if a chunk fails to load (helps when SW caches stale HTML) */}
              <ChunkReload />
            </DataSaverProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
