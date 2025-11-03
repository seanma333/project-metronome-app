"use server";

import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { after } from "next/server";

interface AddressFormData {
  streetAddress?: string; // First part of street address (e.g., "123 Main St")
  aptUnit?: string; // Optional second part (e.g., "Apt 4B" or "Unit 5")
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  [key: string]: string | undefined;
}

/**
 * Formats an address object into a lowercase, comma-separated string
 * Order: streetAddress (with aptUnit if present), city, state, postalCode, country
 */
function formatAddressString(address: AddressFormData): string {
  const parts: string[] = [];

  // Combine street address and apt/unit if both are present
  const streetParts: string[] = [];
  if (address.streetAddress?.trim()) {
    streetParts.push(address.streetAddress.trim());
  }
  if (address.aptUnit?.trim()) {
    streetParts.push(address.aptUnit.trim());
  }

  // Join street parts with a space (e.g., "123 Main St Apt 4B")
  if (streetParts.length > 0) {
    parts.push(streetParts.join(" "));
  }

  if (address.city?.trim()) {
    parts.push(address.city.trim());
  }
  if (address.state?.trim()) {
    parts.push(address.state.trim());
  }
  if (address.postalCode?.trim()) {
    parts.push(address.postalCode.trim());
  }
  if (address.country?.trim()) {
    parts.push(address.country.trim());
  }

  return parts.join(", ").toLowerCase();
}

/**
 * Formats an address for geocoding by removing apartment/unit info
 * This helps Nominatim find the address more reliably
 */
function formatAddressForGeocoding(address: AddressFormData): string {
  const parts: string[] = [];

  // Only include street address (not apt/unit)
  if (address.streetAddress?.trim()) {
    parts.push(address.streetAddress.trim());
  }

  if (address.city?.trim()) {
    parts.push(address.city.trim());
  }
  if (address.state?.trim()) {
    parts.push(address.state.trim());
  }
  if (address.postalCode?.trim()) {
    parts.push(address.postalCode.trim());
  }
  if (address.country?.trim()) {
    parts.push(address.country.trim());
  }

  return parts.join(", ");
}

/**
 * Geocodes an address using Nominatim API with exponential backoff
 * Retries up to 3 times with exponential backoff (starting at 2 seconds)
 * Note: Apartment/unit info is excluded from geocoding query but kept in DB
 */
async function geocodeAddress(
  address: AddressFormData,
  addressId: string,
  retryCount: number = 0
): Promise<void> {
  const maxRetries = 3;
  const baseDelay = 2000; // 2 seconds base delay

  try {
    // Format address without apt/unit for better geocoding results
    const geocodeQuery = formatAddressForGeocoding(address);

    // Call Nominatim API
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(geocodeQuery)}&limit=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "TempoLink/1.0 (Contact: support@tempolink.com)", // Nominatim requires User-Agent
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data && data.length > 0 && data[0].lat && data[0].lon) {
      const latitude = parseFloat(data[0].lat);
      const longitude = parseFloat(data[0].lon);

      // Update address with coordinates
      await db
        .update(addresses)
        .set({
          latitude: latitude,
          longitude: longitude,
          // Update PostGIS geography column
          updatedAt: new Date(),
        })
        .where(eq(addresses.id, addressId));

      // Update PostGIS geography column using raw SQL since Drizzle doesn't have direct support
      const { pool } = await import("@/lib/db");
      await pool.query(
        `UPDATE addresses SET location = ST_GeogFromText($1) WHERE id = $2`,
        [`SRID=4326;POINT(${longitude} ${latitude})`, addressId]
      );

      console.log(`Successfully geocoded address ${addressId}: ${latitude}, ${longitude}`);
    } else {
      console.warn(`No geocoding results found for address: ${geocodeQuery}`);
    }
  } catch (error) {
    console.error(`Geocoding attempt ${retryCount + 1} failed for address ${addressId}:`, error);

      // Retry with exponential backoff if we haven't exceeded max retries
    if (retryCount < maxRetries - 1) {
      const delay = baseDelay * Math.pow(2, retryCount);
      console.log(`Retrying geocoding in ${delay}ms...`);

      await new Promise((resolve) => setTimeout(resolve, delay));
      return geocodeAddress(address, addressId, retryCount + 1);
    } else {
      console.error(`Failed to geocode address ${addressId} after ${maxRetries} attempts`);
    }
  }
}

/**
 * Server action to add an address to the database
 * Accepts form data, formats it, and inserts into addresses table
 * Uses Next.js 'after' to geocode the address in the background
 */
export async function addAddress(formData: AddressFormData) {
  try {
    // Convert form data to JSON format
    const addressJson = {
      streetAddress: formData.streetAddress?.trim() || undefined,
      aptUnit: formData.aptUnit?.trim() || undefined,
      city: formData.city?.trim() || undefined,
      state: formData.state?.trim() || undefined,
      postalCode: formData.postalCode?.trim() || undefined,
      country: formData.country?.trim() || undefined,
    };

    // Format the address string (lowercase, comma-separated)
    const addressFormatted = formatAddressString(addressJson);

    // Check if address already exists (based on formatted string uniqueness)
    const existingAddress = await db
      .select()
      .from(addresses)
      .where(eq(addresses.addressFormatted, addressFormatted))
      .limit(1);

    if (existingAddress.length > 0) {
      return {
        success: true,
        addressId: existingAddress[0].id,
        existing: true,
      };
    }

    // Create new address
    const addressId = randomUUID();
    await db.insert(addresses).values({
      id: addressId,
      address: addressJson,
      addressFormatted: addressFormatted,
      latitude: null,
      longitude: null,
    });

    // Use Next.js 'after' to geocode the address in the background
    after(async () => {
      await geocodeAddress(addressJson, addressId);
    });

    return {
      success: true,
      addressId: addressId,
      existing: false,
    };
  } catch (error) {
    console.error("Error adding address:", error);
    return { error: "Failed to add address" };
  }
}
