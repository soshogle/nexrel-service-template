/// <reference types="@types/google.maps" />

import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MAP_SCRIPT_BASE = "/api/maps/js?v=weekly&libraries=marker,places,geocoding,geometry";

function loadMapScript(): Promise<void> {
  if (typeof window !== "undefined" && (window as any).google?.maps?.places) {
    return Promise.resolve();
  }
  const existing = document.querySelector('script[src*="/api/maps/js"]');
  if (existing) {
    return new Promise((resolve) => {
      if ((window as any).google?.maps?.places) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve());
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = MAP_SCRIPT_BASE;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
}

export interface AddressData {
  address: string;
  city?: string;
  province?: string;
  country?: string;
  lat?: number;
  lng?: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, data?: AddressData) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Search address...",
  className,
  disabled = false,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesRef = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    loadMapScript()
      .then(() => {
        setIsReady(true);
        autocompleteRef.current = new google.maps.places.AutocompleteService();
        const div = document.createElement("div");
        placesRef.current = new google.maps.places.PlacesService(div);
      })
      .catch(() => setIsReady(false));
  }, []);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPredictions = useCallback((input: string) => {
    if (!input || input.length < 2 || !autocompleteRef.current) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }
    setIsLoading(true);
    autocompleteRef.current.getPlacePredictions(
      { input, types: ["address"] },
      (results, status) => {
        setIsLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results);
          setShowDropdown(true);
        } else {
          setPredictions([]);
          setShowDropdown(false);
        }
      }
    );
  }, []);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (!val) {
      onChange("");
      setPredictions([]);
      setShowDropdown(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(val), 300);
  };

  const handleSelect = (p: google.maps.places.AutocompletePrediction) => {
    const desc = p.description;
    setInputValue(desc);
    setShowDropdown(false);
    setPredictions([]);

    if (!placesRef.current) {
      onChange(desc, { address: desc });
      return;
    }

    placesRef.current.getDetails(
      { placeId: p.place_id!, fields: ["address_components", "geometry", "formatted_address"] },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          let city = "", province = "", country = "";
          place.address_components?.forEach((c) => {
            if (c.types.includes("locality")) city = c.long_name;
            if (c.types.includes("administrative_area_level_1")) province = c.short_name;
            if (c.types.includes("country")) country = c.long_name;
          });
          onChange(place.formatted_address || desc, {
            address: place.formatted_address || desc,
            city: city || undefined,
            province: province || undefined,
            country: country || undefined,
            lat: place.geometry?.location?.lat(),
            lng: place.geometry?.location?.lng(),
          });
        } else {
          onChange(desc, { address: desc });
        }
      }
    );
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#214359]/50" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => predictions.length > 0 && setShowDropdown(true)}
          placeholder={isReady ? placeholder : "Loading maps..."}
          disabled={disabled || !isReady}
          className={cn(
            "w-full h-12 pl-10 pr-10 border border-[#214359]/20 rounded-md px-3 text-[#214359] bg-white",
            "focus:outline-none focus:ring-2 focus:ring-[#86C0C7]/50 focus:border-[#86C0C7]",
            className
          )}
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#214359]/50 animate-spin" />
        )}
      </div>
      {showDropdown && predictions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-[#214359]/20 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {predictions.map((p, i) => (
            <button
              key={p.place_id || i}
              type="button"
              onClick={() => handleSelect(p)}
              className="w-full px-4 py-3 text-left hover:bg-[#E8F4F4]/50 flex items-center gap-3 transition-colors text-[#214359] text-sm"
            >
              <MapPin className="w-4 h-4 text-[#86C0C7] shrink-0" />
              <span className="truncate">{p.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
