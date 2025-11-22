"use client";

import type { CreateProductRequest, UpdateProductRequest, ProductResponse } from "@/shared";
import { ProductType, AccessPermission } from "@/shared";
import { FormPageTemplate, type FormFieldConfig } from "@/client/template";
import { validateRequired } from "@/client/helpers/validation";
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

type ProductFormData = {
  name: string;
  description: string;
  type: string;
  remark: string;
};

export function ProductFormPage({ productId, onSuccess, onCancel }: ProductFormPageProps) {
  const fields: FormFieldConfig<ProductFormData>[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
      placeholder: "Product name",
      initialValue: "",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      required: true,
      placeholder: "Product description",
      initialValue: "",
    },
    {
      name: "type",
      label: "Type",
      type: "custom",
      required: true,
      initialValue: ProductType.SELLABLE,
      renderCustom: (value, onChange, disabled) => (
        <Select 
          value={value} 
          onValueChange={onChange} 
          disabled={disabled}
        >
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
      ),
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
    <FormPageTemplate<ProductResponse, CreateProductRequest, ProductFormData>
      entityId={productId}
      title="Product"
      apiEndpoint="/api/products"
      createPermission={AccessPermission.CREATE_PRODUCT}
      editPermission={AccessPermission.EDIT_PRODUCT}
      onSuccess={onSuccess}
      onCancel={onCancel}
      fields={fields}
      validate={(data) => {
        const errors: Record<string, string> = {};
        
        const nameError = validateRequired(data.name);
        if (nameError) errors.name = nameError;
        
        const descError = validateRequired(data.description);
        if (descError) errors.description = descError;
        
        const typeError = validateRequired(data.type);
        if (typeError) errors.type = typeError;
        
        return errors;
      }}
      transformToRequest={(data) => ({
        name: data.name,
        description: data.description,
        type: data.type as ProductType,
        remark: data.remark || undefined,
      })}
      transformFromResponse={(response) => ({
        name: response.name,
        description: response.description,
        type: response.type,
        remark: response.remark || "",
      })}
    />
  );
}
