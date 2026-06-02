import { createContext, useEffect, useState } from "react";
import { loginRequest, meRequest } from "../api/auth";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("certiflow_token");
    if (!token) {
      setLoading(false);
      return;
    }

    meRequest()
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem("certiflow_token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const data = await loginRequest(credentials);
    localStorage.setItem("certiflow_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("certiflow_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
