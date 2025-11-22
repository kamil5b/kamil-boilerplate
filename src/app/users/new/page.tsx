'use client';

import { ProtectedLayout } from "@/client/layouts";
import { UserFormPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function CreateUserRoute() {
  const router = useRouter();
  
  return (
    <ProtectedLayout>
      <UserFormPage
        onSuccess={() => router.push("/users")}
        onCancel={() => router.back()}
      />
    </ProtectedLayout>
  );
}
