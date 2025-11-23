export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string | null;
  role: string;
  isActive: boolean;
  activationToken: string | null;
  resetPasswordToken: string | null;
  resetPasswordExpires: Date | null;
  setPasswordToken: string | null;
  setPasswordExpires: Date | null;
  remark: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
  deletedAt: Date | null;
  deletedBy: string | null;
}
