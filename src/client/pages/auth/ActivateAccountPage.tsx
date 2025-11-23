"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest } from "@/client/helpers";
import type { ActivateAccountRequest } from "@/shared/request";
import type { BaseResponse } from "@/shared/response";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  ErrorAlert,
} from "@/client/components";
import { useEffect } from "react";

export function ActivateAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleActivate = async () => {
    if (!token) {
      setError("Invalid or missing activation token");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const requestData: ActivateAccountRequest = { token };

      const response = await apiRequest<BaseResponse>("/api/auth/activate", {
        method: "POST",
        body: JSON.stringify(requestData),
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to activate account");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-activate on mount if token exists
  useEffect(() => {
    if (token && !success && !error && !isLoading) {
      handleActivate();
    }
  }, [token]);

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid Link</CardTitle>
          <CardDescription>The activation link is invalid or missing</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Please check your email for the correct activation link.
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
          <CardTitle>Account Activated!</CardTitle>
          <CardDescription>Your account has been successfully activated</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-600 mb-4">
            You can now log in with your credentials. Redirecting to login...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activate Your Account</CardTitle>
        <CardDescription>
          {isLoading ? "Activating your account..." : "Click below to activate your account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ErrorAlert message={error} />
        {!isLoading && error && (
          <Button onClick={handleActivate} className="w-full mt-4">
            Retry Activation
          </Button>
        )}
        {isLoading && (
          <p className="text-sm text-gray-600">Please wait...</p>
        )}
      </CardContent>
    </Card>
  );
}
