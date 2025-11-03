"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, userAddresses } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function linkUserToAddress(addressId: string) {
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

    // Check if link already exists
    const existingLink = await db
      .select()
      .from(userAddresses)
      .where(
        and(
          eq(userAddresses.userId, userId),
          eq(userAddresses.addressId, addressId)
        )
      )
      .limit(1);

    if (existingLink.length > 0) {
      return { success: true, existing: true };
    }

    // Create link
    await db.insert(userAddresses).values({
      userId: userId,
      addressId: addressId,
    });

    return { success: true, existing: false };
  } catch (error) {
    console.error("Error linking user to address:", error);
    return { error: "Failed to link address" };
  }
}

export async function unlinkUserFromAddress(addressId: string) {
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
      .delete(userAddresses)
      .where(
        and(
          eq(userAddresses.userId, userId),
          eq(userAddresses.addressId, addressId)
        )
      );

    return { success: true };
  } catch (error) {
    console.error("Error unlinking user from address:", error);
    return { error: "Failed to unlink address" };
  }
}

