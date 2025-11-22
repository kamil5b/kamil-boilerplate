"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { 
  CreateTransactionRequest, 
  TransactionResponse,
  CustomerResponse,
  ProductResponse,
  UnitQuantityResponse,
  TaxResponse,
} from "@/shared";
import { TransactionType, DiscountType, AccessPermission } from "@/shared";
import { usePermissions } from "@/client/hooks";
import { apiRequest, createResource, fetchPaginated } from "@/client/helpers";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/client/components/ui/select";
import { Badge } from "@/client/components/ui/badge";

interface TransactionItem {
  productId: string;
  productName: string;
  unitQuantityId: string;
  unitQuantityName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface TransactionDiscount {
  type: DiscountType;
  value: number;
  transactionItemId?: string;
  itemIndex?: number;
}

interface TransactionFormPageProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function TransactionFormPage({ onSuccess, onCancel }: TransactionFormPageProps) {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();
  const [type, setType] = useState<TransactionType>(TransactionType.SELL);
  const [customerId, setCustomerId] = useState<string>("");
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [discounts, setDiscounts] = useState<TransactionDiscount[]>([]);
  const [selectedTaxes, setSelectedTaxes] = useState<string[]>([]);
  const [taxes, setTaxes] = useState<TaxResponse[]>([]);
  const [remark, setRemark] = useState("");
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!can(AccessPermission.CREATE_TRANSACTION)) {
      router.push("/dashboard");
    }
  }, [can, authLoading, router]);

  // Load taxes on mount
  useEffect(() => {
    fetchPaginated<TaxResponse>("/api/taxes", 1, 100)
      .then((response) => setTaxes(response.items))
      .catch(() => {});
  }, []);

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: "",
        productName: "",
        unitQuantityId: "",
        unitQuantityName: "",
        quantity: 1,
        price: 0,
        subtotal: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    // Remove item-specific discounts
    setDiscounts(discounts.filter((d) => d.itemIndex !== index));
  };

  const updateItem = (index: number, field: keyof TransactionItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate subtotal
    if (field === 'quantity' || field === 'price') {
      newItems[index].subtotal = newItems[index].quantity * newItems[index].price;
    }
    
    setItems(newItems);
  };

  const addDiscount = (type: DiscountType, itemIndex?: number) => {
    setDiscounts([
      ...discounts,
      {
        type,
        value: 0,
        itemIndex,
      },
    ]);
  };

  const removeDiscount = (index: number) => {
    setDiscounts(discounts.filter((_, i) => i !== index));
  };

  const updateDiscount = (index: number, field: keyof TransactionDiscount, value: any) => {
    const newDiscounts = [...discounts];
    newDiscounts[index] = { ...newDiscounts[index], [field]: value };
    setDiscounts(newDiscounts);
  };

  const toggleTax = (taxId: string) => {
    if (selectedTaxes.includes(taxId)) {
      setSelectedTaxes(selectedTaxes.filter((id) => id !== taxId));
    } else {
      setSelectedTaxes([...selectedTaxes, taxId]);
    }
  };

  // Calculate totals
  const itemsSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  
  const totalDiscountAmount = discounts.reduce((sum, discount) => {
    if (discount.type === DiscountType.TOTAL_FIXED) {
      return sum + discount.value;
    } else if (discount.type === DiscountType.TOTAL_PERCENTAGE) {
      return sum + (itemsSubtotal * discount.value / 100);
    } else if (discount.itemIndex !== undefined) {
      const item = items[discount.itemIndex];
      if (item) {
        if (discount.type === DiscountType.ITEM_FIXED) {
          return sum + discount.value;
        } else if (discount.type === DiscountType.ITEM_PERCENTAGE) {
          return sum + (item.subtotal * discount.value / 100);
        }
      }
    }
    return sum;
  }, 0);

  const afterDiscount = itemsSubtotal - totalDiscountAmount;
  
  const taxAmount = selectedTaxes.reduce((sum, taxId) => {
    const tax = taxes.find((t) => t.id === taxId);
    return tax ? sum + (afterDiscount * tax.value / 100) : sum;
  }, 0);

  const grandTotal = afterDiscount + taxAmount;

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
        if (item.quantity <= 0) {
          newErrors[`item_${index}_quantity`] = "Quantity must be greater than 0";
        }
        if (item.price < 0) {
          newErrors[`item_${index}_price`] = "Price cannot be negative";
        }
      });
    }

    discounts.forEach((discount, index) => {
      if (discount.value < 0) {
        newErrors[`discount_${index}_value`] = "Discount value cannot be negative";
      }
      if (discount.type.includes("PERCENTAGE") && discount.value > 100) {
        newErrors[`discount_${index}_value`] = "Percentage cannot exceed 100%";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setError("");

    try {
      const data: CreateTransactionRequest = {
        type,
        customerId: customerId || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitQuantityId: item.unitQuantityId,
          pricePerUnit: item.price,
        })),
        discounts: discounts.map((discount) => ({
          type: discount.type,
          percentage: discount.type.includes('PERCENTAGE') ? discount.value : undefined,
          amount: discount.type.includes('FIXED') ? discount.value : undefined,
          transactionItemIndex: discount.itemIndex,
        })),
        taxes: selectedTaxes,
        remark: remark || undefined,
      };

      await createResource<TransactionResponse, CreateTransactionRequest>(
        "/api/transactions",
        data
      );

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create transaction");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Transaction</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <ErrorAlert message={error} />}
        {errors.items && <ErrorAlert message={errors.items} />}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Type */}
          <FormField label="Transaction Type" htmlFor="type" required>
            <Select
              value={type}
              onValueChange={(value) => setType(value as TransactionType)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TransactionType.SELL}>SELL</SelectItem>
                <SelectItem value={TransactionType.BUY}>BUY</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {/* Customer */}
          <FormField label="Customer" htmlFor="customer">
            <PaginatedSelect<CustomerResponse>
              endpoint="/api/customers"
              value={customerId}
              onChange={setCustomerId}
              displayValue={(customer) => customer.name}
              getId={(customer) => customer.id}
              label=""
              placeholder="Select customer (optional)"
              disabled={isLoading}
              allowClear
            />
          </FormField>

          {/* Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium">Transaction Items *</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                disabled={isLoading}
              >
                + Add Item
              </Button>
            </div>

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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
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
                        <p className="text-sm text-red-500 mt-1">
                          {errors[`item_${index}_product`]}
                        </p>
                      )}
                    </div>

                    <div>
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
                        <p className="text-sm text-red-500 mt-1">
                          {errors[`item_${index}_unit`]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
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
                        onChange={(e) =>
                          updateItem(index, "quantity", parseFloat(e.target.value) || 0)
                        }
                        disabled={isLoading}
                      />
                    </FormField>

                    <FormField
                      label="Price"
                      htmlFor={`price_${index}`}
                      required
                      error={errors[`item_${index}_price`]}
                    >
                      <Input
                        id={`price_${index}`}
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) =>
                          updateItem(index, "price", parseFloat(e.target.value) || 0)
                        }
                        disabled={isLoading}
                      />
                    </FormField>

                    <FormField label="Subtotal" htmlFor={`subtotal_${index}`}>
                      <Input
                        id={`subtotal_${index}`}
                        type="number"
                        value={item.subtotal.toFixed(2)}
                        disabled
                      />
                    </FormField>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addDiscount(DiscountType.ITEM_FIXED, index)}
                    disabled={isLoading}
                  >
                    + Add Item Discount
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Discounts */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium">Discounts</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addDiscount(DiscountType.TOTAL_FIXED)}
                  disabled={isLoading}
                >
                  + Fixed Discount
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addDiscount(DiscountType.TOTAL_PERCENTAGE)}
                  disabled={isLoading}
                >
                  + Percentage Discount
                </Button>
              </div>
            </div>

            {discounts.map((discount, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Select
                      value={discount.type}
                      onValueChange={(value) =>
                        updateDiscount(index, "type", value as DiscountType)
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DiscountType.TOTAL_FIXED}>Total Fixed</SelectItem>
                        <SelectItem value={DiscountType.TOTAL_PERCENTAGE}>
                          Total Percentage
                        </SelectItem>
                        <SelectItem value={DiscountType.ITEM_FIXED}>Item Fixed</SelectItem>
                        <SelectItem value={DiscountType.ITEM_PERCENTAGE}>
                          Item Percentage
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1">
                    <Input
                      type="number"
                      step="0.01"
                      value={discount.value}
                      onChange={(e) =>
                        updateDiscount(index, "value", parseFloat(e.target.value) || 0)
                      }
                      placeholder="Value"
                      disabled={isLoading}
                    />
                    {errors[`discount_${index}_value`] && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors[`discount_${index}_value`]}
                      </p>
                    )}
                  </div>

                  {discount.itemIndex !== undefined && (
                    <Badge variant="secondary">Item {discount.itemIndex + 1}</Badge>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeDiscount(index)}
                    disabled={isLoading}
                  >
                    Remove
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Taxes */}
          <FormField label="Taxes" htmlFor="taxes">
            <div className="space-y-2">
              {taxes.map((tax) => (
                <label key={tax.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedTaxes.includes(tax.id)}
                    onChange={() => toggleTax(tax.id)}
                    disabled={isLoading}
                  />
                  <span>{tax.name} ({tax.value}%)</span>
                </label>
              ))}
            </div>
          </FormField>

          {/* Calculation Summary */}
          <Card className="bg-gray-50">
            <CardContent className="pt-6 space-y-2">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-medium">{itemsSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Total Discount:</span>
                <span className="font-medium">-{totalDiscountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>After Discount:</span>
                <span className="font-medium">{afterDiscount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span className="font-medium">+{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Grand Total:</span>
                <span>{grandTotal.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Remark */}
          <FormField label="Remark" htmlFor="remark">
            <Textarea
              id="remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Optional remark"
              disabled={isLoading}
            />
          </FormField>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Transaction"}
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
