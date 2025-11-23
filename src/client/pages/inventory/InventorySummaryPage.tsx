"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { InventorySummaryResponse, DataResponse } from "@/shared";
import { AccessPermission } from "@/shared";
import { apiRequest } from "@/client/helpers";
import { usePermissions } from "@/client/hooks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorAlert,
  LoadingSpinner,
} from "@/client/components";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/client/components/ui/table";

interface InventorySummaryPageProps {
  onBack: () => void;
  onViewProduct: (productId: string) => void;
}

export function InventorySummaryPage({ onBack, onViewProduct }: InventorySummaryPageProps) {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();
  const [summary, setSummary] = useState<InventorySummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!can(AccessPermission.DETAIL_INVENTORY)) {
      router.push("/dashboard");
    }
  }, [can, authLoading, router]);

  useEffect(() => {
    apiRequest<DataResponse<InventorySummaryResponse[]>>("/api/inventory-histories/summary")
      .then((response) => setSummary(response.data))
      .catch((err) => setError(err.message || "Failed to load inventory summary"))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingSpinner message="Loading inventory summary..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inventory Summary</h1>
        <button
          onClick={onBack}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Back
        </button>
      </div>

      {summary.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No inventory data available
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {summary.map((product) => (
            <Card key={product.productId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{product.productName}</CardTitle>
                  <button
                    onClick={() => onViewProduct(product.productId)}
                    className="text-sm text-blue-500 hover:underline"
                  >
                    View Details →
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Total Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.quantities.map((qty) => (
                      <TableRow key={qty.unitQuantityId}>
                        <TableCell className="font-medium">{qty.unitQuantityName}</TableCell>
                        <TableCell className="text-right">
                          <span className={qty.totalQuantity < 0 ? "text-red-500" : "text-green-600"}>
                            {qty.totalQuantity}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
