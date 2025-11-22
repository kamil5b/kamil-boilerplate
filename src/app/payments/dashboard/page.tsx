'use client';

import { ProtectedLayout } from "@/client/layouts";
import { PaymentDashboardPage } from "@/client/pages";

export default function PaymentDashboardRoute() {
  return (
    <ProtectedLayout>
      <PaymentDashboardPage />
    </ProtectedLayout>
  );
}
