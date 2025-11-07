import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitiza el nombre de un archivo para almacenamiento seguro
 * - Reemplaza espacios con guiones bajos
 * - Elimina caracteres especiales peligrosos
 * - Preserva la extensión del archivo
 * - Mantiene caracteres alfanuméricos, guiones, puntos
 */
export function sanitizeFileName(fileName: string): string {
  const extension = fileName.split('.').pop() || '';
  const nameWithoutExt = fileName.slice(0, -(extension.length + 1));
  
  const sanitized = nameWithoutExt
    .replace(/\s+/g, '_')           // Espacios → guiones bajos
    .replace(/[^a-zA-Z0-9_.-]/g, '') // Eliminar caracteres especiales
    .substring(0, 100);              // Limitar longitud
  
  return `${sanitized}.${extension}`;
}
