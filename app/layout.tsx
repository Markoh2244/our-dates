import type { Metadata } from 'next';
import { Cormorant_Garamond, Nunito } from 'next/font/google';
import './globals.css';

const serif = Cormorant_Garamond({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const sans = Nunito({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Liv & Marko | Our Memory Calendar',
  description:
    'A Christ-centered memory calendar for Liv and Marko — dates, places, photos, and notes rooted in love.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} h-full`}>
      <body className="min-h-full font-sans antialiased">{children}</body>
    </html>
  );
}
