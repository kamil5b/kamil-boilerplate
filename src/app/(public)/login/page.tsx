'use client';

import { LoginPage } from "@/client/pages";
import { useAuth } from "@/client/hooks";

export default function LoginRoute() {
  const { login } = useAuth();
  
  return <LoginPage onSuccess={login} />;
}
