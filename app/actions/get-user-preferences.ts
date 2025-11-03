"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, teachers, userAddresses, addresses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getUserPreferences() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return null;
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (user.length === 0) {
      return null;
    }

    const userData = user[0];

    // Get user addresses
    const userAddressLinks = await db
      .select({
        address: addresses,
      })
      .from(userAddresses)
      .innerJoin(addresses, eq(userAddresses.addressId, addresses.id))
      .where(eq(userAddresses.userId, userData.id));

    const userAddressList = userAddressLinks.map(link => link.address);

    // If teacher, get teacher preferences
    if (userData.role === "TEACHER") {
      const teacher = await db
        .select()
        .from(teachers)
        .where(eq(teachers.id, userData.id))
        .limit(1);

      if (teacher.length > 0) {
        return {
          user: {
            preferredTimezone: userData.preferredTimezone,
          },
          teacher: {
            acceptingStudents: teacher[0].acceptingStudents,
            teachingFormat: teacher[0].teachingFormat,
            agePreference: teacher[0].agePreference,
          },
          addresses: userAddressList,
        };
      }
    }

    return {
      user: {
        preferredTimezone: userData.preferredTimezone,
      },
      addresses: userAddressList,
    };
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    return null;
  }
}

