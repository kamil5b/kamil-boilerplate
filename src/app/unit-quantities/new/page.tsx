'use client';

import { ProtectedLayout } from "@/client/layouts";
import { UnitQuantityFormPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function NewUnitQuantityRoute() {
  const router = useRouter();
  
  return (
    <ProtectedLayout>
      <UnitQuantityFormPage
        onSuccess={() => router.push("/unit-quantities")}
        onCancel={() => router.push("/unit-quantities")}
      />
    </ProtectedLayout>
  );
}
