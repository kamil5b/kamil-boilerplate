'use client';

import { UserFormPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function CreateUserRoute() {
  const router = useRouter();
  
  return (
    
      <UserFormPage
        onSuccess={() => router.push("/users")}
        onCancel={() => router.back()}
      />
    
  );
}
