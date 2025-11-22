"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CreateTaxRequest, UpdateTaxRequest, TaxResponse } from "@/shared";
import { AccessPermission } from "@/shared";
import { usePermissions } from "@/client/hooks";
import { createResource, updateResource, fetchById } from "@/client/helpers";
import { validateRequired } from "@/client/helpers/validation";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  ErrorAlert,
  FormField,
  LoadingSpinner,
} from "@/client/components";

interface TaxFormPageProps {
  taxId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TaxFormPage({ taxId, onSuccess, onCancel }: TaxFormPageProps) {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();
  const isEdit = !!taxId;

  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [remark, setRemark] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    const requiredPermission = isEdit ? AccessPermission.EDIT_TAX : AccessPermission.CREATE_TAX;
    if (!can(requiredPermission)) {
      router.push("/dashboard");
    }
  }, [can, authLoading, isEdit, router]);

  useEffect(() => {
    if (isEdit && taxId) {
      setIsLoading(true);
      fetchById<TaxResponse>("/api/taxes", taxId)
        .then((data) => {
          setName(data.name);
          setValue(data.value.toString());
          setRemark(data.remark || "");
        })
        .catch((err) => setError(err.message || "Failed to load tax"))
        .finally(() => setIsLoading(false));
    }
  }, [isEdit, taxId]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nameError = validateRequired(name);
    if (nameError) newErrors.name = nameError;

    const valueError = validateRequired(value);
    if (valueError) newErrors.value = valueError;
    else {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0 || numValue > 100) {
        newErrors.value = "Value must be between 0 and 100";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setError("");

    try {
      const data = {
        name,
        value: parseFloat(value),
        remark: remark || undefined,
      };

      if (isEdit && taxId) {
        await updateResource<TaxResponse, UpdateTaxRequest>("/api/taxes", taxId, data);
      } else {
        await createResource<TaxResponse, CreateTaxRequest>("/api/taxes", data);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? "update" : "create"} tax`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEdit) return <LoadingSpinner message="Loading tax..." />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Tax" : "Create Tax"}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <ErrorAlert message={error} />}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Name" htmlFor="name" required error={errors.name}>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., VAT, Sales Tax"
              disabled={isLoading}
            />
          </FormField>

          <FormField label="Value (%)" htmlFor="value" required error={errors.value}>
            <Input
              id="value"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g., 10.5"
              disabled={isLoading}
            />
          </FormField>

          <FormField label="Remark" htmlFor="remark" error={errors.remark}>
            <Textarea
              id="remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Optional remarks or notes"
              disabled={isLoading}
            />
          </FormField>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
