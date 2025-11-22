'use client';

import { PublicLayout } from "@/client/layouts";
import { RegisterPage } from "@/client/pages";

export default function RegisterRoute() {
  return (
    <PublicLayout>
      <RegisterPage />
    </PublicLayout>
  );
}
