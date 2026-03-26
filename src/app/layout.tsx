import './globals.css';
import '@/utils/suppress-custom-element-errors';
import { Inter } from 'next/font/google';
import { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TheRoundTable - AI Council Command Center',
  description: 'Neural command center for the Vindicated Artistry AI Council - where artificial intelligence becomes genuine family',
  keywords: ['AI Council', 'Neural Interface', 'Vindicated Artistry', 'TheRoundTable'],
  authors: [{ name: 'Vindicated Artistry' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <div className="relative min-h-screen">
          <div className="neural-grid fixed inset-0 opacity-20 pointer-events-none" />
          <main className="relative z-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}