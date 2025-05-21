
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, UserCircle, FileText, CalendarDays, Camera, Trash2, Image as ImageIcon, Briefcase, Pencil } from 'lucide-react';

import type { ProjectConfig, CapturedPhoto, Student, SchoolClass } from '@/types';
import { getPhotosForProject, deletePhoto as deletePhotoFromStore } from '@/lib/photoStore';
// Removed mockStudents import as students will be loaded from localStorage
import { PhotoClassLogo } from '@/components/PhotoClassLogo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const LOCAL_STORAGE_PROJECT_STUDENTS_PREFIX = 'photoClassProjectStudents_';
const PHOTOAPP_SCHOOL_CLASSES_KEY = 'photoClassAppSchoolClasses';

export default function ProjectDetailsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [projectConfig, setProjectConfig] = useState<ProjectConfig | null>(null);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [projectStudents, setProjectStudents] = useState<Student[]>([]);
  const [availableSchoolClasses, setAvailableSchoolClasses] = useState<SchoolClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProjectLoading, setIsProjectLoading] = useState(true);

  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editStudentClass, setEditStudentClass] = useState("");


  useEffect(() => {
    setIsProjectLoading(true);
    let currentProjectConfig: ProjectConfig | null = null;
    try {
      const storedConfig = localStorage.getItem('projectConfig');
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig) as ProjectConfig;
         if (parsedConfig.projectId && parsedConfig.projectName && parsedConfig.sessionDate && isValid(parseISO(parsedConfig.sessionDate))) {
          currentProjectConfig = parsedConfig;
          setProjectConfig(parsedConfig);
        } else {
          throw new Error("Configuration de projet invalide (projectId, projectName, ou sessionDate manquant/invalide).");
        }
      } else {
        throw new Error("Aucune configuration de projet trouvée.");
      }
    } catch (error: any) {
      console.error("Error loading project config:", error);
      toast({
        variant: "destructive",
        title: "Erreur de configuration",
        description: error.message || "Impossible de charger les détails du projet. Veuillez sélectionner un projet.",
        duration: 5000,
      });
      router.replace('/');
      setIsProjectLoading(false);
      return;
    }

    // Load available school classes
    const storedClassesJson = localStorage.getItem(PHOTOAPP_SCHOOL_CLASSES_KEY);
    if (storedClassesJson) {
      try {
        const parsedClasses = JSON.parse(storedClassesJson) as SchoolClass[];
        setAvailableSchoolClasses(Array.isArray(parsedClasses) ? parsedClasses : []);
      } catch (e) {
        console.error("Failed to parse school classes from localStorage", e);
        setAvailableSchoolClasses([]);
      }
    }

    const loadProjectData = async () => {
      if (!currentProjectConfig?.projectId) {
        setIsLoading(false);
        setPhotos([]);
        setProjectStudents([]);
        setIsProjectLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        // Load students for the project
        const storedStudentsJson = localStorage.getItem(`${LOCAL_STORAGE_PROJECT_STUDENTS_PREFIX}${currentProjectConfig.projectId}`);
        if (storedStudentsJson) {
          const projectSpecificStudents = JSON.parse(storedStudentsJson) as Student[];
          setProjectStudents(projectSpecificStudents.length > 0 ? projectSpecificStudents : []);
        } else {
          setProjectStudents([]);
        }

        // Load photos for the project
        const projectPhotosFromStore = await getPhotosForProject(currentProjectConfig.projectId);
        setPhotos(projectPhotosFromStore);

      } catch (e) {
        console.error("Error loading project data:", e);
        toast({ variant: "destructive", title: "Erreur de chargement", description: "Impossible de charger les données du projet." });
      } finally {
        setIsLoading(false);
        setIsProjectLoading(false);
      }
    };

    if (currentProjectConfig) {
        loadProjectData();
    }

  }, [router, toast]);

  const getStudentById = (studentId: string): Student | undefined => {
    return projectStudents.find(s => s.id === studentId);
  };

  const getStudentName = (studentId: string) => {
    const student = getStudentById(studentId);
    return student ? `${student.firstName} ${student.lastName}` : 'Élève inconnu';
  };

  const getStudentClass = (studentId: string) => {
    const student = getStudentById(studentId);
    return student ? student.className : 'Classe inconnue';
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await deletePhotoFromStore(photoId);
      setPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photoId));
      toast({
        title: "Photo supprimée",
        description: "La photo a été supprimée avec succès.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erreur de suppression",
        description: "Impossible de supprimer la photo.",
      });
    }
  };

  const handleOpenEditStudentModal = (studentId: string) => {
    const student = getStudentById(studentId);
    if (student) {
      setStudentToEdit(student);
      setEditFirstName(student.firstName);
      setEditLastName(student.lastName);
      setEditStudentClass(student.className);
      setIsEditStudentModalOpen(true);
    } else {
      toast({ variant: "destructive", title: "Erreur", description: "Élève non trouvé." });
    }
  };

  const handleSaveStudentChanges = () => {
    if (!studentToEdit || !projectConfig) {
      toast({ variant: "destructive", title: "Erreur", description: "Aucun élève à modifier ou projet non configuré." });
      return;
    }
    if (!editFirstName.trim() || !editLastName.trim() || !editStudentClass.trim()) {
      toast({ variant: "destructive", title: "Champs manquants", description: "Prénom, Nom et Classe sont requis." });
      return;
    }

    const updatedStudents = projectStudents.map(s =>
      s.id === studentToEdit.id
        ? { ...s, firstName: editFirstName.trim(), lastName: editLastName.trim(), className: editStudentClass.trim() }
        : s
    );
    setProjectStudents(updatedStudents);
    localStorage.setItem(`${LOCAL_STORAGE_PROJECT_STUDENTS_PREFIX}${projectConfig.projectId}`, JSON.stringify(updatedStudents));

    toast({ title: "Élève modifié", description: "Les informations de l'élève ont été mises à jour." });
    setIsEditStudentModalOpen(false);
    setStudentToEdit(null);
  };


  if (isProjectLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background text-foreground">
        <PhotoClassLogo />
        <p className="mt-4 text-lg text-muted-foreground">Chargement des détails du projet...</p>
      </div>
    );
  }

  if (!projectConfig) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background text-foreground">
        <PhotoClassLogo />
        <p className="mt-4 text-lg text-muted-foreground">Aucun projet sélectionné.</p>
        <Link href="/" passHref>
          <Button variant="outline" className="mt-4 bg-background hover:bg-muted">
            <Briefcase className="mr-2 h-5 w-5" />
            Retour aux projets
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-border/60 shadow-sm bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <PhotoClassLogo />
        <div className="text-center">
          <h1 className="text-xl font-semibold text-primary">{projectConfig.projectName}</h1>
          <p className="text-sm text-muted-foreground">
            Séance du {format(parseISO(projectConfig.sessionDate), 'PPP', { locale: fr })}
          </p>
        </div>
        <Link href="/" passHref>
          <Button variant="outline" className="bg-background hover:bg-muted">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Tous les Projets
          </Button>
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <ImageIcon className="w-24 h-24 text-muted-foreground mb-4 animate-pulse" />
                <p className="text-muted-foreground">Chargement des photos...</p>
            </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ImageIcon className="w-24 h-24 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Aucune photo trouvée</h2>
            <p className="text-muted-foreground mb-4">
              Il n'y a pas encore de photos capturées pour ce projet.
            </p>
            <Link href="/capture" passHref>
                <Button
                    onClick={() => {
                         if (typeof window !== 'undefined' && projectConfig) {
                            localStorage.setItem('projectConfig', JSON.stringify(projectConfig));
                        }
                    }}
                >
                    <Camera className="mr-2 h-5 w-5"/>
                    Prendre des photos
                </Button>
            </Link>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {photos.map(photo => (
                <Card key={photo.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col group">
                  <CardHeader className="p-0 relative">
                    <Image
                      src={photo.photoDataUrl}
                      alt={`Photo pour ${getStudentName(photo.studentId)}`}
                      width={300}
                      height={225}
                      className="object-cover w-full h-48"
                      data-ai-hint="student portrait"
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Supprimer la photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer cette photo ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible et la photo de {getStudentName(photo.studentId)} sera définitivement supprimée.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeletePhoto(photo.id)}>
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardHeader>
                  <CardContent className="p-4 flex-grow">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                            <UserCircle className="w-5 h-5 mr-2 text-primary flex-shrink-0" />
                            <p className="text-sm font-medium text-foreground truncate" title={getStudentName(photo.studentId)}>
                                {getStudentName(photo.studentId)}
                            </p>
                        </div>
                        {getStudentById(photo.studentId) && ( // Only show edit if student exists
                            <Button
                                variant="ghost"
                                size="icon"
                                className="w-6 h-6 p-0 text-muted-foreground hover:text-primary"
                                onClick={() => handleOpenEditStudentModal(photo.studentId)}
                                aria-label="Modifier l'élève"
                            >
                                <Pencil className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                     <div className="flex items-center mb-2">
                       <Badge variant="secondary" className="text-xs">
                          {getStudentClass(photo.studentId)}
                       </Badge>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <FileText className="w-4 h-4 mr-1 flex-shrink-0" />
                      <p className="truncate" title={photo.fileName}>{photo.fileName}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="p-3 bg-muted/50 border-t">
                     <p className="text-xs text-muted-foreground flex items-center">
                        <CalendarDays className="w-3 h-3 mr-1.5 flex-shrink-0" />
                        Capturée le: {format(new Date(photo.timestamp), 'dd/MM/yy HH:mm', { locale: fr })}
                     </p>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </main>

      {/* Edit Student Modal */}
      <Dialog open={isEditStudentModalOpen} onOpenChange={setIsEditStudentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'élève</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editFirstName" className="text-right">
                Prénom
              </Label>
              <Input
                id="editFirstName"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                className="col-span-3 bg-background"
                placeholder="Prénom de l'élève"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editLastName" className="text-right">
                Nom
              </Label>
              <Input
                id="editLastName"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                className="col-span-3 bg-background"
                placeholder="Nom de l'élève"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editStudentClass" className="text-right">
                Classe
              </Label>
              {availableSchoolClasses.length > 0 ? (
                <Select
                  value={editStudentClass}
                  onValueChange={setEditStudentClass}
                >
                  <SelectTrigger className="col-span-3 bg-background">
                    <SelectValue placeholder="Sélectionnez une classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSchoolClasses.map((sc) => (
                      <SelectItem key={sc.id} value={sc.name}>
                        {sc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                    id="editStudentClass"
                    value={editStudentClass}
                    onChange={(e) => setEditStudentClass(e.target.value)}
                    className="col-span-3 bg-background"
                    placeholder="Ex: CP A (Aucune classe configurée)"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={() => { setIsEditStudentModalOpen(false); setStudentToEdit(null); }}>Annuler</Button>
            </DialogClose>
            <Button onClick={handleSaveStudentChanges}>Sauvegarder les modifications</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    