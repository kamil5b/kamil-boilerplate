"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/client/helpers";
import type { LoginRequest } from "@/shared/request";
import type { LoginResponse } from "@/shared/response";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  FormField,
  ErrorAlert,
} from "@/client/components";

interface LoginPageProps {
  onSuccess: (token: string) => void;
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginRequest>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await apiRequest<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      onSuccess(response.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        <ErrorAlert message={error} />
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <FormField label="Email" htmlFor="email" required>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="admin@example.com"
            />
          </FormField>
          <FormField label="Password" htmlFor="password" required>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </FormField>
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </div>
          <div className="text-center space-y-2">
            <Button
              type="button"
              variant="link"
              onClick={() => router.push("/register")}
            >
              Don't have an account? Register
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={() => router.push("/forgot-password")}
            >
              Forgot password?
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
