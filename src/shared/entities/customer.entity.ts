export interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
  email: string | null;
  address: string | null;
  description: string | null;
  remark: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  deletedAt: Date | null;
  deletedBy: string | null;
}
