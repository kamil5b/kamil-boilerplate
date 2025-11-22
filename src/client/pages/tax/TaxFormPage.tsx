"use client";

import type { CreateTaxRequest, UpdateTaxRequest, TaxResponse } from "@/shared";
import { AccessPermission } from "@/shared";
import { FormPageTemplate, type FormFieldConfig } from "@/client/template";
import { validateRequired } from "@/client/helpers/validation";

interface TaxFormPageProps {
  taxId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type TaxFormData = {
  name: string;
  value: string;
  remark: string;
};

export function TaxFormPage({ taxId, onSuccess, onCancel }: TaxFormPageProps) {
  const fields: FormFieldConfig<TaxFormData>[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
      placeholder: "e.g., VAT, Sales Tax",
      initialValue: "",
    },
    {
      name: "value",
      label: "Value (%)",
      type: "number",
      required: true,
      placeholder: "e.g., 10.5",
      initialValue: "",
      min: 0,
      max: 100,
      step: 0.01,
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
    <FormPageTemplate<TaxResponse, CreateTaxRequest, TaxFormData>
      entityId={taxId}
      title="Tax"
      apiEndpoint="/api/taxes"
      createPermission={AccessPermission.CREATE_TAX}
      editPermission={AccessPermission.EDIT_TAX}
      onSuccess={onSuccess}
      onCancel={onCancel}
      fields={fields}
      validate={(data) => {
        const errors: Record<string, string> = {};
        
        const nameError = validateRequired(data.name);
        if (nameError) errors.name = nameError;
        
        const valueError = validateRequired(data.value);
        if (valueError) {
          errors.value = valueError;
        } else {
          const numValue = parseFloat(data.value);
          if (isNaN(numValue) || numValue < 0 || numValue > 100) {
            errors.value = "Value must be between 0 and 100";
          }
        }
        
        return errors;
      }}
      transformToRequest={(data) => ({
        name: data.name,
        value: parseFloat(data.value),
        remark: data.remark || undefined,
      })}
      transformFromResponse={(response) => ({
        name: response.name,
        value: response.value.toString(),
        remark: response.remark || "",
      })}
    />
  );
}
