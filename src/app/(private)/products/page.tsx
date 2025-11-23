'use client';

import { ProductsListPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function ProductsRoute() {
  const router = useRouter();
  
  return (
    
      <ProductsListPage
        onEdit={(id) => router.push(`/products/${id}/edit`)}
        onCreate={() => router.push("/products/new")}
      />
    
  );
}
