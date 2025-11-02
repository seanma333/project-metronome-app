"use server";

import { db } from "@/lib/db";
import { teachers } from "@/lib/db/schema";
import { like } from "drizzle-orm";

export async function generateUniqueProfileName(firstName: string, lastName: string) {
  const baseName = `${firstName}-${lastName}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  // Find all existing profile names that start with the base name
  const existingProfiles = await db
    .select({ profileName: teachers.profileName })
    .from(teachers)
    .where(like(teachers.profileName, `${baseName}%`));

  // Check if the base name itself exists
  const baseNameExists = existingProfiles.some(p => p.profileName === baseName);

  if (!baseNameExists && existingProfiles.length === 0) {
    return baseName;
  }

  // Extract numbers from existing profiles that match the pattern basename-number
  const numbers = existingProfiles
    .map((p) => {
      const match = p.profileName.match(new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)$`));
      return match ? parseInt(match[1], 10) : null;
    })
    .filter((n): n is number => n !== null);

  // Find the next available number
  let nextNumber = 1;
  if (numbers.length > 0) {
    const maxNumber = Math.max(...numbers);
    nextNumber = maxNumber + 1;
  }

  return `${baseName}-${nextNumber}`;
}
