/**
 * Timezone mappings matching react-timezone-select
 * Maps timezone identifiers to their display-friendly names
 */
const timezoneDisplayNames: Record<string, string> = {
  "Pacific/Midway": "Midway Island, Samoa",
  "Pacific/Honolulu": "Hawaii",
  "America/Juneau": "Alaska",
  "America/Boise": "Mountain Time",
  "America/Dawson": "Dawson, Yukon",
  "America/Chihuahua": "Chihuahua, La Paz, Mazatlan",
  "America/Phoenix": "Arizona",
  "America/Chicago": "Central Time",
  "America/Regina": "Saskatchewan",
  "America/Mexico_City": "Guadalajara, Mexico City, Monterrey",
  "America/Belize": "Central America",
  "America/Detroit": "Eastern Time",
  "America/Bogota": "Bogota, Lima, Quito",
  "America/Caracas": "Caracas, La Paz",
  "America/Santiago": "Santiago",
  "America/St_Johns": "Newfoundland and Labrador",
  "America/Sao_Paulo": "Brasilia",
  "America/Tijuana": "Tijuana",
  "America/Montevideo": "Montevideo",
  "America/Argentina/Buenos_Aires": "Buenos Aires, Georgetown",
  "America/Godthab": "Greenland",
  "America/Los_Angeles": "Pacific Time",
  "Atlantic/Azores": "Azores",
  "Atlantic/Cape_Verde": "Cape Verde Islands",
  "GMT": "UTC",
  "Europe/London": "Edinburgh, London",
  "Europe/Dublin": "Dublin",
  "Europe/Lisbon": "Lisbon",
  "Africa/Casablanca": "Casablanca, Monrovia",
  "Atlantic/Canary": "Canary Islands",
  "Europe/Belgrade": "Belgrade, Bratislava, Budapest, Ljubljana, Prague",
  "Europe/Sarajevo": "Sarajevo, Skopje, Warsaw, Zagreb",
  "Europe/Brussels": "Brussels, Copenhagen, Madrid, Paris",
  "Europe/Amsterdam": "Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna",
  "Africa/Algiers": "West Central Africa",
  "Europe/Bucharest": "Bucharest",
  "Africa/Cairo": "Cairo",
  "Europe/Helsinki": "Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius",
  "Europe/Athens": "Athens",
  "Asia/Jerusalem": "Jerusalem",
  "Africa/Harare": "Harare, Pretoria",
  "Europe/Moscow": "Istanbul, Minsk, Moscow, St. Petersburg, Volgograd",
  "Asia/Kuwait": "Kuwait, Riyadh",
  "Africa/Nairobi": "Nairobi",
  "Asia/Baghdad": "Baghdad",
  "Asia/Tehran": "Tehran",
  "Asia/Dubai": "Abu Dhabi, Muscat",
  "Asia/Baku": "Baku, Tbilisi, Yerevan",
  "Asia/Kabul": "Kabul",
  "Asia/Yekaterinburg": "Ekaterinburg",
  "Asia/Karachi": "Islamabad, Karachi, Tashkent",
  "Asia/Kolkata": "Chennai, Kolkata, Mumbai, New Delhi",
  "Asia/Kathmandu": "Kathmandu",
  "Asia/Dhaka": "Astana, Dhaka",
  "Asia/Colombo": "Sri Jayawardenepura",
  "Asia/Almaty": "Almaty, Novosibirsk",
  "Asia/Rangoon": "Yangon Rangoon",
  "Asia/Bangkok": "Bangkok, Hanoi, Jakarta",
  "Asia/Krasnoyarsk": "Krasnoyarsk",
  "Asia/Shanghai": "Beijing, Chongqing, Hong Kong SAR, Urumqi",
  "Asia/Kuala_Lumpur": "Kuala Lumpur, Singapore",
  "Asia/Taipei": "Taipei",
  "Australia/Perth": "Perth",
  "Asia/Irkutsk": "Irkutsk, Ulaanbaatar",
  "Asia/Seoul": "Seoul",
  "Asia/Tokyo": "Osaka, Sapporo, Tokyo",
  "Asia/Yakutsk": "Yakutsk",
  "Australia/Darwin": "Darwin",
  "Australia/Adelaide": "Adelaide",
  "Australia/Sydney": "Canberra, Melbourne, Sydney",
  "Australia/Brisbane": "Brisbane",
  "Australia/Hobart": "Hobart",
  "Asia/Vladivostok": "Vladivostok",
  "Pacific/Guam": "Guam, Port Moresby",
  "Asia/Magadan": "Magadan, Solomon Islands, New Caledonia",
  "Asia/Kamchatka": "Kamchatka, Marshall Islands",
  "Pacific/Fiji": "Fiji Islands",
  "Pacific/Auckland": "Auckland, Wellington",
  "Pacific/Tongatapu": "Nuku'alofa",
};

/**
 * Get the display-friendly name for a timezone
 * @param timezone - IANA timezone identifier (e.g., "America/New_York")
 * @returns Display-friendly name or the timezone identifier if not found
 */
export function getTimezoneDisplayName(timezone: string | null | undefined): string {
  if (!timezone) {
    return "Unknown";
  }

  return timezoneDisplayNames[timezone] || timezone;
}

/**
 * Get the GMT offset for a timezone
 * @param timezone - IANA timezone identifier (e.g., "America/New_York")
 * @returns GMT offset string (e.g., "GMT-5" or "GMT+9")
 */
export function getTimezoneOffset(timezone: string | null | undefined): string {
  if (!timezone) {
    return "GMT+0";
  }

  try {
    const now = new Date();

    // Get the time components in UTC and the target timezone for the same moment
    const utcParts = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);

    const tzParts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);

    const utcHour = parseInt(utcParts.find(p => p.type === "hour")?.value || "0");
    const utcMinute = parseInt(utcParts.find(p => p.type === "minute")?.value || "0");

    const tzHour = parseInt(tzParts.find(p => p.type === "hour")?.value || "0");
    const tzMinute = parseInt(tzParts.find(p => p.type === "minute")?.value || "0");

    // Calculate the difference in minutes
    const utcMinutes = utcHour * 60 + utcMinute;
    const tzMinutes = tzHour * 60 + tzMinute;
    let offsetMinutes = tzMinutes - utcMinutes;

    // Handle day boundary crossing (when offset is more than 12 hours, likely crossed midnight)
    if (Math.abs(offsetMinutes) > 12 * 60) {
      // Likely crossed a day boundary, adjust
      if (offsetMinutes > 0) {
        offsetMinutes -= 24 * 60;
      } else {
        offsetMinutes += 24 * 60;
      }
    }

    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMinutesRemainder = Math.abs(offsetMinutes) % 60;
    const sign = offsetMinutes >= 0 ? "+" : "-";

    if (offsetMinutesRemainder === 0) {
      return `GMT${sign}${offsetHours}`;
    } else {
      return `GMT${sign}${offsetHours}:${offsetMinutesRemainder.toString().padStart(2, "0")}`;
    }
  } catch (error) {
    console.error("Error calculating timezone offset:", error);
    return "GMT+0";
  }
}

/**
 * Get both display name and GMT offset for a timezone
 * @param timezone - IANA timezone identifier (e.g., "America/New_York")
 * @returns Object with displayName and offset
 */
export function getTimezoneInfo(timezone: string | null | undefined): {
  displayName: string;
  offset: string;
} {
  return {
    displayName: getTimezoneDisplayName(timezone),
    offset: getTimezoneOffset(timezone),
  };
}

/**
 * Format timezone with display name and offset
 * @param timezone - IANA timezone identifier (e.g., "America/New_York")
 * @returns Formatted string like "Eastern Time (GMT-5)" or "America/New_York (GMT-5)"
 */
export function formatTimezone(timezone: string | null | undefined): string {
  const displayName = getTimezoneDisplayName(timezone);
  const offset = getTimezoneOffset(timezone);

  return `${displayName} (${offset})`;
}
