'use client';

import { use } from "react";
import { UserFormPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function EditUserRoute({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  return (
    
      <UserFormPage
        userId={id}
        onSuccess={() => router.push("/users")}
        onCancel={() => router.back()}
      />
    
  );
}
