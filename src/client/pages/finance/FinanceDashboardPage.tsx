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

interface GrossSales {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

interface CashflowReport {
  inflow: number;
  outflow: number;
  netCashFlow: number;
}

interface TradeAccount {
  accountsReceivable: number;
  accountsPayable: number;
  outstandingBalance: number;
}

interface DeferredItems {
  unearnedRevenue: number;
  prepaidExpenses: number;
  netDeferredPosition: number;
}

interface BalanceSheetPosition {
  currentAssets: number;
  currentLiabilities: number;
  netWorkingCapital: number;
}

export function FinanceDashboardPage() {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();
  const [grossSales, setGrossSales] = useState<GrossSales | null>(null);
  const [cashflowReport, setCashflowReport] = useState<CashflowReport | null>(null);
  const [tradeAccount, setTradeAccount] = useState<TradeAccount | null>(null);
  const [deferredItems, setDeferredItems] = useState<DeferredItems | null>(null);
  const [balanceSheetPosition, setBalanceSheetPosition] = useState<BalanceSheetPosition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!can(AccessPermission.DASHBOARD_FINANCE)) {
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
          grossSales: GrossSales;
          cashflowReport: CashflowReport;
          tradeAccount: TradeAccount;
          deferredItems: DeferredItems;
          balanceSheetPosition: BalanceSheetPosition;
        };
      }>("/api/finance/dashboard");

      setGrossSales(response.data.grossSales);
      setCashflowReport(response.data.cashflowReport);
      setTradeAccount(response.data.tradeAccount);
      setDeferredItems(response.data.deferredItems);
      setBalanceSheetPosition(response.data.balanceSheetPosition);
    } catch (err: any) {
      setError(err.message || "Failed to load finance dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading finance dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Finance Dashboard</h1>

      {error && <ErrorAlert message={error} />}

      {!error && grossSales && cashflowReport && tradeAccount && deferredItems && balanceSheetPosition && (
        <>
          {/* Gross Sales Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Gross Sales (from Transactions)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    {grossSales.totalRevenue.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">From SELL transactions</p>
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
                    {grossSales.totalExpenses.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">From BUY transactions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Net Income
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-3xl font-bold ${grossSales.netIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {grossSales.netIncome.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Revenue - Expenses</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Cashflow Report Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Cashflow Report (from Payments)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Inflow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    {cashflowReport.inflow.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Positive Payment</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Outflow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600">
                    {cashflowReport.outflow.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Negative Payment</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Net Cash Flow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-3xl font-bold ${cashflowReport.netCashFlow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {cashflowReport.netCashFlow.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Inflow - Outflow</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Trade Account Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Trade Account</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Accounts Receivable
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-orange-600">
                    {tradeAccount.accountsReceivable.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Unpaid sales invoices</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Accounts Payable
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-600">
                    {tradeAccount.accountsPayable.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Unpaid purchases</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Outstanding Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-3xl font-bold ${tradeAccount.outstandingBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {tradeAccount.outstandingBalance.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">A/R - A/P</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Deferred Items Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Deferred Items</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Unearned Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-indigo-600">
                    {deferredItems.unearnedRevenue.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Advance payments from customers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Prepaid Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-yellow-600">
                    {deferredItems.prepaidExpenses.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Advance payments to suppliers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Net Deferred Position
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-3xl font-bold ${deferredItems.netDeferredPosition >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {deferredItems.netDeferredPosition.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">U/R - P/E</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Balance Sheet Position Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Balance Sheet Position</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Current Assets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    {balanceSheetPosition.currentAssets.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Cash + A/R</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Current Liabilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600">
                    {balanceSheetPosition.currentLiabilities.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">A/P + U/R</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Net Working Capital
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-3xl font-bold ${balanceSheetPosition.netWorkingCapital >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {balanceSheetPosition.netWorkingCapital.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">C/A - C/L</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
