"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, teachers, teacherInstruments, teacherLanguages, teacherTimeslots } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

interface SaveTeacherProfileParams {
  firstName: string;
  lastName: string;
  bio?: string;
  instrumentIds: number[];
  languageIds: number[];
  createTimeslotsAutomatically?: boolean;
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

    // Get the user's imageUrl in case it was set during onboarding (e.g., profile image upload)
    const userRecord = user[0];
    const userImageUrl = userRecord.imageUrl;

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
          // Preserve existing imageUrl or use the one from users table
          imageUrl: existingTeacher[0].imageUrl || userImageUrl || null,
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
        // Include imageUrl from users table if it exists (from onboarding image upload)
        imageUrl: userImageUrl || null,
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

    // Create timeslots automatically if requested
    if (params.createTimeslotsAutomatically) {
      // Get teacher's teaching format (default to ONLINE_ONLY if not set)
      const teacherRecord = await db
        .select()
        .from(teachers)
        .where(eq(teachers.id, userId))
        .limit(1);

      const teachingFormat = teacherRecord[0]?.teachingFormat || "ONLINE_ONLY";

      // Create 45-minute timeslots every hour from 9am to 8pm (9:00 to 20:00)
      // For all 7 days of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
      const timeslots = [];

      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        for (let hour = 9; hour < 20; hour++) {
          const startTime = `${hour.toString().padStart(2, "0")}:00:00`;
          const endTime = `${hour.toString().padStart(2, "0")}:45:00`;

          timeslots.push({
            id: randomUUID(),
            teacherId: userId,
            dayOfWeek,
            startTime,
            endTime,
            isBooked: false,
            studentId: null,
            teachingFormat,
          });
        }
      }

      if (timeslots.length > 0) {
        await db.insert(teacherTimeslots).values(timeslots);
      }
    }

    return { success: true, profileName };
  } catch (error) {
    console.error("Error saving teacher profile:", error);
    return { error: "Failed to save teacher profile" };
  }
}
