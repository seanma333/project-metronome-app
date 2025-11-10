"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, calendarEvents, lessons } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { RRule } from "rrule";

export async function getLessonEventOccurrences(lessonId: string) {
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

    const user = userResult[0];

    // Verify the lesson exists and belongs to this teacher
    const lessonResult = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (lessonResult.length === 0) {
      return { error: "Lesson not found" };
    }

    const lesson = lessonResult[0];

    if (lesson.teacherId !== user.id) {
      return { error: "Unauthorized: You can only view events for your own lessons" };
    }

    // Get calendar event for this lesson
    const eventResult = await db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.lessonId, lessonId),
          eq(calendarEvents.status, "CONFIRMED")
        )
      )
      .limit(1);

    if (eventResult.length === 0) {
      return { occurrences: [] };
    }

    const event = eventResult[0];

    const now = new Date();
    const occurrences: Array<{ date: Date; formatted: string }> = [];

    if (event.rrule) {
      try {
        // Parse the RRULE string and set DTSTART from the event
        const dtStart = new Date(event.dtStart);
        
        // Use RRule.fromString to parse the RRULE string
        const parsedRule = RRule.fromString(event.rrule);
        
        // Get the options from the parsed rule and override dtstart with the event's dtStart
        const rruleOptions = {
          ...parsedRule.options,
          dtstart: dtStart,
        };
        
        // Create new RRule instance with dtstart properly set from the event
        const rrule = new RRule(rruleOptions);
        
        // Get exception dates if any
        const exdates: Date[] = [];
        if (event.exdates && Array.isArray(event.exdates)) {
          exdates.push(...event.exdates.map((dateStr: string) => new Date(dateStr)));
        }
        
        // Get occurrences from the past (up to 4 occurrences before now, including current if ongoing)
        // We'll get occurrences going back in time
        const startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1); // Go back 1 year
        
        // Calculate duration
        const duration = new Date(event.dtEnd).getTime() - new Date(event.dtStart).getTime();
        
        // Generate occurrences up to now (including current if ongoing)
        const allOccurrences = rrule.between(startDate, now, true);
        
        // Filter out excluded dates and include ongoing lessons
        const validOccurrences = allOccurrences
          .filter((occurrence) => {
            const isExcluded = exdates.some(
              (exdate) => exdate.toDateString() === occurrence.toDateString()
            );
            if (isExcluded) return false;
            
            // Include if it's in the past or currently ongoing
            const occurrenceEnd = new Date(occurrence.getTime() + duration);
            return occurrenceEnd <= now || (occurrence <= now && occurrenceEnd >= now);
          })
          .sort((a, b) => b.getTime() - a.getTime()); // Sort descending (most recent first)
        
        // Take the last 4 occurrences (most recent)
        const last4Occurrences = validOccurrences.slice(0, 4);
        
        // Format each occurrence
        for (const occurrence of last4Occurrences) {
          const occurrenceEnd = new Date(occurrence.getTime() + duration);
          const formatted = formatLessonDate(occurrence, occurrenceEnd, event.timezone);
          occurrences.push({
            date: occurrence,
            formatted,
          });
        }
      } catch (error) {
        console.error(`Error parsing RRULE for lesson ${lessonId}:`, error);
      }
    } else {
      // Non-recurring event - check if it's in the past or ongoing
      const eventStart = new Date(event.dtStart);
      const eventEnd = new Date(event.dtEnd);
      if (eventEnd <= now || (eventStart <= now && eventEnd >= now)) {
        const formatted = formatLessonDate(eventStart, event.dtEnd, event.timezone);
        occurrences.push({
          date: eventStart,
          formatted,
        });
      }
    }

    return { occurrences };
  } catch (error) {
    console.error("Error fetching lesson event occurrences:", error);
    return { error: "Failed to fetch lesson event occurrences" };
  }
}

function formatLessonDate(startDate: Date, endDate: Date | string, timezone: string | null): string {
  const start = new Date(startDate);
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  // Format date
  const dateStr = start.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  // Format time
  const startTime = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  
  const endTime = end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  
  return `${dateStr} at ${startTime} - ${endTime}`;
}

