"use client";

import { useState } from "react";
import { SearchResults, SearchResult } from "./SearchResults";
import { SearchForm } from "./SearchForm";

interface Instrument {
  id: number;
  name: string;
  imagePath: string;
}

interface Language {
  id: number;
  name: string;
  code: string;
}

interface Address {
  id: string;
  address: any;
  addressFormatted: string;
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

interface SearchPageContentProps {
  instruments: Instrument[];
  languages: Language[];
  userPreferences: UserPreferences | null;
  defaultAge: number;
  studentProfile: { dateOfBirth: string | null } | null;
  parentStudents: Student[] | null;
}

export function SearchPageContent({
  instruments,
  languages,
  userPreferences,
  defaultAge,
  studentProfile,
  parentStudents,
}: SearchPageContentProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [teachingType, setTeachingType] = useState<"in-person" | "online">("in-person");
  const [selectedInstrumentName, setSelectedInstrumentName] = useState<string | undefined>();

  const handleSearchStart = () => {
    setIsLoading(true);
    setError(undefined);
  };

  const handleSearchResults = (
    newResults: SearchResult[],
    newError?: string,
    newTeachingType?: "in-person" | "online",
    newSelectedInstrumentName?: string
  ) => {
    setResults(newResults);
    setError(newError);
    setIsLoading(false);
    // Update teaching type if provided
    if (newTeachingType) {
      setTeachingType(newTeachingType);
    }
    // Update selected instrument name if provided
    if (newSelectedInstrumentName !== undefined) {
      setSelectedInstrumentName(newSelectedInstrumentName);
    }
  };

  return (
    <>
      {/* Left Sidebar - Search Form */}
      <aside className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-border bg-muted/30 p-4 md:p-6 md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:overflow-y-auto">
        <SearchForm
          instruments={instruments}
          languages={languages}
          userPreferences={userPreferences}
          defaultAge={defaultAge}
          studentProfile={studentProfile}
          parentStudents={parentStudents}
          onSearchResults={handleSearchResults}
          onSearchStart={handleSearchStart}
        />
      </aside>

      {/* Right Side - Search Results */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Search Results</h1>
          <SearchResults
            results={results}
            teachingType={teachingType}
            isLoading={isLoading}
            error={error}
            selectedInstrumentName={selectedInstrumentName}
          />
        </div>
      </div>
    </>
  );
}
