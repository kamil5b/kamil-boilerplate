'use client';

import { ProtectedLayout } from "@/client/layouts";
import { FinanceDashboardPage } from "@/client/pages";

export default function FinanceDashboardRoute() {
  return (
    <ProtectedLayout>
      <FinanceDashboardPage />
    </ProtectedLayout>
  );
}
