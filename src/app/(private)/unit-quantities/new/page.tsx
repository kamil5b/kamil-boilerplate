'use client';

import { UnitQuantityFormPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function NewUnitQuantityRoute() {
  const router = useRouter();
  
  return (
    
      <UnitQuantityFormPage
        onSuccess={() => router.push("/unit-quantities")}
        onCancel={() => router.push("/unit-quantities")}
      />
    
  );
}
