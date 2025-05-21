
import type { Metadata } from 'next';
import { Inter, Pacifico } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const pacifico = Pacifico({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-pacifico',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PhotoClass - Gestion de photos scolaires',
  description: 'School Photography Project Management',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${pacifico.variable}`}>
      {/* 
        La classe 'dark' sera gérée dynamiquement par le code client (localStorage et Switch).
        Pour éviter un flash de contenu non stylisé (FOUC) ou un flash du mauvais thème,
        une approche plus avancée impliquerait un script dans <head> ou un ThemeProvider.
        Pour l'instant, l'effet dans la page /settings gérera le thème.
      */}
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
