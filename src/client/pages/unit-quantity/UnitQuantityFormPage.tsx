"use client";

import type { CreateUnitQuantityRequest, UpdateUnitQuantityRequest, UnitQuantityResponse } from "@/shared";
import { AccessPermission } from "@/shared";
import { FormPageTemplate, type FormFieldConfig } from "@/client/template";
import { validateRequired } from "@/client/helpers/validation";

interface UnitQuantityFormPageProps {
  unitQuantityId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type UnitQuantityFormData = {
  name: string;
  remark: string;
};

export function UnitQuantityFormPage({ unitQuantityId, onSuccess, onCancel }: UnitQuantityFormPageProps) {
  const fields: FormFieldConfig<UnitQuantityFormData>[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
      placeholder: "e.g., Piece, Box, Kilogram",
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
    <FormPageTemplate<UnitQuantityResponse, CreateUnitQuantityRequest, UnitQuantityFormData>
      entityId={unitQuantityId}
      title="Unit Quantity"
      apiEndpoint="/api/unit-quantities"
      createPermission={AccessPermission.CREATE_UNIT_QUANTITY}
      editPermission={AccessPermission.EDIT_UNIT_QUANTITY}
      onSuccess={onSuccess}
      onCancel={onCancel}
      fields={fields}
      validate={(data) => {
        const errors: Record<string, string> = {};
        
        const nameError = validateRequired(data.name);
        if (nameError) errors.name = nameError;
        
        return errors;
      }}
      transformToRequest={(data) => ({
        name: data.name,
        remark: data.remark || undefined,
      })}
      transformFromResponse={(response) => ({
        name: response.name,
        remark: response.remark || "",
      })}
    />
  );
}
