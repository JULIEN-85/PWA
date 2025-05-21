// IMPORTANT: This is a mock implementation using localStorage.
// For a production application, replace this with a robust IndexedDB solution (e.g., using Dexie.js).

import type { CapturedPhoto } from '@/types';

const STORAGE_KEY_PHOTOS = 'photoClassAppPhotos'; // Renamed for clarity or to avoid conflict

function getAllStoredPhotos(): CapturedPhoto[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY_PHOTOS);
  return stored ? JSON.parse(stored) : [];
}

function saveAllStoredPhotos(photos: CapturedPhoto[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_PHOTOS, JSON.stringify(photos));
}

export async function savePhoto(photo: CapturedPhoto): Promise<void> {
  if (!photo.projectId) {
    console.error("Cannot save photo without a projectId");
    throw new Error("Photo must have a projectId");
  }
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));
  const photos = getAllStoredPhotos();
  photos.push(photo);
  saveAllStoredPhotos(photos);
}

export async function getPhotosForStudent(studentId: string, projectId: string): Promise<CapturedPhoto[]> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 50));
  const photos = getAllStoredPhotos();
  return photos.filter(p => p.studentId === studentId && p.projectId === projectId);
}

export async function getPhotosForProject(projectId: string): Promise<CapturedPhoto[]> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 50));
  const photos = getAllStoredPhotos();
  return photos.filter(p => p.projectId === projectId);
}

export async function getAllPhotos(): Promise<CapturedPhoto[]> {
    // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 50));
  return getAllStoredPhotos();
}

export async function deletePhoto(photoId: string): Promise<void> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));
  let photos = getAllStoredPhotos();
  photos = photos.filter(p => p.id !== photoId);
  saveAllStoredPhotos(photos);
}

export async function deleteAllPhotosForProject(projectId: string): Promise<void> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));
  let photos = getAllStoredPhotos();
  photos = photos.filter(p => p.projectId !== projectId);
  saveAllStoredPhotos(photos);
}

export async function clearAllPhotos(): Promise<void> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_PHOTOS);
}
