'use client';

import { InventorySummaryPage } from '@/client/pages';
import { useRouter } from 'next/navigation';

export default function InventorySummaryPage_Route() {
  const router = useRouter();

  return (
    
      <InventorySummaryPage
        onBack={() => router.push('/inventory-histories')}
        onViewProduct={(productId: string) => router.push(`/inventory-histories/product/${productId}`)}
      />
    
  );
}
