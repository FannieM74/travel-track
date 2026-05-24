"use client";

import { useState, useEffect, useRef } from "react";

interface AddressResult {
  lat: number;
  lon: number;
  displayName: string;
}

interface AddressSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: AddressResult) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function AddressSearch({ value, onChange, onSelect, placeholder, disabled }: AddressSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<AddressResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(val)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.results) {
            setResults(data.results);
            setIsOpen(data.results.length > 0);
          }
        } else {
          setResults([]);
          setIsOpen(false);
        }
      } catch {
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }

  function handleSelect(result: AddressResult) {
    setQuery(result.displayName);
    setIsOpen(false);
    onSelect(result);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder={placeholder || "Search street address..."}
        disabled={disabled}
        className="w-full border border-line rounded px-4 py-3 text-base bg-input text-fg disabled:opacity-50"
      />
      {isSearching && (
        <span className="absolute right-3 top-3 text-xs text-fg-muted">Searching...</span>
      )}
      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 w-full bg-card border border-line rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto text-fg">
          {results.map((r, i) => (
            <li
              key={i}
              onClick={() => handleSelect(r)}
              className="px-4 py-2.5 hover:bg-card-hover cursor-pointer text-sm border-b last:border-0 truncate"
              style={{ borderColor: "var(--line-light)" }}
            >
              {r.displayName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
