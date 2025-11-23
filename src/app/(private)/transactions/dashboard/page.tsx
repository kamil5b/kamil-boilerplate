'use client';

import { TransactionDashboardPage } from '@/client/pages';
import { useRouter } from 'next/navigation';

export default function TransactionDashboardPage_Route() {
  const router = useRouter();

  return (
    
      <TransactionDashboardPage
        onViewProduct={(productId: string) => 
          router.push(`/transactions/product/${productId}`)
        }
      />
    
  );
}
