import { env } from "../config/env.js";
import { CertificateType } from "../models/CertificateType.js";
import { FieldLabel } from "../models/FieldLabel.js";
import { Setting } from "../models/Setting.js";
import { Site } from "../models/Site.js";
import { User } from "../models/User.js";

const certificateTypes = [
  { name: "Campo Bremen", code: "CBR" },
  { name: "Cerro Norte", code: "CN" },
  { name: "Cerro Convento", code: "CCV" },
  { name: "El Indio", code: "EIO" },
  { name: "Oceano", code: "OCE" },
  { name: "Campo Molino", code: "CMO" },
  { name: "Glicol", code: "GLI", supportsMercury: false, supportsPh: true },
];

const sites = [
  { name: "Campo Bremen", code: "CBR" },
  { name: "Cerro Norte", code: "CN" },
  { name: "Cerro Convento", code: "CCV" },
  { name: "El Indio", code: "EIO" },
  { name: "Oceano", code: "OCE" },
  { name: "Campo Molino", code: "CMO" },
];

const fieldLabels = [
  ["certificateNumber", "Nro. certificado"],
  ["certificateType", "Tipo de certificado"],
  ["date", "Fecha"],
  ["time", "Hora"],
  ["site", "Yacimiento"],
  ["samplePoint", "Tanque / Punto de muestreo"],
  ["destination", "Destino"],
  ["mercuryPpb", "Mercurio (ppb)"],
  ["density", "Densidad"],
  ["temperatureC", "Temperatura °C"],
  ["api", "° API"],
  ["freeWaterPct", "% Agua libre"],
  ["totalImpurityPct", "% Impureza total"],
  ["emulsionPct", "% Emulsión"],
  ["sedimentPct", "% Sedimentos"],
  ["tvrPsi", "TVR (Psi)"],
  ["ph", "pH"],
  ["observations", "Observaciones"],
];

export const seedDefaultData = async () => {
  await Promise.all(
    certificateTypes.map((item) =>
      CertificateType.updateOne({ code: item.code }, { $setOnInsert: item }, { upsert: true }),
    ),
  );

  await Promise.all(
    sites.map((item) => Site.updateOne({ code: item.code }, { $setOnInsert: item }, { upsert: true })),
  );

  await Promise.all(
    fieldLabels.map(([key, label]) =>
      FieldLabel.updateOne({ key }, { $setOnInsert: { key, label } }, { upsert: true }),
    ),
  );

  const setting = await Setting.findOne();
  if (!setting) {
    await Setting.create({});
  }

  if (!env.seedDefaultUser) {
    return;
  }

  const existingUser = await User.findOne({ email: env.defaultUserEmail.toLowerCase() });
  if (!existingUser) {
    const passwordHash = await User.hashPassword(env.defaultUserPassword);
    await User.create({
      name: env.defaultUserName,
      email: env.defaultUserEmail,
      passwordHash,
      role: "admin",
    });
  }
};
