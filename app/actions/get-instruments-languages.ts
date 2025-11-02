"use server";

import { db } from "@/lib/db";
import { instruments, languages } from "@/lib/db/schema";

export async function getInstruments() {
  try {
    const instrumentsList = await db.select().from(instruments);
    return instrumentsList;
  } catch (error) {
    console.error("Error fetching instruments:", error);
    return [];
  }
}

export async function getLanguages() {
  try {
    const languagesList = await db.select().from(languages);
    return languagesList;
  } catch (error) {
    console.error("Error fetching languages:", error);
    return [];
  }
}
