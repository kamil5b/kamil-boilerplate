export interface Tax {
  id: string;
  name: string;
  value: number;
  remark: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  deletedAt: Date | null;
  deletedBy: string | null;
}
