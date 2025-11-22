'use client';

import { ProtectedLayout } from "@/client/layouts";
import { DashboardPage } from "@/client/pages";

export default function DashboardRoute() {
  return (
    <ProtectedLayout>
        <DashboardPage />
    </ProtectedLayout>
  );
}
