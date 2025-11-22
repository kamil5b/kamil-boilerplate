'use client';

import { ProtectedLayout } from "@/client/layouts";
import { ProductFormPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function EditProductRoute({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  return (
    <ProtectedLayout>
      <ProductFormPage
        productId={params.id}
        onSuccess={() => router.push("/products")}
        onCancel={() => router.push("/products")}
      />
    </ProtectedLayout>
  );
}
