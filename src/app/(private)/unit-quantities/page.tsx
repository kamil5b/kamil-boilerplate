'use client';

import { UnitQuantitiesListPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function UnitQuantitiesRoute() {
  const router = useRouter();
  
  return (
    
      <UnitQuantitiesListPage
        onEdit={(id) => router.push(`/unit-quantities/${id}/edit`)}
        onCreate={() => router.push("/unit-quantities/new")}
      />
    
  );
}
