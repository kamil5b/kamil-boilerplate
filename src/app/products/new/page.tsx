'use client';

import { ProtectedLayout } from "@/client/layouts";
import { ProductFormPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function NewProductRoute() {
  const router = useRouter();
  
  return (
    <ProtectedLayout>
      <ProductFormPage
        onSuccess={() => router.push("/products")}
        onCancel={() => router.push("/products")}
      />
    </ProtectedLayout>
  );
}
