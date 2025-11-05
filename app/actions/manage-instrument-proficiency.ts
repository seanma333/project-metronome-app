"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, students, studentInstrumentProficiency, instruments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

type ProficiencyLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export async function setStudentInstrumentProficiency(
  studentId: string,
  instrumentId: number,
  proficiency: ProficiencyLevel
) {
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

    // Verify student belongs to user
    const student = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (student.length === 0) {
      return { error: "Student not found" };
    }

    // Check authorization: user must be either the student or the parent
    if (userData.role === "STUDENT") {
      if (student[0].userId !== userData.id) {
        return { error: "Unauthorized" };
      }
    } else if (userData.role === "PARENT") {
      if (student[0].parentId !== userData.id) {
        return { error: "Unauthorized" };
      }
    } else {
      return { error: "Only students and parents can set instrument proficiency" };
    }

    // Check if proficiency already exists
    const existing = await db
      .select()
      .from(studentInstrumentProficiency)
      .where(
        and(
          eq(studentInstrumentProficiency.studentId, studentId),
          eq(studentInstrumentProficiency.instrumentId, instrumentId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      await db
        .update(studentInstrumentProficiency)
        .set({
          proficiency: proficiency,
          updatedAt: new Date(),
        })
        .where(eq(studentInstrumentProficiency.id, existing[0].id));
    } else {
      // Create new
      await db.insert(studentInstrumentProficiency).values({
        studentId: studentId,
        instrumentId: instrumentId,
        proficiency: proficiency,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error setting instrument proficiency:", error);
    return { error: "Failed to set instrument proficiency" };
  }
}

export async function removeStudentInstrumentProficiency(
  studentId: string,
  instrumentId: number
) {
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

    // Verify student belongs to user
    const student = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (student.length === 0) {
      return { error: "Student not found" };
    }

    // Check authorization
    if (userData.role === "STUDENT") {
      if (student[0].userId !== userData.id) {
        return { error: "Unauthorized" };
      }
    } else if (userData.role === "PARENT") {
      if (student[0].parentId !== userData.id) {
        return { error: "Unauthorized" };
      }
    } else {
      return { error: "Only students and parents can remove instrument proficiency" };
    }

    // Delete proficiency
    await db
      .delete(studentInstrumentProficiency)
      .where(
        and(
          eq(studentInstrumentProficiency.studentId, studentId),
          eq(studentInstrumentProficiency.instrumentId, instrumentId)
        )
      );

    return { success: true };
  } catch (error) {
    console.error("Error removing instrument proficiency:", error);
    return { error: "Failed to remove instrument proficiency" };
  }
}

export async function getStudentInstrumentProficiencies(studentId: string) {
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

    // Verify student belongs to user
    const student = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (student.length === 0) {
      return { error: "Student not found" };
    }

    // Check authorization (allow teachers to see student proficiencies too)
    let isAuthorized = false;
    if (userData.role === "STUDENT") {
      isAuthorized = student[0].userId === userData.id;
    } else if (userData.role === "PARENT") {
      isAuthorized = student[0].parentId === userData.id;
    } else if (userData.role === "TEACHER") {
      isAuthorized = true; // Teachers can view student proficiencies
    }

    if (!isAuthorized) {
      return { error: "Unauthorized" };
    }

    // Get proficiencies
    const proficiencies = await db
      .select({
        proficiency: studentInstrumentProficiency,
        instrument: instruments,
      })
      .from(studentInstrumentProficiency)
      .innerJoin(
        instruments,
        eq(studentInstrumentProficiency.instrumentId, instruments.id)
      )
      .where(eq(studentInstrumentProficiency.studentId, studentId));

    return { proficiencies };
  } catch (error) {
    console.error("Error getting instrument proficiencies:", error);
    return { error: "Failed to get instrument proficiencies" };
  }
}

export async function getStudentInstrumentProficiency(
  studentId: string,
  instrumentId: number
): Promise<{ proficiency?: ProficiencyLevel | null; error?: string }> {
  try {
    const proficiency = await db
      .select()
      .from(studentInstrumentProficiency)
      .where(
        and(
          eq(studentInstrumentProficiency.studentId, studentId),
          eq(studentInstrumentProficiency.instrumentId, instrumentId)
        )
      )
      .limit(1);

    if (proficiency.length === 0) {
      return { proficiency: null };
    }

    return { proficiency: proficiency[0].proficiency as ProficiencyLevel };
  } catch (error) {
    console.error("Error getting instrument proficiency:", error);
    return { error: "Failed to get instrument proficiency" };
  }
}
