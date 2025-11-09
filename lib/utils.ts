import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns true if images should be unoptimized (for pre-production environments)
 * Checks IS_PRODUCTION or NEXT_PUBLIC_IS_PRODUCTION env variable - if not 'true', assumes pre-production
 * If variable is not set, assumes production (safe default)
 */
export function shouldUnoptimizeImages(): boolean {
  // Check both NEXT_PUBLIC_ (for client) and regular (for server) versions
  const isProduction = process.env.NEXT_PUBLIC_IS_PRODUCTION || process.env.IS_PRODUCTION;
  return isProduction !== 'true';
}
