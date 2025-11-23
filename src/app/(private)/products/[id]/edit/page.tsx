'use client';

import { use } from "react";
import { ProductFormPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function EditProductRoute({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  return (
    
      <ProductFormPage
        productId={id}
        onSuccess={() => router.push("/products")}
        onCancel={() => router.push("/products")}
      />
    
  );
}
