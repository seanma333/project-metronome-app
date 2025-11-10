"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { teachers, teacherSocialLinks, users } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function getTeacherSocialLinks() {
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

    const links = await db
      .select()
      .from(teacherSocialLinks)
      .where(eq(teacherSocialLinks.teacherId, userId))
      .orderBy(asc(teacherSocialLinks.createdAt));

    return { success: true, links };
  } catch (error) {
    console.error("Error getting teacher social links:", error);
    return { error: "Failed to get social links" };
  }
}

export async function addTeacherSocialLink(externalUrl: string) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { error: "User not authenticated" };
    }

    // Validate URL
    try {
      new URL(externalUrl);
    } catch {
      return { error: "Invalid URL format" };
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

    // Verify user is a teacher
    const teacher = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, userId))
      .limit(1);

    if (teacher.length === 0) {
      return { error: "Teacher profile not found" };
    }

    // Add the social link
    const linkId = randomUUID();
    await db.insert(teacherSocialLinks).values({
      id: linkId,
      teacherId: userId,
      externalUrl: externalUrl.trim(),
      updatedAt: new Date(),
    });

    return { success: true, linkId };
  } catch (error) {
    console.error("Error adding teacher social link:", error);
    return { error: "Failed to add social link" };
  }
}

export async function updateTeacherSocialLink(linkId: string, externalUrl: string) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { error: "User not authenticated" };
    }

    // Validate URL
    try {
      new URL(externalUrl);
    } catch {
      return { error: "Invalid URL format" };
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

    // Verify the link belongs to this teacher
    const link = await db
      .select()
      .from(teacherSocialLinks)
      .where(eq(teacherSocialLinks.id, linkId))
      .limit(1);

    if (link.length === 0) {
      return { error: "Social link not found" };
    }

    if (link[0].teacherId !== userId) {
      return { error: "Unauthorized" };
    }

    // Update the social link
    await db
      .update(teacherSocialLinks)
      .set({
        externalUrl: externalUrl.trim(),
        updatedAt: new Date(),
      })
      .where(eq(teacherSocialLinks.id, linkId));

    return { success: true };
  } catch (error) {
    console.error("Error updating teacher social link:", error);
    return { error: "Failed to update social link" };
  }
}

export async function deleteTeacherSocialLink(linkId: string) {
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

    // Verify the link belongs to this teacher
    const link = await db
      .select()
      .from(teacherSocialLinks)
      .where(eq(teacherSocialLinks.id, linkId))
      .limit(1);

    if (link.length === 0) {
      return { error: "Social link not found" };
    }

    if (link[0].teacherId !== userId) {
      return { error: "Unauthorized" };
    }

    // Delete the social link
    await db
      .delete(teacherSocialLinks)
      .where(eq(teacherSocialLinks.id, linkId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting teacher social link:", error);
    return { error: "Failed to delete social link" };
  }
}

