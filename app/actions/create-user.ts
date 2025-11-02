"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function createUserFromClerk() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return { error: "User not authenticated" };
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (existingUser.length > 0) {
      // User already exists, return success
      return { success: true, userId: existingUser[0].id, existing: true };
    }

    // Get role from metadata
    const role = clerkUser.publicMetadata?.role as "TEACHER" | "STUDENT" | "PARENT" | undefined;

    // Create new user
    const newUserId = randomUUID();
    await db.insert(users).values({
      id: newUserId,
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      firstName: clerkUser.firstName || null,
      lastName: clerkUser.lastName || null,
      role: role || null,
    });

    return { success: true, userId: newUserId, existing: false };
  } catch (error) {
    console.error("Error creating user:", error);
    return { error: "Failed to create user" };
  }
}
