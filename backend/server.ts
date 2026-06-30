import cors from "cors";
import dotenv from "dotenv";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import multer, { type FileFilterCallback } from "multer";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import Photo from "./models/Photo.js";
import { pool } from "./db.js";
import layerRoutes from "./routes/layerRoutes.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import shapefileRoutes from "./routes/shapefileRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import visionRoutes from "./routes/visionRoutes.js";
import {
  countPhotosPendingIndexing,
  generateTagsForPhoto,
  startPhotoTagging,
} from "./services/photoTaggingJob.js";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MONGODB_URI = process.env.MONGODB_URI || "";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.log("MongoDB connection error:", error);
  });

type PhotoRecord = {
  id: string;
  name: string;
  url: string;
  lat: number;
  lng: number;
  capturedAt?: string;
  description: string;
  createdAt: string;
};

type PhotoMetadata = {
  name?: string;
  lat?: number | string;
  lng?: number | string;
  capturedAt?: string;
  description?: string;
};

type PhotoSearchRequestBody = {
  query?: string;
};

const app = express();
const PORT = Number(process.env.PORT || 5000);
const FRONTEND_URLS = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

app.use(cors());

// Allow JSON request bodies for metadata-only edit requests.
app.use(express.json());

// Serve saved images so frontend can render them after refresh while backend is running.
//app.use("/uploads", express.static(uploadsDir));

app.use("/api/layers", layerRoutes);//using shapefiles layer 
app.use("/api/shapefiles", shapefileRoutes);
app.use("/api/vision", visionRoutes);
app.use("/api/documents", documentRoutes);

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, _file) => ({
    folder: "geo-snap",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    public_id: `${Date.now()}-${randomUUID()}`,
  }),
});

// Multer reads multipart/form-data from the frontend submit request.
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback,
  ) => {
    if (file.mimetype.startsWith("image/")) {
      callback(null, true);
      return;
    }

    callback(new Error("Only image files are allowed"));
  },
});

app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Photo map backend is running",
  });
});

// Frontend calls this on page load to restore saved photos while the backend is running.
app.get("/api/photos",async (_req: Request, res: Response) => {
  const photos = await Photo.find();
  res.json({
    photos,
  });
});

// Search uploaded photos by generated image tags.
app.post(
  "/api/photos/search",
  async (
    req: Request<Record<string, never>, unknown, PhotoSearchRequestBody>,
    res: Response,
  ) => {
    try {
      const query = req.body.query?.trim();

      if (!query) {
        res.status(400).json({
          message: "Search query is required",
        });
        return;
      }

      const failedPhotosPendingRetry = await countPhotosPendingIndexing();
      const indexingInProgress = failedPhotosPendingRetry > 0;

      const photos = await Photo.find({
        tagStatus: "completed",
        tags: {
          $regex: escapeRegex(query),
          $options: "i",
        },
      });

      res.json({
        photos,
        matchedCount: photos.length,
        indexingInProgress,
        failedPhotosPendingRetry,
      });
    } catch (error) {
      console.error("Photo tag search failed:", error);

      res.status(500).json({
        message: "Failed to search photos",
      });
    }
  },
);

// Frontend submits valid GPS photos here. Each image has one matching metadata item.
app.post(
  "/api/photos",
  upload.array("photos"),
  async (req: Request, res: Response) => {
    try {
      const files = (req.files || []) as Express.Multer.File[];
      const metadata = parseMetadata(req.body.metadata);

      // Persist uploads first. Gemini runs after this response has reached the user.
      const savedPhotos = await Promise.all(
        files.map(async (file, index) => {
          const item = metadata[index] || {};

          return Photo.create({
            id: randomUUID(),
            name: item.name || file.originalname,
            url: (file as any).path,
            lat: Number(item.lat),
            lng: Number(item.lng),
            capturedAt: item.capturedAt || undefined,
            description: item.description || "",
            tags: [],
            tagStatus: "pending",
          });
        }),
      );

      res.status(201).json({
        photos: savedPhotos,
      });

      // Deliberately do not await: an unavailable Gemini service must not delay uploads.
      savedPhotos.forEach((photo) => {
        startPhotoTagging(photo.id);
      });
    } catch (error) {
      console.error("Photo upload failed:", error);
      res.status(500).json({
        message: "Photo could not be uploaded. Please try again.",
      });
    }
  },
);

// Manually regenerate AI tags for one existing uploaded photo.
app.post("/api/photos/:photoId/generate-tags", async (req: Request<{ photoId: string }>, res: Response) => {
  try {
    const updatedPhoto = await generateTagsForPhoto(req.params.photoId);

    if (!updatedPhoto) {
      res.status(404).json({
        message: "Photo not found",
      });
      return;
    }

    res.json({
      photo: updatedPhoto,
    });
  } catch (error) {
    console.error("Manual photo tag generation failed:", error);

    res.status(503).json({
      message: "AI service is busy. Please try again in a few minutes.",
    });
  }
});
// Update editable metadata while keeping the existing uploaded image file.
app.put("/api/photos/:id", async (req: Request, res: Response) => {
  const updatedPhoto = await Photo.findOneAndUpdate(
    { id: req.params.id },
    {
      name: req.body.name,
      lat: Number(req.body.lat),
      lng: Number(req.body.lng),
      capturedAt: req.body.capturedAt || undefined,
      description: req.body.description || "",
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updatedPhoto) {
    res.status(404).json({
      message: "Photo not found",
    });
    return;
  }

  res.json({
    photo: updatedPhoto,
  });
});

// Delete the MongoDB document and remove its local uploaded image file.
app.delete("/api/photos/:id", async (req: Request, res: Response) => {
  const deletedPhoto = await Photo.findOneAndDelete({
    id: req.params.id,
  });

  if (!deletedPhoto) {
    res.status(404).json({
      message: "Photo not found",
    });
    return;
  }

  //await removeUploadedFile(deletedPhoto.url);

  res.json({
    message: "Photo deleted successfully",
  });
});

app.use(
  (error: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(400).json({
      message: error.message || "Something went wrong",
    });
  },
);


app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend server running on port ${PORT}`);
});

function parseMetadata(metadata: unknown): PhotoMetadata[] {
  if (typeof metadata !== "string") return [];

  try {
    const parsed = JSON.parse(metadata);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}







