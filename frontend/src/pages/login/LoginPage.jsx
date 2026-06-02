import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import InputField from "../../components/ui/InputField.jsx";
import { useAuth } from "../../hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: "admin@certiflow.local",
    password: "admin123",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(form);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#ccfbf1,_#f8fafc_55%)] px-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-panel">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">CertiFlow</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">Ingreso al sistema</h1>
        <p className="mt-2 text-sm text-slate-600">
          Accedé con el usuario inicial de laboratorio o con el que definas después en administración.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <InputField label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
          <InputField
            label="Contraseña"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />

          {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
