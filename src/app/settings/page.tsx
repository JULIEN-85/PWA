
"use client";

import Link from 'next/link';
import { ArrowLeft, Settings as SettingsIcon, Palette, Bell, Lock, Users, Info } from 'lucide-react';
import { PhotoClassLogo } from '@/components/PhotoClassLogo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      // Default to light mode if no theme is set or if it's 'light'
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light'); // Ensure theme is set if not present
    }
  }, []);

  const handleThemeChange = (checked: boolean) => {
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    }
  };

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
              <SettingsIcon className="mr-3 h-8 w-8 text-primary" />
              Paramètres de l'application
            </h1>
            <p className="mt-2 text-muted-foreground">
              Configurez les options générales de l'application PhotoClass.
            </p>
          </div>

          <Card className="mb-6 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Palette className="mr-2 h-5 w-5 text-primary" />
                Apparence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                <Label htmlFor="darkModeToggle" className="text-sm font-medium">
                  Mode Sombre
                </Label>
                <Switch
                  id="darkModeToggle"
                  checked={isDarkMode}
                  onCheckedChange={handleThemeChange}
                  aria-label={isDarkMode ? "Désactiver le mode sombre" : "Activer le mode sombre"}
                />
              </div>
              <p className="text-xs text-muted-foreground px-1">
                Basculez entre le thème clair et le thème sombre pour l'application.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Bell className="mr-2 h-5 w-5 text-primary" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                <Label htmlFor="emailNotifications" className="text-sm font-medium">
                  Notifications par email
                </Label>
                <Switch id="emailNotifications" disabled aria-label="Activer les notifications par email (fonctionnalité à venir)" />
              </div>
               <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                <Label htmlFor="appNotifications" className="text-sm font-medium">
                  Notifications dans l'application
                </Label>
                <Switch id="appNotifications" checked disabled aria-label="Activer les notifications dans l'application (fonctionnalité à venir)" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="mb-6 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Info className="mr-2 h-5 w-5 text-primary" />
                À Propos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <p><strong>PhotoClass</strong> - Version 1.0.0</p>
                <p className="text-muted-foreground">Application de gestion de photos scolaires.</p>
                <p className="text-muted-foreground">&copy; {new Date().getFullYear()} Votre Nom/Société. Tous droits réservés.</p>
                 <Button variant="link" className="p-0 h-auto text-primary">Politique de confidentialité</Button>
                 <span className="mx-1 text-muted-foreground">&bull;</span>
                 <Button variant="link" className="p-0 h-auto text-primary">Conditions d'utilisation</Button>
            </CardContent>
          </Card>

        </div>
      </main>
       <footer className="p-4 text-center border-t border-border/60 text-xs text-muted-foreground">
        PhotoClass - Simplifiez la gestion de vos photos scolaires.
      </footer>
    </div>
  );
}
