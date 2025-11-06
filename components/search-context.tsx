"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface SearchContextType {
  isSearchMode: boolean;
  setIsSearchMode: (value: boolean) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isSearchMode, setIsSearchMode] = useState(false);

  return (
    <SearchContext.Provider value={{ isSearchMode, setIsSearchMode }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchContext() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearchContext must be used within a SearchProvider");
  }
  return context;
}

