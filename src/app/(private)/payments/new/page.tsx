'use client';

import { Suspense } from "react";
import { PaymentFormPage } from "@/client/pages";
import { useRouter, useSearchParams } from "next/navigation";

function NewPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transactionId') || undefined;
  
  return (
    <PaymentFormPage
      transactionId={transactionId}
      onSuccess={() => router.push("/payments")}
      onCancel={() => router.push("/payments")}
    />
  );
}

export default function NewPaymentRoute() {
  return (
    
      <Suspense fallback={<div>Loading...</div>}>
        <NewPaymentContent />
      </Suspense>
    
  );
}
