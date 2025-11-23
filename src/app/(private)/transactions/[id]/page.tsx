'use client';

import { use } from 'react';
import { TransactionDetailPage } from '@/client/pages';
import { useRouter } from 'next/navigation';

export default function TransactionDetailPage_Route({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const router = useRouter();
  const { id } = use(params);

  return (
    
      <TransactionDetailPage
        transactionId={id}
        onBack={() => router.push('/transactions')}
        onCreatePayment={(transactionId: string) => 
          router.push(`/payments/new?transactionId=${transactionId}`)
        }
      />
    
  );
}
