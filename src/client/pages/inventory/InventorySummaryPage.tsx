"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { InventorySummaryResponse, DataResponse } from "@/shared";
import { AccessPermission } from "@/shared";
import { apiRequest } from "@/client/helpers";
import { usePermissions } from "@/client/hooks";
import {
  Card,
  CardContent,
  ErrorAlert,
  LoadingSpinner,
  SearchBar,
} from "@/client/components";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/client/components/ui/table";
import { Button } from "@/client/components/ui/button";

interface InventorySummaryPageProps {
  onBack: () => void;
  onViewProduct: (productId: string) => void;
}

interface FlattenedInventoryItem {
  productId: string;
  productName: string;
  unitQuantityId: string;
  unitQuantityName: string;
  totalQuantity: number;
}

export function InventorySummaryPage({ onBack, onViewProduct }: InventorySummaryPageProps) {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();
  const [summary, setSummary] = useState<InventorySummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

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

  // Flatten the nested structure into a single array
  const flattenedData = useMemo(() => {
    const items: FlattenedInventoryItem[] = [];
    for (const product of summary) {
      for (const qty of product.quantities) {
        items.push({
          productId: product.productId,
          productName: product.productName,
          unitQuantityId: qty.unitQuantityId,
          unitQuantityName: qty.unitQuantityName,
          totalQuantity: qty.totalQuantity,
        });
      }
    }
    return items;
  }, [summary]);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return flattenedData;
    
    const lowerSearch = searchTerm.toLowerCase();
    return flattenedData.filter(
      (item) =>
        item.productName.toLowerCase().includes(lowerSearch) ||
        item.unitQuantityName.toLowerCase().includes(lowerSearch)
    );
  }, [flattenedData, searchTerm]);

  if (isLoading) return <LoadingSpinner message="Loading inventory summary..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inventory Summary</h1>
        <Button onClick={onBack} variant="outline">
          Back
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by product or unit..."
            />
          </div>

          {filteredData.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              {searchTerm ? "No results found" : "No inventory data available"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Total Quantity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={`${item.productId}-${item.unitQuantityId}`}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell>{item.unitQuantityName}</TableCell>
                      <TableCell className="text-right">
                        <span className={item.totalQuantity < 0 ? "text-red-500 font-semibold" : "text-green-600 font-semibold"}>
                          {item.totalQuantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => onViewProduct(item.productId)}
                          className="text-blue-500"
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
