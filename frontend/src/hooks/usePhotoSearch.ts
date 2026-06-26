import { useState } from "react";
import { searchPhotos as searchPhotosRequest } from "../services/photoSearchService";
import type { PhotoPoint } from "../types";

// Provides reusable React state around the photo tag search API.
export function usePhotoSearch() {
  const [matchingPhotos, setMatchingPhotos] = useState<PhotoPoint[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [indexingInProgress, setIndexingInProgress] = useState(false);
  const [failedPhotosPendingRetry, setFailedPhotosPendingRetry] = useState(0);

  async function searchPhotos(query: string) {
    setIsSearching(true);
    setSearchError("");

    try {
      const result = await searchPhotosRequest(query);
      setMatchingPhotos(result.photos);
      setIndexingInProgress(result.indexingInProgress);
      setFailedPhotosPendingRetry(result.failedPhotosPendingRetry);
      return result.photos;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to search photos";

      setMatchingPhotos([]);
      setIndexingInProgress(false);
      setFailedPhotosPendingRetry(0);
      setSearchError(message);
      return [];
    } finally {
      setIsSearching(false);
    }
  }

  function clearSearch() {
    setMatchingPhotos([]);
    setSearchError("");
    setIndexingInProgress(false);
    setFailedPhotosPendingRetry(0);
  }

  return {
    matchingPhotos,
    isSearching,
    searchError,
    indexingInProgress,
    failedPhotosPendingRetry,
    searchPhotos,
    clearSearch,
  };
}
