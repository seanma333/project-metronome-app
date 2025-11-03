"use client";

import { useState } from "react";
import { SearchResults, SearchResult } from "./SearchResults";
import { SearchForm } from "./SearchForm";

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

interface UserPreferences {
  user: {
    preferredTimezone: string | null;
  };
  addresses: Address[];
}

interface SearchResultsWrapperProps {
  instruments: Instrument[];
  userPreferences: UserPreferences | null;
}

export function SearchResultsWrapper({
  instruments,
  userPreferences,
}: SearchResultsWrapperProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [teachingType, setTeachingType] = useState<"in-person" | "online">("in-person");

  const handleSearchResults = (
    newResults: SearchResult[],
    newError?: string
  ) => {
    setResults(newResults);
    setError(newError);
    setIsLoading(false);
  };

  return (
    <>
      <div className="hidden">
        <SearchForm
          instruments={instruments}
          userPreferences={userPreferences}
          onSearchResults={(results, err) => {
            setIsLoading(true);
            setTeachingType(
              results.length > 0
                ? (results[0].distance !== undefined ? "in-person" : "online")
                : "in-person"
            );
            handleSearchResults(results, err);
          }}
        />
      </div>
      <SearchResults
        results={results}
        teachingType={teachingType}
        isLoading={isLoading}
        error={error}
      />
    </>
  );
}
