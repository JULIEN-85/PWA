
export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  className: string; // This might be linked to SchoolClass.name or SchoolClass.id in the future
}

export interface CapturedPhoto {
  id: string; // Unique ID for the photo, e.g., timestamp or UUID
  studentId: string;
  projectId: string; // ID of the project this photo belongs to
  photoDataUrl: string; // base64 data URL
  fileName: string;
  timestamp: number;
}

export interface ProjectConfig {
  projectId: string;
  projectName: string;
  sessionDate: string; // Store date as ISO string or YYYY-MM-DD
}

export interface SchoolClass {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  createdDate: string;
  color: string;
  iconColor: string;
  students: number;
  photos: number;
  progress: number;
}
