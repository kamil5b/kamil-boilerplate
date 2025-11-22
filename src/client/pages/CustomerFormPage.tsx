"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CreateCustomerRequest, UpdateCustomerRequest, CustomerResponse } from "@/shared";
import { AccessPermission } from "@/shared";
import { usePermissions } from "@/client/hooks";
import { createResource, updateResource, fetchById } from "@/client/helpers";
import { validateRequired, isValidEmail, isValidPhone } from "@/client/helpers/validation";
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

interface CustomerFormPageProps {
  customerId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CustomerFormPage({ customerId, onSuccess, onCancel }: CustomerFormPageProps) {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();
  const isEdit = !!customerId;

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [remark, setRemark] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    const requiredPermission = isEdit ? AccessPermission.EDIT_CUSTOMER : AccessPermission.CREATE_CUSTOMER;
    if (!can(requiredPermission)) {
      router.push("/dashboard");
    }
  }, [can, authLoading, isEdit, router]);

  useEffect(() => {
    if (isEdit && customerId) {
      setIsLoading(true);
      fetchById<CustomerResponse>("/api/customers", customerId)
        .then((data) => {
          setName(data.name);
          setPhoneNumber(data.phoneNumber);
          setEmail(data.email || "");
          setAddress(data.address || "");
          setDescription(data.description || "");
          setRemark(data.remark || "");
        })
        .catch((err) => setError(err.message || "Failed to load customer"))
        .finally(() => setIsLoading(false));
    }
  }, [isEdit, customerId]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nameError = validateRequired(name);
    if (nameError) newErrors.name = nameError;

    const phoneError = validateRequired(phoneNumber);
    if (phoneError) newErrors.phoneNumber = phoneError;
    else if (!isValidPhone(phoneNumber)) newErrors.phoneNumber = "Invalid phone number format";

    if (email && !isValidEmail(email)) newErrors.email = "Invalid email format";

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
        phoneNumber,
        email: email || undefined,
        address: address || undefined,
        description: description || undefined,
        remark: remark || undefined,
      };

      if (isEdit && customerId) {
        await updateResource<CustomerResponse, UpdateCustomerRequest>("/api/customers", customerId, data);
      } else {
        await createResource<CustomerResponse, CreateCustomerRequest>("/api/customers", data);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? "update" : "create"} customer`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEdit) return <LoadingSpinner message="Loading customer..." />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Customer" : "Create Customer"}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <ErrorAlert message={error} />}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Name" htmlFor="name" required error={errors.name}>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Customer name"
              disabled={isLoading}
            />
          </FormField>

          <FormField label="Phone Number" htmlFor="phoneNumber" required error={errors.phoneNumber}>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              disabled={isLoading}
            />
          </FormField>

          <FormField label="Email" htmlFor="email" error={errors.email}>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              disabled={isLoading}
            />
          </FormField>

          <FormField label="Address" htmlFor="address" error={errors.address}>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Customer address"
              disabled={isLoading}
            />
          </FormField>

          <FormField label="Description" htmlFor="description" error={errors.description}>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Customer description"
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
