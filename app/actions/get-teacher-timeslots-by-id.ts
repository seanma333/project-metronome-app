"use server";

import { db } from "@/lib/db";
import { teacherTimeslots } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function getTeacherTimeslotsById(teacherId: string, requestedFormat?: "IN_PERSON_ONLY" | "ONLINE_ONLY") {
  try {
    // Get all available timeslots for the teacher
    const timeslots = await db
      .select()
      .from(teacherTimeslots)
      .where(
        and(
          eq(teacherTimeslots.teacherId, teacherId),
          eq(teacherTimeslots.isBooked, false) // Only show available timeslots
        )
      );

    // Filter timeslots based on requested format
    let filteredTimeslots = timeslots;
    if (requestedFormat) {
      filteredTimeslots = timeslots.filter(timeslot => {
        if (requestedFormat === "ONLINE_ONLY") {
          // Show timeslots that are ONLINE_ONLY or IN_PERSON_AND_ONLINE
          return timeslot.teachingFormat === "ONLINE_ONLY" || timeslot.teachingFormat === "IN_PERSON_AND_ONLINE";
        } else if (requestedFormat === "IN_PERSON_ONLY") {
          // Show timeslots that are IN_PERSON_ONLY or IN_PERSON_AND_ONLINE
          return timeslot.teachingFormat === "IN_PERSON_ONLY" || timeslot.teachingFormat === "IN_PERSON_AND_ONLINE";
        }
        return true;
      });
    }

    // Sort by day of week, then by start time
    filteredTimeslots.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) {
        return a.dayOfWeek - b.dayOfWeek;
      }
      return a.startTime.localeCompare(b.startTime);
    });

    return filteredTimeslots;
  } catch (error) {
    console.error("Error fetching teacher timeslots by ID:", error);
    return null;
  }
}
