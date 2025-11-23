'use client';

import { InventoryHistoriesListPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function InventoryHistoriesRoute() {
  const router = useRouter();
  
  return (
    
      <InventoryHistoriesListPage
        onManipulate={() => router.push("/inventory-histories/manipulate")}
      />
    
  );
}
