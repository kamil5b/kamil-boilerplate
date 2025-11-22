"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CreateUnitQuantityRequest, UpdateUnitQuantityRequest, UnitQuantityResponse } from "@/shared";
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
  Label,
  Textarea,
  ErrorAlert,
  FormField,
  LoadingSpinner,
} from "@/client/components";

interface UnitQuantityFormPageProps {
  unitQuantityId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UnitQuantityFormPage({ unitQuantityId, onSuccess, onCancel }: UnitQuantityFormPageProps) {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();
  const isEdit = !!unitQuantityId;

  const [name, setName] = useState("");
  const [remark, setRemark] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    const requiredPermission = isEdit ? AccessPermission.EDIT_UNIT_QUANTITY : AccessPermission.CREATE_UNIT_QUANTITY;
    if (!can(requiredPermission)) {
      router.push("/dashboard");
    }
  }, [can, authLoading, isEdit, router]);

  useEffect(() => {
    if (isEdit && unitQuantityId) {
      setIsLoading(true);
      fetchById<UnitQuantityResponse>("/api/unit-quantities", unitQuantityId)
        .then((data) => {
          setName(data.name);
          setRemark(data.remark || "");
        })
        .catch((err) => setError(err.message || "Failed to load unit quantity"))
        .finally(() => setIsLoading(false));
    }
  }, [isEdit, unitQuantityId]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nameError = validateRequired(name);
    if (nameError) newErrors.name = nameError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setError("");

    try {
      if (isEdit && unitQuantityId) {
        const data: UpdateUnitQuantityRequest = { name, remark: remark || undefined };
        await updateResource<UnitQuantityResponse, UpdateUnitQuantityRequest>("/api/unit-quantities", unitQuantityId, data);
      } else {
        const data: CreateUnitQuantityRequest = { name, remark: remark || undefined };
        await createResource<UnitQuantityResponse, CreateUnitQuantityRequest>("/api/unit-quantities", data);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? "update" : "create"} unit quantity`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEdit) return <LoadingSpinner message="Loading unit quantity..." />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Unit Quantity" : "Create Unit Quantity"}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <ErrorAlert message={error} />}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Name" htmlFor="name" required error={errors.name}>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Piece, Box, Kilogram"
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
