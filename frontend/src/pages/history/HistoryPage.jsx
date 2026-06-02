import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getConfigBundleRequest } from "../../api/config";
import {
  downloadCertificateExcel,
  downloadCertificatePdf,
  listCertificatesRequest,
} from "../../api/certificates";
import Button from "../../components/ui/Button.jsx";
import InputField from "../../components/ui/InputField.jsx";
import SelectField from "../../components/ui/SelectField.jsx";
import { formatNumber } from "../../lib/format";

export default function HistoryPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState({ certificateTypes: [], sites: [] });
  const [filters, setFilters] = useState({
    certificateNumber: "",
    dateFrom: "",
    dateTo: "",
    site: "",
    certificateType: "",
  });
  const [certificates, setCertificates] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [downloadingKey, setDownloadingKey] = useState("");

  const loadCertificates = async (currentFilters = filters) => {
    try {
      setError("");
      setMessage("");
      const data = await listCertificatesRequest(currentFilters);
      setCertificates(data.certificates);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    Promise.all([getConfigBundleRequest(), listCertificatesRequest({})])
      .then(([configData, certificatesData]) => {
        setConfig(configData);
        setCertificates(certificatesData.certificates);
      })
      .catch((err) => setError(err.message));
  }, []);

  const handleChange = (event) => {
    setFilters((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleExcelDownload = async (certificate) => {
    try {
      setDownloadingKey(`${certificate._id}-excel`);
      setError("");
      setMessage("");
      await downloadCertificateExcel(certificate._id, certificate.certificateNumber);
      setMessage(`Excel descargado para el certificado ${certificate.certificateNumber}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloadingKey("");
    }
  };

  const handlePdfDownload = async (certificate) => {
    try {
      setDownloadingKey(`${certificate._id}-pdf`);
      setError("");
      setMessage("");
      await downloadCertificatePdf(certificate._id, certificate.certificateNumber);
      setMessage(`PDF descargado para el certificado ${certificate.certificateNumber}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloadingKey("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-accent">Historial</p>
        <h2 className="mt-2 text-2xl font-semibold">Certificados guardados</h2>
      </div>

      {message ? <p className="rounded-2xl bg-teal-50 px-4 py-3 text-sm text-teal-800">{message}</p> : null}

      <div className="grid gap-4 rounded-3xl border border-slate-200 p-5 md:grid-cols-5">
        <InputField
          label="Numero"
          name="certificateNumber"
          value={filters.certificateNumber}
          onChange={handleChange}
        />
        <InputField label="Desde" name="dateFrom" type="date" value={filters.dateFrom} onChange={handleChange} />
        <InputField label="Hasta" name="dateTo" type="date" value={filters.dateTo} onChange={handleChange} />
        <SelectField label="Yacimiento" name="site" value={filters.site} onChange={handleChange} options={config.sites} />
        <SelectField
          label="Tipo"
          name="certificateType"
          value={filters.certificateType}
          onChange={handleChange}
          options={config.certificateTypes}
        />
        <div className="md:col-span-5 flex gap-3">
          <Button onClick={() => loadCertificates()}>Aplicar filtros</Button>
          <Button
            variant="secondary"
            onClick={() => {
              const reset = {
                certificateNumber: "",
                dateFrom: "",
                dateTo: "",
                site: "",
                certificateType: "",
              };
              setFilters(reset);
              loadCertificates(reset);
            }}
          >
            Limpiar
          </Button>
        </div>
      </div>

      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="overflow-hidden rounded-3xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["Numero", "Fecha", "Yacimiento", "Tipo", "Muestreo", "API", "Acciones"].map((label) => (
                <th key={label} className="px-4 py-3 text-left font-semibold text-slate-600">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {certificates.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                  No hay certificados cargados todavia.
                </td>
              </tr>
            ) : (
              certificates.map((certificate) => (
                <tr key={certificate._id}>
                  <td className="px-4 py-3 font-medium">{certificate.certificateNumber}</td>
                  <td className="px-4 py-3">
                    {certificate.date} {certificate.time}
                  </td>
                  <td className="px-4 py-3">{certificate.site?.name}</td>
                  <td className="px-4 py-3">{certificate.certificateType?.name}</td>
                  <td className="px-4 py-3">{certificate.samplePoint}</td>
                  <td className="px-4 py-3">{formatNumber(certificate.api)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        className="px-3 py-2 text-xs"
                        onClick={() => navigate(`/certificates/${certificate._id}`)}
                      >
                        Ver
                      </Button>
                      <Button
                        variant="secondary"
                        className="px-3 py-2 text-xs"
                        onClick={() => handlePdfDownload(certificate)}
                        loading={downloadingKey === `${certificate._id}-pdf`}
                        disabled={Boolean(downloadingKey)}
                      >
                        {downloadingKey === `${certificate._id}-pdf` ? "Generando..." : "PDF"}
                      </Button>
                      <Button
                        variant="secondary"
                        className="px-3 py-2 text-xs"
                        onClick={() => handleExcelDownload(certificate)}
                        loading={downloadingKey === `${certificate._id}-excel`}
                        disabled={Boolean(downloadingKey)}
                      >
                        {downloadingKey === `${certificate._id}-excel` ? "Generando..." : "Excel"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
