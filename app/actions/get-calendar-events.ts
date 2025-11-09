"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, calendarEvents, calendarEventAttendees } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { RRule } from "rrule";

export async function getCalendarEvents() {
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

    if (!user.role) {
      return { error: "User role not set" };
    }

    // Fetch calendar events where user is organizer
    const organizerEvents = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.organizerId, user.id));

    // Fetch calendar events where user is attendee
    const attendeeEvents = await db
      .select({
        id: calendarEvents.id,
        uid: calendarEvents.uid,
        summary: calendarEvents.summary,
        description: calendarEvents.description,
        location: calendarEvents.location,
        dtStart: calendarEvents.dtStart,
        dtEnd: calendarEvents.dtEnd,
        allDay: calendarEvents.allDay,
        timezone: calendarEvents.timezone,
        rrule: calendarEvents.rrule,
        exdates: calendarEvents.exdates,
        status: calendarEvents.status,
        eventType: calendarEvents.eventType,
        priority: calendarEvents.priority,
        organizerId: calendarEvents.organizerId,
        lessonId: calendarEvents.lessonId,
        timeslotId: calendarEvents.timeslotId,
        sequence: calendarEvents.sequence,
        lastModified: calendarEvents.lastModified,
        created: calendarEvents.created,
      })
      .from(calendarEvents)
      .innerJoin(
        calendarEventAttendees,
        eq(calendarEventAttendees.eventId, calendarEvents.id)
      )
      .where(eq(calendarEventAttendees.userId, user.id));

    // Combine and remove duplicates
    const allEvents = [...organizerEvents, ...attendeeEvents];
    const uniqueEvents = Array.from(
      new Map(allEvents.map((event) => [event.id, event])).values()
    );

    // Expand recurring events
    const expandedEvents: any[] = [];
    const now = new Date();
    const oneYearFromNow = new Date(now);
    oneYearFromNow.setFullYear(now.getFullYear() + 1);

    for (const event of uniqueEvents) {
      if (event.rrule) {
        try {
          // Parse the RRULE string and set DTSTART from the event
          const dtStart = new Date(event.dtStart);
          
          // Use RRule.fromString to parse the RRULE string
          // This properly handles all RRULE parameters
          const parsedRule = RRule.fromString(event.rrule);
          
          // Get the options from the parsed rule and override dtstart with the event's dtStart
          // This ensures we use the actual start date/time from the database, not system time
          const rruleOptions = {
            ...parsedRule.options,
            dtstart: dtStart, // Override with the event's actual start date/time
          };
          
          // Create new RRule instance with dtstart properly set from the event
          const rrule = new RRule(rruleOptions);
          
          // Get exception dates if any
          const exdates: Date[] = [];
          if (event.exdates && Array.isArray(event.exdates)) {
            exdates.push(...event.exdates.map((dateStr: string) => new Date(dateStr)));
          }
          
          // Generate occurrences up to one year from now
          const occurrences = rrule.between(now, oneYearFromNow, true);
          
          // Calculate duration
          const duration = event.dtEnd.getTime() - event.dtStart.getTime();
          
          // Create an event instance for each occurrence
          for (const occurrence of occurrences) {
            // Skip if this occurrence is in the exception dates
            const isExcluded = exdates.some(
              (exdate) => exdate.toDateString() === occurrence.toDateString()
            );
            
            if (!isExcluded) {
              const occurrenceEnd = new Date(occurrence.getTime() + duration);
              
              expandedEvents.push({
                ...event,
                id: `${event.id}-${occurrence.getTime()}`, // Unique ID for each occurrence
                dtStart: occurrence.toISOString(), // Convert to ISO string for proper serialization
                dtEnd: occurrenceEnd.toISOString(), // Convert to ISO string for proper serialization
                isRecurringInstance: true,
                parentEventId: event.id,
              });
            }
          }
        } catch (error) {
          console.error(`Error parsing RRULE for event ${event.id}:`, error);
          // If RRULE parsing fails, include the original event with properly serialized dates
          expandedEvents.push({
            ...event,
            dtStart: event.dtStart instanceof Date ? event.dtStart.toISOString() : event.dtStart,
            dtEnd: event.dtEnd instanceof Date ? event.dtEnd.toISOString() : event.dtEnd,
            isRecurringInstance: false,
          });
        }
      } else {
        // Non-recurring event - ensure dates are properly serialized
        expandedEvents.push({
          ...event,
          dtStart: event.dtStart instanceof Date ? event.dtStart.toISOString() : event.dtStart,
          dtEnd: event.dtEnd instanceof Date ? event.dtEnd.toISOString() : event.dtEnd,
          isRecurringInstance: false,
        });
      }
    }

    return { events: expandedEvents };
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return { error: "Failed to fetch calendar events" };
  }
}

