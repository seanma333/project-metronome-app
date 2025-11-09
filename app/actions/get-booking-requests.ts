"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  users,
  students,
  bookingRequests,
  teacherTimeslots,
  teachers,
  instruments,
  lessons,
  studentInstrumentProficiency,
  calendarEvents,
  calendarEventAttendees,
} from "@/lib/db/schema";
import { eq, and, or } from "drizzle-orm";
import { randomUUID } from "crypto";
import { RRule } from "rrule";

export async function getStudentBookingRequests() {
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
    const userRole = userData.role;

    if (userRole !== "STUDENT" && userRole !== "PARENT") {
      return { error: "Access denied" };
    }

    // Get students associated with this user
    let studentIds: string[] = [];

    if (userRole === "STUDENT") {
      // For student users, get their own student record
      const studentRecords = await db
        .select()
        .from(students)
        .where(eq(students.userId, userData.id));

      studentIds = studentRecords.map(s => s.id);
    } else if (userRole === "PARENT") {
      // For parent users, get all their children
      const childRecords = await db
        .select()
        .from(students)
        .where(eq(students.parentId, userData.id));

      studentIds = childRecords.map(s => s.id);
    }

    if (studentIds.length === 0) {
      return { bookingRequests: [] };
    }

    // Get booking requests for these students with all related data
    const bookingRequestsData = await db
      .select({
        // Booking request data
        id: bookingRequests.id,
        lessonFormat: bookingRequests.lessonFormat,
        bookingStatus: bookingRequests.bookingStatus,
        createdAt: bookingRequests.createdAt,
        updatedAt: bookingRequests.updatedAt,

        // Student data
        student: {
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          imageUrl: students.imageUrl,
        },

        // Timeslot data
        timeslot: {
          id: teacherTimeslots.id,
          dayOfWeek: teacherTimeslots.dayOfWeek,
          startTime: teacherTimeslots.startTime,
          endTime: teacherTimeslots.endTime,
          teachingFormat: teacherTimeslots.teachingFormat,
        },

        // Teacher data
        teacher: {
          id: teachers.id,
          imageUrl: teachers.imageUrl,
          profileName: teachers.profileName,
        },

        // Teacher user data
        teacherUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          imageUrl: users.imageUrl,
        },

        // Instrument data
        instrument: {
          id: instruments.id,
          name: instruments.name,
          imagePath: instruments.imagePath,
        },
      })
      .from(bookingRequests)
      .innerJoin(students, eq(bookingRequests.studentId, students.id))
      .innerJoin(teacherTimeslots, eq(bookingRequests.timeslotId, teacherTimeslots.id))
      .innerJoin(teachers, eq(teacherTimeslots.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.id, users.id))
      .innerJoin(instruments, eq(bookingRequests.instrumentId, instruments.id))
      .where(
        or(...studentIds.map(id => eq(bookingRequests.studentId, id)))
      );

    return { bookingRequests: bookingRequestsData };
  } catch (error) {
    console.error("Error fetching student booking requests:", error);
    return { error: "Failed to fetch booking requests" };
  }
}

export async function getTeacherBookingRequests() {
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

    if (userData.role !== "TEACHER") {
      return { error: "Access denied" };
    }

    // Get teacher record
    const teacherRecord = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, userData.id))
      .limit(1);

    if (teacherRecord.length === 0) {
      return { error: "Teacher profile not found" };
    }

    // Get booking requests for this teacher with all related data
    const bookingRequestsData = await db
      .select({
        // Booking request data
        id: bookingRequests.id,
        lessonFormat: bookingRequests.lessonFormat,
        bookingStatus: bookingRequests.bookingStatus,
        createdAt: bookingRequests.createdAt,
        updatedAt: bookingRequests.updatedAt,

        // Student data
        student: {
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          imageUrl: students.imageUrl,
          userId: students.userId,
          parentId: students.parentId,
        },

        // Timeslot data
        timeslot: {
          id: teacherTimeslots.id,
          dayOfWeek: teacherTimeslots.dayOfWeek,
          startTime: teacherTimeslots.startTime,
          endTime: teacherTimeslots.endTime,
          teachingFormat: teacherTimeslots.teachingFormat,
        },

        // Instrument data
        instrument: {
          id: instruments.id,
          name: instruments.name,
          imagePath: instruments.imagePath,
        },
      })
      .from(bookingRequests)
      .innerJoin(students, eq(bookingRequests.studentId, students.id))
      .innerJoin(teacherTimeslots, eq(bookingRequests.timeslotId, teacherTimeslots.id))
      .innerJoin(instruments, eq(bookingRequests.instrumentId, instruments.id))
      .where(eq(teacherTimeslots.teacherId, userData.id));

    // Get user data and proficiency for each booking request
    const processedBookingRequests = await Promise.all(
      bookingRequestsData.map(async (request) => {
        let requestingUser = null;

        if (request.student.userId) {
          // This is a STUDENT role user
          const studentUser = await db
            .select()
            .from(users)
            .where(eq(users.id, request.student.userId))
            .limit(1);

          if (studentUser.length > 0) {
            requestingUser = studentUser[0];
          }
        } else if (request.student.parentId) {
          // This is a PARENT role user
          const parentUser = await db
            .select()
            .from(users)
            .where(eq(users.id, request.student.parentId))
            .limit(1);

          if (parentUser.length > 0) {
            requestingUser = parentUser[0];
          }
        }

        // Get proficiency for this student and instrument
        const proficiencyData = await db
          .select()
          .from(studentInstrumentProficiency)
          .where(
            and(
              eq(studentInstrumentProficiency.studentId, request.student.id),
              eq(studentInstrumentProficiency.instrumentId, request.instrument.id)
            )
          )
          .limit(1);

        const proficiency = proficiencyData.length > 0 ? proficiencyData[0].proficiency : null;

        return {
          ...request,
          requestingUser,
          proficiency,
        };
      })
    );

    return { bookingRequests: processedBookingRequests };
  } catch (error) {
    console.error("Error fetching teacher booking requests:", error);
    return { error: "Failed to fetch booking requests" };
  }
}

export async function declineBookingRequest(bookingRequestId: string) {
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

    if (userData.role !== "TEACHER") {
      return { error: "Only teachers can decline booking requests" };
    }

    // Get the booking request with timeslot to verify ownership
    const bookingRequest = await db
      .select({
        bookingRequest: bookingRequests,
        timeslot: teacherTimeslots,
      })
      .from(bookingRequests)
      .innerJoin(teacherTimeslots, eq(bookingRequests.timeslotId, teacherTimeslots.id))
      .where(eq(bookingRequests.id, bookingRequestId))
      .limit(1);

    if (bookingRequest.length === 0) {
      return { error: "Booking request not found" };
    }

    // Verify the teacher owns this timeslot
    if (bookingRequest[0].timeslot.teacherId !== userData.id) {
      return { error: "Unauthorized: You can only decline requests for your own timeslots" };
    }

    // Update the booking request status to DENIED
    await db
      .update(bookingRequests)
      .set({
        bookingStatus: "DENIED",
        updatedAt: new Date()
      })
      .where(eq(bookingRequests.id, bookingRequestId));

    return { success: true };
  } catch (error) {
    console.error("Error declining booking request:", error);
    return { error: "Failed to decline booking request" };
  }
}

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
  // Note: toString() returns the RRULE string without DTSTART (as per iCalendar spec)
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
  // We'll use Intl.DateTimeFormat to convert it properly
  const dateStr = `${year}-${month}-${day}T${hourStr}:${minStr}:${secStr}`;
  
  // Get the time in the target timezone as if it were UTC, then adjust
  // This is a workaround since JavaScript Date doesn't directly support timezone-aware construction
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
  // We'll create a date and then adjust it
  const tempDate = new Date(`${dateStr}Z`); // Treat as UTC first
  
  // Get what this UTC time represents in the target timezone
  const parts = formatter.formatToParts(tempDate);
  const tzYear = parseInt(parts.find(p => p.type === 'year')?.value || '0');
  const tzMonth = parseInt(parts.find(p => p.type === 'month')?.value || '0');
  const tzDay = parseInt(parts.find(p => p.type === 'day')?.value || '0');
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


export async function acceptBookingRequest(bookingRequestId: string) {
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

    if (userData.role !== "TEACHER") {
      return { error: "Only teachers can accept booking requests" };
    }

    // Get the booking request with all necessary data including student and instrument
    const bookingRequestData = await db
      .select({
        bookingRequest: bookingRequests,
        timeslot: teacherTimeslots,
        student: students,
        instrument: instruments,
      })
      .from(bookingRequests)
      .innerJoin(teacherTimeslots, eq(bookingRequests.timeslotId, teacherTimeslots.id))
      .innerJoin(students, eq(bookingRequests.studentId, students.id))
      .innerJoin(instruments, eq(bookingRequests.instrumentId, instruments.id))
      .where(eq(bookingRequests.id, bookingRequestId))
      .limit(1);

    if (bookingRequestData.length === 0) {
      return { error: "Booking request not found" };
    }

    const bookingRequest = bookingRequestData[0].bookingRequest;
    const timeslot = bookingRequestData[0].timeslot;
    const student = bookingRequestData[0].student;
    const instrument = bookingRequestData[0].instrument;

    // Verify the teacher owns this timeslot
    if (timeslot.teacherId !== userData.id) {
      return { error: "Unauthorized: You can only accept requests for your own timeslots" };
    }

    // Verify the timeslot is not already booked
    if (timeslot.isBooked) {
      return { error: "This timeslot is already booked" };
    }

    // Verify the booking request is still pending
    if (bookingRequest.bookingStatus !== "PENDING") {
      return { error: "This booking request is no longer pending" };
    }

    const now = new Date();
    const lessonId = randomUUID();

    // Perform all operations: update booking request, create lesson, update timeslot, create calendar event
    // Update booking request status to ACCEPTED
    await db
      .update(bookingRequests)
      .set({
        bookingStatus: "ACCEPTED",
        updatedAt: now
      })
      .where(eq(bookingRequests.id, bookingRequestId));

    // Create a new Lesson
    await db.insert(lessons).values({
      id: lessonId,
      teacherId: timeslot.teacherId,
      timeslotId: bookingRequest.timeslotId,
      studentId: bookingRequest.studentId,
      instrumentId: bookingRequest.instrumentId,
      lessonFormat: bookingRequest.lessonFormat,
      createdAt: now,
      updatedAt: now,
    });

    // Update the timeslot to be booked
    await db
      .update(teacherTimeslots)
      .set({
        isBooked: true,
        studentId: bookingRequest.studentId,
        updatedAt: now
      })
      .where(eq(teacherTimeslots.id, bookingRequest.timeslotId));

    // Create calendar event
    const eventId = randomUUID();
    const eventUid = `${lessonId}@tempo-link.xyz`;
    
    // Get teacher's timezone or use UTC
    const timezone = userData.preferredTimezone || "UTC";
    
    // Calculate next occurrence of the day of week in the teacher's timezone
    const dtStart = getNextDayOfWeek(timeslot.dayOfWeek, timeslot.startTime, timezone);
    const dtEnd = getEndDate(dtStart, timeslot.startTime, timeslot.endTime);
    
    // Generate RRULE for weekly recurrence using RRule library
    // Pass dtStart so the rule is created with the correct start date context
    const rrule = generateWeeklyRRULE(timeslot.dayOfWeek, dtStart);
    
    // Create event summary
    const studentName = `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Student";
    const summary = `${instrument.name} Lesson - ${studentName}`;
    
    // Create event description
    const description = `Weekly ${instrument.name} lesson with ${studentName}. Format: ${bookingRequest.lessonFormat === "IN_PERSON" ? "In Person" : "Online"}.`;
    
    // Create calendar event
    await db.insert(calendarEvents).values({
      id: eventId,
      uid: eventUid,
      summary,
      description,
      location: bookingRequest.lessonFormat === "IN_PERSON" ? null : "Online",
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
      timeslotId: bookingRequest.timeslotId,
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

    return { success: true, lessonId, eventId };
  } catch (error) {
    console.error("Error accepting booking request:", error);
    return { error: "Failed to accept booking request" };
  }
}

// Keep this for backward compatibility (used by students/parents to cancel)
export async function updateBookingRequestStatus(
  bookingRequestId: string,
  status: "ACCEPTED" | "DENIED" | "CANCELLED"
) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { error: "User not authenticated" };
    }

    // For CANCELLED status, allow students/parents to cancel their own requests
    if (status === "CANCELLED") {
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

      // Verify user is a student or parent
      if (userData.role !== "STUDENT" && userData.role !== "PARENT") {
        return { error: "Only students and parents can cancel booking requests" };
      }

      // Get the booking request to verify ownership
      const bookingRequest = await db
        .select({
          bookingRequest: bookingRequests,
          student: students,
        })
        .from(bookingRequests)
        .innerJoin(students, eq(bookingRequests.studentId, students.id))
        .where(eq(bookingRequests.id, bookingRequestId))
        .limit(1);

      if (bookingRequest.length === 0) {
        return { error: "Booking request not found" };
      }

      const student = bookingRequest[0].student;

      // Verify the user owns this student record
      if (userData.role === "STUDENT" && student.userId !== userData.id) {
        return { error: "Unauthorized: You can only cancel your own booking requests" };
      }

      if (userData.role === "PARENT" && student.parentId !== userData.id) {
        return { error: "Unauthorized: You can only cancel booking requests for your children" };
      }
    }

    // Update the booking request status
    await db
      .update(bookingRequests)
      .set({
        bookingStatus: status,
        updatedAt: new Date()
      })
      .where(eq(bookingRequests.id, bookingRequestId));

    return { success: true };
  } catch (error) {
    console.error("Error updating booking request status:", error);
    return { error: "Failed to update booking request status" };
  }
}
