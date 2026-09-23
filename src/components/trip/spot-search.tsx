"use client";

import { useCallback, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAutocompleteSuggestions } from "@/lib/hooks/use-autocomplete-suggestions";

export type PlaceSelection = {
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  googlePlaceId: string;
};

export function SpotSearch({
  onSelect,
}: {
  onSelect: (place: PlaceSelection) => void;
}) {
  const places = useMapsLibrary("places");
  const [inputValue, setInputValue] = useState("");
  const { suggestions, isLoading, resetSession } = useAutocompleteSuggestions(inputValue);

  const handleSelect = useCallback(
    async (suggestion: google.maps.places.AutocompleteSuggestion) => {
      if (!places || !suggestion.placePrediction) return;

      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({ fields: ["location", "formattedAddress", "displayName"] });

      if (!place.location) return;

      onSelect({
        name: place.displayName ?? suggestion.placePrediction.text.text,
        address: place.formattedAddress ?? null,
        lat: place.location.lat(),
        lng: place.location.lng(),
        googlePlaceId: place.id,
      });

      setInputValue("");
      resetSession();
    },
    [places, onSelect, resetSession],
  );

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Googleマップでスポットを検索"
          className="pl-8"
        />
      </div>
      {inputValue && (suggestions.length > 0 || isLoading) && (
        <ul className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg dark:bg-zinc-900">
          {isLoading && suggestions.length === 0 && (
            <li className="px-3 py-2 text-sm text-zinc-500">検索中...</li>
          )}
          {suggestions.map((suggestion, index) => (
            <li key={index}>
              <button
                type="button"
                className="w-full truncate px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => handleSelect(suggestion)}
              >
                {suggestion.placePrediction?.text.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
