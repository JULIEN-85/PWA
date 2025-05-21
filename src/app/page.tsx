
"use client";
import { useRouter } from 'next/navigation';
import { Inter } from 'next/font/google';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { format, parse, isValid, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

import {
  Search,
  Folder,
  Settings,
  LogOut,
  Menu,
  CheckCircle2 as CircleCheck, // Renamed to avoid conflict with Checkbox component if any
  Bell,
  HelpCircle,
  UploadCloud,
  Plus,
  MoreVertical,
  Users,
  Image as ImageIcon,
  Download,
  Pencil,
  Eye,
  Copy,
  Archive,
  Trash2,
  Camera,
  User,
  FileText,
} from 'lucide-react';


import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { PhotoClassLogo } from '@/components/PhotoClassLogo';
import { cn } from '@/lib/utils';
import type { Project, ProjectConfig, SchoolClass, Student, CapturedPhoto } from '@/types';
import { getPhotosForProject, deleteAllPhotosForProject, getAllPhotos } from '@/lib/photoStore';


import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const initialMockProjectsData: Omit<Project, 'students' | 'photos' | 'progress'>[] = [
  { id: 'proj_1', name: 'Photos Trimestrielles', createdDate: '15 mai 2025', color: 'bg-primary', iconColor: 'bg-blue-100 text-primary' },
  { id: 'proj_2', name: 'Photos de Classe', createdDate: '10 avril 2025', color: 'bg-green-500', iconColor: 'bg-green-100 text-green-600' },
  { id: 'proj_3', name: 'Portraits Individuels', createdDate: '5 mai 2025', color: 'bg-purple-500', iconColor: 'bg-purple-100 text-purple-600' },
  { id: 'proj_4', name: 'Journée Sportive', createdDate: '18 mai 2025', color: 'bg-amber-500', iconColor: 'bg-amber-100 text-amber-600' },
  { id: 'proj_5', name: 'Fête de l\'École', createdDate: '1 mai 2025', color: 'bg-red-500', iconColor: 'bg-red-100 text-red-600' },
];

const PHOTOAPP_PROJECTS_KEY = 'photoClassAppProjects';
const PHOTOAPP_SCHOOL_CLASSES_KEY = 'photoClassAppSchoolClasses';
const LOCAL_STORAGE_PROJECT_STUDENTS_PREFIX = 'photoClassProjectStudents_';


export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  const [activeProjectMenu, setActiveProjectMenu] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  
  const [lastUpdatedTimestamp, setLastUpdatedTimestamp] = useState<string | null>(null);

  const [isImportCsvModalOpen, setIsImportCsvModalOpen] = useState(false);
  const [selectedProjectIdForCsvImport, setSelectedProjectIdForCsvImport] = useState<string | null>(null);
  const [csvFileToImport, setCsvFileToImport] = useState<File | null>(null);
  const csvImportFileInputRef = useRef<HTMLInputElement>(null);

  const loadAndEnrichProjects = async () => {
    setIsLoadingCounts(true);
    let baseProjects: Omit<Project, 'students' | 'photos' | 'progress'>[];
    
    if (typeof window !== 'undefined') {
      const storedProjectsJson = localStorage.getItem(PHOTOAPP_PROJECTS_KEY);
      if (storedProjectsJson) {
        try {
          const parsedProjects = JSON.parse(storedProjectsJson) as Omit<Project, 'students' | 'photos' | 'progress'>[];
          baseProjects = Array.isArray(parsedProjects) ? parsedProjects : initialMockProjectsData;
          if (!Array.isArray(parsedProjects)) {
               localStorage.setItem(PHOTOAPP_PROJECTS_KEY, JSON.stringify(baseProjects));
          }
        } catch (error) {
          console.error("Failed to parse projects from localStorage", error);
          baseProjects = initialMockProjectsData;
          localStorage.setItem(PHOTOAPP_PROJECTS_KEY, JSON.stringify(baseProjects));
        }
      } else {
        baseProjects = initialMockProjectsData;
        localStorage.setItem(PHOTOAPP_PROJECTS_KEY, JSON.stringify(baseProjects));
      }

      const storedClassesJson = localStorage.getItem(PHOTOAPP_SCHOOL_CLASSES_KEY);
      if (storedClassesJson) {
        try {
          const parsedClasses = JSON.parse(storedClassesJson) as SchoolClass[];
          setSchoolClasses(Array.isArray(parsedClasses) ? parsedClasses : []);
        } catch (error) {
          console.error("Failed to parse school classes from localStorage", error);
          setSchoolClasses([]);
        }
      } else {
        setSchoolClasses([]);
        localStorage.setItem(PHOTOAPP_SCHOOL_CLASSES_KEY, JSON.stringify([]));
      }
    } else {
      baseProjects = initialMockProjectsData;
      setSchoolClasses([]);
    }

    // Fetch all photos once
    const allPhotosFromStore = await getAllPhotos();
    const photosByProjectId = new Map<string, CapturedPhoto[]>();
    allPhotosFromStore.forEach(photo => {
        if (!photosByProjectId.has(photo.projectId)) {
            photosByProjectId.set(photo.projectId, []);
        }
        photosByProjectId.get(photo.projectId)?.push(photo);
    });

    const projectsWithLatestCounts = await Promise.all(
      baseProjects.map(async (proj) => {
        try {
          let projectStudentsList: Student[] = [];
          if (typeof window !== 'undefined') {
            const projectStudentsData = localStorage.getItem(`${LOCAL_STORAGE_PROJECT_STUDENTS_PREFIX}${proj.id}`);
            projectStudentsList = projectStudentsData ? JSON.parse(projectStudentsData) : [];
          }
          const numStudents = projectStudentsList.length;
          
          const projectPhotos = photosByProjectId.get(proj.id) || [];
          const numPhotos = projectPhotos.length;

          let progress = 0;
          if (numStudents > 0 && projectPhotos.length > 0) {
            const studentIdsWithPhotos = new Set(projectPhotos.map(p => p.studentId));
            const studentsWithAtLeastOnePhoto = projectStudentsList.filter(s => studentIdsWithPhotos.has(s.id)).length;
            progress = Math.round((studentsWithAtLeastOnePhoto / numStudents) * 100);
          } else {
            progress = 0; 
          }
          return { ...proj, students: numStudents, photos: numPhotos, progress };
        } catch (e) {
          console.error(`Failed to get counts for project ${proj.id}`, e);
          return { ...proj, students: 0, photos: 0, progress: 0 }; 
        }
      })
    );
    setProjects(projectsWithLatestCounts);
    setIsLoadingCounts(false);
  };

  useEffect(() => {
    loadAndEnrichProjects();
  }, []);
  
 useEffect(() => {
    if (typeof window !== 'undefined') {
      setLastUpdatedTimestamp(format(new Date(), 'd MMMM yyyy, HH:mm', { locale: fr }));
    }
  }, []);


  const updateProjectsInStateAndStorage = (newProjectsList: Project[] | ((prevProjects: Project[]) => Project[])) => {
    setProjects(currentProjects => {
      const updatedList = typeof newProjectsList === 'function' ? newProjectsList(currentProjects) : newProjectsList;
      if (typeof window !== 'undefined') {
        const baseProjectsToStore = updatedList.map(({ students, photos, progress, ...baseProj }) => baseProj);
        localStorage.setItem(PHOTOAPP_PROJECTS_KEY, JSON.stringify(baseProjectsToStore));
      }
      return updatedList; 
    });
  };
  
  const updateSchoolClassesInStateAndStorage = (newClassesList: SchoolClass[] | ((prevClasses: SchoolClass[]) => SchoolClass[])) => {
    setSchoolClasses(currentClasses => {
      const updatedList = typeof newClassesList === 'function' ? newClassesList(currentClasses) : newClassesList;
      if (typeof window !== 'undefined') {
        localStorage.setItem(PHOTOAPP_SCHOOL_CLASSES_KEY, JSON.stringify(updatedList));
      }
      return updatedList;
    });
  };

  const handleCreateOrUpdateProject = async () => {
    if (!newProjectName.trim()) {
      toast({
        title: "Nom du projet requis",
        description: "Veuillez entrer un nom pour le projet.",
        variant: "destructive",
      });
      return;
    }

    if (editingProjectId) {
      updateProjectsInStateAndStorage(prevProjects => 
        prevProjects.map(p =>
          p.id === editingProjectId ? { ...p, name: newProjectName.trim() } : p
        )
      );
      toast({ title: "Projet modifié", description: `Le projet "${newProjectName.trim()}" a été mis à jour.` });
    } else {
      const newProjectBase: Project = {
        id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: newProjectName.trim(),
        progress: 0,
        students: 0, 
        photos: 0,
        createdDate: format(new Date(), 'd MMMM yyyy', { locale: fr }),
        color: 'bg-primary', 
        iconColor: 'bg-blue-100 text-primary',
      };
      updateProjectsInStateAndStorage(prevProjects => [newProjectBase, ...prevProjects]);
      toast({ title: "Projet créé", description: `Le projet "${newProjectBase.name}" a été configuré.` });
    }

    setIsNewProjectModalOpen(false);
    setNewProjectName("");
    setEditingProjectId(null);
    await loadAndEnrichProjects();
  };
  
  const handleOpenNewProjectModal = () => {
    setEditingProjectId(null);
    setNewProjectName('');
    setIsNewProjectModalOpen(true);
    setActiveProjectMenu(null);
  };

  const handleOpenEditProjectModal = (projectId: string) => {
    const projectToEdit = projects.find(p => p.id === projectId);
    if (projectToEdit) {
      setEditingProjectId(projectId);
      setNewProjectName(projectToEdit.name);
      setIsNewProjectModalOpen(true);
      setActiveProjectMenu(null);
    }
  };

  const handleArchiveConfirm = () => {
    setIsArchiveConfirmOpen(false);
    toast({ title: "Projet archivé", description: "Le projet a été archivé avec succès." });
    setActiveProjectMenu(null);
  };

  const handleDeleteConfirm = async () => {
    if (projectToDelete) {
      try {
        await deleteAllPhotosForProject(projectToDelete);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`${LOCAL_STORAGE_PROJECT_STUDENTS_PREFIX}${projectToDelete}`);
        }
        updateProjectsInStateAndStorage(prevProjects => prevProjects.filter(p => p.id !== projectToDelete));
        toast({ title: "Projet supprimé", description: "Le projet, ses photos et sa liste d'élèves ont été supprimés.", variant: "destructive" });
      } catch (e) {
        toast({ title: "Erreur de suppression", description: "Impossible de supprimer le projet ou ses données associées.", variant: "destructive" });
      }
    }
    setIsDeleteConfirmOpen(false);
    setProjectToDelete(null);
    setActiveProjectMenu(null);
  };
  
  const handleOpenDeleteConfirm = (projectId: string) => {
    setProjectToDelete(projectId);
    setIsDeleteConfirmOpen(true);
    setActiveProjectMenu(null);
  };


  const handleCreateSchoolClass = () => {
    const trimmedClassName = newClassName.trim();
    if (!trimmedClassName) {
      toast({
        title: "Nom de la classe requis",
        description: "Veuillez entrer un nom pour la classe.",
        variant: "destructive",
      });
      return;
    }
    if (schoolClasses.some(sc => sc.name.toLowerCase() === trimmedClassName.toLowerCase())) {
       toast({
        title: "Classe existante",
        description: `La classe "${trimmedClassName}" existe déjà.`,
        variant: "destructive",
      });
      return;
    }

    const newClass: SchoolClass = {
      id: `class_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: trimmedClassName,
    };
    updateSchoolClassesInStateAndStorage(prevClasses => [...prevClasses, newClass]);
    toast({ title: "Classe créée", description: `La classe "${newClass.name}" a été ajoutée.` });
    setNewClassName("");
    setIsAddClassModalOpen(false);
  };

  const handleOpenImportCsvModal = () => {
    if (projects.length === 0) {
      toast({
        variant: "destructive",
        title: "Aucun projet",
        description: "Veuillez d'abord créer un projet pour y importer des élèves.",
      });
      return;
    }
    setSelectedProjectIdForCsvImport(null);
    setCsvFileToImport(null);
    if (csvImportFileInputRef.current) {
      csvImportFileInputRef.current.value = ""; 
    }
    setIsImportCsvModalOpen(true);
  };

  const handleImportStudentsFromCsv = async () => {
    if (!selectedProjectIdForCsvImport) {
      toast({ variant: "destructive", title: "Aucun projet sélectionné", description: "Veuillez sélectionner un projet." });
      return;
    }
    if (!csvFileToImport) {
      toast({ variant: "destructive", title: "Aucun fichier sélectionné", description: "Veuillez sélectionner un fichier CSV." });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
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
            id: `student_${selectedProjectIdForCsvImport}_csv_${Date.now()}_${index}`, 
            firstName: values[firstNameIndex] || `PrénomInconnu${index}`,
            lastName: values[lastNameIndex] || `NomInconnu${index}`,
            className: values[classNameIndex] || 'ClasseInconnue',
          };
        });

        if (importedStudents.length > 0) {
          const projectStudentsKey = `${LOCAL_STORAGE_PROJECT_STUDENTS_PREFIX}${selectedProjectIdForCsvImport}`;
          const existingStudentsJson = localStorage.getItem(projectStudentsKey);
          const existingStudents: Student[] = existingStudentsJson ? JSON.parse(existingStudentsJson) : [];
          
          // Simple merge: add new, keep existing. Consider more sophisticated merging if needed.
          const studentIdSet = new Set(existingStudents.map(s => s.id));
          const newUniqueStudents = importedStudents.filter(s => !studentIdSet.has(s.id));
          const updatedStudents = [...existingStudents, ...newUniqueStudents];
          
          localStorage.setItem(projectStudentsKey, JSON.stringify(updatedStudents));
          
          toast({ title: "Élèves importés", description: `${importedStudents.length} élèves traités. ${newUniqueStudents.length} nouveaux élèves ajoutés pour le projet.` });
          setIsImportCsvModalOpen(false);
          await loadAndEnrichProjects(); 
        } else {
          toast({ variant: "destructive", title: "Aucun élève importé", description: "Aucun élève n'a été trouvé dans le fichier CSV." });
        }
      } catch (error) {
          console.error("Error parsing CSV:", error);
          toast({ variant: "destructive", title: "Erreur de parsing CSV", description: "Impossible de lire le fichier CSV. Vérifiez son format." });
      }
    };
    reader.readAsText(csvFileToImport);
  };


  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="sidebar bg-sidebar-background w-64 flex-shrink-0 hidden md:block">
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-4 border-b border-sidebar-border flex items-center">
            <PhotoClassLogo />
          </div>
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="px-4 mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-sidebar-muted-foreground" />
                </div>
                <Input type="text" className="search-input block w-full pl-10 pr-3 py-2 border-sidebar-border rounded-md text-sm placeholder-sidebar-muted-foreground focus:outline-none focus:border-primary transition duration-150 ease-in-out bg-background" placeholder="Rechercher..." />
              </div>
            </div>
            <div className="space-y-1">
              <Link href="/" className="flex items-center px-4 py-3 text-sm font-medium text-sidebar-active-foreground bg-sidebar-active-background rounded-r-full">
                <Folder className="w-5 h-5 mr-3" />
                <span>Projets</span>
              </Link>
              <Link href="/capture" className="flex items-center px-4 py-3 text-sm font-medium text-sidebar-foreground hover:text-sidebar-active-foreground hover:bg-sidebar-active-background rounded-r-full">
                <Camera className="w-5 h-5 mr-3" />
                <span>Capture Photos</span>
              </Link>
              <a href="#" className="flex items-center px-4 py-3 text-sm font-medium text-sidebar-foreground hover:text-sidebar-active-foreground hover:bg-sidebar-active-background rounded-r-full">
                <Users className="w-5 h-5 mr-3" />
                <span>Élèves</span>
              </a>
               <a href="#" className="flex items-center px-4 py-3 text-sm font-medium text-sidebar-foreground hover:text-sidebar-active-foreground hover:bg-sidebar-active-background rounded-r-full">
                <UploadCloud className="w-5 h-5 mr-3" />
                <span>Import Photos</span>
              </a>
              <Link href="/archives" className="flex items-center px-4 py-3 text-sm font-medium text-sidebar-foreground hover:text-sidebar-active-foreground hover:bg-sidebar-active-background rounded-r-full">
                <Archive className="w-5 h-5 mr-3" />
                <span>Archives</span>
              </Link>
              <Link href="/settings" className="flex items-center px-4 py-3 text-sm font-medium text-sidebar-foreground hover:text-sidebar-active-foreground hover:bg-sidebar-active-background rounded-r-full">
                <Settings className="w-5 h-5 mr-3" />
                <span>Paramètres</span>
              </Link>
            </div>
            <div className="mt-8 px-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-semibold text-sidebar-muted-foreground uppercase tracking-wider">Classes</h2>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-sidebar-muted-foreground hover:text-sidebar-active-foreground" onClick={() => { setNewClassName(''); setIsAddClassModalOpen(true); }}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {schoolClasses.length > 0 ? schoolClasses.map(sc => (
                  <a key={sc.id} href="#" className="flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md text-sidebar-foreground hover:text-sidebar-active-foreground hover:bg-sidebar-active-background">
                    <span>{sc.name}</span>
                  </a>
                )) : (
                  <p className="px-3 py-2 text-xs text-sidebar-muted-foreground">Aucune classe créée.</p>
                )}
              </div>
            </div>
          </nav>
          {/* User */}
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-foreground">Sophie Dubois</p>
                <p className="text-xs text-muted-foreground">Photographe</p>
              </div>
              <Button variant="ghost" size="icon" className="ml-auto p-1 text-muted-foreground hover:text-foreground">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navbar */}
        <header className="bg-card border-b border-border">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center md:hidden">
              <Button variant="ghost" size="icon" className="p-2 text-muted-foreground hover:text-foreground">
                <Menu className="w-6 h-6" />
              </Button>
              <h1 className="ml-2 text-lg font-semibold text-foreground">Projets</h1>
            </div>
            <div className="hidden md:flex items-center">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <CircleCheck className="w-4 h-4 text-green-500 mr-1" />
                <span>Synchronisé</span>
                <span>•</span>
                 {lastUpdatedTimestamp ? (
                  <span>Dernière mise à jour: {lastUpdatedTimestamp}</span>
                ) : (
                  <span>Chargement...</span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <HelpCircle className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Page header */}
            <div className="md:flex md:items-center md:justify-between mb-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-foreground sm:text-3xl sm:truncate">Projets</h2>
                <p className="mt-1 text-sm text-muted-foreground">Gérez vos projets photo et vos listes d'élèves</p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                <Button variant="outline" className="whitespace-nowrap" onClick={handleOpenImportCsvModal}>
                  <UploadCloud className="w-5 h-5 mr-2" />
                  Importer CSV
                </Button>
                <Button className="whitespace-nowrap" onClick={handleOpenNewProjectModal}>
                  <Plus className="w-5 h-5 mr-2" />
                  Nouveau projet
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-lg shadow-sm p-4 mb-6 border border-border">
              <div className="sm:flex sm:items-center sm:justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                    <Input type="text" className="search-input block w-full pl-10 pr-3 py-2 border-border rounded-md text-sm placeholder-muted-foreground focus:outline-none focus:border-primary transition duration-150 ease-in-out bg-background" placeholder="Rechercher un projet..." />
                  </div>
                  <div className="hidden sm:block">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px] bg-background">
                        <SelectValue placeholder="Tous les projets" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les projets</SelectItem>
                        <SelectItem value="active">Projets actifs</SelectItem>
                        <SelectItem value="archived">Projets archivés</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-3 sm:mt-0 flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>Trier par:</span>
                  <Select defaultValue="recent">
                    <SelectTrigger className="w-[180px] bg-background">
                      <SelectValue placeholder="Date (récent)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Date (récent)</SelectItem>
                      <SelectItem value="oldest">Date (ancien)</SelectItem>
                      <SelectItem value="name">Nom (A-Z)</SelectItem>
                      <SelectItem value="progress">Progression</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Projects grid */}
            {isLoadingCounts ? (
                 <p className="text-center text-muted-foreground">Chargement des informations des projets...</p>
            ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className={cn(
                    "project-card bg-card overflow-hidden rounded-lg shadow-sm border border-border",
                     activeProjectMenu === proj.id && "project-card-menu-open"
                  )}
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className={cn("w-10 h-10 flex items-center justify-center rounded-lg", proj.iconColor)}>
                          <Folder size={20} /> 
                        </div>
                        <h3 className="ml-3 text-lg font-medium text-foreground">{proj.name}</h3>
                      </div>
                      <DropdownMenu
                        open={activeProjectMenu === proj.id}
                        onOpenChange={(isOpen) => {
                          setActiveProjectMenu(isOpen ? proj.id : null);
                        }}
                      >
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="p-1 text-muted-foreground hover:text-foreground h-auto w-auto">
                            <MoreVertical className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            if (typeof window !== 'undefined') {
                              try {
                                let sessionDateISO = new Date().toISOString().split('T')[0];
                                if (proj.createdDate) {
                                  const parsedDate = parse(proj.createdDate, "d MMMM yyyy", new Date(), { locale: fr });
                                  if (isValid(parsedDate)) {
                                    sessionDateISO = parsedDate.toISOString().split('T')[0];
                                  } else {
                                    console.warn("Invalid date parsed from project.createdDate:", proj.createdDate, "Using current date as fallback.");
                                  }
                                }
                                localStorage.setItem('projectConfig', JSON.stringify({ projectId: proj.id, projectName: proj.name, sessionDate: sessionDateISO } as ProjectConfig));
                              } catch (e) {
                                console.error("Error processing project createdDate:", proj.createdDate, e);
                                localStorage.setItem('projectConfig', JSON.stringify({ projectId: proj.id, projectName: proj.name, sessionDate: new Date().toISOString().split('T')[0] } as ProjectConfig));
                              }
                            }
                            router.push('/project-details'); 
                            setActiveProjectMenu(null);
                          }}>
                            <Eye className="mr-2 h-4 w-4" />Voir les détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenEditProjectModal(proj.id)}>
                            <Pencil className="mr-2 h-4 w-4" />Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {setActiveProjectMenu(null); toast({title: "TODO", description: "Fonction Dupliquer à implémenter"})}}>
                            <Copy className="mr-2 h-4 w-4" />Dupliquer
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setIsArchiveConfirmOpen(true); setActiveProjectMenu(null); }}>
                            <Archive className="mr-2 h-4 w-4" />Archiver
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 focus:!text-destructive"
                            onClick={() => handleOpenDeleteConfirm(proj.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-2 mb-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progression</span>
                        <span className="font-medium text-foreground">{proj.progress}%</span>
                      </div>
                       <Progress value={proj.progress} className={cn("h-2", proj.color.startsWith('bg-') ? proj.color : 'bg-primary')} />
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        <span>{proj.students} élève{proj.students !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center">
                        <ImageIcon className="w-4 h-4 mr-1" />
                        <span>{proj.photos} photo{proj.photos !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/50 px-5 py-3 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Créé le {proj.createdDate}</span>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" className="p-1 text-muted-foreground hover:text-primary h-auto w-auto">
                          <Download className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="p-1 text-muted-foreground hover:text-primary h-auto w-auto"
                            onClick={() => {
                              if (typeof window !== 'undefined') {
                                try {
                                    let sessionDateISO = new Date().toISOString().split('T')[0];
                                     if (proj.createdDate) {
                                        const parsedDate = parse(proj.createdDate, "d MMMM yyyy", new Date(), { locale: fr });
                                        if (isValid(parsedDate)) {
                                            sessionDateISO = parsedDate.toISOString().split('T')[0];
                                        } else {
                                            console.warn("Invalid date parsed from project.createdDate for camera:", proj.createdDate, "Using current date as fallback.");
                                        }
                                     }
                                    localStorage.setItem('projectConfig', JSON.stringify({ projectId: proj.id, projectName: proj.name, sessionDate: sessionDateISO } as ProjectConfig));
                                } catch (e) {
                                    console.error("Error processing project createdDate for camera button:", proj.createdDate, e);
                                    localStorage.setItem('projectConfig', JSON.stringify({ projectId: proj.id, projectName: proj.name, sessionDate: new Date().toISOString().split('T')[0] } as ProjectConfig));
                                }
                              }
                              router.push('/capture');
                            }}
                          >
                            <Camera className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {/* New Project Card */}
              <Dialog open={isNewProjectModalOpen} onOpenChange={(isOpen) => {
                setIsNewProjectModalOpen(isOpen);
                if (!isOpen) {
                    setNewProjectName('');
                    setEditingProjectId(null);
                }
              }}>
                <div className="project-card bg-card overflow-hidden rounded-lg shadow-sm border border-border border-dashed flex items-center justify-center p-6 min-h-[260px] sm:min-h-[294px]">
                  <Button variant="ghost" className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors duration-200 h-full w-full group" onClick={handleOpenNewProjectModal}>
                    <div className="w-12 h-12 flex items-center justify-center border-2 border-dashed border-muted-foreground/50 rounded-full mb-2 group-hover:border-primary">
                      <Plus className="w-6 h-6 group-hover:text-primary" />
                    </div>
                    <span className="text-sm font-medium">Nouveau projet</span>
                  </Button>
                </div>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingProjectId ? "Modifier le projet" : "Créer un nouveau projet"}</DialogTitle>
                  </DialogHeader>
                  <div className="px-0 py-4 space-y-4">
                    <div>
                      <Label htmlFor="projectName" className="block text-sm font-medium text-foreground/80 mb-1">Nom du projet</Label>
                      <Input
                        type="text"
                        id="projectName"
                        placeholder="Entrez le nom du projet"
                        className="bg-background"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="projectType" className="block text-sm font-medium text-foreground/80 mb-1">Type de projet</Label>
                      <Select disabled={!!editingProjectId}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Sélectionnez un type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Photos individuelles</SelectItem>
                          <SelectItem value="class">Photos de classe</SelectItem>
                          <SelectItem value="event">Événement spécial</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-foreground/80 mb-1">Classes concernées</Label>
                      <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                        {schoolClasses.length > 0 ? schoolClasses.map(c => (
                          <div key={c.id} className="flex items-center">
                            <Checkbox id={`class-checkbox-${c.id}`} disabled={!!editingProjectId} />
                            <Label htmlFor={`class-checkbox-${c.id}`} className="ml-2 text-sm text-foreground/80">{c.name}</Label>
                          </div>
                        )) : (
                          <p className="text-xs text-muted-foreground">Aucune classe créée. Veuillez en ajouter via la barre latérale.</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="autoSync" className="text-sm font-medium text-foreground/80">Synchronisation automatique</Label>
                        <Switch id="autoSync" defaultChecked disabled={!!editingProjectId} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Les photos seront automatiquement synchronisées lorsque vous êtes en ligne.</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Annuler</Button>
                    </DialogClose>
                    <Button onClick={handleCreateOrUpdateProject}>
                      {editingProjectId ? "Enregistrer les modifications" : "Créer le projet"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            )}
          </div>
        </main>
      </div>

      {/* Dialog for Adding New School Class */}
      <Dialog open={isAddClassModalOpen} onOpenChange={(isOpen) => {
        setIsAddClassModalOpen(isOpen);
        if (!isOpen) {
          setNewClassName(''); 
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une nouvelle classe</DialogTitle>
          </DialogHeader>
          <div className="px-0 py-4">
            <Label htmlFor="newClassName" className="block text-sm font-medium text-foreground/80 mb-1">Nom de la classe</Label>
            <Input
              id="newClassName"
              type="text"
              placeholder="Ex: CM2 B, Grande Section A"
              className="bg-background"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddClassModalOpen(false)}>Annuler</Button>
            <Button onClick={handleCreateSchoolClass}>Créer la classe</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Importing Students via CSV */}
      <Dialog open={isImportCsvModalOpen} onOpenChange={setIsImportCsvModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importer des élèves pour un projet</DialogTitle>
            <DialogDescription>
              Sélectionnez un projet et un fichier CSV (avec les colonnes: Prénom, Nom, Classe).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="projectSelectForCsv" className="text-right">
                Projet
              </Label>
              <Select
                value={selectedProjectIdForCsvImport || ""}
                onValueChange={setSelectedProjectIdForCsvImport}
              >
                <SelectTrigger id="projectSelectForCsv" className="col-span-3 bg-background">
                  <SelectValue placeholder="Sélectionnez un projet" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id}>
                      {proj.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="csvFileImport" className="text-right">
                Fichier CSV
              </Label>
              <Input
                id="csvFileImport"
                type="file"
                accept=".csv"
                ref={csvImportFileInputRef}
                onChange={(e) => setCsvFileToImport(e.target.files ? e.target.files[0] : null)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline" onClick={() => setIsImportCsvModalOpen(false)}>Annuler</Button>
            </DialogClose>
            <Button onClick={handleImportStudentsFromCsv}>
              <FileText className="mr-2 h-4 w-4" /> Importer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


       <Dialog open={isArchiveConfirmOpen} onOpenChange={setIsArchiveConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Archiver ce projet ?</DialogTitle>
          </DialogHeader>
          <DialogDescription className="py-4">
            Le projet sera déplacé vers les projets archivés. Vous pourrez toujours y accéder via le filtre "Projets archivés".
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsArchiveConfirmOpen(false); setActiveProjectMenu(null); }}>Annuler</Button>
            <Button onClick={handleArchiveConfirm}>Confirmer l'archivage</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

       <AlertDialog open={isDeleteConfirmOpen} onOpenChange={(isOpen) => {
        setIsDeleteConfirmOpen(isOpen);
        if (!isOpen) {
          setProjectToDelete(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ce projet?</AlertDialogTitle>
          </AlertDialogHeader>
           <AlertDialogDescription className="py-4">
            Cette action est irréversible. Toutes les données associées à ce projet, y compris les photos et la liste des élèves, seront définitivement supprimées.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setIsDeleteConfirmOpen(false); setProjectToDelete(null); setActiveProjectMenu(null);}}>Annuler</AlertDialogCancel>
            <AlertDialogAction asChild>
                <Button variant="destructive" onClick={handleDeleteConfirm}>Confirmer la suppression</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
