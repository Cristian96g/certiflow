import { Router } from "express";
import {
  createCertificateType,
  createSite,
  getConfigBundle,
  updateFieldLabel,
  updateSettings,
} from "../controllers/configController.js";

const router = Router();

router.get("/", getConfigBundle);
router.post("/certificate-types", createCertificateType);
router.post("/sites", createSite);
router.patch("/field-labels/:id", updateFieldLabel);
router.put("/settings", updateSettings);

export default router;
