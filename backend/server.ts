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

dotenv.config();
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

const app = express();
const PORT = Number(process.env.PORT || 5000);
const FRONTEND_URLS = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "uploads");



await fs.mkdir(uploadsDir, { recursive: true });

// Allow the Vite frontend to call this backend while both run on different ports.
// app.use(
//   cors({
//     origin(origin, callback) {
//       if (
//         !origin ||
//         FRONTEND_URLS.length === 0 ||
//         FRONTEND_URLS.includes(origin) ||
//         origin.startsWith("capacitor://")
//       ) {
//         callback(null, true);
//         return;
//       }

//       callback(new Error("CORS origin is not allowed"));
//     },
//   }),
// );

app.use(cors());

// app.use((req, _res, next) => {
//   console.log("REQUEST:", req.method, req.url);
//   next();
// });

// Allow JSON request bodies for metadata-only edit requests.
app.use(express.json());

// Serve saved images so frontend can render them after refresh while backend is running.
app.use("/uploads", express.static(uploadsDir));

app.use("/api/layers", layerRoutes);//using shapefiles layer 

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, callback) => {
    callback(null, uploadsDir);
  },
  filename: (_req: Request, file: Express.Multer.File, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    callback(null, `${Date.now()}-${randomUUID()}-${safeName}`);
  },
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

// Frontend submits valid GPS photos here. Each image has one matching metadata item.
app.post(
  "/api/photos",
  upload.array("photos"),
  async (req: Request, res: Response) => {
    
    const files = (req.files || []) as Express.Multer.File[];
    const metadata = parseMetadata(req.body.metadata);

    
    const savedPhotos = await Promise.all(
     files.map(async(file, index) => {
      const item = metadata[index] || {};

      console.log("HOST =", req.get("host"));
    console.log("PROTOCOL =", req.protocol);
    
      const photo = {
        id: randomUUID(),
        name: item.name || file.originalname,
        url: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
        lat: Number(item.lat),
        lng: Number(item.lng),
        capturedAt: item.capturedAt || undefined,
        description: item.description || "",
      };
      const savedPhoto = await Photo.create(photo);
      
      return savedPhoto;
      }),
  );

    res.status(201).json({
      photos: savedPhotos,
    });
  },
);

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

  await removeUploadedFile(deletedPhoto.url);

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

// app.listen(PORT, () => {
//   console.log(`Backend server running on http://localhost:${PORT}`);
// });

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

async function removeUploadedFile(photoUrl: string) {
  try {
    const filename = path.basename(new URL(photoUrl).pathname);
    await fs.unlink(path.join(uploadsDir, filename));
  } catch {
    // Deleting the database record is still valid if the local file is already missing.
  }
}
