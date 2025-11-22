'use client';

import { ProtectedLayout } from '@/client/layouts';
import { TransactionDetailPage } from '@/client/pages';
import { useRouter } from 'next/navigation';

export default function TransactionDetailPage_Route({ 
  params 
}: { 
  params: { id: string } 
}) {
  const router = useRouter();

  return (
    <ProtectedLayout>
      <TransactionDetailPage
        transactionId={params.id}
        onBack={() => router.push('/transactions')}
        onCreatePayment={(transactionId: string) => 
          router.push(`/payments/new?transactionId=${transactionId}`)
        }
      />
    </ProtectedLayout>
  );
}
