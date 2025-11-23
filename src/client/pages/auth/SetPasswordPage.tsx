"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest } from "@/client/helpers";
import type { SetPasswordRequest } from "@/shared/request";
import type { BaseResponse } from "@/shared/response";
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

export function SetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!token) {
      setError("Invalid or missing token");
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const requestData: SetPasswordRequest = {
        token,
        password: formData.password,
      };

      const response = await apiRequest<BaseResponse>("/api/auth/set-password", {
        method: "POST",
        body: JSON.stringify(requestData),
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set password");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid Link</CardTitle>
          <CardDescription>The set password link is invalid or missing</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Please contact your administrator for a new invitation link.
          </p>
          <Button onClick={() => router.push("/login")} className="mt-4">
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Password Set Successfully!</CardTitle>
          <CardDescription>Your password has been set</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-600 mb-4">
            You can now log in with your new password. Redirecting to login...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Your Password</CardTitle>
        <CardDescription>Create a password for your new account</CardDescription>
      </CardHeader>
      <CardContent>
        <ErrorAlert message={error} />
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <FormField label="Password" htmlFor="password" required>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter your password"
              minLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">At least 8 characters</p>
          </FormField>
          <FormField label="Confirm Password" htmlFor="confirmPassword" required>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirm your password"
            />
          </FormField>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Setting Password..." : "Set Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
