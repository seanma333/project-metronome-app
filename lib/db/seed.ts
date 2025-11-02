// Load environment variables FIRST before any other imports
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config(); // Fallback to .env

// Now import database and schema
import { db } from "./index";
import { instruments, languages } from "./schema";

// Instruments
const instrumentData = [
  { name: "Accordion", imagePath: "/images/instruments/accordion.png" },
  { name: "Bassoon", imagePath: "/images/instruments/bassoon.png" },
  { name: "Cello", imagePath: "/images/instruments/cello.png" },
  { name: "Clarinet", imagePath: "/images/instruments/clarinet.png" },
  { name: "Flute", imagePath: "/images/instruments/flute.png" },
  { name: "Guitar", imagePath: "/images/instruments/guitar.png" },
  { name: "Harp", imagePath: "/images/instruments/harp.png" },
  { name: "Oboe", imagePath: "/images/instruments/oboe.png" },
  { name: "Piano", imagePath: "/images/instruments/piano.png" },
  { name: "Saxophone", imagePath: "/images/instruments/saxophone.png" },
  { name: "Trombone", imagePath: "/images/instruments/trombone.png" },
  { name: "Trumpet", imagePath: "/images/instruments/trumpet.png" },
  { name: "Tuba", imagePath: "/images/instruments/tuba.png" },
  { name: "Viola", imagePath: "/images/instruments/viola.png" },
  { name: "Violin", imagePath: "/images/instruments/violin.png" },
  { name: "Voice", imagePath: "/images/instruments/voice.png" },
];

// Languages with ISO codes
const languageData = [
  { name: "English", code: "en" },
  { name: "Spanish", code: "es" },
  { name: "Mandarin", code: "zh" },
  { name: "French", code: "fr" },
  { name: "German", code: "de" },
  { name: "Italian", code: "it" },
  { name: "Russian", code: "ru" },
  { name: "Cantonese", code: "yue" },
  { name: "Japanese", code: "ja" },
  { name: "Korean", code: "ko" },
  { name: "Hindi", code: "hi" }
];

export async function seedInstruments() {
  console.log("Seeding instruments...");
  for (const instrument of instrumentData) {
    try {
      await db.insert(instruments).values(instrument);
    } catch (error: any) {
      // Skip if already exists (unique constraint violation)
      if (error?.code !== "23505") {
        throw error;
      }
    }
  }
  console.log("Instruments seeded successfully");
}

export async function seedLanguages() {
  console.log("Seeding languages...");
  for (const language of languageData) {
    try {
      await db.insert(languages).values(language);
    } catch (error: any) {
      // Skip if already exists (unique constraint violation)
      if (error?.code !== "23505") {
        throw error;
      }
    }
  }
  console.log("Languages seeded successfully");
}

export async function seedAll() {
  await seedInstruments();
  await seedLanguages();
  console.log("All data seeded successfully");
}

// Run seed if this file is executed directly
if (require.main === module) {
  seedAll()
    .then(() => {
      console.log("Seed completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error seeding database:", error);
      process.exit(1);
    });
}
