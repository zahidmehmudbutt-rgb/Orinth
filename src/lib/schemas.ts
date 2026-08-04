import { z } from "zod";

export const emailSchema = z.string().email("Invalid email address").min(1, "Email is required");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain uppercase letter")
  .regex(/[a-z]/, "Must contain lowercase letter")
  .regex(/[0-9]/, "Must contain a number");

export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name is too long");

export const phoneSchema = z
  .string()
  .regex(
    /^(0[3][0-9]{2}[-]?[0-9]{7}|(\+?92)?3[0-9]{9})$/,
    "Invalid phone number"
  )
  .optional()
  .or(z.literal(""));

export const studentIdSchema = z
  .string()
  .min(1, "Student ID is required")
  .max(50, "Student ID is too long");

// Login form schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

// Registration/signup schema
export const signupSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
});

// Student login schema (uses student ID instead of email)
export const studentLoginSchema = z.object({
  studentId: studentIdSchema,
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type StudentLoginFormData = z.infer<typeof studentLoginSchema>;
