import { useEffect, useRef, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

export type UseAutocompleteSuggestionsReturn = {
  suggestions: google.maps.places.AutocompleteSuggestion[];
  isLoading: boolean;
  resetSession: () => void;
};

// Adapted from the @vis.gl/react-google-maps autocomplete example: wraps the
// Autocomplete Data API (session-token based, pay-per-session pricing) since
// this library has no built-in search box component.
export function useAutocompleteSuggestions(
  inputString: string,
  requestOptions: Partial<google.maps.places.AutocompleteRequest> = {},
): UseAutocompleteSuggestionsReturn {
  const placesLib = useMapsLibrary("places");

  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const [rawSuggestions, setSuggestions] = useState<
    google.maps.places.AutocompleteSuggestion[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  // The empty-input case is handled by the derived `suggestions` below
  // rather than in the effect, so it never has to call setState synchronously.
  const suggestions = inputString === "" ? [] : rawSuggestions;

  useEffect(() => {
    if (!placesLib || inputString === "") return;

    const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLib;

    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new AutocompleteSessionToken();
    }

    const request: google.maps.places.AutocompleteRequest = {
      ...requestOptions,
      input: inputString,
      sessionToken: sessionTokenRef.current,
    };

    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicks off the async fetch below; loading state can't be derived at render time
    setIsLoading(true);
    let cancelled = false;
    AutocompleteSuggestion.fetchAutocompleteSuggestions(request).then((res) => {
      if (cancelled) return;
      setSuggestions(res.suggestions);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placesLib, inputString]);

  return {
    suggestions,
    isLoading,
    resetSession: () => {
      sessionTokenRef.current = null;
      setSuggestions([]);
    },
  };
}
