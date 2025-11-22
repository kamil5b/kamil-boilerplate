"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/client/helpers";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSpinner,
  ErrorAlert,
} from "@/client/components";
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

interface ProductTransactionData {
  date: string;
  revenue: number;
  expenses: number;
  netIncome: number;
}

interface ProductTransactionDetailPageProps {
  productId: string;
  productName: string;
  onBack: () => void;
}

export function ProductTransactionDetailPage({
  productId,
  productName,
  onBack,
}: ProductTransactionDetailPageProps) {
  const [data, setData] = useState<ProductTransactionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await apiRequest<{
        message: string;
        requestedAt: string;
        requestId: string;
        data: ProductTransactionData[];
      }>(`/api/transactions/time-series?productId=${productId}`);

      // Sort by date
      const sortedData = [...response.data].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setData(sortedData);
    } catch (err: any) {
      setError(err.message || "Failed to load product transaction data");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading product transaction data..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{productName}</h1>
          <p className="text-sm text-gray-500 mt-2">Transaction history over time</p>
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
          <CardTitle>Revenue & Expenses Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <ErrorAlert message={error} />}

          {!error && data.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No transaction data available for this product
            </p>
          )}

          {!error && data.length > 0 && (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
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
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {!error && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {data.reduce((sum, item) => sum + item.revenue, 0).toFixed(2)}
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
              <p className="text-2xl font-bold text-red-600">
                {data.reduce((sum, item) => sum + item.expenses, 0).toFixed(2)}
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
              <p className={`text-2xl font-bold ${
                data.reduce((sum, item) => sum + item.netIncome, 0) >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {data.reduce((sum, item) => sum + item.netIncome, 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
