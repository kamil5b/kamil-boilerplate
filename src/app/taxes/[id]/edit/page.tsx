'use client';

import { ProtectedLayout } from "@/client/layouts";
import { TaxFormPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function EditTaxRoute({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  return (
    <ProtectedLayout>
      <TaxFormPage
        taxId={params.id}
        onSuccess={() => router.push("/taxes")}
        onCancel={() => router.push("/taxes")}
      />
    </ProtectedLayout>
  );
}
