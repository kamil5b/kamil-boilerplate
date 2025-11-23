import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

let transporter: Transporter | null = null;

/**
 * Initialize the mail transporter with SMTP configuration
 */
function getTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  const config: MailConfig = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "",
  };

  if (!config.auth.user || !config.auth.pass) {
    throw new Error("SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS environment variables.");
  }

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  return transporter;
}

/**
 * Send an email using the configured SMTP transporter
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const transporter = getTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || "";

    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log(`Email sent successfully to ${options.to}`);
  } catch (error) {
    console.error("Error sending email:", error);
    
    // Fallback: Log complete email details when SMTP fails
    console.error("\n============== FAILED EMAIL LOG ==============");
    console.error("Timestamp:", new Date().toISOString());
    console.error("To:", options.to);
    console.error("Subject:", options.subject);
    console.error("Text Content:");
    console.error(options.text || "(none)");
    console.error("\nHTML Content:");
    console.error(options.html || "(none)");
    console.error("\nSMTP Error:", error instanceof Error ? error.message : String(error));
    console.error("=============================================\n");
    
    throw new Error("Failed to send email");
  }
}

/**
 * Send account activation email
 */
export async function sendActivationEmail(email: string, activationToken: string): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const activationUrl = `${frontendUrl}/activate?token=${activationToken}`;
  
  try {

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Welcome! Activate Your Account</h2>
        <p>Thank you for registering. Please click the button below to activate your account:</p>
        <a href="${activationUrl}" class="button">Activate Account</a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #007bff;">${activationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <div class="footer">
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome! Activate Your Account
    
    Thank you for registering. Please visit the following link to activate your account:
    ${activationUrl}
    
    This link will expire in 24 hours.
    
    If you didn't create an account, please ignore this email.
  `;

    await sendEmail({
      to: email,
      subject: "Activate Your Account",
      html,
      text,
    });
  } catch (error) {
    console.error("\n============== FAILED ACTIVATION EMAIL ==============");
    console.error("Timestamp:", new Date().toISOString());
    console.error("Recipient:", email);
    console.error("Activation Token:", activationToken);
    console.error("Activation URL:", activationUrl);
    console.error("Error:", error instanceof Error ? error.message : String(error));
    console.error("====================================================\n");
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
  
  try {

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the button below to proceed:</p>
        <a href="${resetUrl}" class="button">Reset Password</a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #dc3545;">${resetUrl}</p>
        <div class="warning">
          <strong>Security Notice:</strong> This link will expire in 1 hour.
        </div>
        <div class="footer">
          <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Password Reset Request
    
    You requested to reset your password. Please visit the following link to proceed:
    ${resetUrl}
    
    This link will expire in 1 hour.
    
    If you didn't request a password reset, please ignore this email and your password will remain unchanged.
  `;

    await sendEmail({
      to: email,
      subject: "Reset Your Password",
      html,
      text,
    });
  } catch (error) {
    console.error("\n============== FAILED PASSWORD RESET EMAIL ==============");
    console.error("Timestamp:", new Date().toISOString());
    console.error("Recipient:", email);
    console.error("Reset Token:", resetToken);
    console.error("Reset URL:", resetUrl);
    console.error("Error:", error instanceof Error ? error.message : String(error));
    console.error("========================================================\n");
    throw error;
  }
}

/**
 * Send welcome email after successful account activation
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const loginUrl = `${frontendUrl}/login`;
  
  try {

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Welcome, ${name}!</h2>
        <p>Your account has been successfully activated. You can now log in and start using our platform.</p>
        <a href="${loginUrl}" class="button">Login Now</a>
        <p>We're excited to have you on board!</p>
        <div class="footer">
          <p>If you have any questions, feel free to contact our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome, ${name}!
    
    Your account has been successfully activated. You can now log in and start using our platform.
    
    Login at: ${loginUrl}
    
    We're excited to have you on board!
    
    If you have any questions, feel free to contact our support team.
  `;

    await sendEmail({
      to: email,
      subject: "Welcome to Our Platform",
      html,
      text,
    });
  } catch (error) {
    console.error("\n============== FAILED WELCOME EMAIL ==============");
    console.error("Timestamp:", new Date().toISOString());
    console.error("Recipient:", email);
    console.error("User Name:", name);
    console.error("Login URL:", loginUrl);
    console.error("Error:", error instanceof Error ? error.message : String(error));
    console.error("==================================================\n");
    throw error;
  }
}

/**
 * Send set password email for admin-created users
 */
export async function sendSetPasswordEmail(email: string, name: string, setPasswordToken: string): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const setPasswordUrl = `${frontendUrl}/set-password?token=${setPasswordToken}`;
  
  try {

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Welcome, ${name}!</h2>
        <p>An account has been created for you. Please click the button below to set your password and activate your account:</p>
        <a href="${setPasswordUrl}" class="button">Set Your Password</a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #007bff;">${setPasswordUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <div class="footer">
          <p>If you didn't expect this email, please ignore it or contact support.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome, ${name}!
    
    An account has been created for you. Please visit the following link to set your password and activate your account:
    ${setPasswordUrl}
    
    This link will expire in 24 hours.
    
    If you didn't expect this email, please ignore it or contact support.
  `;

    await sendEmail({
      to: email,
      subject: "Set Your Password",
      html,
      text,
    });
  } catch (error) {
    console.error("\n============== FAILED SET PASSWORD EMAIL ==============");
    console.error("Timestamp:", new Date().toISOString());
    console.error("Recipient:", email);
    console.error("User Name:", name);
    console.error("Set Password Token:", setPasswordToken);
    console.error("Set Password URL:", setPasswordUrl);
    console.error("Error:", error instanceof Error ? error.message : String(error));
    console.error("=======================================================\n");
    throw error;
  }
}

/**
 * Send password change confirmation email
 */
export async function sendPasswordChangedEmail(email: string, name: string): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const loginUrl = `${frontendUrl}/login`;
  
  try {

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        .alert { background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 12px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Password Changed Successfully</h2>
        <p>Hello ${name},</p>
        <p>Your password has been changed successfully. You can now log in with your new password.</p>
        <a href="${loginUrl}" class="button">Login Now</a>
        <div class="alert">
          <strong>Security Alert:</strong> If you didn't make this change, please contact support immediately.
        </div>
        <div class="footer">
          <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Password Changed Successfully
    
    Hello ${name},
    
    Your password has been changed successfully. You can now log in with your new password.
    
    Login at: ${loginUrl}
    
    Security Alert: If you didn't make this change, please contact support immediately.
    
    This is an automated notification. Please do not reply to this email.
  `;

    await sendEmail({
      to: email,
      subject: "Password Changed Successfully",
      html,
      text,
    });
  } catch (error) {
    console.error("\n============== FAILED PASSWORD CHANGED EMAIL ==============");
    console.error("Timestamp:", new Date().toISOString());
    console.error("Recipient:", email);
    console.error("User Name:", name);
    console.error("Login URL:", loginUrl);
    console.error("Error:", error instanceof Error ? error.message : String(error));
    console.error("===========================================================\n");
    throw error;
  }
}

/**
 * Test the SMTP connection
 */
export async function testSmtpConnection(): Promise<boolean> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log("SMTP connection successful");
    return true;
  } catch (error) {
    console.error("SMTP connection failed:", error);
    return false;
  }
}
