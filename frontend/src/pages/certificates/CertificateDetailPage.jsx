import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  downloadCertificateExcel,
  downloadCertificatePdf,
  getCertificateRequest,
} from "../../api/certificates";
import Button from "../../components/ui/Button.jsx";
import { formatDateTime, formatNumber } from "../../lib/format";

const fieldGroups = [
  ["Mercurio (ppb)", "mercuryPpb"],
  ["Densidad", "density"],
  ["Temperatura C", "temperatureC"],
  ["API", "api"],
  ["Agua libre %", "freeWaterPct"],
  ["Impureza total %", "totalImpurityPct"],
  ["Emulsion %", "emulsionPct"],
  ["Sedimentos %", "sedimentPct"],
  ["TVR (Psi)", "tvrPsi"],
  ["pH", "ph"],
];

export default function CertificateDetailPage() {
  const { id } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadCertificate = () =>
    getCertificateRequest(id)
      .then((data) => setCertificate(data.certificate))
      .catch((err) => setError(err.message));

  useEffect(() => {
    loadCertificate().finally(() => setLoading(false));
  }, [id]);

  const handleExcelDownload = async () => {
    try {
      setError("");
      setMessage("");
      await downloadCertificateExcel(certificate._id, certificate.certificateNumber);
      await loadCertificate();
      setMessage(`Excel descargado para el certificado ${certificate.certificateNumber}.`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePdfDownload = async () => {
    try {
      setError("");
      setMessage("");
      await downloadCertificatePdf(certificate._id, certificate.certificateNumber);
      await loadCertificate();
      setMessage(`PDF descargado para el certificado ${certificate.certificateNumber}.`);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="py-10 text-sm text-slate-500">Cargando certificado...</div>;
  }

  if (error && !certificate) {
    return (
      <div className="space-y-4">
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        <Link to="/history" className="text-sm font-medium text-accent">
          Volver al historial
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-accent">Revision</p>
          <h2 className="mt-2 text-2xl font-semibold">Certificado {certificate.certificateNumber}</h2>
          <p className="mt-2 text-sm text-slate-600">
            Usa esta vista para validar datos antes de exportar el archivo final.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handlePdfDownload}>
            PDF
          </Button>
          <Button onClick={handleExcelDownload}>Excel</Button>
        </div>
      </div>

      {message ? <p className="rounded-2xl bg-teal-50 px-4 py-3 text-sm text-teal-800">{message}</p> : null}
      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 p-5">
            <h3 className="text-lg font-semibold">Estado operativo</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <StatusItem
                label="Excel"
                value={certificate.exportStatus?.excelReady ? "Listo" : "Pendiente"}
                tone={certificate.exportStatus?.excelReady ? "success" : "pending"}
              />
              <StatusItem
                label="PDF"
                value={certificate.exportStatus?.pdfReady ? "Listo" : "Pendiente"}
                tone={certificate.exportStatus?.pdfReady ? "success" : "pending"}
              />
              <InfoItem label="Fecha de creacion" value={formatCreatedAt(certificate.createdAt)} />
              <InfoItem label="Cargado por" value={certificate.createdBy?.name || certificate.createdBy?.email} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 p-5">
            <h3 className="text-lg font-semibold">Cabecera</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <InfoItem label="Tipo" value={certificate.certificateType?.name} />
              <InfoItem label="Yacimiento" value={certificate.site?.name} />
              <InfoItem label="Fecha y hora" value={formatDateTime(certificate.date, certificate.time)} />
              <InfoItem label="Punto de muestreo" value={certificate.samplePoint} />
              <InfoItem label="Destino" value={certificate.destination} />
              <InfoItem label="Firmado por" value={certificate.signedBy} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 p-5">
            <h3 className="text-lg font-semibold">Resultados</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {fieldGroups.map(([label, key]) => (
                <InfoItem key={key} label={label} value={formatNumber(certificate[key])} />
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 p-5">
            <h3 className="text-lg font-semibold">Observaciones</h3>
            <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
              {certificate.observations || "Sin observaciones."}
            </p>
          </div>
        </div>

        <aside className="space-y-4 rounded-3xl bg-slate-50 p-5">
          <div>
            <h3 className="text-lg font-semibold">Checklist rapido</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Numero de certificado correcto</li>
              <li>Tipo y yacimiento alineados</li>
              <li>Punto de muestreo visible</li>
              <li>API consistente con densidad</li>
              <li>Observaciones completas si aplica</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
            El Excel exportado usa la plantilla real segun el tipo del certificado.
          </div>

          <Link to="/history" className="block text-sm font-medium text-accent">
            Volver al historial
          </Link>
        </aside>
      </section>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm text-slate-800">{value || "-"}</p>
    </div>
  );
}

function StatusItem({ label, value, tone }) {
  const toneClass =
    tone === "success"
      ? "bg-teal-50 text-teal-800 border-teal-200"
      : "bg-amber-50 text-amber-800 border-amber-200";

  return (
    <div className={`rounded-2xl border px-4 py-4 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.15em]">{label}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function formatCreatedAt(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("es-AR");
}
