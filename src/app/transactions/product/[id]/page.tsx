'use client';

import { ProtectedLayout } from '@/client/layouts';
import { ProductTransactionDetailPage } from '@/client/pages';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { fetchById } from '@/client/helpers';
import type { ProductResponse } from '@/shared';

export default function ProductTransactionDetailPage_Route({ 
  params 
}: { 
  params: { id: string } 
}) {
  const router = useRouter();
  const [productName, setProductName] = useState('');

  useEffect(() => {
    fetchById<ProductResponse>('/api/products', params.id)
      .then((product) => setProductName(product.name))
      .catch(() => setProductName('Unknown Product'));
  }, [params.id]);

  return (
    <ProtectedLayout>
      <ProductTransactionDetailPage
        productId={params.id}
        productName={productName}
        onBack={() => router.push('/transactions/dashboard')}
      />
    </ProtectedLayout>
  );
}
