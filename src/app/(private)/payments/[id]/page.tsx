'use client';

import { use } from 'react';
import { PaymentDetailPage } from '@/client/pages';
import { useRouter } from 'next/navigation';

export default function PaymentDetailPage_Route({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const router = useRouter();
  const { id } = use(params);

  return (
    
      <PaymentDetailPage
        paymentId={id}
        onBack={() => router.push('/payments')}
      />
    
  );
}
