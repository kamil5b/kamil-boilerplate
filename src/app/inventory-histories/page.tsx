'use client';

import { ProtectedLayout } from "@/client/layouts";
import { InventoryHistoriesListPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function InventoryHistoriesRoute() {
  const router = useRouter();
  
  return (
    <ProtectedLayout>
      <InventoryHistoriesListPage
        onViewSummary={() => router.push("/inventory-histories/summary")}
        onManipulate={() => router.push("/inventory-histories/manipulate")}
      />
    </ProtectedLayout>
  );
}
