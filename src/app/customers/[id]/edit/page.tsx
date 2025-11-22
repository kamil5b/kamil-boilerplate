'use client';

import { ProtectedLayout } from "@/client/layouts";
import { CustomerFormPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function EditCustomerRoute({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  return (
    <ProtectedLayout>
      <CustomerFormPage
        customerId={params.id}
        onSuccess={() => router.push("/customers")}
        onCancel={() => router.push("/customers")}
      />
    </ProtectedLayout>
  );
}
