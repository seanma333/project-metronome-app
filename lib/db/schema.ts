import { pgTable, text, timestamp, varchar, pgEnum, serial, integer, boolean, jsonb, uuid, unique, index, real, customType } from "drizzle-orm/pg-core";

// Role enum for users
export const roleEnum = pgEnum("user_role", ["TEACHER", "STUDENT", "PARENT"]);

// Teaching format enum for teachers
export const teachingFormatEnum = pgEnum("teaching_format", ["IN_PERSON_ONLY", "ONLINE_ONLY", "IN_PERSON_AND_ONLINE"]);

// Age preference enum for teachers
export const agePreferenceEnum = pgEnum("age_preference", ["ALL_AGES", "13+", "ADULTS_ONLY"]);

// Booking status enum for booking requests
export const bookingStatusEnum = pgEnum("booking_status", ["PENDING", "ACCEPTED", "DENIED", "CANCELLED"]);

// PostGIS Geography type for spatial data
const geography = customType<{ data: string; driverParam: string }>({
  dataType: () => 'geography(Point, 4326)',
});

// Users table - linked to Clerk user ID
export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // internal UUID for the user
  clerkId: text("clerk_id").notNull().unique(), // Clerk user ID
  email: varchar("email", { length: 255 }).notNull(), // Clerk email
  firstName: varchar("first_name", { length: 100 }), // Clerk first name
  lastName: varchar("last_name", { length: 100 }), // Clerk last name
  role: roleEnum("role"), // TEACHER, STUDENT, PARENT
  imageUrl: varchar("image_url", { length: 255 }), // Profile image URL (for PARENT role users)
  preferredTimezone: varchar("preferred_timezone", { length: 50 }), // User's preferred timezone (e.g., "America/New_York")
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Teachers table
export const teachers = pgTable("teachers", {
  id: uuid("id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  bio: text("bio"),
  acceptingStudents: boolean("accepting_students").default(false),
  teachingFormat: teachingFormatEnum("teaching_format").default("ONLINE_ONLY"),
  agePreference: agePreferenceEnum("age_preference").default("ALL_AGES"),
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

// Teacher timeslots table - weekly recurring availability
export const teacherTimeslots = pgTable("teacher_timeslots", {
  id: uuid("id").primaryKey(),
  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: varchar("start_time", { length: 8 }).notNull(), // Format: "HH:MM:SS" (e.g., "09:00:00")
  endTime: varchar("end_time", { length: 8 }).notNull(), // Format: "HH:MM:SS" (e.g., "10:00:00")
  isBooked: boolean("is_booked").default(false).notNull(),
  studentId: uuid("student_id").references(() => students.id, { onDelete: "set null" }), // Nullable - only set when booked
  teachingFormat: teachingFormatEnum("teaching_format").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Index for teacher lookups
    teacherIdIdx: index("teacher_timeslots_teacher_id_idx").on(table.teacherId),
    // Index for day of week queries
    dayOfWeekIdx: index("teacher_timeslots_day_of_week_idx").on(table.dayOfWeek),
    // Index for availability queries
    isBookedIdx: index("teacher_timeslots_is_booked_idx").on(table.isBooked),
    // Composite index for teacher availability queries
    teacherAvailabilityIdx: index("teacher_timeslots_teacher_availability_idx").on(table.teacherId, table.dayOfWeek, table.isBooked),
  };
});

// Booking requests table - for students to request timeslots
export const bookingRequests = pgTable("booking_requests", {
  id: uuid("id").primaryKey(),
  timeslotId: uuid("timeslot_id")
    .notNull()
    .references(() => teacherTimeslots.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  instrumentId: integer("instrument_id")
    .notNull()
    .references(() => instruments.id, { onDelete: "restrict" }),
  bookingStatus: bookingStatusEnum("booking_status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Index for timeslot lookups
    timeslotIdIdx: index("booking_requests_timeslot_id_idx").on(table.timeslotId),
    // Index for student lookups
    studentIdIdx: index("booking_requests_student_id_idx").on(table.studentId),
    // Index for instrument lookups
    instrumentIdIdx: index("booking_requests_instrument_id_idx").on(table.instrumentId),
    // Index for status queries
    statusIdx: index("booking_requests_status_idx").on(table.bookingStatus),
    // Composite index for student's booking history
    studentStatusIdx: index("booking_requests_student_status_idx").on(table.studentId, table.bookingStatus),
    // Ensure one request per student per timeslot
    uniqueStudentTimeslot: unique().on(table.studentId, table.timeslotId),
  };
});

// Lessons table - for successfully scheduled weekly one-on-one lessons
export const lessons = pgTable("lessons", {
  id: uuid("id").primaryKey(),
  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  timeslotId: uuid("timeslot_id")
    .notNull()
    .references(() => teacherTimeslots.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  instrumentId: integer("instrument_id")
    .notNull()
    .references(() => instruments.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Index for teacher lookups
    teacherIdIdx: index("lessons_teacher_id_idx").on(table.teacherId),
    // Index for timeslot lookups
    timeslotIdIdx: index("lessons_timeslot_id_idx").on(table.timeslotId),
    // Index for student lookups
    studentIdIdx: index("lessons_student_id_idx").on(table.studentId),
    // Index for instrument lookups
    instrumentIdIdx: index("lessons_instrument_id_idx").on(table.instrumentId),
    // Ensure one lesson per timeslot
    uniqueTimeslot: unique().on(table.timeslotId),
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

// Addresses table
// Stores addresses that can be shared by multiple users (many-to-many relationship)
export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey(),
  address: jsonb("address").notNull(), // JSON object representing the address (standard format)
  addressFormatted: varchar("address_formatted", { length: 500 }).notNull().unique(), // Lowercase formatted string, unique
  latitude: real("latitude"), // Latitude (nullable, filled during geocoding)
  longitude: real("longitude"), // Longitude (nullable, filled during geocoding)
  location: geography("location"), // PostGIS geography column for spatial queries (Point, SRID 4326)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Index for geocoding lookups
    addressFormattedIdx: index("address_formatted_idx").on(table.addressFormatted),
    // Index for spatial queries using lat/long (for fallback queries)
    locationIdx: index("location_idx").on(table.latitude, table.longitude),
    // Spatial index for PostGIS geography column (GIST index will be created via migration)
    // Note: Drizzle doesn't support GIST index syntax directly, so this will be added via SQL migration
  };
});

// Junction table: Users to Addresses (many-to-many)
export const userAddresses = pgTable("user_addresses", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  addressId: uuid("address_id")
    .notNull()
    .references(() => addresses.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    uniqueUserAddress: unique().on(table.userId, table.addressId),
    // Index for user lookups
    userIdIdx: index("user_addresses_user_id_idx").on(table.userId),
    // Index for address lookups
    addressIdIdx: index("user_addresses_address_id_idx").on(table.addressId),
  };
});
