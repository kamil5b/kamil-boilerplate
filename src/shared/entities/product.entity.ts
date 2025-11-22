export interface Product {
  id: string;
  name: string;
  description: string;
  type: string;
  remark: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  deletedAt: Date | null;
  deletedBy: string | null;
}
