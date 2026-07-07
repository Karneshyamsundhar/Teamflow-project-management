import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import Loader from "./ui/Loader.tsx";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: number[]; // List of role IDs allowed: 1 = Admin, 2 = Manager, 3 = Developer
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, token, loading } = useAuth();

  if (loading) {
    return <Loader fullPage />;
  }

  // If not logged in, redirect to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // If role isn't authorized, redirect to dashboard or safe route
  if (allowedRoles && !allowedRoles.includes(user.roleId)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
