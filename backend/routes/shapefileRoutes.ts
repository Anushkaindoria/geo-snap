import { Router } from "express";
import multer from "multer";
import { uploadShapefile } from "../controllers/shapefileController.js";

const router = Router();

const upload = multer({
  dest: "uploads/shapefiles/",
});

router.get("/test", (_req, res) => {
  res.json({
    message: "Shapefile routes working",
  });
});

router.post(
  "/upload",
  upload.single("shapefile"),
  uploadShapefile,
);

export default router;