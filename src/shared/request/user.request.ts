import { PaginationRequest } from "./common.request";

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: string;
  remark?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  remark?: string;
}

export interface GetUsersRequest extends PaginationRequest {
  role?: string;
}
