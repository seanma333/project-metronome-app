"use server";

import { db } from "@/lib/db";
import { teachers, users, teacherInstruments, teacherLanguages, instruments, languages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getTeacherById(teacherId: string) {
  try {
    const teacher = await db
      .select({
        teacher: teachers,
        user: users,
      })
      .from(teachers)
      .innerJoin(users, eq(teachers.id, users.id))
      .where(eq(teachers.id, teacherId))
      .limit(1);

    if (teacher.length === 0) {
      return null;
    }

    const teacherData = teacher[0];

    // Get instruments
    const teacherInstrumentsData = await db
      .select({
        instrument: instruments,
      })
      .from(teacherInstruments)
      .innerJoin(instruments, eq(teacherInstruments.instrumentId, instruments.id))
      .where(eq(teacherInstruments.teacherId, teacherData.teacher.id));

    // Get languages
    const teacherLanguagesData = await db
      .select({
        language: languages,
      })
      .from(teacherLanguages)
      .innerJoin(languages, eq(teacherLanguages.languageId, languages.id))
      .where(eq(teacherLanguages.teacherId, teacherData.teacher.id));

    return {
      ...teacherData.teacher,
      user: teacherData.user,
      instruments: teacherInstrumentsData.map(ti => ti.instrument),
      languages: teacherLanguagesData.map(tl => tl.language),
    };
  } catch (error) {
    console.error("Error fetching teacher by ID:", error);
    return null;
  }
}
