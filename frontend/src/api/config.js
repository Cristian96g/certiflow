import { apiFetch } from "./http";

export const getConfigBundleRequest = () => apiFetch("/config");

export const createCertificateTypeRequest = (payload) =>
  apiFetch("/config/certificate-types", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const createSiteRequest = (payload) =>
  apiFetch("/config/sites", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateFieldLabelRequest = (id, payload) =>
  apiFetch(`/config/field-labels/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const updateSettingsRequest = (payload) =>
  apiFetch("/config/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
