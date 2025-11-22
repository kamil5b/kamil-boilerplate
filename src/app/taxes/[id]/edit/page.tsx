'use client';

import { use } from "react";
import { ProtectedLayout } from "@/client/layouts";
import { TaxFormPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function EditTaxRoute({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  return (
    <ProtectedLayout>
      <TaxFormPage
        taxId={id}
        onSuccess={() => router.push("/taxes")}
        onCancel={() => router.push("/taxes")}
      />
    </ProtectedLayout>
  );
}
