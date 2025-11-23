'use client';

import { ProtectedLayout } from "@/client/layouts";

export default function PrivateGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
