'use client';

import { ProtectedLayout } from "@/client/layouts";
import { UserFormPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function EditUserRoute({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  return (
    <ProtectedLayout>
      <UserFormPage
        userId={params.id}
        onSuccess={() => router.push("/users")}
        onCancel={() => router.back()}
      />
    </ProtectedLayout>
  );
}
