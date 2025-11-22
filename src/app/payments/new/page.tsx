'use client';

import { ProtectedLayout } from "@/client/layouts";
import { PaymentFormPage } from "@/client/pages";
import { useRouter, useSearchParams } from "next/navigation";

export default function NewPaymentRoute() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transactionId') || undefined;
  
  return (
    <ProtectedLayout>
      <PaymentFormPage
        transactionId={transactionId}
        onSuccess={() => router.push("/payments")}
        onCancel={() => router.push("/payments")}
      />
    </ProtectedLayout>
  );
}
