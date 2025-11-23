"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/client/helpers";
import type { ForgotPasswordRequest } from "@/shared/request";
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

export function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const requestData: ForgotPasswordRequest = { email };

      const response = await apiRequest<BaseResponse>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(requestData),
      });

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset link");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>Password reset link sent</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            If an account exists with that email address, you will receive a password reset link shortly.
          </p>
          <Button onClick={() => router.push("/login")} className="w-full">
            Back to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot Password</CardTitle>
        <CardDescription>Enter your email to receive a password reset link</CardDescription>
      </CardHeader>
      <CardContent>
        <ErrorAlert message={error} />
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <FormField label="Email" htmlFor="email" required>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </FormField>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>
          <Button
            type="button"
            variant="link"
            onClick={() => router.push("/login")}
            className="w-full"
          >
            Back to Login
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
