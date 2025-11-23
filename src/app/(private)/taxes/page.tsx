'use client';

import { TaxesListPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function TaxesRoute() {
  const router = useRouter();
  
  return (
    
      <TaxesListPage
        onEdit={(id) => router.push(`/taxes/${id}/edit`)}
        onCreate={() => router.push("/taxes/new")}
      />
    
  );
}
