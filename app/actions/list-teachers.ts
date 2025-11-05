"use server";

import { db } from "@/lib/db";
import { teachers, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function listAllTeachers() {
  try {
    const teachersList = await db
      .select({
        id: teachers.id,
        profileName: teachers.profileName,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        acceptingStudents: teachers.acceptingStudents,
        teachingFormat: teachers.teachingFormat,
      })
      .from(teachers)
      .innerJoin(users, eq(teachers.id, users.id));

    return teachersList;
  } catch (error) {
    console.error("Error listing teachers:", error);
    return [];
  }
}
