"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, invites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function createUserFromClerk(timezone?: string, invitationId?: string) {
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
      // User already exists, but still try to update invite if invitationId is provided
      // Do this asynchronously to avoid blocking
      if (invitationId) {
        // Don't await - let it run in the background without blocking
        Promise.resolve().then(async () => {
          try {
            const invite = await db
              .select()
              .from(invites)
              .where(eq(invites.id, invitationId))
              .limit(1);

            if (invite.length > 0) {
              await db
                .update(invites)
                .set({ userId: existingUser[0].id, updatedAt: new Date() })
                .where(eq(invites.id, invitationId));
            }
          } catch (error) {
            console.error("Error updating invite with existing user ID:", error);
            // Don't fail if invite update fails
          }
        }).catch(() => {
          // Silently handle any promise rejection
        });
      }
      return { success: true, userId: existingUser[0].id, existing: true };
    }

    // Get role from metadata
    const role = clerkUser.publicMetadata?.role as "TEACHER" | "STUDENT" | "PARENT" | undefined;

    // Use provided timezone or default to UTC
    const preferredTimezone = timezone || "UTC";

    // Create new user
    const newUserId = randomUUID();
    await db.insert(users).values({
      id: newUserId,
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      firstName: clerkUser.firstName || null,
      lastName: clerkUser.lastName || null,
      role: role || null,
      preferredTimezone: preferredTimezone,
    });

    // If invitationId is provided, update the invite with the user ID
    // Do this asynchronously to avoid blocking user creation
    if (invitationId) {
      // Don't await - let it run in the background without blocking
      Promise.resolve().then(async () => {
        try {
          const invite = await db
            .select()
            .from(invites)
            .where(eq(invites.id, invitationId))
            .limit(1);

          if (invite.length > 0) {
            await db
              .update(invites)
              .set({ userId: newUserId, updatedAt: new Date() })
              .where(eq(invites.id, invitationId));
          }
        } catch (error) {
          console.error("Error updating invite with user ID:", error);
          // Don't fail user creation if invite update fails
        }
      }).catch(() => {
        // Silently handle any promise rejection
      });
    }

    return { success: true, userId: newUserId, existing: false };
  } catch (error) {
    console.error("Error creating user:", error);
    return { error: "Failed to create user" };
  }
}
