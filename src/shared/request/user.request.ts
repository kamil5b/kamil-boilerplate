import { PaginationRequest } from "./common.request";

export interface CreateUserRequest {
  name: string;
  email: string;
  role: string;
  remark?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: string;
  remark?: string;
  // Password changes should be done via set-password or reset-password endpoints
}

export interface GetUsersRequest extends PaginationRequest {
  role?: string;
}
