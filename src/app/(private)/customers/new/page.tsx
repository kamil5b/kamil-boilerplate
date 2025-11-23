'use client';

import { CustomerFormPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function NewCustomerRoute() {
  const router = useRouter();
  
  return (
    
      <CustomerFormPage
        onSuccess={() => router.push("/customers")}
        onCancel={() => router.push("/customers")}
      />
    
  );
}
