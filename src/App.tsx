import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/context/AuthContext";
import { FamilyProvider } from "@/context/FamilyContext";
import { CalendarPage } from "@/pages/CalendarPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { DocumentFormPage } from "@/pages/DocumentFormPage";
import { DocumentSheetPage } from "@/pages/DocumentSheetPage";
import { DocumentsIndexPage } from "@/pages/DocumentsIndexPage";
import { FamilyPage } from "@/pages/FamilyPage";
import { LoginPage } from "@/pages/LoginPage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { Navigate, Route, Routes } from "react-router-dom";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          element={
            <ProtectedRoute>
              <FamilyProvider>
                <AppShell />
              </FamilyProvider>
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="documents" element={<DocumentsIndexPage />} />
          <Route path="documents/:typeCode/new" element={<DocumentFormPage />} />
          <Route
            path="documents/:typeCode/:documentId/edit"
            element={<DocumentFormPage />}
          />
          <Route path="documents/:typeCode" element={<DocumentSheetPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="family" element={<FamilyPage />} />
          <Route
            path="settings"
            element={<PlaceholderPage title="Settings" />}
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
