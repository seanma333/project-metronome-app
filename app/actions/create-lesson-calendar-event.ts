"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  users,
  students,
  lessons,
  teacherTimeslots,
  teachers,
  instruments,
  calendarEvents,
  calendarEventAttendees,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { RRule } from "rrule";

// Helper function to convert day of week (0=Sunday, 6=Saturday) to RRule weekday constant
function dayOfWeekToRRuleWeekday(dayOfWeek: number): any {
  const weekdays = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA];
  return weekdays[dayOfWeek];
}

// Helper function to generate RRULE string for weekly recurrence using RRule library
function generateWeeklyRRULE(dayOfWeek: number, dtStart: Date): string {
  // Create RRule instance for weekly recurrence on the specified day
  const rrule = new RRule({
    freq: RRule.WEEKLY,
    byweekday: [dayOfWeekToRRuleWeekday(dayOfWeek)],
    dtstart: dtStart,
  });
  
  // Return the string representation of the RRULE
  return rrule.toString();
}

// Helper function to calculate the next occurrence of a day of week in a specific timezone
function getNextDayOfWeek(dayOfWeek: number, startTime: string, timezone?: string): Date {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
  const daysUntilNext = (dayOfWeek - currentDay + 7) % 7;
  
  // Parse the time
  const [hours, minutes, seconds] = startTime.split(":").map(Number);
  
  // If today is the target day, check if the time has passed
  let daysToAdd = daysUntilNext;
  if (daysUntilNext === 0) {
    // Create a date for today at the specified time in the given timezone
    const todayAtTime = getDateInTimezone(now, hours, minutes, seconds || 0, timezone);
    if (todayAtTime <= now) {
      daysToAdd = 7; // Move to next week
    }
  }
  
  // Calculate the next occurrence date
  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + daysToAdd);
  
  // Set the time in the specified timezone
  return getDateInTimezone(nextDate, hours, minutes, seconds || 0, timezone);
}

// Helper function to create a Date object with specific time in a given timezone
function getDateInTimezone(baseDate: Date, hours: number, minutes: number, seconds: number, timezone?: string): Date {
  if (!timezone) {
    // If no timezone specified, use local time
    const date = new Date(baseDate);
    date.setHours(hours, minutes, seconds, 0);
    return date;
  }
  
  // Create an ISO string for the date in the specified timezone
  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, '0');
  const day = String(baseDate.getDate()).padStart(2, '0');
  const hourStr = String(hours).padStart(2, '0');
  const minStr = String(minutes).padStart(2, '0');
  const secStr = String(seconds).padStart(2, '0');
  
  // Create a date string that represents this time in the target timezone
  const dateStr = `${year}-${month}-${day}T${hourStr}:${minStr}:${secStr}`;
  
  // Get the time in the target timezone as if it were UTC, then adjust
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  // Create a date object and find the UTC time that represents the desired local time in the timezone
  const tempDate = new Date(`${dateStr}Z`); // Treat as UTC first
  
  // Get what this UTC time represents in the target timezone
  const parts = formatter.formatToParts(tempDate);
  const tzHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
  const tzMin = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
  
  // Calculate the difference
  const targetTotalMinutes = hours * 60 + minutes;
  const tzTotalMinutes = tzHour * 60 + tzMin;
  const diffMinutes = targetTotalMinutes - tzTotalMinutes;
  
  // Adjust the date
  const adjustedDate = new Date(tempDate.getTime() + diffMinutes * 60 * 1000);
  
  return adjustedDate;
}

// Helper function to calculate end date from start date and duration
function getEndDate(startDate: Date, startTime: string, endTime: string): Date {
  const endDate = new Date(startDate);
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);
  
  // Calculate duration in minutes
  const startMinutesTotal = startHours * 60 + startMinutes;
  const endMinutesTotal = endHours * 60 + endMinutes;
  const durationMinutes = endMinutesTotal - startMinutesTotal;
  
  // Add duration to start date
  endDate.setMinutes(endDate.getMinutes() + durationMinutes);
  
  return endDate;
}

export async function createLessonCalendarEvent(lessonId: string) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { error: "User not authenticated" };
    }

    // Get user from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (user.length === 0) {
      return { error: "User not found" };
    }

    const userData = user[0];

    // Only teachers can create calendar events for lessons
    if (userData.role !== "TEACHER") {
      return { error: "Only teachers can create calendar events for lessons" };
    }

    // Check if calendar event already exists for this lesson
    const existingEvent = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.lessonId, lessonId))
      .limit(1);

    if (existingEvent.length > 0) {
      return { error: "Calendar event already exists for this lesson" };
    }

    // Get lesson with all necessary data
    const lessonData = await db
      .select({
        lesson: lessons,
        timeslot: teacherTimeslots,
        student: students,
        instrument: instruments,
        teacher: teachers,
      })
      .from(lessons)
      .innerJoin(teacherTimeslots, eq(lessons.timeslotId, teacherTimeslots.id))
      .innerJoin(students, eq(lessons.studentId, students.id))
      .innerJoin(instruments, eq(lessons.instrumentId, instruments.id))
      .innerJoin(teachers, eq(lessons.teacherId, teachers.id))
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (lessonData.length === 0) {
      return { error: "Lesson not found" };
    }

    const lesson = lessonData[0].lesson;
    const timeslot = lessonData[0].timeslot;
    const student = lessonData[0].student;
    const instrument = lessonData[0].instrument;

    // Verify the teacher owns this lesson
    if (lesson.teacherId !== userData.id) {
      return { error: "Unauthorized: You can only create calendar events for your own lessons" };
    }

    const now = new Date();
    const eventId = randomUUID();
    const eventUid = `${lessonId}@tempo-link.xyz`;
    
    // Get teacher's timezone or use UTC
    const timezone = userData.preferredTimezone || "UTC";
    
    // Calculate next occurrence of the day of week in the teacher's timezone
    const dtStart = getNextDayOfWeek(timeslot.dayOfWeek, timeslot.startTime, timezone);
    const dtEnd = getEndDate(dtStart, timeslot.startTime, timeslot.endTime);
    
    // Generate RRULE for weekly recurrence using RRule library
    const rrule = generateWeeklyRRULE(timeslot.dayOfWeek, dtStart);
    
    // Create event summary
    const studentName = `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Student";
    const summary = `${instrument.name} Lesson - ${studentName}`;
    
    // Create event description
    const description = `Weekly ${instrument.name} lesson with ${studentName}. Format: ${lesson.lessonFormat === "IN_PERSON" ? "In Person" : "Online"}.`;
    
    // Create calendar event
    await db.insert(calendarEvents).values({
      id: eventId,
      uid: eventUid,
      summary,
      description,
      location: lesson.lessonFormat === "IN_PERSON" ? null : "Online",
      dtStart,
      dtEnd,
      allDay: false,
      timezone,
      rrule,
      exdates: null,
      status: "CONFIRMED",
      eventType: "LESSON",
      priority: 5, // Medium priority
      organizerId: userData.id,
      lessonId,
      timeslotId: timeslot.id,
      sequence: 0,
      lastModified: now,
      created: now,
      createdAt: now,
      updatedAt: now,
    });

    // Create calendar event attendees (teacher and student)
    // Get student's user ID if they have one
    let studentUserId: string | null = null;
    if (student.userId) {
      studentUserId = student.userId;
    } else if (student.parentId) {
      // If student is a child, use parent's user ID
      studentUserId = student.parentId;
    }

    // Add teacher as attendee (organizer)
    await db.insert(calendarEventAttendees).values({
      id: randomUUID(),
      eventId,
      userId: userData.id,
      participationStatus: "ACCEPTED",
      role: "ORGANIZER",
      responseRequested: false,
      createdAt: now,
      updatedAt: now,
    });

    // Add student/parent as attendee
    if (studentUserId) {
      await db.insert(calendarEventAttendees).values({
        id: randomUUID(),
        eventId,
        userId: studentUserId,
        participationStatus: "NEEDS-ACTION",
        role: "REQ-PARTICIPANT",
        responseRequested: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true, eventId };
  } catch (error) {
    console.error("Error creating lesson calendar event:", error);
    return { error: "Failed to create calendar event" };
  }
}

