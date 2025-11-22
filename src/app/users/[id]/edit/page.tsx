'use client';

import { use } from "react";
import { ProtectedLayout } from "@/client/layouts";
import { UserFormPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function EditUserRoute({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  return (
    <ProtectedLayout>
      <UserFormPage
        userId={id}
        onSuccess={() => router.push("/users")}
        onCancel={() => router.back()}
      />
    </ProtectedLayout>
  );
}
