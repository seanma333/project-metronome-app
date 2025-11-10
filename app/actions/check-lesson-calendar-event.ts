"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, calendarEvents, lessons } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function checkLessonCalendarEvent(lessonId: string) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return { error: "Unauthorized" };
    }

    // Get user from database
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (userResult.length === 0) {
      return { error: "User not found" };
    }

    // Check if calendar event exists for this lesson
    const eventResult = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.lessonId, lessonId))
      .limit(1);

    if (eventResult.length > 0) {
      const event = eventResult[0];
      return { 
        exists: true, 
        event: {
          ...event,
          dtStart: event.dtStart instanceof Date ? event.dtStart.toISOString() : event.dtStart,
          dtEnd: event.dtEnd instanceof Date ? event.dtEnd.toISOString() : event.dtEnd,
          lastModified: event.lastModified instanceof Date ? event.lastModified.toISOString() : event.lastModified,
          created: event.created instanceof Date ? event.created.toISOString() : event.created,
          createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt,
          updatedAt: event.updatedAt instanceof Date ? event.updatedAt.toISOString() : event.updatedAt,
        }
      };
    }

    return { exists: false };
  } catch (error) {
    console.error("Error checking lesson calendar event:", error);
    return { error: "Failed to check calendar event" };
  }
}

