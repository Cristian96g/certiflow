export const CERTIFICATE_TYPE_CONFIG = {
  CBR: {
    label: "Certi CBR",
    siteCode: "CBR",
    siteName: "Campo Bremen",
    templateSheet: "Certi CBR",
  },
  CN: {
    label: "Certi CN",
    siteCode: "CN",
    siteName: "Cerro Norte",
    templateSheet: "Certi CN",
  },
  CCV: {
    label: "Certi CCV",
    siteCode: "CCV",
    siteName: "Cerro Convento",
    templateSheet: "Certi CCV",
  },
  EIO: {
    label: "Certi EIO",
    siteCode: "EIO",
    siteName: "El Indio",
    templateSheet: "Certi EIO",
  },
  OCE: {
    label: "Certi OC",
    siteCode: "OCE",
    siteName: "Oceano",
    templateSheet: "Certi OC",
  },
  CMO: {
    label: "Certi CMO",
    siteCode: "CMO",
    siteName: "Campo Molino",
    templateSheet: "Certi CMO",
  },
  GLI: {
    label: "Certi Glicol",
    siteCode: "CBR",
    siteName: "Campo Bremen",
    templateSheet: "Certi Glicol",
  },
};

export const getCertificateTypeConfig = (typeCode) =>
  CERTIFICATE_TYPE_CONFIG[String(typeCode || "").trim().toUpperCase()] || null;
