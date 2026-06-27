"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "./Input";
import { cn } from "@/lib/utils";
import { searchLocations } from "@/features/geocoding/geocodingApi";
import type { LocationSuggestion } from "@/features/geocoding/types";

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: LocationSuggestion) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Search for a street or place",
  disabled = false,
  className,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchLocations(query);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setHighlightIndex(-1);
    } catch {
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      void fetchSuggestions(value);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (suggestion: LocationSuggestion) => {
    onChange(suggestion.label);
    onSelect(suggestion);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (event.key === "Enter" && highlightIndex >= 0) {
      event.preventDefault();
      handleSelect(suggestions[highlightIndex]);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.id}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-blue-50 transition-colors",
                  highlightIndex === index && "bg-blue-50"
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(suggestion)}
              >
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-blue-600" />
                <span>
                  <span className="block font-medium text-gray-900">{suggestion.label}</span>
                  <span className="block text-xs text-gray-500 truncate">{suggestion.displayName}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
