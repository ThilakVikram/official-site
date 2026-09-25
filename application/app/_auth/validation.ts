// Account rules shared by the sign-up action and scripts/set-admin.ts.
// Each check returns an error message, or null when the value is fine.

// argon2 cost grows with input size, so cap it.
export const MAX_PASSWORD = 256;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function checkUserName(userName: string) {
  return /^[a-zA-Z0-9_.-]{3,32}$/.test(userName) ? null : "User name must be 3–32 letters, numbers, dots, dashes or underscores.";
}

export function checkEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 191 ? null : "Enter a valid email address.";
}

export function checkPassword(password: string) {
  return password.length >= 8 && password.length <= MAX_PASSWORD ? null : `Password must be 8–${MAX_PASSWORD} characters.`;
}
