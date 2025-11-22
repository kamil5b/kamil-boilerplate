export interface InventoryHistoryResponse {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitQuantityId: string;
  unitQuantityName: string;
  remark: string | null;
  createdAt: string;
  createdByName?: string;
}

export interface InventorySummaryResponse {
  productId: string;
  productName: string;
  quantities: {
    unitQuantityId: string;
    unitQuantityName: string;
    totalQuantity: number;
  }[];
}

export interface InventoryTimeSeriesResponse {
  productId: string;
  productName: string;
  unitQuantityId: string;
  unitQuantityName: string;
  data: {
    date: string;
    totalQuantity: number;
  }[];
}
