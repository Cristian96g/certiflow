import { Router } from "express";
import authRoutes from "./authRoutes.js";
import certificateRoutes from "./certificateRoutes.js";
import configRoutes from "./configRoutes.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/config", requireAuth, configRoutes);
router.use("/certificates", requireAuth, certificateRoutes);

export default router;
