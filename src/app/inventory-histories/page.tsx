'use client';

import { ProtectedLayout } from "@/client/layouts";
import { InventoryHistoriesListPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function InventoryHistoriesRoute() {
  const router = useRouter();
  
  return (
    <ProtectedLayout>
      <InventoryHistoriesListPage
        onManipulate={() => router.push("/inventory-histories/manipulate")}
      />
    </ProtectedLayout>
  );
}
