'use client';

import { ProtectedLayout } from "@/client/layouts";
import { TaxFormPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function NewTaxRoute() {
  const router = useRouter();
  
  return (
    <ProtectedLayout>
      <TaxFormPage
        onSuccess={() => router.push("/taxes")}
        onCancel={() => router.push("/taxes")}
      />
    </ProtectedLayout>
  );
}
