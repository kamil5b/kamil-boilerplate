'use client';

import { InventoryManipulatePage } from '@/client/pages';
import { useRouter } from 'next/navigation';

export default function InventoryManipulatePage_Route() {
  const router = useRouter();

  return (
    
      <InventoryManipulatePage
        onSuccess={() => router.push('/inventory-histories')}
        onCancel={() => router.push('/inventory-histories')}
      />
    
  );
}
