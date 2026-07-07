import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import axios from "axios";
import { User } from "../types.ts";

interface AuthContextType {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("teamflow_token"));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("teamflow_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Configure global axios authorization header helper
  const setAxiosHeader = (jwtToken: string | null) => {
    if (jwtToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${jwtToken}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  };

  const login = useCallback((jwtToken: string, loggedInUser: User) => {
    localStorage.setItem("teamflow_token", jwtToken);
    localStorage.setItem("teamflow_user", JSON.stringify(loggedInUser));
    setToken(jwtToken);
    setUser(loggedInUser);
    setAxiosHeader(jwtToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("teamflow_token");
    localStorage.removeItem("teamflow_user");
    setToken(null);
    setUser(null);
    setAxiosHeader(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    try {
      setAxiosHeader(token);
      const res = await axios.get("/api/auth/profile");
      if (res.data && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem("teamflow_user", JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error("Failed to refresh profile, logging out.", err);
      logout();
    }
  }, [token, logout]);

  useEffect(() => {
    if (token) {
      setAxiosHeader(token);
      refreshProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
