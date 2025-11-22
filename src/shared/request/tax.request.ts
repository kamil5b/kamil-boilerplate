import { PaginationRequest } from "./common.request";

export interface CreateTaxRequest {
  name: string;
  value: number;
  remark?: string;
}

export interface UpdateTaxRequest {
  name?: string;
  value?: number;
  remark?: string;
}

export interface GetTaxesRequest extends PaginationRequest {}
