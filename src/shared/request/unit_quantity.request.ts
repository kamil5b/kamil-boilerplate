import { PaginationRequest } from "./common.request";

export interface CreateUnitQuantityRequest {
  name: string;
  remark?: string;
}

export interface UpdateUnitQuantityRequest {
  name?: string;
  remark?: string;
}

export interface GetUnitQuantitiesRequest extends PaginationRequest {}
