export interface CustomerResponse {
  id: string;
  name: string;
  phoneNumber: string;
  email: string | null;
  address: string | null;
  description: string | null;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
  updatedByName?: string;
}
