'use client';

import { ProtectedLayout } from '@/client/layouts';
import { PaymentDetailPage } from '@/client/pages';
import { useRouter } from 'next/navigation';

export default function PaymentDetailPage_Route({ 
  params 
}: { 
  params: { id: string } 
}) {
  const router = useRouter();

  return (
    <ProtectedLayout>
      <PaymentDetailPage
        paymentId={params.id}
        onBack={() => router.push('/payments')}
      />
    </ProtectedLayout>
  );
}
