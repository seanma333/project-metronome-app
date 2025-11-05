"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, students } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getParentChildren() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return null;
    }

    // Get the user from our database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (user.length === 0) {
      return null;
    }

    const userId = user[0].id;
    const userRole = user[0].role;

    if (userRole === "STUDENT") {
      // For students, get their own student profile
      const student = await db
        .select()
        .from(students)
        .where(eq(students.userId, userId))
        .limit(1);

      return student.length > 0 ? [student[0]] : [];
    } else if (userRole === "PARENT") {
      // For parents, get all their children
      const children = await db
        .select()
        .from(students)
        .where(eq(students.parentId, userId));

      return children;
    }

    return [];
  } catch (error) {
    console.error("Error fetching parent children:", error);
    return [];
  }
}
