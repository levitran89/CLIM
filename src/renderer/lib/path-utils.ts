// src/renderer/lib/path-utils.ts
/**
 * Extracts the directory path from a file path.
 * Handles both forward slashes and backslashes.
 * Returns empty string if no directory is found.
 */
export function getDirFromPath(filePath: string): string {
  // Normalize both types of path separators
  const normalized = filePath.replace(/\//g, '\\')
  const lastBackslashIndex = normalized.lastIndexOf('\\')
  
  if (lastBackslashIndex > -1) {
    return normalized.substring(0, lastBackslashIndex)
  }
  
  // No directory separator found, return empty string
  return ''
}
