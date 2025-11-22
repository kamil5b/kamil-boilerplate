"use client";

import type { CreateCustomerRequest, UpdateCustomerRequest, CustomerResponse } from "@/shared";
import { AccessPermission } from "@/shared";
import { FormPageTemplate, type FormFieldConfig } from "@/client/template";
import { validateRequired, isValidEmail, isValidPhone } from "@/client/helpers/validation";

interface CustomerFormPageProps {
  customerId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type CustomerFormData = {
  name: string;
  phoneNumber: string;
  email: string;
  address: string;
  description: string;
  remark: string;
};

export function CustomerFormPage({ customerId, onSuccess, onCancel }: CustomerFormPageProps) {
  const fields: FormFieldConfig<CustomerFormData>[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
      placeholder: "Customer name",
      initialValue: "",
    },
    {
      name: "phoneNumber",
      label: "Phone Number",
      type: "text",
      required: true,
      placeholder: "+1234567890",
      initialValue: "",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "customer@example.com",
      initialValue: "",
    },
    {
      name: "address",
      label: "Address",
      type: "textarea",
      placeholder: "Customer address",
      initialValue: "",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Customer description",
      initialValue: "",
    },
    {
      name: "remark",
      label: "Remark",
      type: "textarea",
      placeholder: "Optional remarks or notes",
      initialValue: "",
    },
  ];

  return (
    <FormPageTemplate<CustomerResponse, CreateCustomerRequest, CustomerFormData>
      entityId={customerId}
      title="Customer"
      apiEndpoint="/api/customers"
      createPermission={AccessPermission.CREATE_CUSTOMER}
      editPermission={AccessPermission.EDIT_CUSTOMER}
      onSuccess={onSuccess}
      onCancel={onCancel}
      fields={fields}
      validate={(data) => {
        const errors: Record<string, string> = {};
        
        const nameError = validateRequired(data.name);
        if (nameError) errors.name = nameError;
        
        const phoneError = validateRequired(data.phoneNumber);
        if (phoneError) errors.phoneNumber = phoneError;
        else if (!isValidPhone(data.phoneNumber)) {
          errors.phoneNumber = "Invalid phone number format";
        }
        
        if (data.email && !isValidEmail(data.email)) {
          errors.email = "Invalid email format";
        }
        
        return errors;
      }}
      transformToRequest={(data) => ({
        name: data.name,
        phoneNumber: data.phoneNumber,
        email: data.email || undefined,
        address: data.address || undefined,
        description: data.description || undefined,
        remark: data.remark || undefined,
      })}
      transformFromResponse={(response) => ({
        name: response.name,
        phoneNumber: response.phoneNumber,
        email: response.email || "",
        address: response.address || "",
        description: response.description || "",
        remark: response.remark || "",
      })}
    />
  );
}
