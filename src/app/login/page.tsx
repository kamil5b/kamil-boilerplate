'use client';

import { PublicLayout } from "@/client/layouts";
import { LoginPage } from "@/client/pages";
import { useAuth } from "@/client/hooks";

export default function LoginRoute() {
  const { login } = useAuth();
  
  return (
    <PublicLayout>
      <LoginPage onSuccess={login} />
    </PublicLayout>
  );
}
