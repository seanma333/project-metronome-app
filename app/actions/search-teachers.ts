"use server";

import { db, pool } from "@/lib/db";
import {
  teachers,
  users,
  teacherInstruments,
  teacherLanguages,
  instruments,
  languages,
  userAddresses,
  addresses,
} from "@/lib/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

interface SearchTeachersParams {
  teachingType: "in-person" | "online";
  instrumentId: string;
  // For online searches
  timezone?: string;
  maxTimeDifference?: number;
  // For in-person searches
  postalCode?: string;
  addressId?: string;
  distance?: number; // in miles
  // Additional filters
  languageId?: string;
  studentAge?: number;
}

interface SearchResult {
  teacherId: string;
  firstName: string;
  lastName: string;
  profileName: string;
  imageUrl?: string | null;
  teachingFormat: "IN_PERSON_ONLY" | "ONLINE_ONLY" | "IN_PERSON_AND_ONLINE";
  instruments: Array<{ id: number; name: string; imagePath: string }>;
  languages: Array<{ id: number; name: string; code: string }>;
  distance?: number; // miles (only for in-person)
  timezone?: string; // only for online
}

/**
 * Calculate timezone difference in hours between two timezones
 */
function getTimezoneDifference(tz1: string, tz2: string): number {
  try {
    const now = new Date();

    // Create date formatters for both timezones
    const formatter1 = new Intl.DateTimeFormat("en-US", {
      timeZone: tz1,
      hour: "numeric",
      hour12: false,
    });

    const formatter2 = new Intl.DateTimeFormat("en-US", {
      timeZone: tz2,
      hour: "numeric",
      hour12: false,
    });

    // Get hours in each timezone
    const hour1 = parseInt(formatter1.format(now));
    const hour2 = parseInt(formatter2.format(now));

    // Calculate absolute difference
    let diff = Math.abs(hour1 - hour2);

    // Handle day boundaries (e.g., if one is 23:00 and other is 1:00)
    if (diff > 12) {
      diff = 24 - diff;
    }

    return diff;
  } catch (error) {
    console.error("Error calculating timezone difference:", error);
    return Infinity; // Return large value if calculation fails
  }
}

/**
 * Geocode a postal code using Nominatim
 */
async function geocodePostalCode(postalCode: string): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  try {
    const query = `${postalCode}, United States`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "TempoLink/1.0 (Contact: support@tempolink.com)",
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.length > 0 && data[0].lat && data[0].lon) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error("Error geocoding postal code:", error);
    return null;
  }
}

/**
 * Create or get an address for a postal code
 */
async function getOrCreatePostalCodeAddress(
  postalCode: string
): Promise<{ addressId: string; latitude: number; longitude: number }> {
  const addressJson = {
    postalCode: postalCode.trim(),
    country: "United States",
  };
  const addressFormatted = `${postalCode.trim()}, united states`.toLowerCase();

  // Check if address already exists
  const existingAddress = await db
    .select()
    .from(addresses)
    .where(eq(addresses.addressFormatted, addressFormatted))
    .limit(1);

  if (existingAddress.length > 0) {
    const addr = existingAddress[0];
    // Check if geocoded
    if (addr.latitude && addr.longitude) {
      return {
        addressId: addr.id,
        latitude: addr.latitude,
        longitude: addr.longitude,
      };
    }
    // If not geocoded, geocode it now
    const coords = await geocodePostalCode(postalCode);
    if (!coords) {
      throw new Error("Failed to geocode postal code");
    }

    // Update address with coordinates
    await db
      .update(addresses)
      .set({
        latitude: coords.latitude,
        longitude: coords.longitude,
        updatedAt: new Date(),
      })
      .where(eq(addresses.id, addr.id));

    // Update PostGIS geography column
    await pool.query(
      `UPDATE addresses SET location = ST_GeogFromText($1) WHERE id = $2`,
      [
        `SRID=4326;POINT(${coords.longitude} ${coords.latitude})`,
        addr.id,
      ]
    );

    return {
      addressId: addr.id,
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
  }

  // Create new address
  const addressId = randomUUID();
  const coords = await geocodePostalCode(postalCode);
  if (!coords) {
    throw new Error("Failed to geocode postal code");
  }

  await db.insert(addresses).values({
    id: addressId,
    address: addressJson,
    addressFormatted: addressFormatted,
    latitude: coords.latitude,
    longitude: coords.longitude,
  });

  // Add PostGIS geography
  await pool.query(
    `UPDATE addresses SET location = ST_GeogFromText($1) WHERE id = $2`,
    [
      `SRID=4326;POINT(${coords.longitude} ${coords.latitude})`,
      addressId,
    ]
  );

  return {
    addressId,
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}

export async function searchTeachers(
  params: SearchTeachersParams
): Promise<{ results: SearchResult[]; error?: string }> {
  try {
    // Determine teaching format filter
    const teachingFormats: Array<"IN_PERSON_ONLY" | "ONLINE_ONLY" | "IN_PERSON_AND_ONLINE"> =
      params.teachingType === "in-person"
        ? ["IN_PERSON_ONLY", "IN_PERSON_AND_ONLINE"]
        : ["ONLINE_ONLY", "IN_PERSON_AND_ONLINE"];

    // Build where conditions
    const conditions = [
      eq(teacherInstruments.instrumentId, parseInt(params.instrumentId)),
      inArray(teachers.teachingFormat, teachingFormats),
      eq(teachers.acceptingStudents, true),
    ];

    // Add age preference filter if studentAge is provided
    if (params.studentAge !== undefined) {
      if (params.studentAge < 13) {
        // Filter to teachers who accept all ages
        conditions.push(eq(teachers.agePreference, "ALL_AGES" as const));
      } else if (params.studentAge >= 13 && params.studentAge < 18) {
        // Filter to teachers who accept 13+ or adults only
        const agePreferences: Array<"13+" | "ADULTS_ONLY"> = ["13+", "ADULTS_ONLY"];
        conditions.push(inArray(teachers.agePreference, agePreferences));
      }
      // If 18 or older, no age filter needed (all teachers accept adults)
    }

    // Build base query
    const baseQuery = db
      .select({
        teacherId: teachers.id,
        profileName: teachers.profileName,
        teachingFormat: teachers.teachingFormat,
        imageUrl: teachers.imageUrl,
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        preferredTimezone: users.preferredTimezone,
      })
      .from(teachers)
      .innerJoin(users, eq(teachers.id, users.id))
      .innerJoin(
        teacherInstruments,
        eq(teachers.id, teacherInstruments.teacherId)
      );

    // Execute query with or without language filter
    let teachersWithInstrument;
    if (params.languageId) {
      // Query with language join
      teachersWithInstrument = await baseQuery
        .innerJoin(
          teacherLanguages,
          eq(teachers.id, teacherLanguages.teacherId)
        )
        .where(
          and(
            ...conditions,
            eq(teacherLanguages.languageId, parseInt(params.languageId))
          )
        );
    } else {
      // Query without language join
      teachersWithInstrument = await baseQuery.where(and(...conditions));
    }

    if (teachersWithInstrument.length === 0) {
      return { results: [] };
    }

    // Get instruments and languages for each teacher
    const teacherIds = teachersWithInstrument.map((t) => t.teacherId);

    const teacherInstrumentsData = await db
      .select({
        teacherId: teacherInstruments.teacherId,
        instrument: instruments,
      })
      .from(teacherInstruments)
      .innerJoin(instruments, eq(teacherInstruments.instrumentId, instruments.id))
      .where(inArray(teacherInstruments.teacherId, teacherIds));

    const teacherLanguagesData = await db
      .select({
        teacherId: teacherLanguages.teacherId,
        language: languages,
      })
      .from(teacherLanguages)
      .innerJoin(languages, eq(teacherLanguages.languageId, languages.id))
      .where(inArray(teacherLanguages.teacherId, teacherIds));

    // Create maps for quick lookup
    const instrumentsMap = new Map<string, Array<{ id: number; name: string; imagePath: string }>>();
    const languagesMap = new Map<string, Array<{ id: number; name: string; code: string }>>();

    for (const ti of teacherInstrumentsData) {
      if (!instrumentsMap.has(ti.teacherId)) {
        instrumentsMap.set(ti.teacherId, []);
      }
      instrumentsMap.get(ti.teacherId)!.push(ti.instrument);
    }

    for (const tl of teacherLanguagesData) {
      if (!languagesMap.has(tl.teacherId)) {
        languagesMap.set(tl.teacherId, []);
      }
      languagesMap.get(tl.teacherId)!.push(tl.language);
    }

    // Filter by teaching type specific criteria
    if (params.teachingType === "online") {
      // Filter by timezone difference
      if (!params.timezone || !params.maxTimeDifference) {
        return { results: [], error: "Timezone and max time difference are required for online searches" };
      }

      const filteredResults: SearchResult[] = [];

      for (const teacher of teachersWithInstrument) {
        if (!teacher.preferredTimezone) {
          continue; // Skip teachers without timezone
        }

        const timeDiff = getTimezoneDifference(
          params.timezone,
          teacher.preferredTimezone
        );

        if (timeDiff <= params.maxTimeDifference!) {
          filteredResults.push({
            teacherId: teacher.teacherId,
            firstName: teacher.firstName || "",
            lastName: teacher.lastName || "",
            profileName: teacher.profileName,
            imageUrl: teacher.imageUrl,
            teachingFormat: teacher.teachingFormat || "ONLINE_ONLY",
            instruments: instrumentsMap.get(teacher.teacherId) || [],
            languages: languagesMap.get(teacher.teacherId) || [],
            timezone: teacher.preferredTimezone,
          });
        }
      }

      return { results: filteredResults };
    } else {
      // In-person search
      if (!params.distance) {
        return { results: [], error: "Distance is required for in-person searches" };
      }

      let searchLocation: { latitude: number; longitude: number; addressId: string };

      // Get or create the search location
      if (params.postalCode) {
        // Geocode postal code
        searchLocation = await getOrCreatePostalCodeAddress(params.postalCode);
      } else if (params.addressId) {
        // Get address from database
        const addressData = await db
          .select()
          .from(addresses)
          .where(eq(addresses.id, params.addressId))
          .limit(1);

        if (addressData.length === 0) {
          return { results: [], error: "Address not found" };
        }

        const addr = addressData[0];

        // Check if geocoded
        if (!addr.latitude || !addr.longitude) {
          // Not geocoded - geocode using postal code if available
          const postalCode =
            (addr.address as any)?.postalCode ||
            (addr.address as any)?.postal_code;

          if (!postalCode) {
            return {
              results: [],
              error: "Address is not geocoded and has no postal code",
            };
          }

          // Geocode and update
          const coords = await geocodePostalCode(postalCode);
          if (!coords) {
            return { results: [], error: "Failed to geocode address" };
          }

          await db
            .update(addresses)
            .set({
              latitude: coords.latitude,
              longitude: coords.longitude,
              updatedAt: new Date(),
            })
            .where(eq(addresses.id, params.addressId));

          await pool.query(
            `UPDATE addresses SET location = ST_GeogFromText($1) WHERE id = $2`,
            [
              `SRID=4326;POINT(${coords.longitude} ${coords.latitude})`,
              params.addressId,
            ]
          );

          searchLocation = {
            addressId: params.addressId,
            latitude: coords.latitude,
            longitude: coords.longitude,
          };
        } else {
          searchLocation = {
            addressId: params.addressId,
            latitude: addr.latitude,
            longitude: addr.longitude,
          };
        }
      } else {
        return {
          results: [],
          error: "Either postal code or address ID is required for in-person searches",
        };
      }

      // Get teacher IDs that match our criteria
      const teacherIds = teachersWithInstrument.map((t) => t.userId);

      if (teacherIds.length === 0) {
        return { results: [] };
      }

      // Use PostGIS to find addresses within distance
      // Distance is in miles, convert to meters (1 mile = 1609.34 meters)
      const distanceInMeters = params.distance * 1609.34;

      const searchPoint = `SRID=4326;POINT(${searchLocation.longitude} ${searchLocation.latitude})`;

      // Find all addresses within distance
      // Use ANY array syntax properly for PostgreSQL
      const nearbyAddresses = await pool.query(
        `
        SELECT DISTINCT ua.user_id, a.id as address_id,
          ST_Distance(a.location, ST_GeogFromText($1)) / 1609.34 as distance_miles
        FROM user_addresses ua
        INNER JOIN addresses a ON ua.address_id = a.id
        WHERE ua.user_id = ANY($2::uuid[])
          AND a.location IS NOT NULL
          AND ST_Distance(a.location, ST_GeogFromText($1)) <= $3
        ORDER BY distance_miles ASC
      `,
        [searchPoint, teacherIds, distanceInMeters]
      );

      // Build results map
      const teacherDistanceMap = new Map<string, number>();
      for (const row of nearbyAddresses.rows) {
        const userId = row.user_id;
        const distance = parseFloat(row.distance_miles);
        if (!teacherDistanceMap.has(userId) || distance < teacherDistanceMap.get(userId)!) {
          teacherDistanceMap.set(userId, distance);
        }
      }

      // Filter teachers to only those with nearby addresses
      const results: SearchResult[] = [];
      for (const teacher of teachersWithInstrument) {
        const distance = teacherDistanceMap.get(teacher.userId);
        if (distance !== undefined) {
          results.push({
            teacherId: teacher.teacherId,
            firstName: teacher.firstName || "",
            lastName: teacher.lastName || "",
            profileName: teacher.profileName,
            imageUrl: teacher.imageUrl,
            teachingFormat: teacher.teachingFormat || "IN_PERSON_ONLY",
            instruments: instrumentsMap.get(teacher.teacherId) || [],
            languages: languagesMap.get(teacher.teacherId) || [],
            distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
          });
        }
      }

      // Sort by distance
      results.sort((a, b) => (a.distance || 0) - (b.distance || 0));

      return { results };
    }
  } catch (error) {
    console.error("Error searching teachers:", error);
    return {
      results: [],
      error: error instanceof Error ? error.message : "Failed to search teachers",
    };
  }
}
