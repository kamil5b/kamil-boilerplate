'use client';

import { ProtectedLayout } from "@/client/layouts";
import { PaymentsListPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function PaymentsRoute() {
  const router = useRouter();
  
  return (
    <ProtectedLayout>
      <PaymentsListPage
        onCreate={() => router.push("/payments/new")}
        onView={(id) => router.push(`/payments/${id}`)}
      />
    </ProtectedLayout>
  );
}
