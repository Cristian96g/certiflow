import { Router } from "express";
import {
  createCertificate,
  exportCertificateExcel,
  exportCertificatePdf,
  getCertificateById,
  listCertificates,
  previewCertificatePdfByType,
  updateCertificate,
} from "../controllers/certificateController.js";

const router = Router();

router.route("/").get(listCertificates).post(createCertificate);
router.get("/preview/pdf/:typeCode", previewCertificatePdfByType);
router.put("/:id", updateCertificate);
router.get("/:id/export/excel", exportCertificateExcel);
router.get("/:id/export/pdf", exportCertificatePdf);
router.get("/:id", getCertificateById);

export default router;
