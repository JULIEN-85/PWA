
"use client";


import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useWebcam } from '@/hooks/useWebcam';
import type { Student, CapturedPhoto, ProjectConfig, Project, SchoolClass } from '@/types';
import { savePhoto as savePhotoToStore, getPhotosForStudent, getAllPhotos, deletePhoto as deletePhotoFromStore, deleteAllPhotosForProject, getPhotosForProject } from '@/lib/photoStore';
import { PhotoClassLogo } from '@/components/PhotoClassLogo';
import { Download, Camera, ArrowLeft, ArrowRight, Trash2, Power, PowerOff, AlertTriangle, Briefcase, Info, UploadCloud, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const LOCAL_STORAGE_PROJECT_STUDENTS_PREFIX = 'photoClassProjectStudents_';
const PHOTOAPP_SCHOOL_CLASSES_KEY = 'photoClassAppSchoolClasses';


export default function PhotoCapturePage() {
  const { toast } = useToast();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { stream, error: webcamError, isWebcamActive, startWebcam, stopWebcam, capturePhoto, setError: setWebcamError } = useWebcam({ videoRef, canvasRef });

  const [projectConfig, setProjectConfig] = useState<ProjectConfig | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [capturedPhotosByStudent, setCapturedPhotosByStudent] = useState<Record<string, CapturedPhoto[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isProjectLoading, setIsProjectLoading] = useState(true);

  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [newStudentFirstName, setNewStudentFirstName] = useState("");
  const [newStudentLastName, setNewStudentLastName] = useState("");
  const [newStudentClass, setNewStudentClass] = useState("");
  const [availableSchoolClasses, setAvailableSchoolClasses] = useState<SchoolClass[]>([]);

  const currentStudent = students[currentStudentIndex];

  useEffect(() => {
    setIsProjectLoading(true);
    let config: ProjectConfig | null = null;
    try {
      const storedConfig = localStorage.getItem('projectConfig');
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig) as ProjectConfig;
        if (parsedConfig.projectId && parsedConfig.projectName && parsedConfig.sessionDate) {
          setProjectConfig(parsedConfig);
          config = parsedConfig;
        } else {
          throw new Error("Configuration de projet invalide (projectId, projectName, ou sessionDate manquant).");
        }
      } else {
        throw new Error("Aucune configuration de projet trouvée.");
      }
    } catch (error: any) {
      console.warn("Project config error:", error);
      toast({
        variant: "destructive",
        title: "Configuration requise",
        description: error.message || "Veuillez configurer le projet avant de continuer.",
        duration: 5000,
      });
      router.replace('/');
      return;
    }

    // Load school classes for the dropdown
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


    // Load students for the project
    if (config?.projectId) {
      const storedStudentsJson = localStorage.getItem(`${LOCAL_STORAGE_PROJECT_STUDENTS_PREFIX}${config.projectId}`);
      if (storedStudentsJson) {
        try {
          const projectSpecificStudents = JSON.parse(storedStudentsJson) as Student[];
          setStudents(projectSpecificStudents.length > 0 ? projectSpecificStudents : []);
        } catch (e) {
          console.error("Failed to parse project students from localStorage", e);
          setStudents([]); 
        }
      } else {
        setStudents([]); 
      }
      setCurrentStudentIndex(0);
    }
     setIsProjectLoading(false);
  }, [router, toast]);

  useEffect(() => {
    const loadPhotosForCurrentStudent = async () => {
      if (!currentStudent || !projectConfig) return;
      setIsLoading(true);
      try {
        const studentPhotos = await getPhotosForStudent(currentStudent.id, projectConfig.projectId);
        setCapturedPhotosByStudent(prev => ({
          ...prev,
          [currentStudent.id]: studentPhotos,
        }));
      } catch (e) {
        console.error("Failed to load photos for student", e);
        toast({ variant: "destructive", title: "Erreur chargement photos", description: "Impossible de charger les photos de l'élève." });
      } finally {
        setIsLoading(false);
      }
    };

    if (currentStudent && projectConfig?.projectId) {
      loadPhotosForCurrentStudent();
    } else if (!currentStudent) {
      setIsLoading(false); // No student, so not loading photos
    }
  }, [currentStudent, projectConfig, toast]);


  useEffect(() => {
    if (webcamError) {
      toast({
        variant: "destructive",
        title: "Erreur Webcam",
        description: webcamError,
      });
    }
  }, [webcamError, toast]);

  const handleCapturePhoto = async () => {
    if (!currentStudent || !projectConfig) return;
    const photoDataUrl = capturePhoto();
    if (photoDataUrl) {
      const timestamp = Date.now();
      const newPhoto: CapturedPhoto = {
        id: `${currentStudent.id}_${projectConfig.projectId}_${timestamp}`,
        studentId: currentStudent.id,
        projectId: projectConfig.projectId,
        photoDataUrl,
        fileName: `${currentStudent.className.replace(/\s+/g, '-')}_${currentStudent.lastName}_${currentStudent.firstName}_${(capturedPhotosByStudent[currentStudent.id]?.length || 0) + 1}.jpg`,
        timestamp,
      };

      try {
        await savePhotoToStore(newPhoto);
        setCapturedPhotosByStudent(prev => ({
          ...prev,
          [currentStudent.id]: [...(prev[currentStudent.id] || []), newPhoto],
        }));
        toast({ title: "Photo capturée !", description: `Photo sauvegardée pour ${currentStudent.firstName} ${currentStudent.lastName}.` });

        if (currentStudentIndex < students.length - 1) {
          setCurrentStudentIndex(prev => prev + 1);
        } else {
          toast({ title: "Tous les élèves traités !", description: "Vous avez atteint la fin de la liste." });
        }
      } catch (e) {
        toast({ variant: "destructive", title: "Erreur sauvegarde photo", description: "Impossible de sauvegarder la photo localement." });
      }
    } else {
      toast({ variant: "destructive", title: "Capture échouée", description: "Impossible de capturer la photo depuis la webcam." });
    }
  };

  const handleDeletePhoto = async (photoId: string, studentId: string) => {
    try {
      await deletePhotoFromStore(photoId);
      setCapturedPhotosByStudent(prev => ({
        ...prev,
        [studentId]: (prev[studentId] || []).filter(p => p.id !== photoId),
      }));
      toast({ title: "Photo supprimée", description: "La photo a été enlevée." });
    } catch (e) {
      toast({ variant: "destructive", title: "Erreur suppression photo", description: "Impossible de supprimer la photo." });
    }
  };

  const handleNextStudent = () => {
    if (currentStudentIndex < students.length - 1) {
      setCurrentStudentIndex(prev => prev + 1);
    } else {
      toast({ title: "Fin de la liste", description: "Vous êtes au dernier élève." });
    }
  };

  const handlePreviousStudent = () => {
    if (currentStudentIndex > 0) {
      setCurrentStudentIndex(prev => prev - 1);
    } else {
      toast({ title: "Début de la liste", description: "Vous êtes au premier élève." });
    }
  };

  const handleExport = async () => {
    if (!projectConfig) {
      toast({ variant: "destructive", title: "Projet non configuré", description: "Veuillez configurer le projet avant d'exporter." });
      return;
    }
    const projectPhotos = await getPhotosForProject(projectConfig.projectId);

    if (projectPhotos.length === 0 && students.length === 0) {
      toast({ variant: "destructive", title: "Rien à exporter", description: "Aucune photo ni élève pour ce projet." });
      return;
    }

    const csvHeader = "Classe,Nom,Prénom,FichierPhoto\n";
    let csvRows = "";

    if (projectPhotos.length > 0) {
        csvRows = projectPhotos.map(photo => {
            const student = students.find(s => s.id === photo.studentId);
            if (!student) return ""; // Should not happen if data is consistent
            return `${student.className},${student.lastName},${student.firstName},${photo.fileName}\n`;
        }).join("");
    } else if (students.length > 0) { // Export students even if no photos
        csvRows = students.map(student => {
            return `${student.className},${student.lastName},${student.firstName},\n`; // No photo file name
        }).join("");
    }
    
    const csvContent = csvHeader + csvRows;

    const csvBlob = new Blob([`Projet: ${projectConfig.projectName}\nDate Séance: ${format(parseISO(projectConfig.sessionDate), 'PPP', { locale: fr })}\n\n` + csvContent], { type: 'text/csv;charset=utf-8;' });
    const csvUrl = URL.createObjectURL(csvBlob);
    const csvLink = document.createElement('a');
    csvLink.href = csvUrl;
    csvLink.setAttribute('download', `export_${projectConfig.projectName.replace(/\s+/g, '_')}_${projectConfig.sessionDate}.csv`);
    document.body.appendChild(csvLink);
    csvLink.click();
    document.body.removeChild(csvLink);
    URL.revokeObjectURL(csvUrl);

    toast({ title: "CSV Exporté", description: "La liste CSV des photos des élèves a été téléchargée." });
    if (projectPhotos.length > 0) {
        console.log("Simulating ZIP export of photos:", projectPhotos.map(p => p.fileName));
        toast({ title: "Export des photos (Simulation)", description: "La simulation de l'export ZIP est dans la console." });
    }
  };

  const handleClearProjectData = async () => {
    if (!projectConfig) return;
    if (window.confirm(`Êtes-vous sûr de vouloir effacer toutes les photos capturées pour le projet "${projectConfig.projectName}" ? Cette action est irréversible.`)) {
      try {
        await deleteAllPhotosForProject(projectConfig.projectId);
        setCapturedPhotosByStudent({});
        if (currentStudent) {
          setCapturedPhotosByStudent(prev => ({ ...prev, [currentStudent.id]: [] }));
        }
        toast({ title: "Données du projet effacées", description: `Toutes les photos pour "${projectConfig.projectName}" ont été supprimées.` });
      } catch (e) {
        toast({ variant: "destructive", title: "Erreur suppression", description: "Impossible de supprimer les photos du projet." });
      }
    }
  };

  const handleCsvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!projectConfig) {
        toast({ variant: "destructive", title: "Projet non configuré", description: "Veuillez sélectionner un projet avant d'importer des élèves." });
        return;
    }
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (!text) {
            toast({ variant: "destructive", title: "Fichier vide", description: "Le fichier CSV sélectionné est vide." });
            return;
        }
        try {
          const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
          if (lines.length <= 1) {
            toast({ variant: "destructive", title: "Format CSV incorrect", description: "Le fichier CSV doit contenir un en-tête et au moins une ligne de données." });
            return;
          }

          const header = lines[0].split(',').map(h => h.trim().toLowerCase());
          const firstNameIndex = header.indexOf('prénom');
          const lastNameIndex = header.indexOf('nom');
          const classNameIndex = header.indexOf('classe');

          if (firstNameIndex === -1 || lastNameIndex === -1 || classNameIndex === -1) {
            toast({ variant: "destructive", title: "En-têtes CSV manquants", description: "Le CSV doit contenir les colonnes: Prénom, Nom, Classe." });
            return;
          }
          
          const importedStudents: Student[] = lines.slice(1).map((line, index) => {
            const values = line.split(',').map(v => v.trim());
            return {
              id: `student_${projectConfig.projectId}_${Date.now()}_${index}`, 
              firstName: values[firstNameIndex] || `PrénomInconnu${index}`,
              lastName: values[lastNameIndex] || `NomInconnu${index}`,
              className: values[classNameIndex] || 'ClasseInconnue',
            };
          });

          if (importedStudents.length > 0) {
            setStudents(importedStudents);
            setCurrentStudentIndex(0);
            localStorage.setItem(`${LOCAL_STORAGE_PROJECT_STUDENTS_PREFIX}${projectConfig.projectId}`, JSON.stringify(importedStudents));
            toast({ title: "Élèves importés", description: `${importedStudents.length} élèves importés avec succès pour le projet ${projectConfig.projectName}.` });
          } else {
            toast({ variant: "destructive", title: "Aucun élève importé", description: "Aucun élève n'a été trouvé dans le fichier CSV." });
          }
        } catch (error) {
            console.error("Error parsing CSV:", error);
            toast({ variant: "destructive", title: "Erreur de parsing CSV", description: "Impossible de lire le fichier CSV. Vérifiez son format." });
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleOpenAddStudentModal = () => {
    setNewStudentFirstName("");
    setNewStudentLastName("");
    setNewStudentClass(availableSchoolClasses[0]?.name || "");
    setIsAddStudentModalOpen(true);
  };

  const handleSaveStudent = () => {
    if (!projectConfig) {
        toast({ variant: "destructive", title: "Erreur Projet", description: "Aucun projet actif pour ajouter cet élève."});
        return;
    }
    if (!newStudentFirstName.trim() || !newStudentLastName.trim() || !newStudentClass.trim()) {
        toast({ variant: "destructive", title: "Champs manquants", description: "Veuillez remplir Prénom, Nom et Classe."});
        return;
    }
    const newStudent: Student = {
        id: `student_${projectConfig.projectId}_${Date.now()}_manual_${students.length}`,
        firstName: newStudentFirstName.trim(),
        lastName: newStudentLastName.trim(),
        className: newStudentClass.trim(),
    };
    const updatedStudents = [...students, newStudent];
    setStudents(updatedStudents);
    localStorage.setItem(`${LOCAL_STORAGE_PROJECT_STUDENTS_PREFIX}${projectConfig.projectId}`, JSON.stringify(updatedStudents));
    toast({ title: "Élève ajouté", description: `${newStudent.firstName} ${newStudent.lastName} a été ajouté à la liste.`});
    setIsAddStudentModalOpen(false);
  };


  if (isProjectLoading) {
    return (
      <div className="flex h-screen flex-col bg-background text-foreground">
        <header className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border/60 shadow-sm bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <PhotoClassLogo />
        </header>
        <main className="flex-1 flex items-center justify-center">
          <p className="text-lg text-muted-foreground">Chargement de la configuration du projet...</p>
        </main>
      </div>
    );
  }

  if (!projectConfig) {
    return (
      <div className="flex h-screen flex-col bg-background text-foreground">
        <header className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border/60 shadow-sm bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <PhotoClassLogo />
          <Link href="/" passHref>
            <Button variant="default" size="lg">
              <Briefcase className="mr-2 h-5 w-5" /> Configurer le Projet
            </Button>
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center p-6">
          <Alert variant="destructive" className="max-w-md">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Projet non configuré</AlertTitle>
            <AlertDescription>
              Veuillez configurer un nom de projet et une date de séance avant de prendre des photos.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  const canInteract = !!projectConfig;

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 p-4 border-b border-border/60 shadow-sm bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <PhotoClassLogo />
        {projectConfig && (
          <div className="text-sm text-muted-foreground text-center order-last lg:order-none lg:absolute lg:left-1/2 lg:-translate-x-1/2">
            <p className="truncate">
              <span className="font-semibold text-primary">{projectConfig.projectName}</span> - Séance du {format(parseISO(projectConfig.sessionDate), 'PPP', { locale: fr })}
            </p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Link href="/" passHref>
            <Button variant="outline" size="lg" className="bg-card hover:bg-muted" aria-label="Aller à la gestion de projet">
              <Briefcase className="mr-2 h-5 w-5" /> Projets
            </Button>
          </Link>
           <Button variant="outline" size="lg" onClick={handleOpenAddStudentModal} disabled={!canInteract} className="bg-card hover:bg-muted" aria-label="Ajouter un élève manuellement">
            <UserPlus className="mr-2 h-5 w-5" /> Ajouter Élève
          </Button>
           <Button variant="outline" size="lg" onClick={() => fileInputRef.current?.click()} disabled={!canInteract} className="bg-card hover:bg-muted" aria-label="Import CSV Élèves">
            <UploadCloud className="mr-2 h-5 w-5" /> Importer CSV Élèves
          </Button>
          <Input type="file" accept=".csv" ref={fileInputRef} onChange={handleCsvFileChange} className="hidden" />
          <Button variant="outline" size="lg" onClick={handleExport} disabled={!canInteract} className="bg-card hover:bg-muted" aria-label="Export Photos and CSV">
            <Download className="mr-2 h-5 w-5" /> Export
          </Button>
          <Button
            variant={isWebcamActive ? "destructive" : "default"}
            size="lg"
            onClick={isWebcamActive ? stopWebcam : () => { setWebcamError(null); startWebcam(); }}
            disabled={!canInteract}
            aria-label={isWebcamActive ? "Stop Webcam" : "Start Webcam"}
          >
            {isWebcamActive ? <PowerOff className="mr-2 h-5 w-5" /> : <Power className="mr-2 h-5 w-5" />}
            {isWebcamActive ? "Stop Cam" : "Start Cam"}
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row p-4 gap-4 overflow-hidden">
        <Card className={cn("lg:w-1/3 flex flex-col shadow-lg bg-card", !canInteract && "opacity-50 pointer-events-none")}>
          <CardHeader>
            <CardTitle className="text-xl">Élève Actuel</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-6">
            {students.length > 0 && currentStudent ? (
              <>
                <p className="text-sm text-muted-foreground">{currentStudent.className}</p>
                <p className="text-5xl md:text-6xl font-bold my-4 text-primary truncate max-w-full px-2" title={`${currentStudent.firstName} ${currentStudent.lastName}`}>
                  {currentStudent.firstName}
                </p>
                <p className="text-5xl md:text-6xl font-bold mb-4 text-primary truncate max-w-full px-2">
                  {currentStudent.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentStudentIndex + 1} / {students.length}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">Aucun élève disponible. Veuillez importer ou ajouter des élèves.</p>
            )}
            {isLoading && students.length > 0 && <p className="text-sm text-muted-foreground mt-2">Chargement des photos de l'élève...</p>}
          </CardContent>
          <CardFooter className="flex justify-between p-4 border-t border-border/60">
            <Button variant="outline" size="lg" onClick={handlePreviousStudent} disabled={currentStudentIndex === 0 || !canInteract || students.length === 0} className="bg-background hover:bg-muted" aria-label="Previous Student">
              <ArrowLeft className="mr-2 h-5 w-5" /> Préc.
            </Button>
            <Button variant="outline" size="lg" onClick={handleNextStudent} disabled={currentStudentIndex === students.length - 1 || !canInteract || students.length === 0} className="bg-background hover:bg-muted" aria-label="Next Student">
              Suiv. <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardFooter>
        </Card>

        <Card className={cn("lg:w-2/3 flex flex-col shadow-lg overflow-hidden bg-card", !canInteract && "opacity-50 pointer-events-none")}>
          <CardHeader>
            <CardTitle className="text-xl">Capture Photo</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center relative p-2 md:p-4">
            <div className="w-full aspect-video bg-muted rounded-md shadow-inner overflow-hidden relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
              {(!isWebcamActive || webcamError) && canInteract && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 backdrop-blur-sm rounded-md p-4 text-center">
                  <Camera className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {webcamError ? "Erreur Webcam" : "Webcam inactive."}
                  </p>
                  {webcamError && (
                    <p className="text-destructive text-sm mt-2 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 mr-1 flex-shrink-0" />
                      <span className="break-words max-w-xs">
                        {webcamError.replace("Error accessing webcam: ", "").replace(" Please ensure permissions are granted.", "")}
                      </span>
                    </p>
                  )}
                  <Button
                    onClick={() => {
                      setWebcamError(null);
                      startWebcam();
                    }}
                    className="mt-4"
                    size="lg"
                    aria-label="Activer la webcam"
                  >
                    {isWebcamActive && webcamError ? "Réessayer Webcam" : "Activer Webcam"}
                  </Button>
                </div>
              )}
            </div>
            {!canInteract && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/90 backdrop-blur-sm rounded-md shadow-inner p-4 text-center">
                <Info className="w-16 h-16 text-primary mb-4" />
                <p className="text-lg font-medium">Projet non configuré</p>
                <p className="text-muted-foreground mb-4">Veuillez configurer le projet pour activer la capture.</p>
                <Link href="/" passHref>
                  <Button size="lg">Configurer le Projet</Button>
                </Link>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden"></canvas>
          </CardContent>
          <CardFooter className="flex flex-col p-4 border-t border-border/60">
            <Button
              size="lg"
              className="w-full mb-4 bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-xl"
              onClick={handleCapturePhoto}
              disabled={!isWebcamActive || !currentStudent || !canInteract || isLoading || students.length === 0}
              aria-label="Capture Photo"
            >
              <Camera className="mr-2 h-6 w-6" /> Capturer Photo
            </Button>
            {currentStudent && (capturedPhotosByStudent[currentStudent.id]?.length ?? 0) > 0 && (
              <div className="w-full">
                <h3 className="text-sm font-medium mb-2 text-muted-foreground">Captures pour {currentStudent.firstName}:</h3>
                <ScrollArea className="h-24 w-full">
                  <div className="flex gap-2 pb-2">
                    {(capturedPhotosByStudent[currentStudent.id] || []).map((photo) => (
                      <div key={photo.id} className="relative group shrink-0">
                        <Image
                          src={photo.photoDataUrl}
                          alt={`Photo pour ${currentStudent.firstName}`}
                          width={80}
                          height={60}
                          className="rounded-md object-cover w-20 h-[60px] border border-border/60"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-0 right-0 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeletePhoto(photo.id, currentStudent.id)}
                          aria-label="Delete Photo"
                          disabled={!canInteract}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardFooter>
        </Card>
      </main>
      <footer className="p-2 text-center border-t border-border/60">
        <Button variant="link" size="sm" onClick={handleClearProjectData} className="text-destructive hover:text-destructive/80" disabled={!canInteract}>
          <Trash2 className="mr-1 h-3 w-3" /> Effacer les photos du projet actuel
        </Button>
      </footer>

      {/* Add Student Modal */}
      <Dialog open={isAddStudentModalOpen} onOpenChange={setIsAddStudentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un nouvel élève</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">
                Prénom
              </Label>
              <Input
                id="firstName"
                value={newStudentFirstName}
                onChange={(e) => setNewStudentFirstName(e.target.value)}
                className="col-span-3 bg-background"
                placeholder="Prénom de l'élève"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">
                Nom
              </Label>
              <Input
                id="lastName"
                value={newStudentLastName}
                onChange={(e) => setNewStudentLastName(e.target.value)}
                className="col-span-3 bg-background"
                placeholder="Nom de l'élève"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="className" className="text-right">
                Classe
              </Label>
              {availableSchoolClasses.length > 0 ? (
                <Select
                  value={newStudentClass}
                  onValueChange={setNewStudentClass}
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
                    id="className"
                    value={newStudentClass}
                    onChange={(e) => setNewStudentClass(e.target.value)}
                    className="col-span-3 bg-background"
                    placeholder="Ex: CP A (Aucune classe configurée)"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={handleSaveStudent}>Sauvegarder Élève</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
