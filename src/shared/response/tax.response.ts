export interface TaxResponse {
  id: string;
  name: string;
  value: number;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
  updatedByName?: string;
}
