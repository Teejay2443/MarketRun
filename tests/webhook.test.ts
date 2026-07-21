describe("Webhook Signature Verification", () => {
  const crypto = require("crypto");

  // Simulate the fixed verifyWebhookSignature function from monnify.ts
  // Monnify docs: SHA-512(client secret key + object of request body)
  function verifyWebhookSignature(payload: string, signature: string, secretKey: string): boolean {
    const hash = crypto.createHash("sha512").update(secretKey + payload).digest("hex");
    return hash === signature;
  }

  const testSecret = "test-monnify-secret-key";

  it("should verify a valid SHA-512 signature (secretKey + payload)", () => {
    const payload = '{"event":"SUCCESSFUL_COLLECTION","data":{"amount":5000}}';
    const signature = crypto.createHash("sha512").update(testSecret + payload).digest("hex");

    expect(verifyWebhookSignature(payload, signature, testSecret)).toBe(true);
  });

  it("should reject an invalid signature", () => {
    const payload = '{"event":"SUCCESSFUL_COLLECTION","data":{"amount":5000}}';
    const invalidSignature = "a".repeat(128); // Wrong hash

    expect(verifyWebhookSignature(payload, invalidSignature, testSecret)).toBe(false);
  });

  it("should reject signature from different secret", () => {
    const payload = '{"event":"SUCCESSFUL_COLLECTION"}';
    const signature = crypto.createHash("sha512").update("different-secret" + payload).digest("hex");

    expect(verifyWebhookSignature(payload, signature, testSecret)).toBe(false);
  });

  it("should reject empty signature", () => {
    const payload = '{"event":"SUCCESSFUL_COLLECTION"}';
    expect(verifyWebhookSignature(payload, "", testSecret)).toBe(false);
  });

  it("should produce consistent signatures for same input", () => {
    const payload = '{"event":"PAYMENT","ref":"MRN-123"}';
    const sig1 = crypto.createHash("sha512").update(testSecret + payload).digest("hex");
    const sig2 = crypto.createHash("sha512").update(testSecret + payload).digest("hex");
    expect(sig1).toBe(sig2);
  });

  it("should produce different signatures for different payloads", () => {
    const payload1 = '{"event":"PAYMENT","amount":1000}';
    const payload2 = '{"event":"PAYMENT","amount":2000}';
    const sig1 = crypto.createHash("sha512").update(testSecret + payload1).digest("hex");
    const sig2 = crypto.createHash("sha512").update(testSecret + payload2).digest("hex");
    expect(sig1).not.toBe(sig2);
  });

  it("should use SHA-512 (128 hex characters)", () => {
    const payload = "test";
    const signature = crypto.createHash("sha512").update(testSecret + payload).digest("hex");
    expect(signature).toHaveLength(128);
  });
});
