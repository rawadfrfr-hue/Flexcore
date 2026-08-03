import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#08080a',
};

export const metadata: Metadata = {
  title: 'FlixCore - Watch Movies & Series',
  description: 'Stream latest movies and web series in high quality',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body suppressHydrationWarning className="bg-[#08080a] text-white antialiased touch-manipulation select-none flex flex-col min-h-screen">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
