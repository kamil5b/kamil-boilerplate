"use client";

import type { CreateUserRequest, UpdateUserRequest } from "@/shared/request";
import type { UserResponse } from "@/shared/response";
import { UserRole, AccessPermission } from "@/shared/enums";
import { FormPageTemplate, type FormFieldConfig } from "@/client/template";
import { validateRequired, validateEmail, validatePassword } from "@/client/helpers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/client/components/ui/select";

interface UserFormPageProps {
  userId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type UserFormData = {
  name: string;
  email: string;
  password: string;
  role: string;
};

export function UserFormPage({ userId, onSuccess, onCancel }: UserFormPageProps) {
  const isEdit = !!userId;

  const fields: FormFieldConfig<UserFormData>[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
      placeholder: "User name",
      initialValue: "",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      placeholder: "user@example.com",
      initialValue: "",
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      required: !isEdit,
      placeholder: isEdit ? "Leave blank to keep current password" : "",
      initialValue: "",
    },
    {
      name: "role",
      label: "Role",
      type: "custom",
      required: true,
      initialValue: UserRole.CASHIER,
      renderCustom: (value, onChange, disabled) => (
        <Select
          value={value}
          onValueChange={onChange}
          disabled={disabled}
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
      ),
    },
  ];

  return (
    <FormPageTemplate<UserResponse, CreateUserRequest, UserFormData>
      entityId={userId}
      title="User"
      apiEndpoint="/api/users"
      createPermission={AccessPermission.CREATE_USER}
      editPermission={AccessPermission.EDIT_USER}
      onSuccess={onSuccess}
      onCancel={onCancel}
      fields={fields}
      validate={(data) => {
        const errors: Record<string, string> = {};
        
        const nameError = validateRequired(data.name);
        if (nameError) errors.name = nameError;
        
        const emailError = validateEmail(data.email);
        if (emailError) errors.email = emailError;
        
        if (!isEdit) {
          const passwordError = validatePassword(data.password);
          if (passwordError) errors.password = passwordError;
        } else if (data.password) {
          const passwordError = validatePassword(data.password);
          if (passwordError) errors.password = passwordError;
        }
        
        return errors;
      }}
      transformToRequest={(data) => {
        // For edit mode, only include password if it's provided
        if (isEdit && !data.password) {
          return {
            name: data.name,
            email: data.email,
            role: data.role as UserRole,
          } as CreateUserRequest;
        }
        return {
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role as UserRole,
        };
      }}
      transformFromResponse={(response) => ({
        name: response.name,
        email: response.email,
        password: "",
        role: response.role,
      })}
    />
  );
}
