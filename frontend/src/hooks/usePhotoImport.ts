import { useState } from "react";
//import { Capacitor } from "@capacitor/core";
import * as exifr from "exifr";
import type { InvalidPhoto, PhotoPoint } from "../types";

// Handles all form-side photo import state and EXIF GPS extraction.
export function usePhotoImport() {
  const [selectedPhotos, setSelectedPhotos] = useState<PhotoPoint[]>([]);
  const [invalidPhotos, setInvalidPhotos] = useState<InvalidPhoto[]>([]);
  const [isReadingMetadata, setIsReadingMetadata] = useState(false);
  const [description, setDescription] = useState(() => {
    return sessionStorage.getItem("photo-map-upload-description") || "";
  });

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []).slice(0, 1);
    const validPhotos: PhotoPoint[] = [];
    const invalidPhotoFiles: InvalidPhoto[] = [];

    setIsReadingMetadata(true);

    for (const file of files) {
      const url = URL.createObjectURL(file);
      const id = crypto.randomUUID();

      try {
        const buffer = await file.arrayBuffer();
        const metadata = await exifr.parse(buffer, true);

        // alert(JSON.stringify(Object.keys(metadata || {})));
        
        console.log("Metadata:", metadata);
        const lat = metadata?.latitude;
        const lng = metadata?.longitude;

        console.log("LAT:", lat);
        console.log("LNG:", lng);

        // const fallbackLocation =
        //   isValidCoordinate(lat) && isValidCoordinate(lng)
        //     ? undefined
        //     : await getNativeDeviceLocation();
        // const finalLat = isValidCoordinate(lat) ? lat : fallbackLocation?.lat;
        // const finalLng = isValidCoordinate(lng) ? lng : fallbackLocation?.lng;

        if (isValidCoordinate(lat) && isValidCoordinate(lng)) {
          validPhotos.push({
          id,
          file,
          name: file.name,
          url,
          lat,
          lng,
            capturedAt: metadata?.DateTimeOriginal
              ? new Date(metadata.DateTimeOriginal).toLocaleString()
              : undefined,
          });
          continue;
        }

        invalidPhotoFiles.push({ id, name: file.name, url });
      } catch {
        invalidPhotoFiles.push({ id, name: file.name, url });
      }
    }

    // The form represents one photo draft. A new selection replaces the previous draft.
    setSelectedPhotos(validPhotos);
    setInvalidPhotos(invalidPhotoFiles);
    setIsReadingMetadata(false);
    event.target.value = "";
  }

  function clearFormDraft() {
    setSelectedPhotos([]);
    setInvalidPhotos([]);
    setDescription("");
  }

  // Existing database metadata is loaded into the same form to make editing straightforward.
  function loadEditDraft(photo: PhotoPoint) {
    setSelectedPhotos([photo]);
    setInvalidPhotos([]);
    setDescription(photo.description || "");
  }

  return {
    selectedPhotos,
    invalidPhotos,
    description,
    isReadingMetadata,
    handlePhotoUpload,
    setDescription,
    clearFormDraft,
    loadEditDraft,
  };
}

function isValidCoordinate(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}



