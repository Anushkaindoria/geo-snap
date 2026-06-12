import express from "express";
import { getLayer, getLayers } from "../controllers/layerController.js";

const router = express.Router();

router.get("/", getLayers);

router.get("/:tableName", getLayer);

export default router;