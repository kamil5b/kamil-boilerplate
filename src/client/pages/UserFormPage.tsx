"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CreateUserRequest, UpdateUserRequest } from "@/shared/request";
import type { UserResponse } from "@/shared/response";
import { UserRole, AccessPermission } from "@/shared/enums";
import { usePermissions } from "@/client/hooks";
import { createResource, updateResource, fetchById, validateEmail, validatePassword, validateRequired } from "@/client/helpers";
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
  ErrorAlert,
  LoadingSpinner,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/client/components";

interface UserFormPageProps {
  userId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserFormPage({ userId, onSuccess, onCancel }: UserFormPageProps) {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();
  const isEdit = !!userId;
  const [formData, setFormData] = useState<CreateUserRequest>({
    name: "",
    email: "",
    password: "",
    role: UserRole.CASHIER,
  });
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (authLoading) return;
    const requiredPermission = isEdit ? AccessPermission.EDIT_USER : AccessPermission.CREATE_USER;
    if (!can(requiredPermission)) {
      router.push("/dashboard");
    }
  }, [can, authLoading, isEdit, router]);

  useEffect(() => {
    if (userId) loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      const user = await fetchById<UserResponse>("/api/users", userId!);
      setFormData({
        name: user.name,
        email: user.email,
        password: "", // Don't populate password for edits
        role: user.role,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user");
    } finally {
      setIsLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    const nameError = validateRequired(formData.name);
    if (nameError) newErrors.name = nameError;
    
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;
    
    if (!isEdit) {
      const passwordError = validatePassword(formData.password);
      if (passwordError) newErrors.password = passwordError;
    } else if (formData.password) {
      const passwordError = validatePassword(formData.password);
      if (passwordError) newErrors.password = passwordError;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    setError("");

    try {
      const dataToSend: CreateUserRequest | UpdateUserRequest = isEdit && !formData.password
        ? { name: formData.name, email: formData.email, role: formData.role }
        : formData;

      if (isEdit) {
        await updateResource("/api/users", userId!, dataToSend);
      } else {
        await createResource("/api/users", dataToSend);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading user..." />;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit User" : "Create User"}</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorAlert message={error} />
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <FormField label="Name" htmlFor="name" required error={errors.name}>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </FormField>
            <FormField label="Email" htmlFor="email" required error={errors.email}>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </FormField>
            <FormField
              label="Password"
              htmlFor="password"
              required={!isEdit}
              error={errors.password}
            >
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={isEdit ? "Leave blank to keep current password" : ""}
              />
            </FormField>
            <FormField label="Role" htmlFor="role" required>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.SUPER_ADMIN}>Super Admin</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                  <SelectItem value={UserRole.WAREHOUSE_MANAGER}>Warehouse Manager</SelectItem>
                  <SelectItem value={UserRole.CASHIER}>Cashier</SelectItem>
                  <SelectItem value={UserRole.FINANCE}>Finance</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : isEdit ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
