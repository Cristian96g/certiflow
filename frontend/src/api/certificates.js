import { apiFetch } from "./http";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4001/api";

export const createCertificateRequest = (payload) =>
  apiFetch("/certificates", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const listCertificatesRequest = (filters) => {
  const params = new URLSearchParams();

  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return apiFetch(`/certificates${query ? `?${query}` : ""}`);
};

export const getCertificateRequest = (id) => apiFetch(`/certificates/${id}`);

const buildAuthHeaders = () => {
  const token = localStorage.getItem("certiflow_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const downloadFromApi = async (path, fallbackFileName) => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: buildAuthHeaders(),
  });

  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    if (contentType.includes("application/json")) {
      const data = await response.json();
      throw new Error(data.message || data.error || "Download failed");
    }
    throw new Error("Download failed");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;

  const disposition = response.headers.get("content-disposition") || "";
  const match = disposition.match(/filename="(.+)"/);
  anchor.download = match?.[1] || fallbackFileName;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

export const downloadCertificateExcel = (id, certificateNumber = "certificado") =>
  downloadFromApi(`/certificates/${id}/export/excel`, `${certificateNumber}.xlsx`);

export const downloadCertificatePdf = (id, certificateNumber = "certificado") =>
  downloadFromApi(`/certificates/${id}/export/pdf`, `${certificateNumber}.pdf`);

export const downloadPreviewPdfByType = (typeCode) =>
  downloadFromApi(`/certificates/preview/pdf/${typeCode}`, `preview-${typeCode}.pdf`);
