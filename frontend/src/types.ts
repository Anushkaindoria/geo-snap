// A valid photo has readable GPS metadata and can be shown as a marker on the map.
export type PhotoPoint = {
  id: string;
  name: string;
  // Local File exists for new uploads; database-loaded records keep their saved URL instead.
  file?: File;
  url: string;
  lat: number;
  lng: number;
  capturedAt?: string;
  description?: string;
  tags?: string[];
  tagStatus?: "pending" | "completed" | "failed";
};

// Invalid photos are kept only to show the current upload error message.
export type InvalidPhoto = {
  id: string;
  name: string;
  url: string;
};



// A saved document uploaded to Cloudinary and tracked separately from photos.
export type DocumentRecord = {
  id: string;
  name: string;
  url: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};
