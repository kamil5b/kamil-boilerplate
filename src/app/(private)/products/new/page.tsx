'use client';

import { ProductFormPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function NewProductRoute() {
  const router = useRouter();
  
  return (
    
      <ProductFormPage
        onSuccess={() => router.push("/products")}
        onCancel={() => router.push("/products")}
      />
    
  );
}
