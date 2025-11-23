'use client';

import { UsersListPage } from "@/client/pages";
import { useRouter } from "next/navigation";

export default function UsersRoute() {
  const router = useRouter();
  
  return (
    
      <UsersListPage
        onEdit={(id) => router.push(`/users/${id}/edit`)}
        onCreate={() => router.push("/users/new")}
      />
    
  );
}
