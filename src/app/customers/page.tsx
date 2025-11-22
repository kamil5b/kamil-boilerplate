'use client';

import { ProtectedLayout } from "@/client/layouts";
import { CustomersListPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function CustomersRoute() {
  const router = useRouter();
  
  return (
    <ProtectedLayout>
      <CustomersListPage
        onEdit={(id) => router.push(`/customers/${id}/edit`)}
        onCreate={() => router.push("/customers/new")}
      />
    </ProtectedLayout>
  );
}
