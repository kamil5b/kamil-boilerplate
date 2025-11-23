"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/client/helpers";
import { AccessPermission } from "@/shared";
import type { InventoryTimeSeriesResponse, DataResponse } from "@/shared/response";
import { usePermissions } from "@/client/hooks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSpinner,
  ErrorAlert,
  Button,
} from "@/client/components";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/client/components/ui/table";
import { formatDateTime } from "@/client/helpers";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ProductInventoryDetailPageProps {
  productId: string;
  productName: string;
  onBack: () => void;
}

export function ProductInventoryDetailPage({ 
  productId, 
  productName, 
  onBack 
}: ProductInventoryDetailPageProps) {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();
  const [data, setData] = useState<InventoryTimeSeriesResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!can(AccessPermission.DETAIL_INVENTORY)) {
      router.push("/dashboard");
    }
  }, [can, authLoading, router]);

  useEffect(() => {
    loadTimeSeries();
  }, [productId]);

  const loadTimeSeries = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await apiRequest<DataResponse<InventoryTimeSeriesResponse[]>>(
        `/api/inventory-histories/time-series?productId=${productId}`
      );

      // Sort data by unit quantity name for better visualization
      const sortedData = [...response.data].sort((a, b) => 
        a.unitQuantityName.localeCompare(b.unitQuantityName)
      );
      setData(sortedData);
    } catch (err: any) {
      setError(err.message || "Failed to load time-series data");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading inventory history..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{productName}</h1>
          <p className="text-sm text-gray-500 mt-2">Inventory history over time</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Back
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historical Data</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <ErrorAlert message={error} />}

          {!error && data.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No inventory history available for this product
            </p>
          )}

          {!error && data.length > 0 && (
            <>
              {/* Display by Unit Quantity */}
              {data.map((unitData) => (
                <div key={unitData.unitQuantityId} className="mb-8">
                  <h3 className="font-medium mb-4">
                    {unitData.unitQuantityName} - Cumulative Quantity Over Time
                  </h3>
                  
                  {/* Line Chart */}
                  {unitData.data.length > 0 && (
                    <div className="mb-6">
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={unitData.data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(value) => new Date(value).toLocaleDateString()}
                          />
                          <YAxis label={{ value: 'Total Quantity', angle: -90, position: 'insideLeft' }} />
                          <Tooltip 
                            labelFormatter={(value) => formatDateTime(value as string)}
                            formatter={(value: number) => [value.toFixed(2), 'Total Quantity']}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="totalQuantity"
                            name="Total Quantity"
                            stroke="#22c55e"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Detailed table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Total Quantity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unitData.data.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-gray-500">
                            No data available
                          </TableCell>
                        </TableRow>
                      ) : (
                        unitData.data.map((point, index) => (
                          <TableRow key={index}>
                            <TableCell>{formatDateTime(point.date)}</TableCell>
                            <TableCell className="text-right">
                              <span className="font-medium">
                                {point.totalQuantity.toFixed(2)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
