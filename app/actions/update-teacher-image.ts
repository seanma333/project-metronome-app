"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { teachers, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { put } from '@vercel/blob';

export async function updateTeacherImageUrl(imageUrl: string) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { error: "User not authenticated" };
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (user.length === 0) {
      return { error: "User not found" };
    }

    const userId = user[0].id;

    // Update teacher imageUrl in database
    await db
      .update(teachers)
      .set({
        imageUrl: imageUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(teachers.id, userId));

    // Also update users table
    await db
      .update(users)
      .set({
        imageUrl: imageUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, clerkUser.id));

    return { success: true, imageUrl };
  } catch (error) {
    console.error("Error updating teacher image:", error);
    return { error: "Failed to update image" };
  }
}

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
];

export async function uploadTeacherProfileImage(file: File) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { error: "User not authenticated" };
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.' };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return { error: 'File size must be less than 4MB' };
    }

    if (file.size < 1024) { // 1KB minimum
      return { error: 'File is too small. Please select a valid image file.' };
    }

    // Get file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    
    // Create pathname with user ID and timestamp
    const timestamp = Date.now();
    const pathname = `profile-images/${clerkUser.id}-${timestamp}.${fileExtension}`;

    // Upload to Vercel Blob
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return { error: 'Blob storage token not configured' };
    }

    const blob = await put(pathname, file, {
      access: 'public',
      token,
    });

    // Update database with new image URL
    const updateResult = await updateTeacherImageUrl(blob.url);
    if (updateResult.error) {
      return { error: updateResult.error };
    }

    return { success: true, imageUrl: blob.url };
  } catch (error) {
    console.error("Error uploading teacher profile image:", error);
    return { error: "Failed to upload image" };
  }
}
