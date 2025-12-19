import type { Metadata } from 'next';
import { Oswald, Lato } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

// 🔥 Typographie "Orange Bistro"
const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RestoTech',
  description: 'Restaurant SaaS Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${oswald.variable} ${lato.variable}`}>
      <body className="font-sans">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
