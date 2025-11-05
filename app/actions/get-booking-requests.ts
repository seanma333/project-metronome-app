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
} from "@/lib/db/schema";
import { eq, and, or } from "drizzle-orm";
import { randomUUID } from "crypto";

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

    // Get the booking request with all necessary data
    const bookingRequestData = await db
      .select({
        bookingRequest: bookingRequests,
        timeslot: teacherTimeslots,
      })
      .from(bookingRequests)
      .innerJoin(teacherTimeslots, eq(bookingRequests.timeslotId, teacherTimeslots.id))
      .where(eq(bookingRequests.id, bookingRequestId))
      .limit(1);

    if (bookingRequestData.length === 0) {
      return { error: "Booking request not found" };
    }

    const bookingRequest = bookingRequestData[0].bookingRequest;
    const timeslot = bookingRequestData[0].timeslot;

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

    // Perform all operations: update booking request, create lesson, update timeslot
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

    return { success: true, lessonId };
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
