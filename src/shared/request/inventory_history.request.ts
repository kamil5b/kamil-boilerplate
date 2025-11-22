import { PaginationRequest } from "./common.request";

export interface GetInventoryHistoriesRequest extends PaginationRequest {
  productId?: string;
  unitQuantityId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ManipulateInventoryRequest {
  items: {
    productId: string;
    quantity: number;
    unitQuantityId: string;
    remark?: string;
  }[];
  remark?: string;
}

export interface GetInventorySummaryRequest {
  productId?: string;
}
