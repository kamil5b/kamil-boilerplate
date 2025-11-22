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
} from "@/client/components";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/client/components/ui/table";
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

interface CustomerPaymentSummary {
  customerId: string | null;
  customerName: string;
  payable: number;
  receivable: number;
}

interface CustomerPaymentHistoryPoint {
  date: string;
  payable: number;
  receivable: number;
  net: number;
}

export function PaymentDashboardPage() {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();
  const [customerSummaries, setCustomerSummaries] = useState<CustomerPaymentSummary[]>([]);
  const [historicalData, setHistoricalData] = useState<CustomerPaymentHistoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!can(AccessPermission.DASHBOARD_PAYMENT)) {
      router.push("/dashboard");
    }
  }, [can, authLoading, router]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await apiRequest<{
        message: string;
        requestedAt: string;
        requestId: string;
        data: {
          customerSummaries: CustomerPaymentSummary[];
          historicalData: CustomerPaymentHistoryPoint[];
        };
      }>("/api/payments/dashboard");

      setCustomerSummaries(response.data.customerSummaries);
      
      // Sort historical data by date
      const sortedHistorical = [...response.data.historicalData].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setHistoricalData(sortedHistorical);
    } catch (err: any) {
      setError(err.message || "Failed to load payment dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading payment dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Payment Dashboard</h1>

      {error && <ErrorAlert message={error} />}

      {!error && (
        <>
          {/* Customer Payment Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead className="text-right">Payable</TableHead>
                    <TableHead className="text-right">Receivable</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerSummaries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500">
                        No payment data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    customerSummaries.map((customer) => (
                      <TableRow key={customer.customerId || 'anonymous'}>
                        <TableCell className="font-medium">
                          {customer.customerName}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {customer.payable.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {customer.receivable.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {(customer.receivable - customer.payable).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Customer Payment Line Graph */}
          {historicalData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Trends Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => value.toFixed(2)}
                      labelFormatter={(label) => {
                        const date = new Date(label);
                        return date.toLocaleDateString();
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="payable"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Payable"
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="receivable"
                      stroke="#22c55e"
                      strokeWidth={2}
                      name="Receivable"
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="net"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Net"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
