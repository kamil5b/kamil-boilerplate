'use client';

import { ProtectedLayout } from '@/client/layouts';
import { TransactionFormPage } from '@/client/pages';
import { useRouter } from 'next/navigation';

export default function TransactionNewPage() {
  const router = useRouter();

  return (
    <ProtectedLayout>
      <TransactionFormPage
        onSuccess={() => router.push('/transactions')}
        onCancel={() => router.push('/transactions')}
      />
    </ProtectedLayout>
  );
}
