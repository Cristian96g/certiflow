import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout.jsx";
import ProtectedRoute from "./components/layout/ProtectedRoute.jsx";
import CertificateDetailPage from "./pages/certificates/CertificateDetailPage.jsx";
import CertificateNewPage from "./pages/certificates/CertificateNewPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import HistoryPage from "./pages/history/HistoryPage.jsx";
import LoginPage from "./pages/login/LoginPage.jsx";
import SettingsPage from "./pages/config/SettingsPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="certificates/new" element={<CertificateNewPage />} />
        <Route path="certificates/:id" element={<CertificateDetailPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
