'use client';

import { ProtectedLayout } from '@/client/layouts';
import { InventorySummaryPage } from '@/client/pages';
import { useRouter } from 'next/navigation';

export default function InventorySummaryPage_Route() {
  const router = useRouter();

  return (
    <ProtectedLayout>
      <InventorySummaryPage
        onBack={() => router.push('/inventory-histories')}
        onViewProduct={(productId: string) => router.push(`/inventory-histories/product/${productId}`)}
      />
    </ProtectedLayout>
  );
}
