"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, students, studentInstrumentProficiency, instruments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getParentChildren() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return [];
    }

    // Get the user from our database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (user.length === 0) {
      return [];
    }

    const userId = user[0].id;
    const userRole = user[0].role;

    let studentList: any[] = [];

    if (userRole === "STUDENT") {
      // For students, get their own student profile
      const student = await db
        .select()
        .from(students)
        .where(eq(students.userId, userId))
        .limit(1);

      studentList = student.length > 0 ? [student[0]] : [];
    } else if (userRole === "PARENT") {
      // For parents, get all their children
      const children = await db
        .select()
        .from(students)
        .where(eq(students.parentId, userId));

      studentList = children;
    }

    // Load proficiencies for all students
    const studentsWithProficiencies = await Promise.all(
      studentList.map(async (student) => {
        const proficiencies = await db
          .select({
            proficiency: studentInstrumentProficiency,
            instrument: instruments,
          })
          .from(studentInstrumentProficiency)
          .innerJoin(
            instruments,
            eq(studentInstrumentProficiency.instrumentId, instruments.id)
          )
          .where(eq(studentInstrumentProficiency.studentId, student.id));

        return {
          ...student,
          proficiencies: proficiencies.map((prof) => ({
            instrumentId: prof.instrument.id,
            instrumentName: prof.instrument.name,
            proficiency: prof.proficiency.proficiency, // Access the nested proficiency enum value
          })),
        };
      })
    );

    return studentsWithProficiencies;
  } catch (error) {
    console.error("Error fetching parent children:", error);
    return [];
  }
}
