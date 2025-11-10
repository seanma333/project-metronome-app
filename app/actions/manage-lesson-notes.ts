"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, teachers, lessons, lessonNotes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function createLessonNote(lessonId: string, noteTitle: string | null, notes: string, lessonDate: Date | null = null) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { error: "User not authenticated" };
    }

    // Get user from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (user.length === 0) {
      return { error: "User not found" };
    }

    const userData = user[0];

    if (userData.role !== "TEACHER") {
      return { error: "Only teachers can create lesson notes" };
    }

    // Verify the lesson exists and belongs to this teacher
    const lesson = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (lesson.length === 0) {
      return { error: "Lesson not found" };
    }

    if (lesson[0].teacherId !== userData.id) {
      return { error: "Unauthorized: You can only create notes for your own lessons" };
    }

    // Create the note
    const noteId = randomUUID();
    const now = new Date();

    await db.insert(lessonNotes).values({
      id: noteId,
      lessonId: lessonId,
      noteTitle: noteTitle || null,
      notes: notes.trim(),
      lessonDate: lessonDate || null,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, noteId };
  } catch (error) {
    console.error("Error creating lesson note:", error);
    return { error: "Failed to create lesson note" };
  }
}

export async function updateLessonNote(noteId: string, noteTitle: string | null, notes: string, lessonDate: Date | null = null) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { error: "User not authenticated" };
    }

    // Get user from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (user.length === 0) {
      return { error: "User not found" };
    }

    const userData = user[0];

    if (userData.role !== "TEACHER") {
      return { error: "Only teachers can update lesson notes" };
    }

    // Get the note with lesson to verify ownership
    const noteData = await db
      .select({
        note: lessonNotes,
        lesson: lessons,
      })
      .from(lessonNotes)
      .innerJoin(lessons, eq(lessonNotes.lessonId, lessons.id))
      .where(eq(lessonNotes.id, noteId))
      .limit(1);

    if (noteData.length === 0) {
      return { error: "Note not found" };
    }

    if (noteData[0].lesson.teacherId !== userData.id) {
      return { error: "Unauthorized: You can only update notes for your own lessons" };
    }

    // Update the note
    const now = new Date();
    await db
      .update(lessonNotes)
      .set({
        noteTitle: noteTitle || null,
        notes: notes.trim(),
        lessonDate: lessonDate || null,
        updatedAt: now,
      })
      .where(eq(lessonNotes.id, noteId));

    return { success: true };
  } catch (error) {
    console.error("Error updating lesson note:", error);
    return { error: "Failed to update lesson note" };
  }
}

export async function getLessonNote(noteId: string) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { error: "User not authenticated" };
    }

    // Get user from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (user.length === 0) {
      return { error: "User not found" };
    }

    const userData = user[0];

    if (userData.role !== "TEACHER") {
      return { error: "Only teachers can view lesson notes" };
    }

    // Get the note with lesson to verify ownership
    const noteData = await db
      .select({
        note: lessonNotes,
        lesson: lessons,
      })
      .from(lessonNotes)
      .innerJoin(lessons, eq(lessonNotes.lessonId, lessons.id))
      .where(eq(lessonNotes.id, noteId))
      .limit(1);

    if (noteData.length === 0) {
      return { error: "Note not found" };
    }

    if (noteData[0].lesson.teacherId !== userData.id) {
      return { error: "Unauthorized: You can only view notes for your own lessons" };
    }

    return { note: noteData[0].note };
  } catch (error) {
    console.error("Error fetching lesson note:", error);
    return { error: "Failed to fetch lesson note" };
  }
}

export async function deleteLessonNote(noteId: string) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { error: "User not authenticated" };
    }

    // Get user from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (user.length === 0) {
      return { error: "User not found" };
    }

    const userData = user[0];

    if (userData.role !== "TEACHER") {
      return { error: "Only teachers can delete lesson notes" };
    }

    // Get the note with lesson to verify ownership
    const noteData = await db
      .select({
        note: lessonNotes,
        lesson: lessons,
      })
      .from(lessonNotes)
      .innerJoin(lessons, eq(lessonNotes.lessonId, lessons.id))
      .where(eq(lessonNotes.id, noteId))
      .limit(1);

    if (noteData.length === 0) {
      return { error: "Note not found" };
    }

    if (noteData[0].lesson.teacherId !== userData.id) {
      return { error: "Unauthorized: You can only delete notes for your own lessons" };
    }

    // Delete the note
    await db.delete(lessonNotes).where(eq(lessonNotes.id, noteId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting lesson note:", error);
    return { error: "Failed to delete lesson note" };
  }
}
