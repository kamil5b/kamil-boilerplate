"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ManipulateInventoryRequest, ProductResponse, UnitQuantityResponse } from "@/shared";
import { AccessPermission } from "@/shared";
import { usePermissions } from "@/client/hooks";
import { apiRequest, fetchPaginated } from "@/client/helpers";
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
  PaginatedSelect,
} from "@/client/components";

interface InventoryItem {
  productId: string;
  productName: string;
  quantity: number;
  unitQuantityId: string;
  unitQuantityName: string;
  remark: string;
}

interface InventoryManipulatePageProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function InventoryManipulatePage({ onSuccess, onCancel }: InventoryManipulatePageProps) {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [remark, setRemark] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!can(AccessPermission.MANIPULATE_INVENTORY)) {
      router.push("/dashboard");
    }
  }, [can, authLoading, router]);

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: "",
        productName: "",
        quantity: 0,
        unitQuantityId: "",
        unitQuantityName: "",
        remark: "",
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InventoryItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (items.length === 0) {
      newErrors.items = "At least one item is required";
    } else {
      items.forEach((item, index) => {
        if (!item.productId) {
          newErrors[`item_${index}_product`] = "Product is required";
        }
        if (!item.unitQuantityId) {
          newErrors[`item_${index}_unit`] = "Unit is required";
        }
        if (item.quantity === 0) {
          newErrors[`item_${index}_quantity`] = "Quantity cannot be zero";
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setError("");

    try {
      const data: ManipulateInventoryRequest = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitQuantityId: item.unitQuantityId,
          remark: item.remark || undefined,
        })),
        remark: remark || undefined,
      };

      await apiRequest("/api/inventory-histories/manipulate", {
        method: "POST",
        body: JSON.stringify(data),
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to manipulate inventory");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manipulate Inventory</CardTitle>
        <p className="text-sm text-gray-500 mt-2">
          Use this form to convert inventory units (e.g., 1 box → 6 pieces). 
          Add items with negative quantities to subtract, and items with positive quantities to add.
        </p>
      </CardHeader>
      <CardContent>
        {error && <ErrorAlert message={error} />}
        {errors.items && <ErrorAlert message={errors.items} />}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <label className="block text-sm font-medium">Inventory Items</label>
            
            {items.map((item, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={isLoading}
                    >
                      Remove
                    </Button>
                  </div>

                  <div className={errors[`item_${index}_product`] ? "" : ""}>
                    <PaginatedSelect<ProductResponse>
                      endpoint="/api/products"
                      value={item.productId}
                      onChange={(value) => {
                        updateItem(index, "productId", value);
                      }}
                      displayValue={(product) => product.name}
                      getId={(product) => product.id}
                      label="Product"
                      placeholder="Select product"
                      disabled={isLoading}
                    />
                    {errors[`item_${index}_product`] && (
                      <p className="text-sm text-red-500 mt-1">{errors[`item_${index}_product`]}</p>
                    )}
                  </div>

                  <div className={errors[`item_${index}_unit`] ? "" : ""}>
                    <PaginatedSelect<UnitQuantityResponse>
                      endpoint="/api/unit-quantities"
                      value={item.unitQuantityId}
                      onChange={(value) => {
                        updateItem(index, "unitQuantityId", value);
                      }}
                      displayValue={(unit) => unit.name}
                      getId={(unit) => unit.id}
                      label="Unit"
                      placeholder="Select unit"
                      disabled={isLoading}
                    />
                    {errors[`item_${index}_unit`] && (
                      <p className="text-sm text-red-500 mt-1">{errors[`item_${index}_unit`]}</p>
                    )}
                  </div>

                  <FormField
                    label="Quantity"
                    htmlFor={`quantity_${index}`}
                    required
                    error={errors[`item_${index}_quantity`]}
                  >
                    <Input
                      id={`quantity_${index}`}
                      type="number"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                      placeholder="Use negative for subtract, positive for add"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Negative: subtract from inventory, Positive: add to inventory
                    </p>
                  </FormField>

                  <FormField label="Item Remark" htmlFor={`item_remark_${index}`}>
                    <Input
                      id={`item_remark_${index}`}
                      value={item.remark}
                      onChange={(e) => updateItem(index, "remark", e.target.value)}
                      placeholder="Optional remark for this item"
                      disabled={isLoading}
                    />
                  </FormField>
                </div>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addItem}
              disabled={isLoading}
              className="w-full"
            >
              + Add Item
            </Button>
          </div>

          <FormField label="Overall Remark" htmlFor="remark">
            <Textarea
              id="remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Optional overall remark for this operation"
              disabled={isLoading}
            />
          </FormField>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Processing..." : "Submit"}
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
