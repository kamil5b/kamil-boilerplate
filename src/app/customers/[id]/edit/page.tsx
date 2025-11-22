'use client';

import { use } from "react";
import { ProtectedLayout } from "@/client/layouts";
import { CustomerFormPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function EditCustomerRoute({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  return (
    <ProtectedLayout>
      <CustomerFormPage
        customerId={id}
        onSuccess={() => router.push("/customers")}
        onCancel={() => router.push("/customers")}
      />
    </ProtectedLayout>
  );
}
