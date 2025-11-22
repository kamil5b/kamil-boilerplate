import { PaginationRequest } from "./common.request";

export interface CreateProductRequest {
  name: string;
  description: string;
  type: string;
  remark?: string;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  type?: string;
  remark?: string;
}

export interface GetProductsRequest extends PaginationRequest {
  type?: string;
}
