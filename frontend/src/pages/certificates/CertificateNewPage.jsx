import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createCertificateRequest,
  downloadCertificateExcel,
  downloadCertificatePdf,
} from "../../api/certificates";
import { getConfigBundleRequest } from "../../api/config";
import Button from "../../components/ui/Button.jsx";
import InputField from "../../components/ui/InputField.jsx";
import SelectField from "../../components/ui/SelectField.jsx";
import TextareaField from "../../components/ui/TextareaField.jsx";

const glycolTypeCodes = new Set(["GLI"]);
const noMercuryTypeCodes = new Set(["CN", "CMO", "GLI"]);
const noTvrTypeCodes = new Set(["CCV", "EIO", "OCE", "CMO", "GLI"]);
const noObservationsTypeCodes = new Set(["CBR", "CCV", "GLI"]);

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

const initialForm = {
  certificateNumber: "",
  certificateType: "",
  date: getArgentinaNow().date,
  time: getArgentinaNow().time,
  site: "",
  samplePoint: "",
  destination: "Control",
  mercuryPpb: "",
  density: "",
  temperatureC: "15",
  api: "",
  freeWaterPct: "",
  totalImpurityPct: "",
  emulsionPct: "",
  sedimentPct: "",
  tvrPsi: "",
  ph: "",
  observations: "",
  signedBy: "",
};

const calculateApi = (density) => {
  const parsed = Number(density);
  if (!parsed || parsed <= 0) {
    return "";
  }
  return (141.5 / parsed - 131.5).toFixed(2);
};

export default function CertificateNewPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState({
    certificateTypes: [],
    sites: [],
    settings: null,
  });
  const [form, setForm] = useState(initialForm);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [downloadMode, setDownloadMode] = useState("");

  useEffect(() => {
    getConfigBundleRequest()
      .then((data) => {
        setConfig(data);
        const argentinaNow = getArgentinaNow();
        setForm((current) => ({
          ...current,
          date: current.date || argentinaNow.date,
          time: current.time || argentinaNow.time,
          signedBy: data.settings?.defaultSignerName || "",
        }));
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      api: calculateApi(current.density),
    }));
  }, [form.density]);

  const suggestedEmulsion = useMemo(() => {
    const freeWater = Number(form.freeWaterPct);
    const totalImpurity = Number(form.totalImpurityPct);

    if (Number.isNaN(freeWater) || Number.isNaN(totalImpurity)) {
      return "";
    }

    return (totalImpurity - freeWater).toFixed(2);
  }, [form.freeWaterPct, form.totalImpurityPct]);

  const selectedTypeCode = useMemo(() => {
    return (
      config.certificateTypes.find((type) => type._id === form.certificateType)?.code || ""
    );
  }, [config.certificateTypes, form.certificateType]);

  const isGlycol = glycolTypeCodes.has(selectedTypeCode);
  const showMercury = selectedTypeCode && !noMercuryTypeCodes.has(selectedTypeCode);
  const showTvr = selectedTypeCode && !noTvrTypeCodes.has(selectedTypeCode);
  const showObservations = !selectedTypeCode || !noObservationsTypeCodes.has(selectedTypeCode);
  const showHydrocarbonFields = !isGlycol;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (mode) => {
    setSaving(true);
    setDownloadMode(mode);
    setError("");
    setFeedback("");

    try {
      const payload = {
        ...form,
        emulsionPct: form.emulsionPct || suggestedEmulsion,
      };
      const data = await createCertificateRequest(payload);
      if (mode === "excel") {
        await downloadCertificateExcel(data.certificate._id, data.certificate.certificateNumber);
        navigate(`/certificates/${data.certificate._id}`);
        return;
      }
      if (mode === "pdf") {
        await downloadCertificatePdf(data.certificate._id);
        navigate(`/certificates/${data.certificate._id}`);
        return;
      }
      navigate(`/certificates/${data.certificate._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
      setDownloadMode("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-accent">Carga inicial</p>
        <h2 className="mt-2 text-2xl font-semibold">Nuevo certificado</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Este formulario guarda el certificado en base de datos, calcula el API automaticamente y deja ocultos los
          campos que salen de configuracion para hacerlo mas corto. Fecha y hora se completan automaticamente en
          horario de Argentina.
        </p>
      </div>

      {feedback ? <p className="rounded-2xl bg-teal-50 px-4 py-3 text-sm text-teal-800">{feedback}</p> : null}
      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <form
          className="grid gap-4 rounded-3xl border border-slate-200 p-5 md:grid-cols-2"
          onSubmit={(event) => event.preventDefault()}
        >
          <InputField
            label="Numero de certificado"
            name="certificateNumber"
            value={form.certificateNumber}
            onChange={handleChange}
            required
          />
          <SelectField
            label="Tipo de certificado"
            name="certificateType"
            value={form.certificateType}
            onChange={handleChange}
            options={config.certificateTypes}
            required
          />
          <InputField label="Fecha" name="date" type="date" value={form.date} onChange={handleChange} required />
          <InputField label="Hora" name="time" type="time" value={form.time} onChange={handleChange} required />
          <SelectField
            label="Yacimiento"
            name="site"
            value={form.site}
            onChange={handleChange}
            options={config.sites}
            required
          />
          <InputField
            label="Tanque / Punto de muestreo"
            name="samplePoint"
            value={form.samplePoint}
            onChange={handleChange}
            required
          />
          <InputField label="Destino" name="destination" value={form.destination} onChange={handleChange} required />

          {showMercury ? (
            <InputField
              label="Mercurio (ppb)"
              name="mercuryPpb"
              type="number"
              step="0.01"
              value={form.mercuryPpb}
              onChange={handleChange}
            />
          ) : null}

          <InputField
            label="Densidad"
            name="density"
            type="number"
            step="0.001"
            value={form.density}
            onChange={handleChange}
            required
          />
          <InputField
            label="Temperatura C"
            name="temperatureC"
            type="number"
            step="0.01"
            value={form.temperatureC}
            onChange={handleChange}
          />

          {showHydrocarbonFields ? (
            <>
              <InputField
                label="% Agua libre"
                name="freeWaterPct"
                type="number"
                step="0.01"
                value={form.freeWaterPct}
                onChange={handleChange}
              />
              <InputField
                label="% Impureza total"
                name="totalImpurityPct"
                type="number"
                step="0.01"
                value={form.totalImpurityPct}
                onChange={handleChange}
              />
              <InputField
                label="% Emulsion"
                name="emulsionPct"
                type="number"
                step="0.01"
                value={form.emulsionPct}
                onChange={handleChange}
                placeholder={suggestedEmulsion ? `Sugerido: ${suggestedEmulsion}` : ""}
              />
              <InputField
                label="% Sedimentos"
                name="sedimentPct"
                type="number"
                step="0.01"
                value={form.sedimentPct}
                onChange={handleChange}
              />
              {showTvr ? (
                <InputField
                  label="TVR (Psi)"
                  name="tvrPsi"
                  type="number"
                  step="0.01"
                  value={form.tvrPsi}
                  onChange={handleChange}
                />
              ) : null}
            </>
          ) : (
            <>
              <InputField
                label="pH"
                name="ph"
                type="number"
                step="0.01"
                value={form.ph}
                onChange={handleChange}
              />
              <InputField
                label="% Sedimentos"
                name="sedimentPct"
                type="number"
                step="0.01"
                value={form.sedimentPct}
                onChange={handleChange}
              />
            </>
          )}

          {showObservations ? (
            <div className="md:col-span-2">
              <TextareaField
                label="Observaciones"
                name="observations"
                value={form.observations}
                onChange={handleChange}
              />
            </div>
          ) : null}
        </form>

        <aside className="space-y-4 rounded-3xl bg-slate-50 p-5">
          <div>
            <h3 className="text-lg font-semibold">Resumen de calculo</h3>
            <p className="mt-2 text-sm text-slate-600">
              API automatico: <span className="font-semibold text-ink">{form.api || "-"}</span>
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Emulsion sugerida: <span className="font-semibold text-ink">{suggestedEmulsion || "-"}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
            La firma sale desde Configuracion y el backend recalcula el API antes de guardar.
          </div>

          <div className="space-y-3">
            <Button className="w-full" onClick={() => handleSubmit("save")} disabled={saving} loading={saving && downloadMode === "save"}>
              {saving && downloadMode === "save" ? "Guardando..." : "Guardar"}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => handleSubmit("pdf")}
              disabled={saving}
              loading={saving && downloadMode === "pdf"}
            >
              {saving && downloadMode === "pdf" ? "Generando PDF..." : "Guardar y descargar PDF"}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => handleSubmit("excel")}
              disabled={saving}
              loading={saving && downloadMode === "excel"}
            >
              {saving && downloadMode === "excel" ? "Generando Excel..." : "Guardar y descargar Excel"}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
