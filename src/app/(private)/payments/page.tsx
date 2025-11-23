'use client';

import { PaymentsListPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function PaymentsRoute() {
  const router = useRouter();
  
  return (
    
      <PaymentsListPage
        onCreate={() => router.push("/payments/new")}
        onView={(id) => router.push(`/payments/${id}`)}
      />
    
  );
}
