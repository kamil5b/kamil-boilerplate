'use client';

import { ProtectedLayout } from "@/client/layouts";
import { ProductsListPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function ProductsRoute() {
  const router = useRouter();
  
  return (
    <ProtectedLayout>
      <ProductsListPage
        onEdit={(id) => router.push(`/products/${id}/edit`)}
        onCreate={() => router.push("/products/new")}
      />
    </ProtectedLayout>
  );
}
