'use client';

import { ProtectedLayout } from "@/client/layouts";
import { UnitQuantitiesListPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function UnitQuantitiesRoute() {
  const router = useRouter();
  
  return (
    <ProtectedLayout>
      <UnitQuantitiesListPage
        onEdit={(id) => router.push(`/unit-quantities/${id}/edit`)}
        onCreate={() => router.push("/unit-quantities/new")}
      />
    </ProtectedLayout>
  );
}
