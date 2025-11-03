/**
 * User Avatar Utilities
 * Generate and handle user profile picture URLs
 */

/**
 * Generate a profile picture URL for a user
 * Uses Firebase Storage path or fallback to UI Avatars API
 * 
 * @param userId - The user's unique ID
 * @param avatarUrl - Optional custom avatar URL from user profile
 * @param userName - Optional user name for fallback avatar
 * @returns Profile picture URL
 */
export function getUserAvatarUrl(
  userId: string,
  avatarUrl?: string | null,
  userName?: string | null
): string {
  // If user has uploaded a custom avatar, use it
  if (avatarUrl && avatarUrl.trim() !== '') {
    return avatarUrl;
  }

  // Firebase Storage path pattern (if storing avatars there)
  // Uncomment if you're using Firebase Storage for avatars
  // const firebaseStoragePath = `https://storage.googleapis.com/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/avatars/${userId}.jpg`;
  // return firebaseStoragePath;

  // Fallback: Generate avatar using UI Avatars API or similar
  // This creates a nice colorful avatar with user's initials
  if (userName) {
    const initials = userName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    // UI Avatars (free service)
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&size=200&background=random&color=fff&bold=true`;
  }

  // Last fallback: Generic avatar based on user ID
  // Create consistent color based on user ID hash
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = ['3b82f6', 'ef4444', '10b981', 'f59e0b', '8b5cf6', 'ec4899', '06b6d4'];
  const color = colors[hash % colors.length];
  
  return `https://ui-avatars.com/api/?name=${userId.slice(0, 2)}&size=200&background=${color}&color=fff&bold=true`;
}

/**
 * Get initials from a name for avatar fallback
 * 
 * @param name - User's full name
 * @returns Initials (max 2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Validate if a URL is a valid image URL
 * 
 * @param url - URL to validate
 * @returns true if valid image URL
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || url.trim() === '') return false;
  
  try {
    const urlObj = new URL(url);
    const validProtocols = ['http:', 'https:'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    
    return validProtocols.includes(urlObj.protocol) && 
           (validExtensions.some(ext => urlObj.pathname.toLowerCase().endsWith(ext)) || 
            urlObj.hostname.includes('ui-avatars.com'));
  } catch {
    return false;
  }
}
