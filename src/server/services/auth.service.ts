import { getDbClient } from "../db";
import { createUserRepository } from "../repositories";
import { AppError } from "../utils/error";
import { hashPassword, signToken } from "../utils/auth";
import { sendActivationEmail, sendPasswordResetEmail, sendPasswordChangedEmail, sendWelcomeEmail } from "../utils/mail";
import {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ActivateAccountRequest,
} from "@/shared/request";
import { LoginResponse, AuthTokenPayload } from "@/shared/response";
import { UserRole } from "@/shared/enums";
import crypto from "crypto";

export interface AuthService {
  login(data: LoginRequest): Promise<LoginResponse>;
  register(data: RegisterRequest): Promise<{ message: string }>;
  forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }>;
  resetPassword(data: ResetPasswordRequest): Promise<{ message: string }>;
  activateAccount(data: ActivateAccountRequest): Promise<{ message: string }>;
}

export function createAuthService(): AuthService {
  const userRepo = createUserRepository();

  return {
    async login(data) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const user = await userRepo.findByEmail(client, data.email);
        if (!user) {
          throw new AppError("Invalid email or password", 401);
        }

        const bcrypt = await import("bcryptjs");
        const isValidPassword = bcrypt.compareSync(data.password, user.passwordHash);
        if (!isValidPassword) {
          throw new AppError("Invalid email or password", 401);
        }

        if (!user.isActive) {
          throw new AppError("Account is not activated. Please check your email.", 403);
        }

        const payload: AuthTokenPayload = {
          userId: user.id,
          email: user.email,
          role: user.role,
        };

        const token = signToken(payload);

        await client.query("COMMIT");

        return {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async register(data) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        // Check if email already exists
        const existingUser = await userRepo.findByEmail(client, data.email);
        if (existingUser) {
          throw new AppError("Email already registered", 400);
        }

        // Hash password
        const passwordHash = hashPassword(data.password);

        // Generate activation token
        const activationToken = crypto.randomBytes(32).toString("hex");

        // Create user
        await userRepo.create(client, {
          name: data.name,
          email: data.email,
          passwordHash,
          role: data.role as UserRole,
          isActive: false,
          activationToken,
          resetPasswordToken: null,
          resetPasswordExpires: null,
          remark: null,
          createdBy: null,
          updatedBy: null,
          deletedAt: null,
          deletedBy: null,
        });

        // Send activation email with activationToken
        try {
          await sendActivationEmail(data.email, activationToken);
        } catch (emailError) {
          console.error("Failed to send activation email:", emailError);
          // Continue with registration even if email fails
        }

        await client.query("COMMIT");

        return {
          message: "Registration successful. Please check your email to activate your account.",
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async forgotPassword(data) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const user = await userRepo.findByEmail(client, data.email);
        if (!user) {
          // Don't reveal if email exists
          await client.query("COMMIT");
          return {
            message: "If the email exists, a password reset link has been sent.",
          };
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour

        await userRepo.update(client, user.id, {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetExpires,
        });

        // Send reset password email
        try {
          await sendPasswordResetEmail(data.email, resetToken);
        } catch (emailError) {
          console.error("Failed to send password reset email:", emailError);
          // Continue even if email fails
        }

        await client.query("COMMIT");

        return {
          message: "If the email exists, a password reset link has been sent.",
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async resetPassword(data) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const user = await userRepo.findByResetToken(client, data.token);
        if (!user) {
          throw new AppError("Invalid or expired reset token", 400);
        }

        const passwordHash = hashPassword(data.password);

        await userRepo.update(client, user.id, {
          passwordHash,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        });

        // Send password changed confirmation email
        try {
          await sendPasswordChangedEmail(user.email, user.name);
        } catch (emailError) {
          console.error("Failed to send password changed email:", emailError);
          // Continue even if email fails
        }

        await client.query("COMMIT");

        return {
          message: "Password reset successful. You can now login with your new password.",
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async activateAccount(data) {
      const client = await getDbClient();

      try {
        await client.query("BEGIN");

        const user = await userRepo.findByActivationToken(client, data.token);
        if (!user) {
          throw new AppError("Invalid or expired activation token", 400);
        }

        await userRepo.update(client, user.id, {
          isActive: true,
          activationToken: null,
        });

        // Send welcome email after activation
        try {
          await sendWelcomeEmail(user.email, user.name);
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
          // Continue even if email fails
        }

        await client.query("COMMIT");

        return {
          message: "Account activated successfully. You can now login.",
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
