export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
  updatedByName?: string;
}
