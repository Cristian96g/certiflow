import { Link } from "react-router-dom";

const actions = [
  {
    title: "Nuevo certificado",
    description: "Cargar una muestra y guardar el certificado en la base.",
    to: "/certificates/new",
  },
  {
    title: "Historial",
    description: "Buscar certificados por número, fecha, yacimiento o tipo.",
    to: "/history",
  },
  {
    title: "Configuración",
    description: "Mantener tipos, yacimientos, firma y etiquetas visibles.",
    to: "/settings",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-sand p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-accent">MVP operativo</p>
        <h2 className="mt-2 text-2xl font-semibold">Una sola carga, una sola fuente de verdad</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          El sistema ya queda organizado para guardar certificados en MongoDB, filtrarlos desde el historial y
          preparar futuras exportaciones a Excel y PDF sin depender del Excel manual como fuente principal.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.title}
            to={action.to}
            className="rounded-3xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-panel"
          >
            <h3 className="text-lg font-semibold">{action.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{action.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
