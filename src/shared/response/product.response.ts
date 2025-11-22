export interface ProductResponse {
  id: string;
  name: string;
  description: string;
  type: string;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
  updatedByName?: string;
}
