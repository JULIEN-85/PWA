
"use client";

import Link from 'next/link';
import { ArrowLeft, Archive as ArchiveIcon } from 'lucide-react';
import { PhotoClassLogo } from '@/components/PhotoClassLogo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ArchivesPage() {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-border/60 shadow-sm bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <PhotoClassLogo />
        <Link href="/" passHref>
          <Button variant="outline" className="bg-background hover:bg-muted">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Retour aux Projets
          </Button>
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              <ArchiveIcon className="mr-3 h-8 w-8 text-primary" />
              Projets Archivés
            </h1>
            <p className="mt-2 text-muted-foreground">
              Consultez ici les projets que vous avez archivés.
            </p>
          </div>

          <Card className="mb-6 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">
                Liste des Archives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                La fonctionnalité d'affichage des projets archivés sera bientôt disponible.
              </p>
              {/* Placeholder for archived projects list */}
            </CardContent>
          </Card>
        </div>
      </main>
       <footer className="p-4 text-center border-t border-border/60 text-xs text-muted-foreground">
        PhotoClass - Gestion des archives.
      </footer>
    </div>
  );
}
