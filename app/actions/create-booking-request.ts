"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, students, bookingRequests, teacherTimeslots, instruments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function createBookingRequest(
  timeslotId: string,
  studentId: string | undefined,
  instrument: string | undefined,
  lessonFormat: "IN_PERSON" | "ONLINE",
  proficiency?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return { error: "User not authenticated" };
    }

    // Get the user from our database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (user.length === 0) {
      return { error: "User not found in database" };
    }

    const userId = user[0].id;
    const userRole = user[0].role;

    // Verify user is a student or parent
    if (userRole !== "STUDENT" && userRole !== "PARENT") {
      return { error: "Only students and parents can request bookings" };
    }

    // Get student ID based on user role
    let finalStudentId: string | null = null;

    if (userRole === "STUDENT") {
      // For STUDENT role users, find their student record
      const student = await db
        .select()
        .from(students)
        .where(eq(students.userId, userId))
        .limit(1);

      if (student.length === 0) {
        return { error: "Student profile not found" };
      }

      finalStudentId = student[0].id;
    } else if (userRole === "PARENT") {
      if (studentId) {
        // Verify the provided student ID belongs to this parent
        const student = await db
          .select()
          .from(students)
          .where(
            and(
              eq(students.id, studentId),
              eq(students.parentId, userId)
            )
          )
          .limit(1);

        if (student.length === 0) {
          return { error: "Student not found or not associated with this parent" };
        }

        finalStudentId = studentId;
      } else {
        // If no student ID provided, get the first child
        const parentStudents = await db
          .select()
          .from(students)
          .where(eq(students.parentId, userId))
          .limit(1);

        if (parentStudents.length === 0) {
          return { error: "No student profiles found for this parent" };
        }

        finalStudentId = parentStudents[0].id;
      }
    }

    if (!finalStudentId) {
      return { error: "Could not determine student for booking" };
    }

    // Validate and get instrument
    if (!instrument) {
      return { error: "Instrument is required for booking" };
    }

    // Look up the instrument by name
    const instrumentRecord = await db
      .select()
      .from(instruments)
      .where(eq(instruments.name, instrument))
      .limit(1);

    if (instrumentRecord.length === 0) {
      return { error: "Invalid instrument specified" };
    }

    const instrumentId = instrumentRecord[0].id;

    // Verify the timeslot exists and is available
    const timeslot = await db
      .select()
      .from(teacherTimeslots)
      .where(
        and(
          eq(teacherTimeslots.id, timeslotId),
          eq(teacherTimeslots.isBooked, false)
        )
      )
      .limit(1);

    if (timeslot.length === 0) {
      return { error: "Timeslot not found or already booked" };
    }

    // Check if student already has a pending or accepted request for this timeslot
    const existingRequest = await db
      .select()
      .from(bookingRequests)
      .where(
        and(
          eq(bookingRequests.studentId, finalStudentId),
          eq(bookingRequests.timeslotId, timeslotId)
        )
      )
      .limit(1);

    if (existingRequest.length > 0) {
      return { error: "A booking request already exists for this timeslot" };
    }

    // Create the booking request
    const bookingRequestId = randomUUID();
    const now = new Date();

    await db.insert(bookingRequests).values({
      id: bookingRequestId,
      timeslotId: timeslotId,
      studentId: finalStudentId,
      instrumentId: instrumentId,
      lessonFormat: lessonFormat,
      bookingStatus: "PENDING",
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, bookingRequestId };
  } catch (error) {
    console.error("Error creating booking request:", error);
    return { error: "Failed to create booking request" };
  }
}
