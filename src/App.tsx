import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ToastProvider } from "./components/ui/Toast.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import NotFound from "./pages/NotFound.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Projects from "./pages/Projects.tsx";
import Incidents from "./pages/Incidents.tsx";
import Reports from "./pages/Reports.tsx";
import Profile from "./pages/Profile.tsx";
import Settings from "./pages/Settings.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import Navbar from "./components/layout/Navbar.tsx";
import Sidebar from "./components/layout/Sidebar.tsx";

// App layout wrapper for authenticated workspace screens
function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" id="teamflow-app-layout">
      <Navbar />
      <div className="flex-1 flex" id="teamflow-layout-body">
        <Sidebar />
        <main 
          id="teamflow-workspace-container"
          className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-4rem)] bg-slate-50"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public/Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Workspace Workspace (Layout Wrapper) */}
            <Route 
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/incidents" element={<Incidents />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Fallbacks */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
