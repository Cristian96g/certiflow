import { useEffect, useMemo, useState } from "react";
import { downloadPreviewPdfByType } from "../../api/certificates";
import {
  createCertificateTypeRequest,
  createSiteRequest,
  getConfigBundleRequest,
  updateFieldLabelRequest,
  updateSettingsRequest,
} from "../../api/config";
import Button from "../../components/ui/Button.jsx";
import InputField from "../../components/ui/InputField.jsx";

const previewOrder = ["CBR", "CN", "CCV", "EIO", "OCE", "CMO", "GLI"];

export default function SettingsPage() {
  const [bundle, setBundle] = useState({
    certificateTypes: [],
    sites: [],
    fieldLabels: [],
    settings: {},
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [newType, setNewType] = useState({ name: "", code: "" });
  const [newSite, setNewSite] = useState({ name: "", code: "" });
  const [previewLoading, setPreviewLoading] = useState("");

  const loadBundle = async () => {
    try {
      const data = await getConfigBundleRequest();
      setBundle(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadBundle();
  }, []);

  const previewTypes = useMemo(() => {
    const byCode = new Map(bundle.certificateTypes.map((item) => [item.code, item]));
    return previewOrder
      .map((code) => byCode.get(code) || { _id: code, code, name: code })
      .filter(Boolean);
  }, [bundle.certificateTypes]);

  const handleSettingsChange = (event) => {
    setBundle((current) => ({
      ...current,
      settings: {
        ...current.settings,
        [event.target.name]: event.target.value,
      },
    }));
  };

  const saveSettings = async () => {
    try {
      setError("");
      setMessage("");
      await updateSettingsRequest(bundle.settings);
      setMessage("Configuracion general actualizada.");
      await loadBundle();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateLabel = async (labelId, label) => {
    try {
      setError("");
      setMessage("");
      await updateFieldLabelRequest(labelId, { label });
      setMessage("Etiqueta actualizada.");
      await loadBundle();
    } catch (err) {
      setError(err.message);
    }
  };

  const createType = async () => {
    try {
      setError("");
      setMessage("");
      await createCertificateTypeRequest(newType);
      setNewType({ name: "", code: "" });
      setMessage("Tipo creado.");
      await loadBundle();
    } catch (err) {
      setError(err.message);
    }
  };

  const createSite = async () => {
    try {
      setError("");
      setMessage("");
      await createSiteRequest(newSite);
      setNewSite({ name: "", code: "" });
      setMessage("Yacimiento creado.");
      await loadBundle();
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePreviewDownload = async (code) => {
    try {
      setError("");
      setMessage("");
      setPreviewLoading(code);
      await downloadPreviewPdfByType(code);
      setMessage(`Preview PDF descargado para ${code}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setPreviewLoading("");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-accent">Configuracion</p>
        <h2 className="mt-2 text-2xl font-semibold">Ajustes simples del MVP</h2>
      </div>

      {message ? <p className="rounded-2xl bg-teal-50 px-4 py-3 text-sm text-teal-800">{message}</p> : null}
      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <section className="rounded-3xl border border-slate-200 p-5">
        <h3 className="text-lg font-semibold">Preview PDF por tipo</h3>
        <p className="mt-2 text-sm text-slate-600">
          Usa estos accesos para revisar rapido el layout del PDF sin tener que crear certificados reales.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {previewTypes.map((item) => (
            <Button
              key={item.code}
              variant="ghost"
              className="min-w-[140px]"
              onClick={() => handlePreviewDownload(item.code)}
              disabled={previewLoading === item.code}
            >
              {previewLoading === item.code ? `Preview ${item.code}...` : `Preview ${item.code}`}
            </Button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 p-5">
        <h3 className="text-lg font-semibold">Firma y datos visibles</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <InputField
            label="Nombre del laboratorio"
            name="laboratoryName"
            value={bundle.settings?.laboratoryName || ""}
            onChange={handleSettingsChange}
          />
          <InputField
            label="Responsable por defecto"
            name="defaultSignerName"
            value={bundle.settings?.defaultSignerName || ""}
            onChange={handleSettingsChange}
          />
          <InputField
            label="Rol del firmante"
            name="defaultSignerRole"
            value={bundle.settings?.defaultSignerRole || ""}
            onChange={handleSettingsChange}
          />
          <InputField
            label="URL de firma"
            name="signatureImageUrl"
            value={bundle.settings?.signatureImageUrl || ""}
            onChange={handleSettingsChange}
          />
        </div>
        <Button className="mt-4" onClick={saveSettings}>
          Guardar configuracion
        </Button>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold">Tipos de certificado</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <InputField
              label="Nombre"
              name="name"
              value={newType.name}
              onChange={(event) => setNewType((current) => ({ ...current, name: event.target.value }))}
            />
            <InputField
              label="Codigo"
              name="code"
              value={newType.code}
              onChange={(event) => setNewType((current) => ({ ...current, code: event.target.value }))}
            />
          </div>
          <Button className="mt-4" onClick={createType}>
            Agregar tipo
          </Button>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {bundle.certificateTypes.map((item) => (
              <li key={item._id} className="rounded-2xl bg-slate-50 px-4 py-3">
                {item.name} <span className="text-slate-400">({item.code})</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold">Yacimientos</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <InputField
              label="Nombre"
              name="name"
              value={newSite.name}
              onChange={(event) => setNewSite((current) => ({ ...current, name: event.target.value }))}
            />
            <InputField
              label="Codigo"
              name="code"
              value={newSite.code}
              onChange={(event) => setNewSite((current) => ({ ...current, code: event.target.value }))}
            />
          </div>
          <Button className="mt-4" onClick={createSite}>
            Agregar yacimiento
          </Button>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {bundle.sites.map((item) => (
              <li key={item._id} className="rounded-2xl bg-slate-50 px-4 py-3">
                {item.name} <span className="text-slate-400">({item.code})</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 p-5">
        <h3 className="text-lg font-semibold">Etiquetas visibles</h3>
        <div className="mt-4 space-y-3">
          {bundle.fieldLabels.map((item) => (
            <div key={item._id} className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)_120px]">
              <InputField label="Clave" name="key" value={item.key} onChange={() => {}} readOnly />
              <InputField
                label="Etiqueta"
                name={`label-${item._id}`}
                value={item.label}
                onChange={(event) =>
                  setBundle((current) => ({
                    ...current,
                    fieldLabels: current.fieldLabels.map((labelItem) =>
                      labelItem._id === item._id ? { ...labelItem, label: event.target.value } : labelItem,
                    ),
                  }))
                }
              />
              <div className="flex items-end">
                <Button className="w-full" onClick={() => updateLabel(item._id, item.label)}>
                  Guardar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
