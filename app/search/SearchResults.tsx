"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import InstrumentBadge from "@/app/components/profile/InstrumentBadge";
import LanguageBadge from "@/app/components/profile/LanguageBadge";
import { getTimezoneDisplayName } from "@/lib/timezone-utils";

export interface SearchResult {
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

interface SearchResultsProps {
  results: SearchResult[];
  teachingType: "in-person" | "online";
  isLoading?: boolean;
  error?: string;
  selectedInstrumentName?: string;
}

export function SearchResults({
  results,
  teachingType,
  isLoading,
  error,
  selectedInstrumentName,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Searching...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground text-center">
          <p className="text-lg font-medium mb-2">No teachers found</p>
          <p className="text-sm">
            Try adjusting your search criteria to find more results.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Found {results.length} teacher{results.length !== 1 ? "s" : ""}
      </div>
      <div className="grid gap-4">
        {results.map((result) => (
          <Card key={result.teacherId}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4 flex-1">
                  {/* Teacher Image */}
                  <Link
                    href={`/teacher-profiles/${result.profileName}`}
                    className="flex-shrink-0"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-primary/20 shadow-sm hover:border-primary/40 transition-colors">
                      <Image
                        src={result.imageUrl || "/images/profile/default_user.png"}
                        alt={`${result.firstName} ${result.lastName}`}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                  </Link>

                  {/* Teacher Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/teacher-profiles/${result.profileName}`}
                      className="hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <h3 className="text-xl font-semibold mb-2">
                        {result.firstName} {result.lastName}
                      </h3>
                    </Link>

                    {/* Teaching Format */}
                    <div className="mb-3">
                      <span className="text-sm text-muted-foreground">
                        {result.teachingFormat === "IN_PERSON_ONLY" && "In-Person Only"}
                        {result.teachingFormat === "ONLINE_ONLY" && "Online Only"}
                        {result.teachingFormat === "IN_PERSON_AND_ONLINE" && "In-Person & Online"}
                      </span>
                    </div>

                    {/* Instruments */}
                    {result.instruments.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-2">
                          {result.instruments.map((instrument) => (
                            <InstrumentBadge
                              key={instrument.id}
                              instrument={instrument}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Languages */}
                    {result.languages.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-2">
                          {result.languages.map((language) => (
                            <LanguageBadge
                              key={language.id}
                              language={language}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Distance or Timezone */}
                    <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                      {teachingType === "in-person" && result.distance !== undefined && (
                        <div>
                          <span className="font-medium">Distance:</span>{" "}
                          {result.distance} miles
                        </div>
                      )}
                      {teachingType === "online" && result.timezone && (
                        <div>
                          <span className="font-medium">Timezone:</span>{" "}
                          {getTimezoneDisplayName(result.timezone)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/teacher-profiles/${result.profileName}`} target="_blank" rel="noopener noreferrer">
                      View Profile
                    </Link>
                  </Button>
                  {selectedInstrumentName && (
                    <Button asChild className="w-full">
                      <Link
                        href={`/teachers/${result.teacherId}/request-booking?format=${teachingType}&instrument=${encodeURIComponent(selectedInstrumentName)}`}
                      >
                        Book a Lesson
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
