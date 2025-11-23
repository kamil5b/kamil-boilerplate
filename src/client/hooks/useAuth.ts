"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@/shared/enums";

export interface User {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

export function useAuth() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to get token from localStorage first, then cookies
    let storedToken = localStorage.getItem("auth_token");
    
    if (!storedToken) {
      // Try to get from cookie
      const cookies = document.cookie.split(";");
      const authCookie = cookies.find((c) => c.trim().startsWith("auth_token="));
      if (authCookie) {
        storedToken = authCookie.split("=")[1];
        // Sync to localStorage
        localStorage.setItem("auth_token", storedToken);
      }
    }
    
    setToken(storedToken);
    
    if (storedToken) {
      fetchUser(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async (authToken: string) => {
    try {
      const response = await fetch("/api/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token is invalid, clear it
        localStorage.removeItem("auth_token");
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      localStorage.removeItem("auth_token");
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string) => {
    localStorage.setItem("auth_token", newToken);
    // Also set cookie for middleware
    document.cookie = `auth_token=${newToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    setToken(newToken);
    await fetchUser(newToken);
    router.push("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    // Clear cookie
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return {
    token,
    user,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    getAuthHeaders,
  };
}
