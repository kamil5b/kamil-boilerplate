/**
 * Generic Form Page Template
 * 
 * This is a reusable template for creating form pages with common features:
 * - Permission-based access control
 * - Create and Edit modes
 * - Form validation
 * - Loading and error states
 * - Auto-fetch data in edit mode
 * 
 * @example Basic Usage
 * ```tsx
 * import { FormPageTemplate, type FormFieldConfig } from "@/client/template";
 * import { AccessPermission } from "@/shared/enums";
 * import type { MyEntityResponse, CreateMyEntityRequest } from "@/shared";
 * 
 * interface FormData {
 *   name: string;
 *   email: string;
 *   age: string;
 * }
 * 
 * export function MyEntityFormPage({ entityId, onSuccess, onCancel }: { entityId?: string; onSuccess: () => void; onCancel: () => void }) {
 *   const fields: FormFieldConfig<FormData>[] = [
 *     {
 *       name: "name",
 *       label: "Name",
 *       type: "text",
 *       placeholder: "Enter name",
 *       required: true,
 *       initialValue: "",
 *     },
 *     {
 *       name: "email",
 *       label: "Email",
 *       type: "email",
 *       placeholder: "Enter email",
 *       required: true,
 *       initialValue: "",
 *     },
 *     {
 *       name: "age",
 *       label: "Age",
 *       type: "number",
 *       placeholder: "Enter age",
 *       initialValue: "",
 *     },
 *   ];
 * 
 *   return (
 *     <FormPageTemplate<MyEntityResponse, CreateMyEntityRequest, FormData>
 *       title="My Entity"
 *       entityId={entityId}
 *       createPermission={AccessPermission.CREATE_MY_ENTITY}
 *       editPermission={AccessPermission.EDIT_MY_ENTITY}
 *       apiEndpoint="/api/my-entities"
 *       fields={fields}
 *       onSuccess={onSuccess}
 *       onCancel={onCancel}
 *       validate={(data) => {
 *         const errors: Record<string, string> = {};
 *         if (!data.name) errors.name = "Name is required";
 *         if (!data.email) errors.email = "Email is required";
 *         return errors;
 *       }}
 *       transformToRequest={(data) => ({
 *         name: data.name,
 *         email: data.email,
 *         age: data.age ? parseInt(data.age) : undefined,
 *       })}
 *       transformFromResponse={(response) => ({
 *         name: response.name,
 *         email: response.email,
 *         age: response.age?.toString() || "",
 *       })}
 *     />
 *   );
 * }
 * ```
 * 
 * @example With PaginatedSelect (Custom Field)
 * ```tsx
 * import { PaginatedSelect } from "@/client/components";
 * import type { CustomerResponse } from "@/shared";
 * 
 * const fields: FormFieldConfig<FormData>[] = [
 *   {
 *     name: "customerId",
 *     label: "Customer",
 *     type: "custom",
 *     initialValue: "",
 *     required: true,
 *     renderCustom: (value, onChange, disabled) => (
 *       <PaginatedSelect<CustomerResponse>
 *         endpoint="/api/customers"
 *         value={value}
 *         onChange={onChange}
 *         displayValue={(customer) => customer.name}
 *         getId={(customer) => customer.id}
 *         label=""
 *         placeholder="Select customer"
 *         disabled={disabled}
 *       />
 *     ),
 *   },
 * ];
 * ```
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AccessPermission } from "@/shared";
import { usePermissions } from "@/client/hooks";
import { createResource, updateResource, fetchById } from "@/client/helpers";
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

export type FormFieldType = "text" | "email" | "number" | "password" | "textarea" | "select" | "date" | "datetime-local" | "custom";

export interface FormFieldConfig<T> {
  name: keyof T;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required?: boolean;
  initialValue: string;
  disabled?: boolean;
  options?: Array<{ value: string; label: string }>; // For select fields
  rows?: number; // For textarea fields
  min?: number; // For number/date fields
  max?: number; // For number/date fields
  step?: number; // For number fields
  // Custom renderer for complex fields like PaginatedSelect
  renderCustom?: (value: string, onChange: (value: string) => void, disabled: boolean) => React.ReactNode;
}

export interface FormPageTemplateProps<TResponse, TRequest, TFormData extends Record<string, string>> {
  /** Title of the form (e.g., "Customer", "Product") */
  title: string;
  
  /** ID of the entity to edit (undefined for create mode) */
  entityId?: string;
  
  /** Permission required to create */
  createPermission: AccessPermission;
  
  /** Permission required to edit */
  editPermission: AccessPermission;
  
  /** API endpoint (e.g., "/api/customers") */
  apiEndpoint: string;
  
  /** Field configuration */
  fields: FormFieldConfig<TFormData>[];
  
  /** Callback when form is successfully submitted */
  onSuccess: () => void;
  
  /** Callback when cancel button is clicked */
  onCancel: () => void;
  
  /** Validation function */
  validate: (data: TFormData) => Record<string, string>;
  
  /** Transform form data to API request */
  transformToRequest: (data: TFormData) => TRequest;
  
  /** Transform API response to form data */
  transformFromResponse: (response: TResponse) => TFormData;
  
  /** Optional: Custom loading message */
  loadingMessage?: string;
  
  /** Optional: Redirect path when permission is denied */
  redirectPath?: string;
  
  /** Optional: Custom submit button text */
  submitButtonText?: { create: string; update: string };
}

export function FormPageTemplate<
  TResponse extends { id: string },
  TRequest,
  TFormData extends Record<string, string>
>({
  title,
  entityId,
  createPermission,
  editPermission,
  apiEndpoint,
  fields,
  onSuccess,
  onCancel,
  validate,
  transformToRequest,
  transformFromResponse,
  loadingMessage,
  redirectPath = "/dashboard",
  submitButtonText = { create: "Create", update: "Update" },
}: FormPageTemplateProps<TResponse, TRequest, TFormData>) {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();
  const isEdit = !!entityId;

  // Initialize form data state
  const initialFormData = fields.reduce((acc, field) => {
    acc[field.name as string] = field.initialValue;
    return acc;
  }, {} as Record<string, string>) as TFormData;

  const [formData, setFormData] = useState<TFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    const requiredPermission = isEdit ? editPermission : createPermission;
    if (!can(requiredPermission)) {
      router.push(redirectPath);
    }
  }, [can, authLoading, isEdit, createPermission, editPermission, router, redirectPath]);

  useEffect(() => {
    if (isEdit && entityId) {
      setIsLoading(true);
      fetchById<TResponse>(apiEndpoint, entityId)
        .then((data) => {
          const transformedData = transformFromResponse(data);
          setFormData(transformedData);
        })
        .catch((err) => setError(err.message || `Failed to load ${title.toLowerCase()}`))
        .finally(() => setIsLoading(false));
    }
  }, [isEdit, entityId, apiEndpoint, transformFromResponse, title]);

  const handleFieldChange = (name: keyof TFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validate(formData);
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) return;

    setIsLoading(true);
    setError("");

    try {
      const requestData = transformToRequest(formData);

      if (isEdit && entityId) {
        await updateResource<TResponse, TRequest>(apiEndpoint, entityId, requestData);
      } else {
        await createResource<TResponse, TRequest>(apiEndpoint, requestData);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? "update" : "create"} ${title.toLowerCase()}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderField = (field: FormFieldConfig<TFormData>) => {
    const value = formData[field.name];
    const fieldDisabled = isLoading || !!field.disabled;

    // Custom renderer for complex fields
    if (field.type === "custom" && field.renderCustom) {
      return field.renderCustom(
        value,
        (newValue) => handleFieldChange(field.name, newValue),
        fieldDisabled
      );
    }

    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            id={field.name as string}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            disabled={fieldDisabled}
            rows={field.rows}
          />
        );

      case "select":
        return (
          <Select
            value={value}
            onValueChange={(val) => handleFieldChange(field.name, val)}
            disabled={fieldDisabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return (
          <Input
            id={field.name as string}
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            disabled={fieldDisabled}
            min={field.min}
            max={field.max}
            step={field.step}
          />
        );
    }
  };

  if (isLoading && isEdit) return <LoadingSpinner message={loadingMessage || `Loading ${title.toLowerCase()}...`} />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? `Edit ${title}` : `Create ${title}`}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <ErrorAlert message={error} />}
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <FormField
              key={field.name as string}
              label={field.label}
              htmlFor={field.name as string}
              required={field.required}
              error={errors[field.name as string]}
            >
              {renderField(field)}
            </FormField>
          ))}

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : isEdit ? submitButtonText.update : submitButtonText.create}
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
