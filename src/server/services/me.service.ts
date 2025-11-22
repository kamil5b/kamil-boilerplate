import { getDbClient } from "../db";
import { createUserRepository } from "../repositories";
import { AppError } from "../utils/error";
import { UserRole } from "@/shared/enums";

export interface MeResponse {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface MeService {
  getMe(userId: string): Promise<MeResponse>;
}

export function createMeService(): MeService {
  const userRepo = createUserRepository();

  return {
    async getMe(userId: string): Promise<MeResponse> {
      const client = await getDbClient();

      try {
        const user = await userRepo.findById(client, userId);

        if (!user) {
          throw new AppError("User not found", 404);
        }

        return {
          userId: user.id,
          email: user.email,
          role: user.role as UserRole,
          name: user.name,
        };
      } finally {
        client.release();
      }
    },
  };
}
