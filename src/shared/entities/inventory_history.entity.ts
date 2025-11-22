export interface InventoryHistory {
  id: string;
  productId: string;
  quantity: number;
  unitQuantityId: string;
  remark: string | null;
  createdAt: Date;
  createdBy: string;
}
