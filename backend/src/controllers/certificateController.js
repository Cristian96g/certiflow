import fs from "fs";
import { getCertificateTypeConfig } from "../config/certificateTypeConfig.js";
import { Certificate } from "../models/Certificate.js";
import { CertificateType } from "../models/CertificateType.js";
import { Setting } from "../models/Setting.js";
import { Site } from "../models/Site.js";
import {
  buildCertificatePdfBuffer,
  buildExcelFileName,
  buildPdfFileName,
  ensureCertificateArtifacts,
  getStoredArtifactAbsolutePath,
  persistCertificateArtifacts,
} from "../services/exportService.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const calculateApi = (density) => Number((141.5 / density - 131.5).toFixed(2));
const nowMs = () => Date.now();
const logPdfTiming = (label, durationMs, extra = "") => {
  const suffix = extra ? ` ${extra}` : "";
  console.log(`[PDF] ${label}: ${durationMs}ms${suffix}`);
};

const getArgentinaNow = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(new Date());
  const getPart = (type) => parts.find((part) => part.type === type)?.value || "";

  return {
    date: `${getPart("year")}-${getPart("month")}-${getPart("day")}`,
    time: `${getPart("hour")}:${getPart("minute")}`,
  };
};

const streamFileResponse = (res, absolutePath, contentType, fileName) =>
  new Promise((resolve, reject) => {
    const stream = fs.createReadStream(absolutePath);

    stream.on("error", reject);
    stream.on("end", resolve);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    stream.pipe(res);
  });

const previewPresets = {
  CBR: {
    siteCode: "CBR",
    samplePoint: "EDL - TK 160m3",
    density: 0.741,
    temperatureC: 15,
    mercuryPpb: null,
    freeWaterPct: 0,
    totalImpurityPct: 0,
    emulsionPct: 0,
    sedimentPct: 0,
    tvrPsi: 4.5,
    observations: "",
  },
  CN: {
    siteCode: "CN",
    samplePoint: "TK 150",
    density: 0.673,
    temperatureC: 15,
    mercuryPpb: null,
    freeWaterPct: 0,
    totalImpurityPct: 0,
    emulsionPct: 0,
    sedimentPct: 0,
    tvrPsi: 15,
    observations: "",
  },
  CCV: {
    siteCode: "CCV",
    samplePoint: "despacho",
    density: 0.824,
    temperatureC: 15,
    mercuryPpb: null,
    freeWaterPct: 0,
    totalImpurityPct: 0,
    emulsionPct: 0,
    sedimentPct: 0.05,
    tvrPsi: null,
    observations: "",
  },
  EIO: {
    siteCode: "EIO",
    samplePoint: "TK-211",
    density: 0.821,
    temperatureC: 15,
    mercuryPpb: null,
    freeWaterPct: 0,
    totalImpurityPct: 0,
    emulsionPct: 0,
    sedimentPct: 0.02,
    tvrPsi: null,
    observations: "",
  },
  OCE: {
    siteCode: "OCE",
    samplePoint: "TK 9",
    density: 0.852,
    temperatureC: 15,
    mercuryPpb: null,
    freeWaterPct: 0,
    totalImpurityPct: 0.15,
    emulsionPct: 0.15,
    sedimentPct: 0.3,
    tvrPsi: null,
    observations: "",
  },
  CMO: {
    siteCode: "CMO",
    samplePoint: "tk-807 recirculado",
    density: 0.874,
    temperatureC: 15,
    mercuryPpb: null,
    freeWaterPct: 0,
    totalImpurityPct: 0.25,
    emulsionPct: 0.25,
    sedimentPct: 0.05,
    tvrPsi: null,
    observations: "tk-807 bruta: 272cm h2o: 15cm T: 45C. Recirculando por calderin con bba schmitt.",
  },
  GLI: {
    siteCode: "CBR",
    samplePoint: "Glicol H-200",
    density: 1.108,
    temperatureC: 15,
    mercuryPpb: null,
    freeWaterPct: null,
    totalImpurityPct: null,
    emulsionPct: null,
    sedimentPct: 0.05,
    tvrPsi: null,
    ph: 5,
    observations: "",
  },
};

const parseNullableNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const resolveSiteId = async (body) => {
  if (body.site) {
    return body.site;
  }

  const typeConfig = getCertificateTypeConfig(body.certificateTypeCode || body.certificateType);
  if (!typeConfig?.siteCode) {
    return "";
  }

  const site = await Site.findOne({ code: typeConfig.siteCode });
  return site?._id?.toString() || "";
};

const buildCertificatePayload = async (body, defaults) => {
  const argentinaNow = getArgentinaNow();
  const siteId = await resolveSiteId(body);
  const typeConfig = getCertificateTypeConfig(body.certificateTypeCode || body.certificateType);
  const density = Number(body.density);

  if (!density || density <= 0) {
    throw new AppError("La densidad debe ser mayor a 0.", 400);
  }

  const api = calculateApi(density);
  const manualEmulsion = parseNullableNumber(body.emulsionPct);
  const freeWaterPct = parseNullableNumber(body.freeWaterPct);
  const totalImpurityPct = parseNullableNumber(body.totalImpurityPct);
  const derivedEmulsion =
    freeWaterPct !== null && totalImpurityPct !== null
      ? Number((totalImpurityPct - freeWaterPct).toFixed(2))
      : null;

  return {
    certificateNumber: String(body.certificateNumber || "").trim(),
    certificateType: body.certificateType,
    site: siteId,
    date: String(body.date || argentinaNow.date).trim(),
    time: String(body.time || argentinaNow.time).trim(),
    samplePoint: String(body.samplePoint || "").trim(),
    destination: String(body.destination || "").trim(),
    mercuryPpb: parseNullableNumber(body.mercuryPpb),
    density,
    temperatureC: parseNullableNumber(body.temperatureC) ?? 15,
    api,
    freeWaterPct,
    totalImpurityPct,
    emulsionPct: manualEmulsion ?? derivedEmulsion,
    sedimentPct: parseNullableNumber(body.sedimentPct),
    tvrPsi: parseNullableNumber(body.tvrPsi),
    ph: parseNullableNumber(body.ph),
    observations: String(body.observations || "").trim(),
    signedBy: String(body.signedBy || defaults.defaultSignerName || "").trim(),
    signedRole: defaults.defaultSignerRole || "",
    templateSheet: String(body.templateSheet || typeConfig?.templateSheet || "").trim(),
  };
};

export const createCertificate = asyncHandler(async (req, res) => {
  const defaults = (await Setting.findOne()) || {};
  const payload = await buildCertificatePayload(req.body, defaults);

  const requiredFields = [
    "certificateNumber",
    "certificateType",
    "site",
    "date",
    "time",
    "samplePoint",
    "destination",
  ];

  for (const field of requiredFields) {
    if (!payload[field]) {
      throw new AppError("Faltan campos obligatorios del certificado.", 400);
    }
  }

  const certificate = await Certificate.create({
    ...payload,
    createdBy: req.user._id,
  });
  console.log(`[ARTIFACTS] Certificate created certificateId=${certificate._id}`);

  let artifactWarning = "";

  const artifactCertificate = await Certificate.findById(certificate._id)
    .populate("certificateType", "name code")
    .populate("site", "name code");

  try {
    console.log(`[ARTIFACTS] Calling persistCertificateArtifacts certificateId=${certificate._id}`);
    await persistCertificateArtifacts(artifactCertificate, defaults);
  } catch (error) {
    artifactWarning = error.message || "No se pudieron generar los archivos exportables automaticamente.";
    console.error(
      `[ARTIFACTS] Persist failed certificateId=${certificate._id} message=${artifactWarning}`,
      error,
    );
  }

  const populated = await Certificate.findById(certificate._id)
    .populate("certificateType", "name code")
    .populate("site", "name code")
    .populate("createdBy", "name email");
  console.log(
    `[ARTIFACTS] Post-create Mongo state certificateId=${certificate._id} excelPath=${populated?.excelPath || "-"} pdfPath=${populated?.pdfPath || "-"} generatedAt=${populated?.generatedAt || "-"}`,
  );

  res.status(201).json({
    certificate: populated,
    downloads: populated.exportStatus,
    warning: artifactWarning || undefined,
  });
});

export const updateCertificate = asyncHandler(async (req, res) => {
  const [defaults, certificate] = await Promise.all([
    Setting.findOne(),
    Certificate.findById(req.params.id)
      .populate("certificateType", "name code")
      .populate("site", "name code"),
  ]);

  if (!certificate) {
    throw new AppError("Certificado no encontrado.", 404);
  }

  const payload = await buildCertificatePayload(req.body, defaults || {});
  const requiredFields = [
    "certificateNumber",
    "certificateType",
    "site",
    "date",
    "time",
    "samplePoint",
    "destination",
  ];

  for (const field of requiredFields) {
    if (!payload[field]) {
      throw new AppError("Faltan campos obligatorios del certificado.", 400);
    }
  }

  Object.assign(certificate, payload);
  certificate.exportStatus = {
    excelReady: false,
    pdfReady: false,
  };
  certificate.generatedAt = null;
  certificate.excelPath = "";
  certificate.pdfPath = "";

  await certificate.save();

  const refreshedForArtifacts = await Certificate.findById(certificate._id)
    .populate("certificateType", "name code")
    .populate("site", "name code");

  await persistCertificateArtifacts(refreshedForArtifacts, defaults || {});

  const populated = await Certificate.findById(certificate._id)
    .populate("certificateType", "name code")
    .populate("site", "name code")
    .populate("createdBy", "name email");

  res.json({
    certificate: populated,
    downloads: populated.exportStatus,
  });
});

export const listCertificates = asyncHandler(async (req, res) => {
  const { certificateNumber, dateFrom, dateTo, site, certificateType } = req.query;
  const filters = {};

  if (certificateNumber) {
    filters.certificateNumber = { $regex: certificateNumber, $options: "i" };
  }

  if (site) {
    filters.site = site;
  }

  if (certificateType) {
    filters.certificateType = certificateType;
  }

  if (dateFrom || dateTo) {
    filters.date = {};
    if (dateFrom) filters.date.$gte = dateFrom;
    if (dateTo) filters.date.$lte = dateTo;
  }

  const certificates = await Certificate.find(filters)
    .sort({ date: -1, time: -1, createdAt: -1 })
    .populate("certificateType", "name code")
    .populate("site", "name code")
    .populate("createdBy", "name");

  res.json({ certificates });
});

export const getCertificateById = asyncHandler(async (req, res) => {
  const certificate = await Certificate.findById(req.params.id)
    .populate("certificateType", "name code")
    .populate("site", "name code")
    .populate("createdBy", "name email");

  if (!certificate) {
    throw new AppError("Certificado no encontrado.", 404);
  }

  res.json({ certificate });
});

const getCertificateDocument = async (id) => {
  const certificate = await Certificate.findById(id)
    .populate("certificateType", "name code")
    .populate("site", "name code")
    .populate("createdBy", "name email");

  if (!certificate) {
    throw new AppError("Certificado no encontrado.", 404);
  }

  return certificate;
};

const buildPreviewCertificate = async (typeCode, settings) => {
  const normalizedCode = String(typeCode || "").trim().toUpperCase();
  const preset = previewPresets[normalizedCode];

  if (!preset) {
    throw new AppError(`No hay preview configurado para el tipo ${normalizedCode}.`, 404);
  }

  const [certificateType, site] = await Promise.all([
    CertificateType.findOne({ code: normalizedCode }),
    Site.findOne({ code: preset.siteCode }),
  ]);

  if (!certificateType) {
    throw new AppError(`Tipo de certificado ${normalizedCode} no encontrado.`, 404);
  }

  if (!site) {
    throw new AppError(`Yacimiento ${preset.siteCode} no encontrado para el preview.`, 404);
  }

  const density = preset.density;

  return {
    _id: `preview-${normalizedCode}`,
    certificateNumber: `PREVIEW-${normalizedCode}`,
    certificateType: {
      _id: certificateType._id,
      name: certificateType.name,
      code: certificateType.code,
    },
    site: {
      _id: site._id,
      name: site.name,
      code: site.code,
    },
    date: "2026-05-31",
    time: "11:00",
    samplePoint: preset.samplePoint,
    destination: "Control",
    mercuryPpb: preset.mercuryPpb ?? null,
    density,
    temperatureC: preset.temperatureC ?? 15,
    api: density ? calculateApi(density) : null,
    freeWaterPct: preset.freeWaterPct ?? null,
    totalImpurityPct: preset.totalImpurityPct ?? null,
    emulsionPct: preset.emulsionPct ?? null,
    sedimentPct: preset.sedimentPct ?? null,
    tvrPsi: preset.tvrPsi ?? null,
    ph: preset.ph ?? null,
    observations: preset.observations || "",
    signedBy: settings?.defaultSignerName || "Verna Matias",
    signedRole: settings?.defaultSignerRole || "Laboratorio",
  };
};

export const exportCertificateExcel = asyncHandler(async (req, res) => {
  const [certificate, settings] = await Promise.all([
    getCertificateDocument(req.params.id),
    Setting.findOne(),
  ]);
  await ensureCertificateArtifacts(certificate, settings);
  const fileName = buildExcelFileName(certificate);
  const absolutePath = getStoredArtifactAbsolutePath(certificate.excelPath);
  await streamFileResponse(
    res,
    absolutePath,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileName,
  );
});

export const exportCertificatePdf = asyncHandler(async (req, res) => {
  const endpointStartedAt = nowMs();
  console.log(`[PDF] Endpoint start: ${new Date(endpointStartedAt).toISOString()} id=${req.params.id}`);

  const mongoStartedAt = nowMs();
  const [certificate, settings] = await Promise.all([
    getCertificateDocument(req.params.id),
    Setting.findOne(),
  ]);
  logPdfTiming("Mongo lookup", nowMs() - mongoStartedAt);

  const artifactCheckStartedAt = nowMs();
  await ensureCertificateArtifacts(certificate, settings, {
    onPdfPathChecked: ({ durationMs, pdfPath }) => {
      logPdfTiming("pdfPath check", durationMs, `path=${pdfPath || "-"}`);
    },
    onFileExistsChecked: ({ durationMs, excelExists, pdfExists }) => {
      logPdfTiming("File exists", durationMs, `excel=${excelExists} pdf=${pdfExists}`);
    },
    onRegenerationStart: () => {
      console.log("[PDF] Regeneration start");
    },
    onLibreOfficeStart: () => {
      console.log("[PDF] LibreOffice start");
    },
    onLibreOfficeEnd: (durationMs) => {
      logPdfTiming("LibreOffice conversion", durationMs);
    },
  });
  logPdfTiming("Artifact ensure total", nowMs() - artifactCheckStartedAt);

  const fileName = buildPdfFileName(certificate);
  const absolutePath = getStoredArtifactAbsolutePath(certificate.pdfPath);
  const streamStartedAt = nowMs();
  console.log("[PDF] Stream start");
  await streamFileResponse(res, absolutePath, "application/pdf", fileName);
  logPdfTiming("Stream response", nowMs() - streamStartedAt);
  logPdfTiming("Total endpoint", nowMs() - endpointStartedAt);
});

export const previewCertificatePdfByType = asyncHandler(async (req, res) => {
  const settings = await Setting.findOne();
  const certificate = await buildPreviewCertificate(req.params.typeCode, settings);
  const pdfBuffer = await buildCertificatePdfBuffer(certificate, settings);
  const fileName = buildPdfFileName(certificate);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.send(pdfBuffer);
});
