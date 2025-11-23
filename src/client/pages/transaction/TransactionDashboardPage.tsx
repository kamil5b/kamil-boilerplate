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
import type {
  TransactionSummaryResponse,
  ProductTransactionSummaryResponse,
  TransactionTimeSeriesItemResponse,
  DataResponse,
} from "@/shared/response";

interface TransactionDashboardPageProps {
  onViewProduct?: (productId: string) => void;
}

export function TransactionDashboardPage({ onViewProduct }: TransactionDashboardPageProps) {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();
  const [summary, setSummary] = useState<TransactionSummaryResponse | null>(null);
  const [timeSeries, setTimeSeries] = useState<TransactionTimeSeriesItemResponse[]>([]);
  const [productSummary, setProductSummary] = useState<ProductTransactionSummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!can(AccessPermission.DASHBOARD_TRANSACTION)) {
      router.push("/dashboard");
      return;
    }
    // Only load data if user has permission
    loadData();
  }, [can, authLoading, router]);

  const loadData = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Load summary
      const summaryResponse = await apiRequest<DataResponse<TransactionSummaryResponse>>(
        "/api/transactions/summary"
      );
      setSummary(summaryResponse.data);

      // Load time-series
      const timeSeriesResponse = await apiRequest<DataResponse<TransactionTimeSeriesItemResponse[]>>(
        "/api/transactions/time-series"
      );
      // Sort by period
      const sortedTimeSeries = [...timeSeriesResponse.data].sort((a, b) => 
        new Date(a.period).getTime() - new Date(b.period).getTime()
      );
      setTimeSeries(sortedTimeSeries);

      // Load product summary
      const productResponse = await apiRequest<DataResponse<ProductTransactionSummaryResponse[]>>(
        "/api/transactions/product-summary"
      );
      setProductSummary(productResponse.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  if (!can(AccessPermission.DASHBOARD_TRANSACTION)) {
    return null; // Will redirect
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Transaction Dashboard</h1>

      {error && <ErrorAlert message={error} />}

      {!error && !summary && (
        <Card>
          <CardContent className="py-10 text-center text-gray-500">
            No transaction data available yet.
          </CardContent>
        </Card>
      )}

      {!error && summary && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">
                  {summary.totalRevenue.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-600">
                  {summary.totalExpenses.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">
                  Net Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summary.netIncome.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Time Series Chart */}
          {timeSeries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Revenue & Expenses Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="period" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis label={{ value: 'Amount', angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      labelFormatter={(value) => formatDateTime(value as string)}
                      formatter={(value: number) => value.toFixed(2)}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      name="Expenses"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="netIncome"
                      name="Net Income"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Product Summary */}
          {productSummary.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Revenue & Expenses by Product</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Expenses</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                      {onViewProduct && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productSummary.map((product) => {
                      const net = product.revenue - product.expenses;
                      return (
                        <TableRow key={product.productId}>
                          <TableCell className="font-medium">{product.productName}</TableCell>
                          <TableCell className="text-right text-green-600">
                            {product.revenue.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {product.expenses.toFixed(2)}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {net.toFixed(2)}
                          </TableCell>
                          {onViewProduct && (
                            <TableCell className="text-right">
                              <Button
                                onClick={() => onViewProduct(product.productId)}
                                className="text-blue-600 hover:underline text-sm"
                              >
                                View Details
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
