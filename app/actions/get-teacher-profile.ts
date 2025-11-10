"use server";

import { db } from "@/lib/db";
import { teachers, users, teacherInstruments, teacherLanguages, instruments, languages, teacherSocialLinks } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function getTeacherByProfileName(profileName: string) {
  try {
    const teacher = await db
      .select({
        teacher: teachers,
        user: users,
      })
      .from(teachers)
      .innerJoin(users, eq(teachers.id, users.id))
      .where(eq(teachers.profileName, profileName))
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

    // Get social links
    const socialLinksData = await db
      .select()
      .from(teacherSocialLinks)
      .where(eq(teacherSocialLinks.teacherId, teacherData.teacher.id))
      .orderBy(asc(teacherSocialLinks.createdAt));

    return {
      ...teacherData.teacher,
      user: teacherData.user,
      instruments: teacherInstrumentsData.map(ti => ti.instrument),
      languages: teacherLanguagesData.map(tl => tl.language),
      socialLinks: socialLinksData,
    };
  } catch (error) {
    console.error("Error fetching teacher profile:", error);
    return null;
  }
}

export async function getCurrentTeacherProfile() {
  try {
    const { currentUser } = await import("@clerk/nextjs/server");
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return null;
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (user.length === 0) {
      return null;
    }

    const userId = user[0].id;

    const teacher = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, userId))
      .limit(1);

    if (teacher.length === 0) {
      return null;
    }

    // Get instruments
    const teacherInstrumentsData = await db
      .select({
        instrument: instruments,
      })
      .from(teacherInstruments)
      .innerJoin(instruments, eq(teacherInstruments.instrumentId, instruments.id))
      .where(eq(teacherInstruments.teacherId, userId));

    // Get languages
    const teacherLanguagesData = await db
      .select({
        language: languages,
      })
      .from(teacherLanguages)
      .innerJoin(languages, eq(teacherLanguages.languageId, languages.id))
      .where(eq(teacherLanguages.teacherId, userId));

    return {
      ...teacher[0],
      user: user[0],
      instruments: teacherInstrumentsData.map(ti => ti.instrument),
      languages: teacherLanguagesData.map(tl => tl.language),
    };
  } catch (error) {
    console.error("Error fetching current teacher profile:", error);
    return null;
  }
}
