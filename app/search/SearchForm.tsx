"use client";

import { useState, useEffect } from "react";
import TimezoneSelect from "react-timezone-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { searchTeachers } from "@/app/actions/search-teachers";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SearchResult } from "./SearchResults";

// Prevent hydration mismatch by only rendering after client mount
function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

interface Instrument {
  id: number;
  name: string;
  imagePath: string;
}

interface Address {
  id: string;
  address: any;
  addressFormatted: string;
}

interface Language {
  id: number;
  name: string;
  code: string;
}

interface UserPreferences {
  user: {
    preferredTimezone: string | null;
  };
  addresses: Address[];
}

interface Student {
  id: string;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null; // ISO string
}

interface SearchFormProps {
  instruments: Instrument[];
  languages: Language[];
  userPreferences: UserPreferences | null;
  defaultAge: number;
  studentProfile: { id: string; dateOfBirth: string | null } | null;
  parentStudents: Student[] | null;
  onSearchResults: (results: SearchResult[], error?: string, teachingType?: "in-person" | "online", selectedInstrumentName?: string, selectedStudentId?: string) => void;
  onSearchStart?: () => void;
}

type TeachingType = "in-person" | "online";
type LocationMethod = "address" | "postal-code";
type AgeRange = "child" | "teenager" | "adult";

function calculateAge(dateOfBirth: string | Date | null): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function ageToRange(age: number | null): AgeRange {
  if (age === null || age < 4) return "child";
  if (age >= 4 && age <= 12) return "child";
  if (age >= 13 && age <= 17) return "teenager";
  return "adult";
}

function rangeToAge(range: AgeRange): number {
  switch (range) {
    case "child":
      return 8; // Middle of 4-12 range
    case "teenager":
      return 15; // Middle of 13-17 range
    case "adult":
      return 18; // Minimum for adult
  }
}

export function SearchForm({
  instruments,
  languages,
  userPreferences,
  defaultAge,
  studentProfile,
  parentStudents,
  onSearchResults,
  onSearchStart
}: SearchFormProps) {
  const isClient = useIsClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [teachingType, setTeachingType] = useState<TeachingType>("in-person");
  const [selectedInstrument, setSelectedInstrument] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [studentAgeRange, setStudentAgeRange] = useState<AgeRange>(ageToRange(defaultAge));
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedTimezone, setSelectedTimezone] = useState<string>("");
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [postalCode, setPostalCode] = useState<string>("");
  const [locationMethod, setLocationMethod] = useState<LocationMethod>("postal-code");
  const [distance, setDistance] = useState<string>("10");
  const [maxTimeDifference, setMaxTimeDifference] = useState<string>("1");
  const [isSearching, setIsSearching] = useState(false);
  const [didInitFromQuery, setDidInitFromQuery] = useState(false);

  // Initialize timezone based on user preferences or browser timezone
  useEffect(() => {
    if (userPreferences?.user.preferredTimezone) {
      setSelectedTimezone(userPreferences.user.preferredTimezone);
    } else {
      // Get browser timezone
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setSelectedTimezone(browserTimezone);
    }
  }, [userPreferences]);

  // On first client render, read query params and initialize state, then optionally auto-search
  useEffect(() => {
    if (!isClient || didInitFromQuery) return;
    const tp = searchParams.get("teachingType") as TeachingType | null;
    const instr = searchParams.get("instrumentId");
    const lang = searchParams.get("languageId");
    const ageQ = searchParams.get("studentAge");
    const tz = searchParams.get("timezone");
    const maxDiff = searchParams.get("maxTimeDifference");
    const locMethod = searchParams.get("locationMethod") as LocationMethod | null;
    const addr = searchParams.get("addressId");
    const zip = searchParams.get("postalCode");
    const dist = searchParams.get("distance");

    if (tp) setTeachingType(tp);
    if (instr) setSelectedInstrument(instr);
    if (lang) setSelectedLanguage(lang);
    if (ageQ) {
      const ageNum = parseInt(ageQ);
      if (!isNaN(ageNum)) {
        setStudentAgeRange(ageToRange(ageNum));
      }
    }
    if (tz) setSelectedTimezone(tz);
    if (maxDiff) setMaxTimeDifference(maxDiff);
    if (locMethod) setLocationMethod(locMethod);
    if (addr) setSelectedAddress(addr);
    if (zip) setPostalCode(zip);
    if (dist) setDistance(dist);

    setDidInitFromQuery(true);

    // If we have at least instrument and either online or in-person required fields, auto-search
    const hasInstrument = !!instr;
    const onlineReady = tp === "online" && !!tz && !!maxDiff;
    const inPersonReady = tp === "in-person" && ((locMethod === "address" && !!addr) || (locMethod === "postal-code" && !!zip)) && !!dist;
    if (hasInstrument && (onlineReady || inPersonReady)) {
      // Delay to allow state updates to flush
      setTimeout(() => {
        void handleSearch();
      }, 0);
    }
  }, [isClient, didInitFromQuery, searchParams]);

  // Initialize age from student profile or default
  useEffect(() => {
    if (studentProfile?.dateOfBirth) {
      const age = calculateAge(studentProfile.dateOfBirth);
      setStudentAgeRange(ageToRange(age));
    } else {
      setStudentAgeRange(ageToRange(defaultAge));
    }
  }, [defaultAge, studentProfile]);

  // Update age when student is selected (for parents)
  useEffect(() => {
    if (selectedStudent && selectedStudent !== "none" && parentStudents) {
      const student = parentStudents.find((s) => s.id === selectedStudent);
      if (student?.dateOfBirth) {
        const age = calculateAge(student.dateOfBirth);
        setStudentAgeRange(ageToRange(age));
      } else {
        setStudentAgeRange(ageToRange(defaultAge));
      }
    } else if ((!selectedStudent || selectedStudent === "none") && studentProfile?.dateOfBirth) {
      const age = calculateAge(studentProfile.dateOfBirth);
      setStudentAgeRange(ageToRange(age));
    }
  }, [selectedStudent, parentStudents, defaultAge, studentProfile]);

  // Reset location fields when teaching type changes
  useEffect(() => {
    setSelectedAddress("");
    setPostalCode("");
    setLocationMethod("postal-code");
    setDistance("10");
    setMaxTimeDifference("1");
    // Reset student selection when teaching type changes
    setSelectedStudent("");
  }, [teachingType]);

  const handleSearch = async () => {
    if (!selectedInstrument) {
      return;
    }

    setIsSearching(true);
    if (onSearchStart) {
      onSearchStart();
    }

    try {
      const age = rangeToAge(studentAgeRange);
      const searchParams = {
        teachingType,
        instrumentId: selectedInstrument,
        ...(selectedLanguage ? { languageId: selectedLanguage } : {}),
        studentAge: age,
        ...(teachingType === "online"
          ? {
              timezone: selectedTimezone,
              maxTimeDifference: parseInt(maxTimeDifference),
            }
          : {
              postalCode:
                locationMethod === "postal-code" ? postalCode : undefined,
              addressId:
                locationMethod === "address" ? selectedAddress : undefined,
              distance: parseInt(distance),
            }),
      };

      const result = await searchTeachers(searchParams);
      console.log(result);

      // Get the selected instrument name
      const selectedInstrumentObj = instruments.find(
        (inst) => inst.id.toString() === selectedInstrument
      );
      const selectedInstrumentName = selectedInstrumentObj?.name;

      if (result.error) {
        onSearchResults([], result.error);
      } else {
        // Determine which student ID to pass:
        // - For parents: use selectedStudent if selected
        // - For students: use studentProfile.id if available
        const studentIdToPass = selectedStudent || (studentProfile?.id && !parentStudents ? studentProfile.id : undefined);
        // Pass teaching type and selected instrument name along with results
        onSearchResults(result.results, undefined, teachingType, selectedInstrumentName, studentIdToPass);
      }

      // Write query parameters to URL (without navigating away)
      const qp = new URLSearchParams();
      qp.set("teachingType", teachingType);
      qp.set("instrumentId", selectedInstrument);
      if (selectedLanguage) qp.set("languageId", selectedLanguage);
      qp.set("studentAge", String(age));
      if (teachingType === "online") {
        qp.set("timezone", selectedTimezone);
        qp.set("maxTimeDifference", maxTimeDifference);
      } else {
        qp.set("locationMethod", locationMethod);
        if (locationMethod === "address" && selectedAddress) qp.set("addressId", selectedAddress);
        if (locationMethod === "postal-code" && postalCode) qp.set("postalCode", postalCode);
        qp.set("distance", distance);
      }
      router.replace(`${pathname}?${qp.toString()}`);
    } catch (error) {
      console.error("Search error:", error);
      // Determine which student ID to pass:
      // - For parents: use selectedStudent if selected
      // - For students: use studentProfile.id if available
      const studentIdToPass = selectedStudent || (studentProfile?.id && !parentStudents ? studentProfile.id : undefined);
      onSearchResults(
        [],
        error instanceof Error ? error.message : "Failed to search teachers",
        teachingType,
        undefined,
        studentIdToPass
      );
      // Also update URL even on error so state persists
      const qpErr = new URLSearchParams();
      qpErr.set("teachingType", teachingType);
      qpErr.set("instrumentId", selectedInstrument);
      if (selectedLanguage) qpErr.set("languageId", selectedLanguage);
      const ageErr = rangeToAge(studentAgeRange);
      qpErr.set("studentAge", String(ageErr));
      if (teachingType === "online") {
        qpErr.set("timezone", selectedTimezone);
        qpErr.set("maxTimeDifference", maxTimeDifference);
      } else {
        qpErr.set("locationMethod", locationMethod);
        if (locationMethod === "address" && selectedAddress) qpErr.set("addressId", selectedAddress);
        if (locationMethod === "postal-code" && postalCode) qpErr.set("postalCode", postalCode);
        qpErr.set("distance", distance);
      }
      router.replace(`${pathname}?${qpErr.toString()}`);
    } finally {
      setIsSearching(false);
    }
  };

  const hasUserAddresses = userPreferences?.addresses && userPreferences.addresses.length > 0;

  // Prevent hydration mismatch by not rendering Select components until client-side
  if (!isClient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Search Criteria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Teaching Type</Label>
            <div className="flex flex-row space-x-6">
              <div className="flex items-center space-x-2">
                <div className="border-input aspect-square size-4 shrink-0 rounded-full border" />
                <Label>In-Person</Label>
              </div>
              <div className="flex items-center space-x-2">
                <div className="border-input aspect-square size-4 shrink-0 rounded-full border" />
                <Label>Online</Label>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-base font-semibold">Instrument</Label>
            <div className="w-full p-2 border border-input rounded-md bg-background h-9" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Criteria</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Teaching Type */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Teaching Type</Label>
          <RadioGroup
            value={teachingType}
            onValueChange={(value) => setTeachingType(value as TeachingType)}
            className="flex flex-row space-x-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="in-person" id="in-person" />
              <Label htmlFor="in-person">In-Person</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="online" id="online" />
              <Label htmlFor="online">Online</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Instrument Selection */}
        <div className="space-y-3">
          <Label htmlFor="instrument" className="text-base font-semibold">
            Instrument
          </Label>
          <Select
            value={selectedInstrument}
            onValueChange={setSelectedInstrument}
          >
            <SelectTrigger id="instrument" className="w-full">
              <SelectValue placeholder="Select an instrument" />
            </SelectTrigger>
            <SelectContent>
              {instruments.map((instrument) => (
                <SelectItem key={instrument.id} value={instrument.id.toString()}>
                  {instrument.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Language Selection */}
        <div className="space-y-3">
          <Label htmlFor="language" className="text-base font-semibold">
            Language (Optional)
          </Label>
          <Select
            value={selectedLanguage || undefined}
            onValueChange={(value) => setSelectedLanguage(value === "none" ? "" : value)}
          >
            <SelectTrigger id="language" className="w-full">
              <SelectValue placeholder="Any language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Any language</SelectItem>
              {languages.map((language) => (
                <SelectItem key={language.id} value={language.id.toString()}>
                  {language.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Student Selection for Parents */}
        {parentStudents && parentStudents.length > 0 && (
          <div className="space-y-3">
            <Label htmlFor="student-selector" className="text-base font-semibold">
              Student
            </Label>
            <Select
              value={selectedStudent || undefined}
              onValueChange={(value) => setSelectedStudent(value === "none" ? "" : value)}
            >
              <SelectTrigger id="student-selector" className="w-full">
                <SelectValue placeholder="No student selected" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No student selected</SelectItem>
                {parentStudents.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {[student.firstName, student.lastName].filter(Boolean).join(" ") || "Student"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Student Age */}
        <div className="space-y-3">
          <Label htmlFor="student-age" className="text-base font-semibold">
            Student Age
          </Label>
          <Select
            value={studentAgeRange}
            onValueChange={(value) => setStudentAgeRange(value as AgeRange)}
          >
            <SelectTrigger id="student-age" className="w-full">
              <SelectValue placeholder="Select age range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="child">Child (4-12)</SelectItem>
              <SelectItem value="teenager">Teenager (13-17)</SelectItem>
              <SelectItem value="adult">Adult (18+)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Online Teaching - Timezone Selection */}
        {teachingType === "online" && (
          <>
            <div className="space-y-3">
              <Label className="text-base font-semibold">Preferred Timezone</Label>
              <TimezoneSelect
                value={selectedTimezone}
                onChange={(timezone) => setSelectedTimezone(timezone.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="max-time-difference" className="text-base font-semibold">
                Maximum Time Difference (hours)
              </Label>
              <Input
                id="max-time-difference"
                type="number"
                min="1"
                max="12"
                value={maxTimeDifference}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = parseInt(value);
                  // Only allow values between 1 and 12, or empty string (will default to min)
                  if (value === "") {
                    setMaxTimeDifference("1");
                  } else if (!isNaN(numValue) && numValue >= 1 && numValue <= 12) {
                    setMaxTimeDifference(value);
                  }
                }}
                placeholder="1-12 hours"
                className="w-full"
              />
            </div>
          </>
        )}

        {/* In-Person Teaching - Location Selection */}
        {teachingType === "in-person" && (
          <div className="space-y-4">
            <Label className="text-base font-semibold">Location</Label>

            {hasUserAddresses ? (
              <>
                {/* Location Method Selection */}
                <RadioGroup
                  value={locationMethod}
                  onValueChange={(value) => {
                    setLocationMethod(value as LocationMethod);
                    // Clear the other field when switching methods
                    if (value === "address") {
                      setPostalCode("");
                    } else {
                      setSelectedAddress("");
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="address" id="use-address" />
                    <Label htmlFor="use-address">Use saved address</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="postal-code" id="use-postal-code" />
                    <Label htmlFor="use-postal-code">Enter postal code</Label>
                  </div>
                </RadioGroup>

                {/* Address Selection */}
                {locationMethod === "address" && (
                  <div className="space-y-2">
                    <Label className="text-sm">Select from your addresses:</Label>
                    <Select
                      value={selectedAddress}
                      onValueChange={setSelectedAddress}
                    >
                      <SelectTrigger className="w-full uppercase">
                        <SelectValue placeholder="Select an address" />
                      </SelectTrigger>
                      <SelectContent className="uppercase">
                        {userPreferences!.addresses.map((address) => (
                          <SelectItem key={address.id} value={address.id}>
                            {address.addressFormatted}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Postal Code Input */}
                {locationMethod === "postal-code" && (
                  <div className="space-y-2">
                    <Label htmlFor="postal-code" className="text-sm">
                      Enter a postal code (US zip code):
                    </Label>
                    <Input
                      id="postal-code"
                      type="text"
                      placeholder="e.g., 90210"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      maxLength={5}
                      pattern="[0-9]{5}"
                    />
                  </div>
                )}
              </>
            ) : (
              // No saved addresses - only show postal code input
              <div className="space-y-2">
                <Label htmlFor="postal-code" className="text-sm">
                  Enter a postal code (US zip code):
                </Label>
                <Input
                  id="postal-code"
                  type="text"
                  placeholder="e.g., 90210"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  maxLength={5}
                  pattern="[0-9]{5}"
                />
              </div>
            )}

            {/* Distance Selection */}
            <div className="space-y-3">
              <Label htmlFor="distance" className="text-base font-semibold">
                Maximum Distance
              </Label>
              <Select value={distance} onValueChange={setDistance}>
                <SelectTrigger id="distance" className="w-full">
                  <SelectValue placeholder="Select distance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 miles</SelectItem>
                  <SelectItem value="10">10 miles</SelectItem>
                  <SelectItem value="20">20 miles</SelectItem>
                  <SelectItem value="50">50 miles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Search Button */}
        <div className="pt-4">
          <Button
            onClick={handleSearch}
            className="w-full"
            disabled={
              isSearching ||
              !selectedInstrument ||
              !studentAgeRange ||
              (teachingType === "in-person" &&
                ((locationMethod === "address" && !selectedAddress) ||
                 (locationMethod === "postal-code" && !postalCode))) ||
              (teachingType === "online" &&
                (!maxTimeDifference ||
                 parseInt(maxTimeDifference) < 1 ||
                 parseInt(maxTimeDifference) > 12))
            }
          >
            {isSearching ? "Searching..." : "Search Teachers"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
