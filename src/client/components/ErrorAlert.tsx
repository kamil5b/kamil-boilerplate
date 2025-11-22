"use client";

import { AlertCircle } from "lucide-react";

interface ErrorAlertProps {
  message?: string;
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  if (!message) return null;

  return (
    <div className="flex items-center gap-2 p-4 text-sm text-destructive border border-destructive rounded-md bg-destructive/10">
      <AlertCircle className="h-4 w-4" />
      <p>{message}</p>
    </div>
  );
}
