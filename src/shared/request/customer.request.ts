import { PaginationRequest } from "./common.request";

export interface CreateCustomerRequest {
  name: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  description?: string;
  remark?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  description?: string;
  remark?: string;
}

export interface GetCustomersRequest extends PaginationRequest {}
