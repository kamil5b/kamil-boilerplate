'use client';

import { ProtectedLayout } from "@/client/layouts";
import { CustomerFormPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function NewCustomerRoute() {
  const router = useRouter();
  
  return (
    <ProtectedLayout>
      <CustomerFormPage
        onSuccess={() => router.push("/customers")}
        onCancel={() => router.push("/customers")}
      />
    </ProtectedLayout>
  );
}
