'use client';

import { ProductInventoryDetailPage } from '@/client/pages';
import { useRouter } from 'next/navigation';
import { use, useState, useEffect } from 'react';
import { fetchById } from '@/client/helpers';
import type { ProductResponse } from '@/shared';

export default function ProductInventoryDetailPage_Route({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const router = useRouter();
  const { id } = use(params);
  const [productName, setProductName] = useState('');

  useEffect(() => {
    fetchById<ProductResponse>('/api/products', id)
      .then((product) => setProductName(product.name))
      .catch(() => setProductName('Unknown Product'));
  }, [id]);

  return (
    
      <ProductInventoryDetailPage
        productId={id}
        productName={productName}
        onBack={() => router.push('/inventory-histories/summary')}
      />
    
  );
}
