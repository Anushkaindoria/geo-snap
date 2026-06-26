import { API_BASE_URL } from "../config/api";
import type { PhotoPoint } from "../types";

type PhotoSearchResponse = {
  photos?: PhotoPoint[];
  matchedCount?: number;
  indexingInProgress?: boolean;
  failedPhotosPendingRetry?: number;
  message?: string;
};

export type PhotoSearchResult = {
  photos: PhotoPoint[];
  matchedCount: number;
  indexingInProgress: boolean;
  failedPhotosPendingRetry: number;
};

// Searches saved MongoDB photos by their generated tags.
export async function searchPhotos(query: string): Promise<PhotoSearchResult> {
  const response = await fetch(`${API_BASE_URL}/api/photos/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
    }),
  });

  const data: PhotoSearchResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to search photos");
  }

  const photos = Array.isArray(data.photos) ? data.photos : [];

  return {
    photos,
    matchedCount: Number(data.matchedCount ?? photos.length),
    indexingInProgress: Boolean(data.indexingInProgress),
    failedPhotosPendingRetry: Number(data.failedPhotosPendingRetry || 0),
  };
}
