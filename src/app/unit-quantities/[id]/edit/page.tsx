'use client';

import { ProtectedLayout } from "@/client/layouts";
import { UnitQuantityFormPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function EditUnitQuantityRoute({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  return (
    <ProtectedLayout>
      <UnitQuantityFormPage
        unitQuantityId={params.id}
        onSuccess={() => router.push("/unit-quantities")}
        onCancel={() => router.push("/unit-quantities")}
      />
    </ProtectedLayout>
  );
}
