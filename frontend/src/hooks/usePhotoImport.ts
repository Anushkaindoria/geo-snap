import { useState } from "react";
import * as exifr from "exifr";
import type { InvalidPhoto, PhotoPoint } from "../types";

type PhotoMetadata = {
  latitude?: number;
  longitude?: number;
  GPSLatitude?: number | number[];
  GPSLongitude?: number | number[];
  GPSLatitudeRef?: string;
  GPSLongitudeRef?: string;
  DateTimeOriginal?: string | Date;
};

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
        const metadata = await readPhotoMetadata(file);
        const coordinates =
          getCoordinatesFromMetadata(metadata) || (await getCurrentDeviceLocation());

        validPhotos.push({
          id,
          file,
          name: file.name,
          url,
          lat: coordinates?.lat ?? Number.NaN,
          lng: coordinates?.lng ?? Number.NaN,
          capturedAt: metadata?.DateTimeOriginal
            ? new Date(metadata.DateTimeOriginal).toLocaleString()
            : undefined,
        });
      } catch {
        validPhotos.push({
          id,
          file,
          name: file.name,
          url,
          lat: Number.NaN,
          lng: Number.NaN,
        });
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

  // Users can correct extracted coordinates or manually enter coordinates when needed.
  function updatePhotoCoordinate(
    photoId: string,
    field: "lat" | "lng",
    value: string,
  ) {
    const numericValue = value.trim() === "" ? Number.NaN : Number(value);

    setSelectedPhotos((currentPhotos) =>
      currentPhotos.map((photo) =>
        photo.id === photoId
          ? {
              ...photo,
              [field]: numericValue,
            }
          : photo,
      ),
    );
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
    updatePhotoCoordinate,
    setDescription,
    clearFormDraft,
    loadEditDraft,
  };
}

function isValidCoordinate(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

async function readPhotoMetadata(file: File): Promise<PhotoMetadata | undefined> {
  try {
    const gps = await exifr.gps(file);
    const metadata = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      mergeOutput: true,
    });

    return {
      ...metadata,
      latitude: gps?.latitude ?? metadata?.latitude,
      longitude: gps?.longitude ?? metadata?.longitude,
    };
  } catch {
    try {
      const buffer = await file.arrayBuffer();
      return await exifr.parse(buffer, {
        tiff: true,
        exif: true,
        gps: true,
        mergeOutput: true,
      });
    } catch {
      return undefined;
    }
  }
}

function getCoordinatesFromMetadata(metadata?: PhotoMetadata) {
  if (!metadata) return undefined;

  const lat =
    metadata.latitude ??
    convertDmsToDecimal(metadata.GPSLatitude, metadata.GPSLatitudeRef);
  const lng =
    metadata.longitude ??
    convertDmsToDecimal(metadata.GPSLongitude, metadata.GPSLongitudeRef);

  if (!isValidCoordinate(lat) || !isValidCoordinate(lng)) {
    return undefined;
  }

  return { lat, lng };
}

function convertDmsToDecimal(
  value: number | number[] | undefined,
  direction?: string,
) {
  if (typeof value === "number") return value;
  if (!Array.isArray(value) || value.length < 3) return undefined;

  const [degrees, minutes, seconds] = value;
  const decimal = Math.abs(degrees) + minutes / 60 + seconds / 3600;
  const sign = direction === "S" || direction === "W" ? -1 : 1;

  return decimal * sign;
}

async function getCurrentDeviceLocation() {
  if (!navigator.geolocation) return undefined;

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      });
    });

    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
  } catch {
    return undefined;
  }
}
