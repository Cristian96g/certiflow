import { CERTIFICATE_TYPE_CONFIG } from "../config/certificateTypeConfig.js";
import { CertificateType } from "../models/CertificateType.js";
import { FieldLabel } from "../models/FieldLabel.js";
import { Setting } from "../models/Setting.js";
import { Site } from "../models/Site.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getConfigBundle = asyncHandler(async (_req, res) => {
  const [certificateTypes, sites, fieldLabels, settings] = await Promise.all([
    CertificateType.find().sort({ name: 1 }),
    Site.find().sort({ name: 1 }),
    FieldLabel.find().sort({ key: 1 }),
    Setting.findOne(),
  ]);

  res.json({
    certificateTypes,
    sites,
    fieldLabels,
    settings,
    certificateTypeConfig: CERTIFICATE_TYPE_CONFIG,
  });
});

export const createCertificateType = asyncHandler(async (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) {
    throw new AppError("Nombre y código son obligatorios.", 400);
  }

  const certificateType = await CertificateType.create({
    name: String(name).trim(),
    code: String(code).trim().toUpperCase(),
    description: String(req.body.description || "").trim(),
    supportsMercury: req.body.supportsMercury !== false,
    supportsPh: req.body.supportsPh === true,
  });

  res.status(201).json({ certificateType });
});

export const createSite = asyncHandler(async (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) {
    throw new AppError("Nombre y código son obligatorios.", 400);
  }

  const site = await Site.create({
    name: String(name).trim(),
    code: String(code).trim().toUpperCase(),
  });

  res.status(201).json({ site });
});

export const updateFieldLabel = asyncHandler(async (req, res) => {
  const label = await FieldLabel.findByIdAndUpdate(
    req.params.id,
    {
      label: String(req.body.label || "").trim(),
    },
    { new: true, runValidators: true },
  );

  if (!label) {
    throw new AppError("Etiqueta no encontrada.", 404);
  }

  res.json({ fieldLabel: label });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const current = await Setting.findOne();
  const payload = {
    laboratoryName: String(req.body.laboratoryName || current?.laboratoryName || "").trim(),
    defaultSignerName: String(req.body.defaultSignerName || "").trim(),
    defaultSignerRole: String(req.body.defaultSignerRole || "").trim(),
    signatureImageUrl: String(req.body.signatureImageUrl || "").trim(),
  };

  const settings = current
    ? await Setting.findByIdAndUpdate(current._id, payload, { new: true, runValidators: true })
    : await Setting.create(payload);

  res.json({ settings });
});
