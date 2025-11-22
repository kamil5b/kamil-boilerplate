'use client';

import { ProtectedLayout } from "@/client/layouts";
import { TransactionsListPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function TransactionsRoute() {
  const router = useRouter();
  
  return (
    <ProtectedLayout>
      <TransactionsListPage
        onCreate={() => router.push("/transactions/new")}
        onView={(id) => router.push(`/transactions/${id}`)}
      />
    </ProtectedLayout>
  );
}
