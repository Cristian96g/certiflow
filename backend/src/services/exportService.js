import fs from "fs";
import fsp from "fs/promises";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import ExcelJS from "exceljs";
import { getCertificateTypeConfig } from "../config/certificateTypeConfig.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const execFileAsync = promisify(execFile);
const CERT_NO = `Certificado N\u00B0`;
const nowMs = () => Date.now();

const sanitizeFileNamePart = (value, fallback = "sin-dato") => {
  const normalized = String(value || "")
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || fallback;
};

const buildDisplayBaseName = (certificate) => {
  const typeConfig = getCertificateTypeConfig(certificate.certificateType?.code);
  const typeLabel =
    sanitizeFileNamePart(typeConfig?.label, "") ||
    sanitizeFileNamePart(certificate.templateSheet, "") ||
    sanitizeFileNamePart(certificate.certificateType?.name, "") ||
    `Certi ${sanitizeFileNamePart(certificate.certificateType?.code, "CERT")}`;
  const certificateNumber = sanitizeFileNamePart(certificate.certificateNumber, "sin-numero");
  const siteName =
    sanitizeFileNamePart(certificate.site?.name, "") ||
    sanitizeFileNamePart(typeConfig?.siteName, "") ||
    "Sin yacimiento";

  return `${typeLabel} - ${certificateNumber} - ${siteName}`;
};

const buildStorageBaseName = (certificate) => buildDisplayBaseName(certificate);

const pad = (value) => String(value).padStart(2, "0");

const formatDatePart = (date, mode = "short-year") => {
  if (!date) return "";
  const [year, month, day] = String(date).split("-");
  if (!year || !month || !day) return String(date);
  if (mode === "long-year") return `${day}/${month}/${year}`;
  return `${day}/${month}/${year.slice(-2)}`;
};

const formatTimePart = (time) => {
  if (!time) return "";
  const [hours = "00", minutes = "00"] = String(time).split(":");
  return `${pad(hours)}:${pad(minutes)}`;
};

const formatDateTime = (date, time, mode) => {
  if (!date) return "";
  const formattedDate = formatDatePart(date, mode);
  const formattedTime = formatTimePart(time);
  return formattedTime ? `${formattedDate} - ${formattedTime} hs` : formattedDate;
};

const formatValue = (value, fallback = "-") => {
  if (value === null || value === undefined || value === "") return fallback;
  return value;
};

const normalizeRelativePath = (value) => String(value || "").split(path.sep).join("/");

const getRelativeStoragePath = (absolutePath) =>
  normalizeRelativePath(path.relative(env.generatedFilesRoot, absolutePath));

const resolveStoredFilePath = (relativePath) =>
  path.resolve(env.generatedFilesRoot, String(relativePath || ""));

const templateSheetMap = {
  CBR: "Certi CBR",
  CN: "Certi CN",
  CCV: "Certi CCV",
  EIO: "Certi EIO",
  OCE: "Certi OC",
  CMO: "Certi CMO",
  GLI: "Certi Glicol",
};

const templateMappings = {
  "Certi Glicol": {
    dateMode: "short-year",
    fallbacks: { density: "", ph: "", sedimentPct: "" },
    printArea: "A1:G36",
    printableLastRow: 36,
    printableLastColumn: 7,
    pdfColumnWidthOverrides: { 4: 10.5, 5: 10.25 },
    title: "A6",
    laboratoryName: "D8",
    dateTime: "B12",
    samplePoint: "B13",
    site: "B14",
    destination: "B15",
    resultLabel: "B20",
    density: "C20",
    ph: "D20",
    sedimentPct: "E20",
    signedBy: "E35",
    signedRole: "E36",
  },
  "Certi CBR": {
    dateMode: "short-year",
    fallbacks: { mercuryPpb: "-", tvrPsi: "-" },
    printArea: "A1:J35",
    printableLastRow: 35,
    printableLastColumn: 10,
    pdfColumnWidthOverrides: { 4: 6.4, 5: 6.4, 6: 6.4, 9: 6.4 },
    title: "A6",
    laboratoryName: "F8",
    dateTime: "B12",
    samplePoint: "B13",
    site: "B14",
    destination: "B15",
    resultLabel: "A20",
    mercuryPpb: "B20",
    density: "C20",
    temperatureC: "D20",
    api: "E20",
    freeWaterPct: "F20",
    totalImpurityPct: "G20",
    emulsionPct: "H20",
    sedimentPct: "I20",
    tvrPsi: "J20",
    signedBy: "G34",
    signedRole: "G35",
  },
  "Certi CN": {
    dateMode: "short-year",
    fallbacks: { mercuryPpb: "", tvrPsi: "", observations: "" },
    printArea: "A1:J36",
    printableLastRow: 36,
    printableLastColumn: 10,
    pdfColumnWidthOverrides: { 4: 6.6, 9: 6.6 },
    title: "A6",
    laboratoryName: "F8",
    dateTime: "B12",
    samplePoint: "B13",
    site: "B14",
    destination: "B15",
    resultLabel: "A20",
    mercuryPpb: "B20",
    density: "C20",
    temperatureC: "D20",
    api: "E20",
    freeWaterPct: "F20",
    totalImpurityPct: "G20",
    emulsionPct: "H20",
    sedimentPct: "I20",
    tvrPsi: "J20",
    observations: "A23",
    signedBy: "G35",
    signedRole: "G36",
  },
  "Certi CCV": {
    dateMode: "short-year",
    fallbacks: { mercuryPpb: "-", tvrPsi: "-" },
    printArea: "A1:J36",
    printableLastRow: 36,
    printableLastColumn: 10,
    pdfColumnWidthOverrides: { 4: 6.6, 9: 6.6 },
    title: "A6",
    laboratoryName: "F8",
    dateTime: "B12",
    samplePoint: "B13",
    site: "B14",
    destination: "B15",
    resultLabel: "A20",
    resultLabelValue: "Convento",
    mercuryPpb: "B20",
    density: "C20",
    temperatureC: "D20",
    api: "E20",
    freeWaterPct: "F20",
    totalImpurityPct: "G20",
    emulsionPct: "H20",
    sedimentPct: "I20",
    tvrPsi: "J20",
    signedBy: "G35",
    signedRole: "G36",
  },
  "Certi EIO": {
    dateMode: "long-year",
    fallbacks: { mercuryPpb: "-", tvrPsi: "", observations: "" },
    printArea: "A1:J36",
    printableLastRow: 36,
    printableLastColumn: 10,
    pdfColumnWidthOverrides: { 4: 6.6, 9: 6.6 },
    title: "A6",
    laboratoryName: "F8",
    dateTime: "B12",
    samplePoint: "B13",
    site: "B14",
    destination: "B15",
    resultLabel: "A20",
    mercuryPpb: "B20",
    density: "C20",
    temperatureC: "D20",
    api: "E20",
    freeWaterPct: "F20",
    totalImpurityPct: "G20",
    emulsionPct: "H20",
    sedimentPct: "I20",
    tvrPsi: "J20",
    observations: "A23",
    signedBy: "G35",
    signedRole: "G36",
  },
  "Certi OC": {
    dateMode: "long-year",
    fallbacks: { mercuryPpb: "-", tvrPsi: "-", observations: "" },
    printArea: "A1:J36",
    printableLastRow: 36,
    printableLastColumn: 10,
    pdfColumnWidthOverrides: { 5: 6.6, 10: 6.6 },
    title: "A6",
    laboratoryName: "G8",
    dateTime: "B12",
    samplePoint: "B13",
    site: "B14",
    destination: "B15",
    resultLabel: "A20",
    mercuryPpb: "B20",
    density: "C20",
    temperatureC: "D20",
    api: "E20",
    freeWaterPct: "F20",
    totalImpurityPct: "G20",
    emulsionPct: "H20",
    sedimentPct: "I20",
    tvrPsi: "J20",
    observations: "A23",
    signedBy: "H35",
    signedRole: "H36",
  },
  "Certi CMO": {
    dateMode: "short-year",
    fallbacks: { mercuryPpb: "", tvrPsi: "-", observations: "" },
    printArea: "A1:J36",
    printableLastRow: 36,
    printableLastColumn: 10,
    pdfColumnWidthOverrides: { 4: 6.6, 9: 6.6, 10: 6.9 },
    title: "A6",
    laboratoryName: "F8",
    dateTime: "B12",
    samplePoint: "B13",
    site: "B14",
    destination: "B15",
    resultLabel: "A20",
    mercuryPpb: "B20",
    density: "C20",
    temperatureC: "D20",
    api: "E20",
    freeWaterPct: "F20",
    totalImpurityPct: "G20",
    emulsionPct: "H20",
    sedimentPct: "I20",
    tvrPsi: "J20",
    observations: "A23",
    signedBy: "G35",
    signedRole: "G36",
  },
};

const commonLibreOfficeCandidates = [
  "soffice.com",
  "soffice",
  "libreoffice",
  "C:/Program Files/LibreOffice/program/soffice.com",
  "C:/Program Files/LibreOffice/program/soffice.exe",
  "C:/Program Files (x86)/LibreOffice/program/soffice.com",
  "C:/Program Files (x86)/LibreOffice/program/soffice.exe",
];

const setCellValue = (sheet, address, value) => {
  if (!address) return;
  sheet.getCell(address).value = value;
};

const getFieldValue = (mapping, fieldName, rawValue, defaultFallback = "-") =>
  formatValue(rawValue, mapping.fallbacks?.[fieldName] ?? defaultFallback);

const setApiCell = (sheet, address, densityAddress, apiValue) => {
  if (!address) return;
  sheet.getCell(address).value = {
    formula: `(141.5/${densityAddress})-131.5`,
    result: apiValue,
  };
};

const pruneWorkbookToTargetSheet = (workbook, targetSheetName) => {
  for (const sheet of [...workbook.worksheets]) {
    if (sheet.name !== targetSheetName) {
      workbook.removeWorksheet(sheet.id);
    }
  }
};

const getSheetNameForCertificate = (certificate) =>
  certificate.templateSheet ||
  getCertificateTypeConfig(certificate.certificateType?.code)?.templateSheet ||
  templateSheetMap[certificate.certificateType?.code];

const ensureTemplateAvailable = () => {
  if (!fs.existsSync(env.certificateTemplatePath)) {
    throw new AppError(
      `No se encontro la plantilla Excel en ${env.certificateTemplatePath}. Configura CERTIFICATE_TEMPLATE_PATH correctamente.`,
      500,
    );
  }
};

const ensureGeneratedFilesRoot = async () => {
  await fsp.mkdir(env.generatedFilesRoot, { recursive: true });
};

const applyCommonFields = (sheet, mapping, certificate, settings) => {
  setCellValue(sheet, mapping.title, `${CERT_NO} ${certificate.certificateNumber}`);
  setCellValue(sheet, mapping.laboratoryName, settings?.laboratoryName || "Laboratorio Campo Molino");
  setCellValue(sheet, mapping.dateTime, formatDateTime(certificate.date, certificate.time, mapping.dateMode));
  setCellValue(sheet, mapping.samplePoint, formatValue(certificate.samplePoint, ""));
  setCellValue(sheet, mapping.site, formatValue(certificate.site?.name, ""));
  setCellValue(sheet, mapping.destination, formatValue(certificate.destination, ""));
  setCellValue(sheet, mapping.resultLabel, formatValue(mapping.resultLabelValue || certificate.site?.name, ""));
  setCellValue(sheet, mapping.signedBy, formatValue(certificate.signedBy, settings?.defaultSignerName || ""));
  setCellValue(
    sheet,
    mapping.signedRole,
    formatValue(certificate.signedRole, settings?.defaultSignerRole || "Laboratorio"),
  );

  if (mapping.observations) {
    setCellValue(sheet, mapping.observations, getFieldValue(mapping, "observations", certificate.observations, ""));
  }
};

const applyHydrocarbonFields = (sheet, mapping, certificate) => {
  setCellValue(sheet, mapping.mercuryPpb, getFieldValue(mapping, "mercuryPpb", certificate.mercuryPpb));
  setCellValue(sheet, mapping.density, getFieldValue(mapping, "density", certificate.density, ""));
  setCellValue(sheet, mapping.temperatureC, getFieldValue(mapping, "temperatureC", certificate.temperatureC, ""));
  setApiCell(sheet, mapping.api, mapping.density, certificate.api);
  setCellValue(sheet, mapping.freeWaterPct, getFieldValue(mapping, "freeWaterPct", certificate.freeWaterPct));
  setCellValue(
    sheet,
    mapping.totalImpurityPct,
    getFieldValue(mapping, "totalImpurityPct", certificate.totalImpurityPct),
  );
  setCellValue(sheet, mapping.emulsionPct, getFieldValue(mapping, "emulsionPct", certificate.emulsionPct));
  setCellValue(sheet, mapping.sedimentPct, getFieldValue(mapping, "sedimentPct", certificate.sedimentPct));
  setCellValue(sheet, mapping.tvrPsi, getFieldValue(mapping, "tvrPsi", certificate.tvrPsi));
};

const applyGlycolFields = (sheet, mapping, certificate) => {
  setCellValue(sheet, mapping.density, getFieldValue(mapping, "density", certificate.density, ""));
  setCellValue(sheet, mapping.ph, getFieldValue(mapping, "ph", certificate.ph, ""));
  setCellValue(sheet, mapping.sedimentPct, getFieldValue(mapping, "sedimentPct", certificate.sedimentPct, ""));
};

const applyPdfPrintSetup = (sheet, mapping) => {
  sheet.pageSetup = {
    ...sheet.pageSetup,
    printArea: mapping.printArea,
    orientation: "landscape",
    paperSize: 1,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    scale: undefined,
    margins: {
      left: 0.2,
      right: 0.2,
      top: 0.25,
      bottom: 0.2,
      header: 0,
      footer: 0,
    },
    horizontalCentered: false,
    verticalCentered: false,
  };

  const lastRow = mapping.printableLastRow;
  const lastColumn = mapping.printableLastColumn;

  if (lastRow && sheet.rowCount > lastRow) {
    sheet.spliceRows(lastRow + 1, sheet.rowCount - lastRow);
  }

  if (lastColumn && sheet.columnCount > lastColumn) {
    for (let columnNumber = sheet.columnCount; columnNumber > lastColumn; columnNumber -= 1) {
      sheet.spliceColumns(columnNumber, 1);
    }
  }

  for (const [columnNumber, width] of Object.entries(mapping.pdfColumnWidthOverrides || {})) {
    sheet.getColumn(Number(columnNumber)).width = width;
  }
};

const resolveLibreOfficeBinary = async () => {
  const candidates = [env.libreOfficePath, ...commonLibreOfficeCandidates].filter(Boolean);

  for (const candidate of candidates) {
    const isNamedCommand = !candidate.includes("/") && !candidate.includes("\\");

    if (isNamedCommand) {
      try {
        await execFileAsync(candidate, ["--version"], { timeout: 10000 });
        return candidate;
      } catch {
        continue;
      }
    }

    const normalizedPath = path.normalize(candidate);
    if (fs.existsSync(normalizedPath)) {
      return normalizedPath;
    }
  }

  throw new AppError(
    "No se encontro LibreOffice para exportar PDF. Instala LibreOffice y configura LIBREOFFICE_PATH apuntando a soffice.exe.",
    500,
  );
};

const buildArtifactBundlePaths = (certificate) => {
  const safeType = String(certificate.certificateType?.code || "CERT").replace(/[^\w-]+/g, "_");
  const certificateId = String(certificate._id || "preview");
  const baseName = buildStorageBaseName(certificate);
  const directory = path.resolve(env.generatedFilesRoot, "certificates", safeType, certificateId);

  return {
    directory,
    excelAbsolutePath: path.join(directory, `${baseName}.xlsx`),
    pdfAbsolutePath: path.join(directory, `${baseName}.pdf`),
  };
};

const convertExcelFileToPdf = async ({ xlsxPath, pdfPath, workspaceRoot, hooks = {} }) => {
  const libreOfficeBinary = await resolveLibreOfficeBinary();
  const libreOfficeProfileDir = path.join(workspaceRoot, "lo-profile");
  const libreOfficeProfileUrl = `file:///${libreOfficeProfileDir.replace(/\\/g, "/")}`;

  await fsp.mkdir(libreOfficeProfileDir, { recursive: true });
  await fsp.rm(pdfPath, { force: true });
  let libreOfficeStartedAt = 0;

  try {
    libreOfficeStartedAt = nowMs();
    hooks.onLibreOfficeStart?.();
    await execFileAsync(
      libreOfficeBinary,
      [
        `-env:UserInstallation=${libreOfficeProfileUrl}`,
        "--headless",
        "--nologo",
        "--nodefault",
        "--nolockcheck",
        "--nofirststartwizard",
        "--convert-to",
        "pdf:calc_pdf_Export",
        "--outdir",
        path.dirname(pdfPath),
        xlsxPath,
      ],
      {
        timeout: 120000,
        windowsHide: true,
      },
    );
    hooks.onLibreOfficeEnd?.(nowMs() - libreOfficeStartedAt);
  } catch (error) {
    if (libreOfficeStartedAt) {
      hooks.onLibreOfficeEnd?.(nowMs() - libreOfficeStartedAt);
    }
    const stderr = error.stderr?.toString().trim();
    const stdout = error.stdout?.toString().trim();
    throw new AppError(
      `No se pudo convertir el Excel a PDF con LibreOffice.${stderr ? ` STDERR: ${stderr}` : ""}${stdout ? ` STDOUT: ${stdout}` : ""}`,
      500,
    );
  }

  if (!fs.existsSync(pdfPath)) {
    throw new AppError(
      "LibreOffice no genero el PDF esperado. Revisa la plantilla, el area de impresion y la instalacion de LibreOffice.",
      500,
    );
  }
};

const hasStoredFile = (relativePath) => {
  if (!relativePath) return false;
  return fs.existsSync(resolveStoredFilePath(relativePath));
};

export const buildExcelFileName = (certificate) => `${buildDisplayBaseName(certificate)}.xlsx`;
export const buildPdfFileName = (certificate) => `${buildDisplayBaseName(certificate)}.pdf`;

export const getStoredArtifactAbsolutePath = resolveStoredFilePath;

export const buildCertificateWorkbook = async (certificate, settings) => {
  ensureTemplateAvailable();
  const targetSheetName = getSheetNameForCertificate(certificate);

  if (!targetSheetName) {
    throw new AppError(
      `No hay una hoja de plantilla configurada para el tipo ${certificate.certificateType?.code || "-"}.`,
      400,
    );
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(env.certificateTemplatePath);
  workbook.calcProperties.fullCalcOnLoad = true;

  const sheet = workbook.getWorksheet(targetSheetName);
  const mapping = templateMappings[targetSheetName];

  if (!sheet || !mapping) {
    throw new AppError(`No se pudo cargar la hoja de plantilla ${targetSheetName}.`, 500);
  }

  applyCommonFields(sheet, mapping, certificate, settings);

  if (targetSheetName === "Certi Glicol") {
    applyGlycolFields(sheet, mapping, certificate);
  } else {
    applyHydrocarbonFields(sheet, mapping, certificate);
  }

  applyPdfPrintSetup(sheet, mapping);
  pruneWorkbookToTargetSheet(workbook, targetSheetName);

  return workbook;
};

export const buildCertificatePdfBuffer = async (certificate, settings) => {
  const workbook = await buildCertificateWorkbook(certificate, settings);
  const tempRoot = await fsp.mkdtemp(path.join(os.tmpdir(), "certiflow-preview-"));
  const xlsxPath = path.join(tempRoot, `${buildStorageBaseName(certificate)}.xlsx`);
  const pdfPath = path.join(tempRoot, `${buildStorageBaseName(certificate)}.pdf`);

  try {
    await workbook.xlsx.writeFile(xlsxPath);
    await convertExcelFileToPdf({ xlsxPath, pdfPath, workspaceRoot: tempRoot });
    return await fsp.readFile(pdfPath);
  } finally {
    await fsp.rm(tempRoot, { recursive: true, force: true });
  }
};

export const persistCertificateArtifacts = async (certificate, settings, options = {}) => {
  console.log(`[ARTIFACTS] Start persist certificateId=${certificate._id}`);
  await ensureGeneratedFilesRoot();

  const workbook = await buildCertificateWorkbook(certificate, settings);
  const { directory, excelAbsolutePath, pdfAbsolutePath } = buildArtifactBundlePaths(certificate);

  await fsp.rm(directory, { recursive: true, force: true });
  await fsp.mkdir(directory, { recursive: true });

  await workbook.xlsx.writeFile(excelAbsolutePath);
  console.log(`[ARTIFACTS] Generated Excel path=${excelAbsolutePath}`);
  options.onRegenerationStart?.();
  await convertExcelFileToPdf({
    xlsxPath: excelAbsolutePath,
    pdfPath: pdfAbsolutePath,
    workspaceRoot: directory,
    hooks: {
      onLibreOfficeStart: options.onLibreOfficeStart,
      onLibreOfficeEnd: options.onLibreOfficeEnd,
    },
  });
  console.log(`[ARTIFACTS] Generated PDF path=${pdfAbsolutePath}`);

  const generatedAt = new Date();

  certificate.excelPath = getRelativeStoragePath(excelAbsolutePath);
  certificate.pdfPath = getRelativeStoragePath(pdfAbsolutePath);
  certificate.generatedAt = generatedAt;
  certificate.exportStatus = {
    excelReady: true,
    pdfReady: true,
  };

  console.log(
    `[ARTIFACTS] Saving paths to Mongo certificateId=${certificate._id} excelPath=${certificate.excelPath} pdfPath=${certificate.pdfPath}`,
  );
  await certificate.save();
  console.log(`[ARTIFACTS] Saved pdfPath=${certificate.pdfPath}`);
  console.log(`[ARTIFACTS] Saved excelPath=${certificate.excelPath}`);

  return {
    excelPath: certificate.excelPath,
    pdfPath: certificate.pdfPath,
    generatedAt,
  };
};

export const ensureCertificateArtifacts = async (certificate, settings, options = {}) => {
  const pdfPathCheckStartedAt = nowMs();
  const currentPdfPath = certificate.pdfPath;
  options.onPdfPathChecked?.({
    durationMs: nowMs() - pdfPathCheckStartedAt,
    pdfPath: currentPdfPath,
  });

  const fileExistsStartedAt = nowMs();
  const excelExists = hasStoredFile(certificate.excelPath);
  const pdfExists = hasStoredFile(certificate.pdfPath);
  options.onFileExistsChecked?.({
    durationMs: nowMs() - fileExistsStartedAt,
    excelExists,
    pdfExists,
  });

  if (excelExists && pdfExists) {
    return {
      excelPath: certificate.excelPath,
      pdfPath: certificate.pdfPath,
      generatedAt: certificate.generatedAt,
      regenerated: false,
    };
  }

  const generated = await persistCertificateArtifacts(certificate, settings, options);

  return {
    ...generated,
    regenerated: true,
  };
};
