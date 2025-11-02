"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { teachers, users, teacherInstruments, teacherLanguages } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function updateTeacherBio(bio: string) {
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

    await db
      .update(teachers)
      .set({
        bio: bio || null,
        updatedAt: new Date(),
      })
      .where(eq(teachers.id, userId));

    return { success: true };
  } catch (error) {
    console.error("Error updating teacher bio:", error);
    return { error: "Failed to update bio" };
  }
}

export async function toggleTeacherInstrument(instrumentId: number) {
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

    // Check if instrument is already associated
    const existing = await db
      .select()
      .from(teacherInstruments)
      .where(and(
        eq(teacherInstruments.teacherId, userId),
        eq(teacherInstruments.instrumentId, instrumentId)
      ))
      .limit(1);

    if (existing.length > 0) {
      // Remove instrument
      await db
        .delete(teacherInstruments)
        .where(and(
          eq(teacherInstruments.teacherId, userId),
          eq(teacherInstruments.instrumentId, instrumentId)
        ));
      return { success: true, added: false };
    } else {
      // Add instrument
      await db.insert(teacherInstruments).values({
        teacherId: userId,
        instrumentId: instrumentId,
      });
      return { success: true, added: true };
    }
  } catch (error) {
    console.error("Error toggling teacher instrument:", error);
    return { error: "Failed to update instruments" };
  }
}

export async function toggleTeacherLanguage(languageId: number) {
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

    // Check if language is already associated
    const existing = await db
      .select()
      .from(teacherLanguages)
      .where(and(
        eq(teacherLanguages.teacherId, userId),
        eq(teacherLanguages.languageId, languageId)
      ))
      .limit(1);

    if (existing.length > 0) {
      // Remove language
      await db
        .delete(teacherLanguages)
        .where(and(
          eq(teacherLanguages.teacherId, userId),
          eq(teacherLanguages.languageId, languageId)
        ));
      return { success: true, added: false };
    } else {
      // Add language
      await db.insert(teacherLanguages).values({
        teacherId: userId,
        languageId: languageId,
      });
      return { success: true, added: true };
    }
  } catch (error) {
    console.error("Error toggling teacher language:", error);
    return { error: "Failed to update languages" };
  }
}
