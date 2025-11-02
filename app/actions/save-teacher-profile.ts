"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, teachers, teacherInstruments, teacherLanguages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface SaveTeacherProfileParams {
  firstName: string;
  lastName: string;
  bio?: string;
  instrumentIds: number[];
  languageIds: number[];
}

export async function saveTeacherProfile(params: SaveTeacherProfileParams) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return { error: "User not authenticated" };
    }

    // Get the user from our database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (user.length === 0) {
      return { error: "User not found in database" };
    }

    const userId = user[0].id;

    // Generate unique profile name
    const { generateUniqueProfileName } = await import("./generate-profile-name");
    const profileName = await generateUniqueProfileName(params.firstName, params.lastName);

    // Check if teacher profile already exists
    const existingTeacher = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, userId))
      .limit(1);

    if (existingTeacher.length > 0) {
      // Update existing teacher
      await db
        .update(teachers)
        .set({
          bio: params.bio || null,
          profileName: profileName,
          updatedAt: new Date(),
        })
        .where(eq(teachers.id, userId));

      // Delete existing instrument and language associations
      await db.delete(teacherInstruments).where(eq(teacherInstruments.teacherId, userId));
      await db.delete(teacherLanguages).where(eq(teacherLanguages.teacherId, userId));
    } else {
      // Create new teacher profile
      await db.insert(teachers).values({
        id: userId,
        bio: params.bio || null,
        profileName: profileName,
        acceptingStudents: false,
      });
    }

    // Insert instrument associations
    if (params.instrumentIds.length > 0) {
      await db.insert(teacherInstruments).values(
        params.instrumentIds.map((instrumentId) => ({
          teacherId: userId,
          instrumentId,
        }))
      );
    }

    // Insert language associations
    if (params.languageIds.length > 0) {
      await db.insert(teacherLanguages).values(
        params.languageIds.map((languageId) => ({
          teacherId: userId,
          languageId,
        }))
      );
    }

    return { success: true, profileName };
  } catch (error) {
    console.error("Error saving teacher profile:", error);
    return { error: "Failed to save teacher profile" };
  }
}
