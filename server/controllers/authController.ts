import { Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { prisma } from "../db/prisma.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const resetTokens = new Map<string, { email: string; expires: number }>();

const JWT_SECRET = process.env.JWT_SECRET || "teamflow_super_secret_jwt_key_9911";
const JWT_EXPIRES_IN = "24h";

// Helper function to validate email structure
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export class AuthController {
  // Register a new user
  static async register(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, email, password, roleId } = req.body;

      // 1. Validation checks
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Full Name is required and cannot be empty." });
      }

      if (!email || !email.trim() || !isValidEmail(email)) {
        return res.status(400).json({ error: "A valid work email address is required." });
      }

      if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long for security." });
      }

      const parsedRoleId = Number(roleId);
      if (isNaN(parsedRoleId) || ![1, 2, 3].includes(parsedRoleId)) {
        return res.status(400).json({ error: "Invalid role selected. Role must be Admin (1), Manager (2), or Developer (3)." });
      }

      // Check if selected role actually exists in the MySQL db
      const dbRole = await prisma.role.findUnique({
        where: { id: parsedRoleId }
      });

      if (!dbRole) {
        return res.status(400).json({ error: `Selected role ID ${parsedRoleId} does not exist in the system.` });
      }

      // Check if email already taken
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      });

      if (existingUser) {
        return res.status(400).json({ error: "An account with this email address already exists." });
      }

      // 2. Hash password securely using bcrypt
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // 3. Create user record with Prisma
      const newUser = await prisma.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          passwordHash,
          roleId: parsedRoleId
        },
        include: {
          role: true
        }
      });

      // 4. Issue a JWT so they are logged in immediately upon registering
      const tokenPayload = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        roleId: newUser.roleId
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      // 5. Send payload back
      return res.status(201).json({
        message: "User registered successfully.",
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          roleId: newUser.roleId,
          roleName: newUser.role.name,
          createdAt: newUser.createdAt
        }
      });
    } catch (error: any) {
      console.error("Registration failed:", error);
      return res.status(500).json({ error: error.message || "An error occurred while creating your account." });
    }
  }

  // Login user
  static async login(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password } = req.body;

      // 1. Validation checks
      if (!email || !email.trim()) {
        return res.status(400).json({ error: "Please enter your work email address." });
      }

      if (!password || !password.trim()) {
        return res.status(400).json({ error: "Please enter your password." });
      }

      // 2. Retrieve user and their role relations from MySQL
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: { role: true }
      });

      if (!user) {
        return res.status(401).json({ 
          error: "Account not registered. Please create a new account to join TeamFlow.",
          isNewUser: true 
        });
      }

      // 3. Verify user password against hashed db value using bcrypt
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid email or password. Please try again." });
      }

      // 4. Create and sign JWT payload
      const tokenPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.roleId
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      // 5. Send token and user details to client
      return res.json({
        message: "Login successful.",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          roleId: user.roleId,
          roleName: user.role.name,
          createdAt: user.createdAt
        }
      });
    } catch (error: any) {
      console.error("Login failed:", error);
      return res.status(500).json({ error: error.message || "An unexpected error occurred during login." });
    }
  }

  // Get current authenticated user profile
  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized. Missing token context." });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { role: true }
      });

      if (!user) {
        return res.status(404).json({ error: "User profile not found in system." });
      }

      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          roleId: user.roleId,
          roleName: user.role.name,
          createdAt: user.createdAt
        }
      });
    } catch (error: any) {
      console.error("Retrieving profile failed:", error);
      return res.status(500).json({ error: error.message || "Failed to retrieve user profile." });
    }
  }

  // Update authenticated user profile
  static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized. Missing token context." });
      }

      const { name } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Full Name cannot be empty." });
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: { name: name.trim() },
        include: { role: true }
      });

      return res.json({
        message: "Profile updated successfully.",
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          roleId: updatedUser.roleId,
          roleName: updatedUser.role.name,
          createdAt: updatedUser.createdAt
        }
      });
    } catch (error: any) {
      console.error("Updating profile failed:", error);
      return res.status(500).json({ error: error.message || "Failed to update profile." });
    }
  }

  // Get list of all users
  static async getAllUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const users = await prisma.user.findMany({
        include: { role: true },
        orderBy: { name: "asc" }
      });

      const usersList = users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        roleId: u.roleId,
        roleName: u.role.name,
        createdAt: u.createdAt
      })).sort((a, b) => {
        if (a.roleId !== b.roleId) {
          return a.roleId - b.roleId;
        }
        return a.name.localeCompare(b.name);
      });

      return res.json({ users: usersList });
    } catch (error: any) {
      console.error("Retrieving users failed:", error);
      return res.status(500).json({ error: error.message || "Failed to retrieve user list." });
    }
  }

  // Request password reset token
  static async forgotPassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { email } = req.body;
      if (!email || !email.trim() || !isValidEmail(email)) {
        return res.status(400).json({ error: "Please enter a valid work email address." });
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      });

      if (!user) {
        // Return 200/Success for safety, but with realistic simulator information
        return res.json({
          message: "If an account exists with that email, a reset link has been dispatched.",
          email: email.toLowerCase().trim()
        });
      }

      // Generate secure random token
      const token = crypto.randomBytes(32).toString("hex");
      const expires = Date.now() + 3600000; // 1 hour expiry

      resetTokens.set(token, { email: user.email, expires });

      // Build reset URL
      const protocol = req.headers["x-forwarded-proto"] || "http";
      const host = req.headers["host"] || "localhost:3000";
      const resetUrl = `${protocol}://${host}/reset-password?token=${token}`;

      console.log(`[PASSWORD RESET LINK]: ${resetUrl}`);

      // Try sending mail with nodemailer
      let mailSent = false;
      try {
        const transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER || "mock_user",
            pass: process.env.SMTP_PASS || "mock_pass"
          }
        });

        if (process.env.SMTP_USER) {
          await transporter.sendMail({
            from: '"TeamFlow SaaS" <noreply@teamflow.io>',
            to: user.email,
            subject: "Reset Your TeamFlow Password",
            text: `We received a request to reset your password. Click the link to proceed: ${resetUrl}`,
            html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                     <h2 style="color: #0f172a; margin-bottom: 16px;">Reset Your Password</h2>
                     <p style="color: #475569; font-size: 14px; line-height: 1.5;">We received a request to reset your password for TeamFlow. Click the button below to set a new password:</p>
                     <p style="margin: 24px 0;"><a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">Reset Password</a></p>
                     <p style="color: #64748b; font-size: 12px; margin-top: 24px;">Or copy and paste this link in your browser: <br/><span style="font-family: monospace; word-break: break-all;">${resetUrl}</span></p>
                     <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                     <p style="color: #94a3b8; font-size: 11px;">This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
                   </div>`
          });
          mailSent = true;
        }
      } catch (mailErr) {
        console.warn("Mail dispatch failed; utilizing sandbox logging fallback.", mailErr);
      }

      return res.json({
        message: "Password reset instructions have been dispatched.",
        email: user.email,
        resetUrl: process.env.NODE_ENV !== "production" ? resetUrl : undefined,
        token: process.env.NODE_ENV !== "production" ? token : undefined
      });
    } catch (error: any) {
      console.error("Forgot password failed:", error);
      return res.status(500).json({ error: error.message || "An error occurred during password reset dispatch." });
    }
  }

  // Reset password using token
  static async resetPassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { token, password } = req.body;
      if (!token) {
        return res.status(400).json({ error: "Reset token is missing or invalid." });
      }

      if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long." });
      }

      const tokenData = resetTokens.get(token);
      if (!tokenData) {
        return res.status(400).json({ error: "The password reset token is invalid or has expired." });
      }

      if (Date.now() > tokenData.expires) {
        resetTokens.delete(token);
        return res.status(400).json({ error: "The password reset token has expired. Please request a new one." });
      }

      // Hash password securely
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Update in DB
      await prisma.user.update({
        where: { email: tokenData.email },
        data: { passwordHash }
      });

      // Delete the used token
      resetTokens.delete(token);

      return res.json({
        message: "Your password has been successfully reset. You may now log in with your new credentials."
      });
    } catch (error: any) {
      console.error("Reset password failed:", error);
      return res.status(500).json({ error: error.message || "An error occurred during password reset." });
    }
  }

  // Change password while logged in
  static async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized. Missing token context." });
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Both current password and new password are required." });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters long." });
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { id: req.user.id }
      });

      if (!user) {
        return res.status(404).json({ error: "User account not found." });
      }

      // Compare current password
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ error: "Current password is incorrect." });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash }
      });

      return res.json({
        message: "Password changed successfully."
      });
    } catch (error: any) {
      console.error("Change password failed:", error);
      return res.status(500).json({ error: error.message || "An error occurred while changing your password." });
    }
  }
}
