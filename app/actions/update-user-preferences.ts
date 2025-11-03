"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function updatePreferredTimezone(timezone: string) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { error: "User not authenticated" };
    }

    await db
      .update(users)
      .set({
        preferredTimezone: timezone,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, clerkUser.id));

    return { success: true };
  } catch (error) {
    console.error("Error updating preferred timezone:", error);
    return { error: "Failed to update timezone" };
  }
}

