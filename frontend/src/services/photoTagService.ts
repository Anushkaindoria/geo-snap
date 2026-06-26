import { API_BASE_URL } from "../config/api";
import type { PhotoPoint } from "../types";

type GenerateTagsResponse = {
  photo?: PhotoPoint;
  message?: string;
};

// Regenerates Gemini tags for one already-uploaded photo using its saved image URL.
export async function generatePhotoTags(photoId: string): Promise<PhotoPoint> {
  const response = await fetch(`${API_BASE_URL}/api/photos/${photoId}/generate-tags`, {
    method: "POST",
  });

  const data: GenerateTagsResponse = await response.json().catch(() => ({}));

  if (!response.ok || !data.photo) {
    throw new Error(
      data.message || "AI service is busy. Please try again in a few minutes.",
    );
  }

  return data.photo;
}
