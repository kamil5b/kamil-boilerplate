'use client';

import { use } from "react";
import { ProtectedLayout } from "@/client/layouts";
import { ProductFormPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function EditProductRoute({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  return (
    <ProtectedLayout>
      <ProductFormPage
        productId={id}
        onSuccess={() => router.push("/products")}
        onCancel={() => router.push("/products")}
      />
    </ProtectedLayout>
  );
}
