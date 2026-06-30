import { Router, type Request, type Response } from "express";
import multer, { type FileFilterCallback } from "multer";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import DocumentModel from "../models/Document.js";

const router = Router();

const SUPPORTED_DOCUMENT_TYPES = new Set(["pdf", "docx", "xlsx", "csv", "txt"]);
const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;

const documentStorage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => {
    const extension = getFileExtension(file.originalname);

    return {
      folder: "geo-snap/documents",
      resource_type: "raw",
      allowed_formats: [...SUPPORTED_DOCUMENT_TYPES],
      public_id: `${Date.now()}-${randomUUID()}${extension ? `.${extension}` : ""}`,
    } as Record<string, unknown>;
  },
});

const uploadDocument = multer({
  storage: documentStorage,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
  },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback,
  ) => {
    const extension = getFileExtension(file.originalname);

    if (SUPPORTED_DOCUMENT_TYPES.has(extension)) {
      callback(null, true);
      return;
    }

    callback(
      new Error("Unsupported document type. Please upload PDF, DOCX, XLSX, CSV, or TXT files."),
    );
  },
});

router.get("/", async (_req: Request, res: Response) => {
  try {
    const documents = await DocumentModel.find().sort({ uploadedAt: -1 });

    res.json({
      documents,
    });
  } catch (error) {
    console.error("Documents could not be loaded:", error);

    res.status(500).json({
      message: "Documents could not be loaded. Please try again.",
    });
  }
});

router.post(
  "/",
  uploadDocument.single("document"),
  async (req: Request, res: Response) => {
    try {
      const file = req.file as Express.Multer.File | undefined;

      if (!file) {
        res.status(400).json({
          message: "Please choose a supported document to upload.",
        });
        return;
      }

      const fileType = getFileExtension(file.originalname).toUpperCase();
      const savedDocument = await DocumentModel.create({
        id: randomUUID(),
        name: file.originalname,
        url: (file as Express.Multer.File & { path?: string }).path || "",
        fileType,
        fileSize: file.size,
        uploadedAt: new Date(),
        description: typeof req.body.description === "string" ? req.body.description.trim() : "",
      });

      res.status(201).json({
        document: savedDocument,
      });
    } catch (error) {
      console.error("Document upload failed:", error);

      res.status(500).json({
        message: "Document could not be uploaded. Please try again.",
      });
    }
  },
);

router.delete("/:id", async (req: Request<{ id: string }>, res: Response) => {
  try {
    const deletedDocument = await DocumentModel.findOneAndDelete({
      id: req.params.id,
    });

    if (!deletedDocument) {
      res.status(404).json({
        message: "Document not found",
      });
      return;
    }

    res.json({
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Document delete failed:", error);

    res.status(500).json({
      message: "Document could not be deleted. Please try again.",
    });
  }
});

function getFileExtension(fileName: string) {
  return path.extname(fileName).replace(".", "").toLowerCase();
}

export default router;
