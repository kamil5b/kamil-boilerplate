"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/client/helpers";
import { AccessPermission } from "@/shared";
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

interface TimeSeriesData {
  date: string;
  unitQuantityId: string;
  unitQuantityName: string;
  quantity: number;
}

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
  const [data, setData] = useState<TimeSeriesData[]>([]);
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
      const response = await apiRequest<{
        message: string;
        requestedAt: string;
        requestId: string;
        data: TimeSeriesData[];
      }>(`/api/inventory-histories/time-series?productId=${productId}`);

      // Sort by date for better visualization
      const sortedData = [...response.data].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
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
              {/* Line Chart */}
              <div className="mb-8">
                <h3 className="font-medium mb-4">Quantity Over Time</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis label={{ value: 'Quantity', angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      labelFormatter={(value) => formatDateTime(value as string)}
                      formatter={(value: number, name: string) => [value.toFixed(2), name]}
                    />
                    <Legend />
                    {/* Group data by unit and create a line for each unit */}
                    {Array.from(new Set(data.map(d => d.unitQuantityName))).map((unitName, index) => {
                      const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
                      return (
                        <Line
                          key={unitName}
                          type="monotone"
                          dataKey={(entry) => entry.unitQuantityName === unitName ? entry.quantity : null}
                          name={unitName}
                          stroke={colors[index % colors.length]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          connectNulls
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed table */}
              <div>
                <h3 className="font-medium mb-4">Detailed History</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatDateTime(item.date)}</TableCell>
                        <TableCell>{item.unitQuantityName}</TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              item.quantity > 0
                                ? "text-green-600 font-medium"
                                : item.quantity < 0
                                ? "text-red-600 font-medium"
                                : ""
                            }
                          >
                            {item.quantity.toFixed(2)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
