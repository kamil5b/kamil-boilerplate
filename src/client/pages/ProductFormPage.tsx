"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CreateProductRequest, UpdateProductRequest, ProductResponse } from "@/shared";
import { ProductType, AccessPermission } from "@/shared";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/client/components/ui/select";

interface ProductFormPageProps {
  productId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductFormPage({ productId, onSuccess, onCancel }: ProductFormPageProps) {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();
  const isEdit = !!productId;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ProductType>(ProductType.SELLABLE);
  const [remark, setRemark] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    const requiredPermission = isEdit ? AccessPermission.EDIT_PRODUCT : AccessPermission.CREATE_PRODUCT;
    if (!can(requiredPermission)) {
      router.push("/dashboard");
    }
  }, [can, authLoading, isEdit, router]);

  useEffect(() => {
    if (isEdit && productId) {
      setIsLoading(true);
      fetchById<ProductResponse>("/api/products", productId)
        .then((data) => {
          setName(data.name);
          setDescription(data.description);
          setType(data.type as ProductType);
          setRemark(data.remark || "");
        })
        .catch((err) => setError(err.message || "Failed to load product"))
        .finally(() => setIsLoading(false));
    }
  }, [isEdit, productId]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nameError = validateRequired(name);
    if (nameError) newErrors.name = nameError;

    const descError = validateRequired(description);
    if (descError) newErrors.description = descError;

    const typeError = validateRequired(type);
    if (typeError) newErrors.type = typeError;

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
        description,
        type,
        remark: remark || undefined,
      };

      if (isEdit && productId) {
        await updateResource<ProductResponse, UpdateProductRequest>("/api/products", productId, data);
      } else {
        await createResource<ProductResponse, CreateProductRequest>("/api/products", data);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? "update" : "create"} product`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEdit) return <LoadingSpinner message="Loading product..." />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Product" : "Create Product"}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <ErrorAlert message={error} />}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Name" htmlFor="name" required error={errors.name}>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Product name"
              disabled={isLoading}
            />
          </FormField>

          <FormField label="Description" htmlFor="description" required error={errors.description}>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Product description"
              disabled={isLoading}
            />
          </FormField>

          <FormField label="Type" htmlFor="type" required error={errors.type}>
            <Select value={type} onValueChange={(value) => setType(value as ProductType)} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select product type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ProductType.SELLABLE}>Sellable</SelectItem>
                <SelectItem value={ProductType.ASSET}>Asset</SelectItem>
                <SelectItem value={ProductType.UTILITY}>Utility</SelectItem>
                <SelectItem value={ProductType.PLACEHOLDER}>Placeholder</SelectItem>
              </SelectContent>
            </Select>
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
