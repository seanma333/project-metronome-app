import { pgTable, text, timestamp, varchar, pgEnum, serial, integer, boolean, jsonb, uuid, unique, index } from "drizzle-orm/pg-core";

// Role enum for users
export const roleEnum = pgEnum("user_role", ["TEACHER", "STUDENT", "PARENT"]);

// Teaching format enum for teachers
export const teachingFormatEnum = pgEnum("teaching_format", ["IN_PERSON_ONLY", "ONLINE_ONLY", "IN_PERSON_AND_ONLINE"]);

// Users table - linked to Clerk user ID
export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // internal UUID for the user
  clerkId: text("clerk_id").notNull().unique(), // Clerk user ID
  email: varchar("email", { length: 255 }).notNull(), // Clerk email
  firstName: varchar("first_name", { length: 100 }), // Clerk first name
  lastName: varchar("last_name", { length: 100 }), // Clerk last name
  role: roleEnum("role"), // TEACHER, STUDENT, PARENT
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Teachers table
export const teachers = pgTable("teachers", {
  id: uuid("id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  bio: text("bio"),
  acceptingStudents: boolean("accepting_students").default(false),
  teachingFormat: teachingFormatEnum("teaching_format").default("ONLINE_ONLY"),
  imageUrl: varchar("image_url", { length: 255 }),
  profileName: varchar("profile_name", { length: 100 }).unique().notNull(), // Used for URL slug
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Junction table: Teachers to Instruments (many-to-many)
export const teacherInstruments = pgTable("teacher_instruments", {
  id: serial("id").primaryKey(),
  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  instrumentId: integer("instrument_id")
    .notNull()
    .references(() => instruments.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    uniqueTeacherInstrument: unique().on(table.teacherId, table.instrumentId),
  };
});

// Junction table: Teachers to Languages (many-to-many)
export const teacherLanguages = pgTable("teacher_languages", {
  id: serial("id").primaryKey(),
  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  languageId: integer("language_id")
    .notNull()
    .references(() => languages.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    uniqueTeacherLanguage: unique().on(table.teacherId, table.languageId),
  };
});

// Students table
// For STUDENT role users: one entry where userId = their own user.id, parentId may be null or set
// For PARENT role users: multiple entries where parentId = their user.id, userId = null
export const students = pgTable("students", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }), // For STUDENT role users
  parentId: uuid("parent_id").references(() => users.id, { onDelete: "cascade" }), // For PARENT role users (their children)
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  dateOfBirth: timestamp("date_of_birth"),
  imageUrl: varchar("image_url", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Ensure a student entry has either userId or parentId (or both)
  // A student entry must belong to either a student user or a parent user
  studentConstraint: {
    check: `("user_id" IS NOT NULL OR "parent_id" IS NOT NULL)`,
  },
}));

// Instruments table
export const instruments = pgTable("instruments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  imagePath: varchar("image_path", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Languages table
export const languages = pgTable("languages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  code: varchar("code", { length: 10 }).notNull().unique(), // ISO language code
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
