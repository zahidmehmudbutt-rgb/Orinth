/**
 * Validation utilities for form inputs
 */

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  const trimmed = email.trim();

  if (!trimmed) {
    return { valid: false, error: "Email is required" };
  }

  if (trimmed.length > 255) {
    return { valid: false, error: "Email is too long" };
  }

  if (!isValidEmail(trimmed)) {
    return { valid: false, error: "Please enter a valid email address" };
  }

  return { valid: true };
}

// Password validation
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: "Password is required" };
  }

  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }

  if (password.length > 128) {
    return { valid: false, error: "Password is too long" };
  }

  return { valid: true };
}

export function validateNewPassword(password: string): { valid: boolean; error?: string; strength?: "weak" | "medium" | "strong" } {
  const result = validatePassword(password);
  if (!result.valid) return result;

  // Check password strength
  let strength: "weak" | "medium" | "strong" = "weak";
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score >= 5) {
    strength = "strong";
  } else if (score >= 3) {
    strength = "medium";
  }

  if (strength === "weak") {
    return {
      valid: false,
      error: "Password is too weak. Include uppercase, lowercase, numbers, and symbols.",
      strength
    };
  }

  return { valid: true, strength };
}

// Name validation
export function validateName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();

  if (!trimmed) {
    return { valid: false, error: "Name is required" };
  }

  if (trimmed.length < 2) {
    return { valid: false, error: "Name must be at least 2 characters" };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: "Name is too long" };
  }

  // Check for invalid characters (allow letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s\-'.]+$/.test(trimmed)) {
    return { valid: false, error: "Name contains invalid characters" };
  }

  return { valid: true };
}

// Phone validation (Pakistani format)
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone) {
    return { valid: true }; // Phone is optional
  }

  const cleaned = phone.replace(/\D/g, "");

  // Pakistani mobile numbers: 03XX-XXXXXXX (11 digits) or 923XXXXXXXXX (12 digits)
  if (cleaned.length === 11 && cleaned.startsWith("03")) {
    return { valid: true };
  }

  if (cleaned.length === 12 && cleaned.startsWith("92")) {
    return { valid: true };
  }

  if (cleaned.length === 10 && cleaned.startsWith("3")) {
    return { valid: true };
  }

  return { valid: false, error: "Please enter a valid Pakistani phone number (e.g., 03XX-XXXXXXX)" };
}

// Student ID validation
export function validateStudentId(studentId: string): { valid: boolean; error?: string } {
  const trimmed = studentId.trim();

  if (!trimmed) {
    return { valid: false, error: "Student ID is required" };
  }

  if (trimmed.length < 3) {
    return { valid: false, error: "Student ID must be at least 3 characters" };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: "Student ID is too long" };
  }

  // Allow alphanumeric and hyphens
  if (!/^[a-zA-Z0-9-]+$/.test(trimmed)) {
    return { valid: false, error: "Student ID can only contain letters, numbers, and hyphens" };
  }

  return { valid: true };
}

/**
 * Parse Supabase auth error and return user-friendly message
 */
export function parseAuthError(error: { message?: string; status?: number; code?: string } | null): string {
  if (!error) return "An unexpected error occurred";

  const message = error.message?.toLowerCase() || "";
  const code = error.code?.toLowerCase() || "";

  // Invalid credentials
  if (message.includes("invalid login credentials") || message.includes("invalid_credentials")) {
    return "Invalid email or password. Please check your credentials and try again.";
  }

  // Email not confirmed
  if (message.includes("email not confirmed") || code.includes("email_not_confirmed")) {
    return "Please verify your email address before signing in. Check your inbox for the verification link.";
  }

  // User not found
  if (message.includes("user not found") || message.includes("no user")) {
    return "No account found with this email address.";
  }

  // Too many requests
  if (message.includes("too many requests") || message.includes("rate limit") || error.status === 429) {
    return "Too many login attempts. Please wait a few minutes before trying again.";
  }

  // Network error
  if (message.includes("network") || message.includes("fetch")) {
    return "Network error. Please check your internet connection and try again.";
  }

  // Session expired
  if (message.includes("session") || message.includes("expired") || message.includes("refresh_token")) {
    return "Your session has expired. Please sign in again.";
  }

  // Email already exists
  if (message.includes("already registered") || message.includes("already exists") || message.includes("duplicate")) {
    return "An account with this email already exists.";
  }

  // Weak password
  if (message.includes("password") && (message.includes("weak") || message.includes("short") || message.includes("strength"))) {
    return "Password is too weak. Please use at least 8 characters with a mix of letters, numbers, and symbols.";
  }

  // Invalid email format
  if (message.includes("invalid email") || message.includes("valid email")) {
    return "Please enter a valid email address.";
  }

  // Account disabled/banned
  if (message.includes("disabled") || message.includes("banned") || message.includes("blocked")) {
    return "This account has been disabled. Please contact the school administrator.";
  }

  // Server error
  if (error.status && error.status >= 500) {
    return "The server encountered an error. Please wait a moment and try again.";
  }

  // Default message (don't expose technical details)
  return "Unable to sign in. Please check your credentials and try again.";
}

/**
 * Parse Supabase database error
 */
export function parseDbError(error: { message?: string; code?: string; details?: string } | null): string {
  if (!error) return "An unexpected error occurred";

  const message = error.message?.toLowerCase() || "";
  const code = error.code || "";

  // Unique constraint violation
  if (code === "23505" || message.includes("duplicate") || message.includes("unique")) {
    if (message.includes("email")) {
      return "This email is already in use.";
    }
    if (message.includes("student_id")) {
      return "This student ID already exists.";
    }
    return "This record already exists.";
  }

  // Foreign key violation
  if (code === "23503" || message.includes("foreign key")) {
    return "Referenced record does not exist.";
  }

  // Not null violation
  if (code === "23502" || message.includes("not-null")) {
    return "Required field is missing.";
  }

  // Permission denied
  if (message.includes("permission") || message.includes("denied") || message.includes("policy")) {
    return "You don't have permission to perform this action.";
  }

  // Row not found
  if (code === "PGRST116" || message.includes("no rows")) {
    return "Record not found.";
  }

  return "An error occurred while saving data. Check your connection and try again.";
}
