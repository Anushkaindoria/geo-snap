import { Router } from "express";
import {
  testVision,
  askImageQuestion,
} from "../controllers/visionController.js";

const router = Router();

router.get("/test", testVision);

router.post("/ask", askImageQuestion);

export default router;