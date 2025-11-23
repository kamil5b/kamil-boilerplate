'use client';

import { TransactionFormPage } from '@/client/pages';
import { useRouter } from 'next/navigation';

export default function TransactionNewPage() {
  const router = useRouter();

  return (
    
      <TransactionFormPage
        onSuccess={() => router.push('/transactions')}
        onCancel={() => router.push('/transactions')}
      />
    
  );
}
