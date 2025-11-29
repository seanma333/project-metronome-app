"use server";

import { currentUser } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function updateUserRole(role: "TEACHER" | "STUDENT" | "PARENT") {
  try {
    const user = await currentUser();

    if (!user) {
      return { error: "User not authenticated" };
    }

    const client = await clerkClient();
    // Get existing metadata to preserve onboarded status
    const existingMetadata = user.publicMetadata as { onboarded?: boolean } | undefined;
    await client.users.updateUserMetadata(user.id, {
      publicMetadata: {
        role: role,
        onboarded: existingMetadata?.onboarded ?? false,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating user metadata:", error);
    return { error: "Failed to update user role" };
  }
}

export async function setOnboardedStatus(onboarded: boolean) {
  try {
    const user = await currentUser();

    if (!user) {
      return { error: "User not authenticated" };
    }

    const client = await clerkClient();
    // Get existing metadata to preserve role
    const existingMetadata = user.publicMetadata as { role?: string } | undefined;
    await client.users.updateUserMetadata(user.id, {
      publicMetadata: {
        role: existingMetadata?.role,
        onboarded: onboarded,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating onboarded status:", error);
    return { error: "Failed to update onboarded status" };
  }
}
