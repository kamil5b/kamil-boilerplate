'use client';

import { TransactionsListPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function TransactionsRoute() {
  const router = useRouter();
  
  return (
    
      <TransactionsListPage
        onCreate={() => router.push("/transactions/new")}
        onView={(id) => router.push(`/transactions/${id}`)}
      />
    
  );
}
