"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    setToken(storedToken);
    setIsLoading(false);
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem("auth_token", newToken);
    setToken(newToken);
    router.push("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    router.push("/login");
  };

  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return {
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
    getAuthHeaders,
  };
}
