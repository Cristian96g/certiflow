import { apiFetch } from "./http";

export const loginRequest = (payload) =>
  apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const meRequest = () => apiFetch("/auth/me");
