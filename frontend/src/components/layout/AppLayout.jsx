import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const navItems = [
  { to: "/", label: "Panel" },
  { to: "/certificates/new", label: "Nuevo certificado" },
  { to: "/history", label: "Historial" },
  { to: "/settings", label: "Configuración" },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-mist text-ink">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 md:px-6">
        <header className="mb-6 rounded-3xl bg-ink px-6 py-5 text-white shadow-panel">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-teal-200">CertiFlow</p>
              <h1 className="text-3xl font-semibold">Gestión de certificados</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-slate-300">Sesión activa</p>
                <p className="font-medium">{user?.name}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
              >
                Salir
              </button>
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-3xl bg-white p-4 shadow-panel">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive ? "bg-accent text-white" : "text-slate-600 hover:bg-slate-100"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>

          <main className="rounded-3xl bg-white p-5 shadow-panel md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
