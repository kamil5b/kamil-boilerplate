'use client';

import { use } from "react";
import { ProtectedLayout } from "@/client/layouts";
import { UnitQuantityFormPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function EditUnitQuantityRoute({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  return (
    <ProtectedLayout>
      <UnitQuantityFormPage
        unitQuantityId={id}
        onSuccess={() => router.push("/unit-quantities")}
        onCancel={() => router.push("/unit-quantities")}
      />
    </ProtectedLayout>
  );
}
