"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AuthResponse } from "@/types";

interface AuthContextType {
  user: AuthResponse | null;
  login: (user: AuthResponse) => void;
  logout: () => void;
  updateUser: (patch: Partial<Pick<AuthResponse, "fullName" | "avatarUrl">>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("cdv_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("cdv_user");
      }
    }
  }, []);

  const login = (u: AuthResponse) => {
    localStorage.setItem("cdv_token", u.token);
    localStorage.setItem("cdv_user", JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("cdv_token");
    localStorage.removeItem("cdv_user");
    setUser(null);
  };

  const updateUser = (patch: Partial<Pick<AuthResponse, "fullName" | "avatarUrl">>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      localStorage.setItem("cdv_user", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
