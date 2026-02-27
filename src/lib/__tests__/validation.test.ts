import { describe, it, expect } from "vitest";
import {
  validateEmail,
  validateNewPassword,
  validateName,
  validatePhone,
  validateStudentId,
  parseAuthError,
  parseDbError,
} from "../validation";

// ── validateEmail ──────────────────────────────────────────────

describe("validateEmail", () => {
  it("accepts a standard valid email", () => {
    expect(validateEmail("user@example.com")).toEqual({ valid: true });
  });

  it("accepts emails with subdomains", () => {
    expect(validateEmail("user@mail.example.co.uk")).toEqual({ valid: true });
  });

  it("trims whitespace before validating", () => {
    expect(validateEmail("  user@example.com  ")).toEqual({ valid: true });
  });

  it("rejects an empty string", () => {
    const result = validateEmail("");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Email is required");
  });

  it("rejects whitespace-only input", () => {
    const result = validateEmail("   ");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Email is required");
  });

  it("rejects email without @", () => {
    const result = validateEmail("userexample.com");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Please enter a valid email address");
  });

  it("rejects email without domain", () => {
    const result = validateEmail("user@");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Please enter a valid email address");
  });

  it("rejects email without local part", () => {
    const result = validateEmail("@example.com");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Please enter a valid email address");
  });

  it("rejects emails longer than 255 characters", () => {
    const longEmail = "a".repeat(250) + "@b.com";
    const result = validateEmail(longEmail);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Email is too long");
  });
});

// ── validateNewPassword ────────────────────────────────────────

describe("validateNewPassword", () => {
  it("rejects empty password", () => {
    const result = validateNewPassword("");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Password is required");
  });

  it("rejects passwords shorter than 8 characters", () => {
    const result = validateNewPassword("Ab1!xyz");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Password must be at least 8 characters");
  });

  it("marks a simple lowercase 8-char password as weak", () => {
    // length >= 8 (1 point) + has lowercase (1 point) = score 2 => weak
    const result = validateNewPassword("abcdefgh");
    expect(result.valid).toBe(false);
    expect(result.strength).toBe("weak");
  });

  it("marks a password with mixed case and numbers as medium (score 4)", () => {
    // "Abcdefg1" => length>=8 (1), lowercase (1), uppercase (1), digit (1) = score 4 => medium
    const result = validateNewPassword("Abcdefg1");
    expect(result.valid).toBe(true);
    expect(result.strength).toBe("medium");
  });

  it("marks a 12+ char password with all character types as strong", () => {
    // "Abcdefghij1!" => length>=8 (1), length>=12 (1), lower (1), upper (1), digit (1), symbol (1) = 6 => strong
    const result = validateNewPassword("Abcdefghij1!");
    expect(result.valid).toBe(true);
    expect(result.strength).toBe("strong");
  });

  it("rejects passwords that exceed 128 characters", () => {
    const result = validateNewPassword("A1!a" + "x".repeat(126));
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Password is too long");
  });

  it("rejects common passwords like 'password123'", () => {
    const result = validateNewPassword("password123");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("too common");
    expect(result.strength).toBe("weak");
  });

  it("rejects common passwords case-insensitively", () => {
    const result = validateNewPassword("Password1");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("too common");
  });

  it("rejects 'admin123' as a common password", () => {
    const result = validateNewPassword("admin123");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("too common");
  });
});

// ── validateName ───────────────────────────────────────────────

describe("validateName", () => {
  it("accepts a standard English name", () => {
    expect(validateName("John Doe")).toEqual({ valid: true });
  });

  it("accepts names with hyphens and apostrophes", () => {
    expect(validateName("O'Brien-Smith")).toEqual({ valid: true });
  });

  it("rejects empty string", () => {
    const result = validateName("");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Name is required");
  });

  it("rejects single character names", () => {
    const result = validateName("A");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Name must be at least 2 characters");
  });

  it("rejects names with digits", () => {
    const result = validateName("John123");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Name contains invalid characters");
  });

  it("accepts names with Urdu characters", () => {
    const result = validateName("\u0627\u062D\u0645\u062F");
    expect(result.valid).toBe(true);
  });

  it("accepts names with mixed English and Urdu characters", () => {
    const result = validateName("Ahmed \u0627\u062D\u0645\u062F");
    expect(result.valid).toBe(true);
  });

  it("rejects names longer than 100 characters", () => {
    const longName = "A".repeat(101);
    const result = validateName(longName);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Name is too long");
  });

  it("trims whitespace before validation", () => {
    expect(validateName("  Ali  ")).toEqual({ valid: true });
  });
});

// ── validatePhone ──────────────────────────────────────────────

describe("validatePhone", () => {
  it("returns valid for empty (phone is optional)", () => {
    expect(validatePhone("")).toEqual({ valid: true });
  });

  it("accepts 03XX-XXXXXXX format (11 digits)", () => {
    expect(validatePhone("03001234567")).toEqual({ valid: true });
  });

  it("accepts formatted 03XX with dashes", () => {
    // cleaned: 03001234567 (11 digits starting with 03)
    expect(validatePhone("0300-1234567")).toEqual({ valid: true });
  });

  it("accepts +923XXXXXXXXX format (12 digits)", () => {
    expect(validatePhone("+923001234567")).toEqual({ valid: true });
  });

  it("accepts 10-digit number starting with 3", () => {
    expect(validatePhone("3001234567")).toEqual({ valid: true });
  });

  it("rejects numbers with wrong prefix", () => {
    const result = validatePhone("05001234567");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("valid Pakistani phone number");
  });

  it("rejects numbers that are too short", () => {
    const result = validatePhone("0300123");
    expect(result.valid).toBe(false);
  });

  it("rejects numbers that are too long", () => {
    const result = validatePhone("030012345678901");
    expect(result.valid).toBe(false);
  });
});

// ── validateStudentId ──────────────────────────────────────────

describe("validateStudentId", () => {
  it("accepts a valid alphanumeric ID", () => {
    expect(validateStudentId("STD-001")).toEqual({ valid: true });
  });

  it("accepts numeric-only IDs", () => {
    expect(validateStudentId("12345")).toEqual({ valid: true });
  });

  it("rejects empty string", () => {
    const result = validateStudentId("");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Student ID is required");
  });

  it("rejects IDs shorter than 3 characters", () => {
    const result = validateStudentId("AB");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Student ID must be at least 3 characters");
  });

  it("rejects IDs longer than 20 characters", () => {
    const result = validateStudentId("A".repeat(21));
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Student ID is too long");
  });

  it("rejects IDs with special characters", () => {
    const result = validateStudentId("STD@001");
    expect(result.valid).toBe(false);
    expect(result.error).toBe(
      "Student ID can only contain letters, numbers, and hyphens"
    );
  });
});

// ── parseAuthError ─────────────────────────────────────────────

describe("parseAuthError", () => {
  it("returns default message for null error", () => {
    expect(parseAuthError(null)).toBe("An unexpected error occurred");
  });

  it("maps invalid login credentials", () => {
    expect(
      parseAuthError({ message: "Invalid login credentials" })
    ).toBe(
      "Invalid email or password. Please check your credentials and try again."
    );
  });

  it("maps invalid_credentials code variant", () => {
    expect(
      parseAuthError({ message: "invalid_credentials" })
    ).toBe(
      "Invalid email or password. Please check your credentials and try again."
    );
  });

  it("maps email not confirmed", () => {
    expect(
      parseAuthError({ message: "Email not confirmed" })
    ).toContain("verify your email");
  });

  it("maps email_not_confirmed code", () => {
    expect(
      parseAuthError({ code: "email_not_confirmed" })
    ).toContain("verify your email");
  });

  it("maps user not found", () => {
    expect(
      parseAuthError({ message: "User not found" })
    ).toContain("No account found");
  });

  it("maps rate limit / 429", () => {
    expect(parseAuthError({ status: 429 })).toContain("Too many login attempts");
  });

  it("maps too many requests by message", () => {
    expect(
      parseAuthError({ message: "Too many requests" })
    ).toContain("Too many login attempts");
  });

  it("maps network errors", () => {
    expect(
      parseAuthError({ message: "Network error occurred" })
    ).toContain("Network error");
  });

  it("maps session expired", () => {
    expect(
      parseAuthError({ message: "Session expired" })
    ).toContain("session has expired");
  });

  it("maps already registered", () => {
    expect(
      parseAuthError({ message: "User already registered" })
    ).toContain("already exists");
  });

  it("maps weak password", () => {
    expect(
      parseAuthError({ message: "Password is too weak" })
    ).toContain("too weak");
  });

  it("maps invalid email format", () => {
    expect(
      parseAuthError({ message: "Invalid email format" })
    ).toContain("valid email");
  });

  it("maps disabled account", () => {
    expect(
      parseAuthError({ message: "Account disabled" })
    ).toContain("disabled");
  });

  it("maps 500+ server errors", () => {
    expect(
      parseAuthError({ status: 500, message: "Internal" })
    ).toContain("server encountered an error");
  });

  it("returns fallback for unknown errors", () => {
    expect(
      parseAuthError({ message: "something very unusual" })
    ).toBe("Unable to sign in. Please check your credentials and try again.");
  });
});

// ── parseDbError ───────────────────────────────────────────────

describe("parseDbError", () => {
  it("returns default message for null error", () => {
    expect(parseDbError(null)).toBe("An unexpected error occurred");
  });

  it("maps unique constraint violation code 23505", () => {
    expect(parseDbError({ code: "23505" })).toBe("This record already exists.");
  });

  it("maps unique constraint on email", () => {
    expect(
      parseDbError({ code: "23505", message: "duplicate key email" })
    ).toBe("This email is already in use.");
  });

  it("maps unique constraint on student_id", () => {
    expect(
      parseDbError({ code: "23505", message: "duplicate key student_id" })
    ).toBe("This student ID already exists.");
  });

  it("maps foreign key violation code 23503", () => {
    expect(parseDbError({ code: "23503" })).toBe(
      "Referenced record does not exist."
    );
  });

  it("maps not null violation code 23502", () => {
    expect(parseDbError({ code: "23502" })).toBe("Required field is missing.");
  });

  it("maps permission denied", () => {
    expect(
      parseDbError({ message: "Permission denied for table" })
    ).toBe("You don't have permission to perform this action.");
  });

  it("maps RLS policy error", () => {
    expect(
      parseDbError({ message: "new row violates row-level security policy" })
    ).toBe("You don't have permission to perform this action.");
  });

  it("maps PGRST116 no rows", () => {
    expect(parseDbError({ code: "PGRST116" })).toBe("Record not found.");
  });

  it("returns fallback for unknown DB errors", () => {
    expect(
      parseDbError({ message: "something unknown" })
    ).toBe(
      "An error occurred while saving data. Check your connection and try again."
    );
  });
});
