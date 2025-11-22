export interface BaseResponse {
  message: string;
  requestedAt: string;
  requestId: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
}

export interface PaginatedResponse<T> extends BaseResponse {
  meta: PaginationMeta;
  items: T[];
}

export interface DataResponse<T> extends BaseResponse {
  data: T;
}
