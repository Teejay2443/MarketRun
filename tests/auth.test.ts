import jwt from "jsonwebtoken";

const TEST_SECRET = "test-secret-key-for-unit-tests";

// Mock the env variable before importing
process.env.JWT_SECRET = TEST_SECRET;

import { signToken, verifyToken } from "@/lib/auth-utils";

describe("Auth Utilities", () => {
  describe("signToken", () => {
    it("should create a valid JWT token", () => {
      const token = signToken({ id: "user-123", email: "test@example.com" });
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");

      const decoded = jwt.verify(token, TEST_SECRET) as { id: string; email: string };
      expect(decoded.id).toBe("user-123");
      expect(decoded.email).toBe("test@example.com");
    });

    it("should set 7-day expiry", () => {
      const token = signToken({ id: "user-123", email: "test@example.com" });
      const decoded = jwt.decode(token) as { exp: number };
      const now = Math.floor(Date.now() / 1000);
      const sevenDays = 7 * 24 * 60 * 60;

      // Token should expire within 7 days (with 10s tolerance)
      expect(decoded.exp).toBeGreaterThan(now + sevenDays - 10);
      expect(decoded.exp).toBeLessThanOrEqual(now + sevenDays + 10);
    });
  });

  describe("verifyToken", () => {
    it("should verify a valid token", () => {
      const token = signToken({ id: "user-456", email: "verified@example.com" });
      const result = verifyToken(token);

      expect(result).not.toBeNull();
      expect(result?.id).toBe("user-456");
      expect(result?.email).toBe("verified@example.com");
    });

    it("should return null for invalid token", () => {
      const result = verifyToken("invalid-token-string");
      expect(result).toBeNull();
    });

    it("should return null for token signed with wrong secret", () => {
      const token = jwt.sign({ id: "user-789" }, "wrong-secret");
      const result = verifyToken(token);
      expect(result).toBeNull();
    });

    it("should return null for expired token", () => {
      const token = jwt.sign({ id: "user-101", email: "expired@example.com" }, TEST_SECRET, { expiresIn: "-1s" });
      const result = verifyToken(token);
      expect(result).toBeNull();
    });
  });
});
