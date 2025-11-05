"use client";

import { useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/app/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { createBookingRequest } from "@/app/actions/create-booking-request";
import { getTimezoneDisplayName } from "@/lib/timezone-utils";

interface Teacher {
  id: string;
  bio: string | null;
  acceptingStudents: boolean | null;
  teachingFormat: "IN_PERSON_ONLY" | "ONLINE_ONLY" | "IN_PERSON_AND_ONLINE" | null;
  agePreference: "ALL_AGES" | "13+" | "ADULTS_ONLY" | null;
  imageUrl: string | null;
  profileName: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    clerkId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: "TEACHER" | "STUDENT" | "PARENT" | null;
    imageUrl: string | null;
    preferredTimezone: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  instruments: Array<{
    id: number;
    name: string;
    imagePath: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  languages: Array<{
    id: number;
    name: string;
    code: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

interface Timeslot {
  id: string;
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  studentId: string | null;
  teachingFormat: "IN_PERSON_ONLY" | "ONLINE_ONLY" | "IN_PERSON_AND_ONLINE";
  createdAt: Date;
  updatedAt: Date;
}

interface Child {
  id: string;
  userId: string | null;
  parentId: string | null;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: Date | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface RequestBookingContentProps {
  teacher: Teacher;
  timeslots: Timeslot[];
  initialFormat: "IN_PERSON_ONLY" | "ONLINE_ONLY";
  children: Child[];
  selectedInstrument: string | null;
  userRole: "STUDENT" | "PARENT";
  userTimezone: string | null;
  teacherTimezone: string | null;
}

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

/**
 * Convert time from teacher's timezone to user's timezone
 * @param timeString - Time in HH:MM:SS format
 * @param dayOfWeek - Day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * @param teacherTimezone - Teacher's timezone (e.g., "America/New_York")
 * @param userTimezone - User's timezone (e.g., "America/Los_Angeles") or null for browser timezone
 * @returns Time string in HH:MM:SS format in user's timezone
 */
function convertTimeToUserTimezone(
  timeString: string,
  dayOfWeek: number,
  teacherTimezone: string | null,
  userTimezone: string | null
): string {
  // If no teacher timezone specified, return original time
  if (!teacherTimezone) {
    return timeString;
  }

  // Get user's timezone (use browser timezone if not specified)
  const targetTimezone = userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  // If timezones are the same, return original time
  if (teacherTimezone === targetTimezone) {
    return timeString;
  }

  // Parse the time string
  const [hours, minutes] = timeString.split(":").map(Number);

  // Get current date
  const now = new Date();
  const currentDay = now.getDay();

  // Calculate days until next occurrence of this day
  let daysUntil = dayOfWeek - currentDay;
  if (daysUntil < 0) {
    daysUntil += 7; // Next week
  }
  if (daysUntil === 0 && hours * 60 + minutes <= now.getHours() * 60 + now.getMinutes()) {
    daysUntil = 7; // If time has passed today, use next week
  }

  // Create a date for the next occurrence of this day
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + daysUntil);

  // Get the date string in teacher's timezone for this day
  const teacherDateStr = new Intl.DateTimeFormat("sv-SE", {
    timeZone: teacherTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(targetDate);

  // Create an ISO date string with the target time, interpreted as being in teacher's timezone
  // We'll use a trick: create a date string and then adjust it
  const isoString = `${teacherDateStr}T${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;

  // Create a date object - this will be interpreted in local timezone
  // We need to find the UTC timestamp that represents this time in teacher's timezone
  const baseDate = new Date(isoString);

  // Get what this represents in teacher's timezone
  const teacherParts = new Intl.DateTimeFormat("en-US", {
    timeZone: teacherTimezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(baseDate);

  const teacherHour = parseInt(teacherParts.find(p => p.type === "hour")?.value || "0");
  const teacherMin = parseInt(teacherParts.find(p => p.type === "minute")?.value || "0");

  // Calculate the offset needed
  const targetMinutes = hours * 60 + minutes;
  const currentMinutes = teacherHour * 60 + teacherMin;
  const offsetMinutes = targetMinutes - currentMinutes;

  // Adjust the date
  const adjustedDate = new Date(baseDate.getTime() + offsetMinutes * 60 * 1000);

  // Verify it's correct in teacher's timezone
  const verifyParts = new Intl.DateTimeFormat("en-US", {
    timeZone: teacherTimezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(adjustedDate);

  const verifyHour = parseInt(verifyParts.find(p => p.type === "hour")?.value || "0");
  const verifyMin = parseInt(verifyParts.find(p => p.type === "minute")?.value || "0");

  // If verification fails, try one more adjustment
  if (verifyHour !== hours || verifyMin !== minutes) {
    const finalOffset = (hours * 60 + minutes) - (verifyHour * 60 + verifyMin);
    adjustedDate.setMinutes(adjustedDate.getMinutes() + finalOffset);
  }

  // Now format in user's timezone
  const userParts = new Intl.DateTimeFormat("en-US", {
    timeZone: targetTimezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(adjustedDate);

  const userHour = userParts.find(p => p.type === "hour")?.value?.padStart(2, "0") || "00";
  const userMin = userParts.find(p => p.type === "minute")?.value?.padStart(2, "0") || "00";

  return `${userHour}:${userMin}:00`;
}

/**
 * Format time string for display
 * @param timeString - Time in HH:MM:SS format
 * @param dayOfWeek - Day of week (0-6)
 * @param teacherTimezone - Teacher's timezone
 * @param userTimezone - User's timezone
 * @returns Formatted time string (e.g., "9:00 AM")
 */
function formatTime(
  timeString: string,
  dayOfWeek: number,
  teacherTimezone: string | null,
  userTimezone: string | null
): string {
  // Convert to user's timezone first
  const convertedTime = convertTimeToUserTimezone(timeString, dayOfWeek, teacherTimezone, userTimezone);
  const [hours, minutes] = convertedTime.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function calculateDuration(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);

  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  return endTotalMinutes - startTotalMinutes;
}

export default function RequestBookingContent({
  teacher,
  timeslots: allTimeslots,
  initialFormat,
  children,
  selectedInstrument,
  userRole,
  userTimezone,
  teacherTimezone
}: RequestBookingContentProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [selectedFormat, setSelectedFormat] = useState<"online" | "in-person">(
    initialFormat === "IN_PERSON_ONLY" ? "in-person" : "online"
  );
  const [selectedTimeslot, setSelectedTimeslot] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<string>(
    children.length > 0 ? children[0].id : ""
  );
  const [currentInstrument, setCurrentInstrument] = useState<string>(
    selectedInstrument || (teacher.instruments.length > 0
      ? teacher.instruments.sort((a, b) => a.name.localeCompare(b.name))[0].name
      : "")
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter timeslots based on selected format and exclude 12am-6am after timezone conversion
  const filteredTimeslots = useMemo(() => {
    return allTimeslots.filter((timeslot) => {
      // First filter by format
      let formatMatch = false;
      if (selectedFormat === "online") {
        // Show timeslots that are ONLINE_ONLY or IN_PERSON_AND_ONLINE
        formatMatch = timeslot.teachingFormat === "ONLINE_ONLY" || timeslot.teachingFormat === "IN_PERSON_AND_ONLINE";
      } else {
        // Show timeslots that are IN_PERSON_ONLY or IN_PERSON_AND_ONLINE
        formatMatch = timeslot.teachingFormat === "IN_PERSON_ONLY" || timeslot.teachingFormat === "IN_PERSON_AND_ONLINE";
      }

      if (!formatMatch) {
        return false;
      }

      // Convert start time to user's timezone and check if it's between 12am and 6am
      const convertedStartTime = convertTimeToUserTimezone(
        timeslot.startTime,
        timeslot.dayOfWeek,
        teacherTimezone,
        userTimezone
      );

      const [convertedHours, convertedMinutes] = convertedStartTime.split(":").map(Number);
      const convertedTotalMinutes = convertedHours * 60 + convertedMinutes;

      // Filter out timeslots between 12am (0:00) and 6am (6:00)
      // Exclude if start time is >= 0:00 and < 6:00
      if (convertedTotalMinutes >= 0 && convertedTotalMinutes < 6 * 60) {
        return false;
      }

      return true;
    });
  }, [allTimeslots, selectedFormat, teacherTimezone, userTimezone]);

  // Group filtered timeslots by day of week
  const timeslotsByDay = useMemo(() => {
    return filteredTimeslots.reduce((acc, timeslot) => {
      const day = timeslot.dayOfWeek;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(timeslot);
      return acc;
    }, {} as Record<number, Timeslot[]>);
  }, [filteredTimeslots]);

  const updateURL = (format: "online" | "in-person", instrument: string) => {
    const params = new URLSearchParams();
    params.set("format", format);
    if (instrument) {
      params.set("instrument", instrument);
    }
    // Use replace to update URL without causing a page reload
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleFormatChange = (format: "online" | "in-person") => {
    setSelectedFormat(format);
    setSelectedTimeslot(null); // Clear selection when format changes
    // Update URL without reload
    updateURL(format, currentInstrument);
  };

  const handleInstrumentChange = (instrument: string) => {
    setCurrentInstrument(instrument);
    setSelectedTimeslot(null); // Clear selection when instrument changes
    // Update URL without reload
    updateURL(selectedFormat, instrument);
  };

  const handleTimeslotSelect = (timeslotId: string) => {
    setSelectedTimeslot(timeslotId === selectedTimeslot ? null : timeslotId);
  };

  const handleRequestBooking = async () => {
    if (!selectedTimeslot) return;

    setIsSubmitting(true);

    try {
      // For parent users, pass the selected child's ID
      const studentId = children.length > 1 ? selectedChild : undefined;
      const lessonFormat = selectedFormat === "online" ? "ONLINE" : "IN_PERSON";
      const result = await createBookingRequest(selectedTimeslot, studentId, currentInstrument, lessonFormat);

      if (result.error) {
        alert(result.error);
      } else {
        alert("Booking request submitted successfully!");
        router.push("/my-profile"); // Redirect to profile or bookings page
      }
    } catch (error) {
      console.error("Error submitting booking request:", error);
      alert("Failed to submit booking request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayName = `${teacher.user.firstName || ""} ${teacher.user.lastName || ""}`.trim() || "Teacher";
  const profileImage = teacher.imageUrl || teacher.user.imageUrl || "/images/profile/default_user.png";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Side - Teacher Profile */}
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-32 h-32 rounded-full overflow-hidden">
                <Image
                  src={profileImage}
                  alt={displayName}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
                <p className="text-muted-foreground">{teacher.user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Children Selection (for parents) */}
        {userRole === "PARENT" && children.length === 0 ? (
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="text-yellow-600 dark:text-yellow-500">No Student Profiles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You cannot book a timeslot without a student profile. Please create a student profile first.
              </p>
              <Button asChild className="w-full">
                <Link href="/my-profile">Create Student Profile</Link>
              </Button>
            </CardContent>
          </Card>
        ) : children.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Student</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedChild} onValueChange={setSelectedChild}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {`${child.firstName || ""} ${child.lastName || ""}`.trim() || "Student"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Instrument Selection */}
        {teacher.instruments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Instrument</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={currentInstrument} onValueChange={handleInstrumentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select instrument" />
                </SelectTrigger>
                <SelectContent>
                  {teacher.instruments
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((instrument) => (
                      <SelectItem key={instrument.id} value={instrument.name}>
                        {instrument.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Lesson Format Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Lesson Format</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedFormat}
              onValueChange={(value) => handleFormatChange(value as "online" | "in-person")}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="online" id="online" />
                <Label htmlFor="online" className="cursor-pointer">
                  Online Lesson
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="in-person" id="in-person" />
                <Label htmlFor="in-person" className="cursor-pointer">
                  In-Person Lesson
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Teacher Info */}
        {teacher.bio && (
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{teacher.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Instruments */}
        {teacher.instruments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Instruments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {teacher.instruments.map((instrument) => (
                  <Badge key={instrument.id} variant="secondary">
                    {instrument.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Side - Available Timeslots */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              Available {selectedFormat === "online" ? "Online" : "In-Person"} Timeslots
              {currentInstrument && ` - ${currentInstrument}`}
            </CardTitle>
            <div className="text-sm text-muted-foreground mt-1">
              Times shown in {getTimezoneDisplayName(userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone)}
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {userRole === "PARENT" && children.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Please create a student profile first to view available timeslots.
              </p>
            ) : Object.keys(timeslotsByDay).length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No available timeslots for {selectedFormat} lessons.
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(timeslotsByDay)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([dayOfWeek, dayTimeslots]) => (
                    <div key={dayOfWeek}>
                      <h3 className="font-semibold text-base mb-2">
                        {DAYS_OF_WEEK[parseInt(dayOfWeek)]}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
                        {dayTimeslots.map((timeslot) => {
                          const duration = calculateDuration(timeslot.startTime, timeslot.endTime);
                          const isSelected = selectedTimeslot === timeslot.id;

                          return (
                            <button
                              key={timeslot.id}
                              onClick={() => handleTimeslotSelect(timeslot.id)}
                              className={`p-2 rounded-md border text-left transition-colors ${
                                isSelected
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border hover:border-primary/50 hover:bg-accent"
                              }`}
                            >
                              <div className="font-medium text-sm">
                                {formatTime(timeslot.startTime, timeslot.dayOfWeek, teacherTimezone, userTimezone)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {duration} min
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Booking Button */}
        {selectedTimeslot && children.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <Button
                onClick={handleRequestBooking}
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? "Submitting..." : "Request Booking"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
