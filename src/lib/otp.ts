import crypto from "crypto";

// In-memory OTP store with TTL
interface OTPEntry {
  code: string;
  email: string;
  expiresAt: number;
  purpose: "signup" | "login";
}

const otpStore = new Map<string, OTPEntry>();

// Clean expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of otpStore.entries()) {
    if (entry.expiresAt < now) {
      otpStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export function storeOTP(email: string, purpose: "signup" | "login"): string {
  const code = generateOTP();
  const key = `${email}:${purpose}`;

  otpStore.set(key, {
    code,
    email,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    purpose,
  });

  return code;
}

export function verifyOTP(email: string, code: string, purpose: "signup" | "login"): boolean {
  const key = `${email}:${purpose}`;
  const entry = otpStore.get(key);

  if (!entry) return false;
  if (entry.expiresAt < Date.now()) {
    otpStore.delete(key);
    return false;
  }
  if (entry.code !== code) return false;

  // Delete after successful verification
  otpStore.delete(key);
  return true;
}

export function isEmailVerified(email: string): boolean {
  // Check if there's a completed signup verification
  const key = `${email}:signup:verified`;
  return otpStore.get(key) !== undefined;
}

export function markEmailVerified(email: string): void {
  const key = `${email}:signup:verified`;
  otpStore.set(key, {
    code: "verified",
    email,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    purpose: "signup",
  });
}
