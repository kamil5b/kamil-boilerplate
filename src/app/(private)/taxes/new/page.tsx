'use client';

import { TaxFormPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function NewTaxRoute() {
  const router = useRouter();
  
  return (
    
      <TaxFormPage
        onSuccess={() => router.push("/taxes")}
        onCancel={() => router.push("/taxes")}
      />
    
  );
}
