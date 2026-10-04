/**
 * Terpusat API Client Helper untuk ERP Al Mubarok
 * Mendukung pemanggilan server-side (absolute URL ke port 3001)
 * dan browser-side (relative URL via Next.js proxy rewrite)
 */

export const API_BASE_URL = 
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
    : "";

/**
 * Custom fetch wrapper yang secara otomatis menambahkan base URL
 * jika dipanggil dari server-side.
 */
export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  
  // Gunakan standard fetch
  return fetch(url, options);
}
