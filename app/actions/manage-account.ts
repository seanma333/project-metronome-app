"use server";

import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, teachers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { put } from '@vercel/blob';

export async function updateAccountName(firstName: string, lastName: string) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { error: "User not authenticated" };
    }

    // Update in database
    await db
      .update(users)
      .set({
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, clerkUser.id));

    // Update in Clerk
    try {
      const client = await clerkClient();
      await client.users.updateUser(clerkUser.id, {
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
    } catch (clerkError) {
      console.error("Error updating Clerk user name:", clerkError);
      return { error: "Failed to update name in authentication system" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating account name:", error);
    return { error: "Failed to update name" };
  }
}

export async function updateAccountImage(imageUrl: string) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { error: "User not authenticated" };
    }

    const role = clerkUser.publicMetadata?.role as string | undefined;

    // Update users table
    await db
      .update(users)
      .set({
        imageUrl: imageUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, clerkUser.id));

    // If user is a teacher, also update teachers table
    if (role === "TEACHER") {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkUser.id))
        .limit(1);

      if (user.length > 0) {
        await db
          .update(teachers)
          .set({
            imageUrl: imageUrl || null,
            updatedAt: new Date(),
          })
          .where(eq(teachers.id, user[0].id));
      }
    }

    return { success: true, imageUrl };
  } catch (error) {
    console.error("Error updating account image:", error);
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

export async function uploadProfileImage(file: File) {
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
    const updateResult = await updateAccountImage(blob.url);
    if (updateResult.error) {
      return { error: updateResult.error };
    }

    return { success: true, imageUrl: blob.url };
  } catch (error) {
    console.error("Error uploading profile image:", error);
    return { error: "Failed to upload image" };
  }
}

export async function deleteAccount() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { error: "User not authenticated" };
    }

    // Mark user as deleted in database
    await db
      .update(users)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, clerkUser.id));

    // Delete user from Clerk
    try {
      const client = await clerkClient();
      await client.users.deleteUser(clerkUser.id);
    } catch (clerkError) {
      console.error("Error deleting user from Clerk:", clerkError);
      return { error: "Failed to delete account from authentication system" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    return { error: "Failed to delete account" };
  }
}
